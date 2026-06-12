// ══════════════════════════════════════════════════════════════════════════
// WebGL Slime Renderer
// Drop-in replacement for the SVG SlimeRenderer (slime-renderer.js) with the
// same public API, drawing instead to a single fixed full-viewport canvas
// overlay. The controller picks this renderer when available; append
// ?slime=svg to the URL to force the original SVG renderer for A/B.
//
// Visual parity targets (from the SVG renderer):
//   - Constraint layer: lines stroke rgba(120,120,120,1) width 0.5 round
//     caps, node circles r 1.5 fill rgba(60,60,60,1) stroke rgba(40,40,40,1)
//     width 0.3 — the whole layer multiplied by the radial opacity mask
//     (base 0.25 everywhere, hover gradient stops 0%→1.0, 50%→0.8, 80%→0.3,
//     100%→0 over a 150px radius; composited as base + (1-base)*g). The
//     layer is rendered to an offscreen target first so line/point overlaps
//     composite exactly like the SVG <g mask=…> does.
//   - Slime body: smooth closed cubic Bézier through the hull verts
//     (tension 0.3), filled with the 3-stop radial body gradient
//     (objectBoundingBox, cx 30% cy 30% r 70%), 1px stroke in the base
//     color at 0.2 opacity, then filter chain url(#slime-glow)
//     url(#slime-drop-shadow): gaussian blur σ3 merged UNDER the source,
//     then drop shadow (blur σ4 of the result's alpha, offset (3,6),
//     black at 0.15) — replicated with real separable gaussian passes over
//     offscreen framebuffers, not an approximation.
//   - The highlight path is NOT drawn: in the SVG renderer it references
//     filter url(#slime-distortion) which is never defined, and Chrome does
//     not render elements with broken filter references. Flip
//     `this.drawHighlight = true` if that ever changes.
//   - Eyes: ellipses with the vertical 3-stop anime gradient; shines are
//     white 0.9 ellipses rotated 16°.
//   - Selection marker: hexagon outline r 8, stroke #444 width 1.
//
// Rendering is skipped entirely (one clear) whenever the slime's padded
// AABB is outside the viewport, so off-screen cost is a few float compares.
// The canvas uses preserveDrawingBuffer so the controller's at-rest skip
// keeps the last frame without redrawing.
// ══════════════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    const MAX_BLOB_PTS = 64;   // tessellated outline points (+1 wrap slot)
    const MAX_BLUR_TAPS = 24;  // paired linear-sampled gaussian taps
    const REGION_PAD = 28;     // css px around the body bbox: covers glow
                               // (3σ=9) + shadow (offset 6 + 3σ=12) spread
    const CULL_BUFFER = 16;    // extra css px before off-screen culling

    class SlimeRendererGL {
        // Returns a renderer or null when WebGL (or a needed limit) is
        // unavailable, letting the controller fall back to the SVG renderer.
        static create() {
            try {
                const r = new SlimeRendererGL();
                return r._ok ? r : null;
            } catch (e) {
                console.warn('[SlimeRendererGL] init failed, using SVG renderer:', e);
                return null;
            }
        }

        constructor() {
            this.slimeCounter = 0;
            this.drawHighlight = false; // see header note on #slime-distortion
            this.onDirty = null;        // controller hook: force a re-render

            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;margin:0;padding:0;border:none;max-width:none;max-height:none;';
            this.root = canvas;
            this._ok = false;

            const opts = {
                alpha: true,
                antialias: false,           // all edges carry their own AA
                premultipliedAlpha: true,
                preserveDrawingBuffer: true, // at-rest frames persist unredrawn
                depth: false,
                stencil: false
            };
            const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
            if (!gl) return;
            this.gl = gl;

            // The blob shader holds the tessellated outline in a uniform
            // array; bail out (→ SVG fallback) on hardware that can't fit it.
            if (gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) < 128) return;

            canvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                this._glReady = false;
            });
            canvas.addEventListener('webglcontextrestored', () => {
                this._initGL();
                if (this.onDirty) this.onDirty();
            });

            if (!this._initGL()) return;
            this._ok = true;

            // Retained per-frame scene state, filled by the SlimeRenderer-
            // compatible API calls and drawn by flush()
            this._slime = null;
            this._constraintScene = null;
            this._marker = null;
            this._screenCleared = false;

            this.updateGradientColors('#4A90E2');
            console.log('[SlimeRendererGL] WebGL slime renderer active (?slime=svg for the SVG renderer)');
        }

        // ── GL setup ────────────────────────────────────────────────────────

        _initGL() {
            const gl = this.gl;

            // Shared vertex transform: pixel space with y down (top-left
            // origin) on every target. A pixel-space y maps to window row
            // H - y, so a texel for logical y is sampled at v = 1 - y/H.
            const vsBlob = [
                'attribute vec2 aPos;',
                'uniform vec2 uResolution;',
                'varying vec2 vPos;',
                'void main() {',
                '	vPos = aPos;',
                '	gl_Position = vec4(aPos.x / uResolution.x * 2.0 - 1.0, 1.0 - aPos.y / uResolution.y * 2.0, 0.0, 1.0);',
                '}'
            ].join('\n');

            // Polygon-SDF blob with a 3-stop gradient (radial in bbox-uv or
            // linear-vertical) and an optional centered stroke. Used for the
            // body source, the highlight, and the eye/shine ellipses
            // (tessellated to polygons).
            const fsBlob = [
                'precision highp float;',
                'varying vec2 vPos;',
                'uniform vec2 uPts[' + (MAX_BLOB_PTS + 1) + '];', // [count] duplicates [0]
                'uniform int uCount;',
                'uniform vec4 uBBox;',      // x, y, w, h (gradient objectBoundingBox)
                'uniform int uGradMode;',   // 0 radial, 1 linear vertical
                'uniform vec3 uGradGeom;',  // cx, cy, r in bbox-uv
                'uniform vec3 uStopOff;',
                'uniform vec4 uStop0;',
                'uniform vec4 uStop1;',
                'uniform vec4 uStop2;',     // rgba, non-premultiplied
                'uniform vec4 uStroke;',
                'uniform float uStrokeHW;',
                'uniform float uAA;',       // coverage ramp width in target px
                '',
                'void main() {',
                '	vec2 p = vPos;',
                '	float d = 1e20;',
                '	float s = 1.0;',
                '	for (int i = 0; i < ' + MAX_BLOB_PTS + '; i++) {',
                '		if (i >= uCount) break;',
                '		vec2 va = uPts[i];',
                '		vec2 vb = uPts[i + 1];',
                '		vec2 e = vb - va;',
                '		vec2 w = p - va;',
                '		vec2 b = w - e * clamp(dot(w, e) / max(dot(e, e), 1e-12), 0.0, 1.0);',
                '		d = min(d, dot(b, b));',
                // winding parity (iq's polygon SDF): flip sign per crossing
                '		bvec3 c = bvec3(p.y >= va.y, p.y < vb.y, e.x * w.y > e.y * w.x);',
                '		if (all(c) || !any(c)) s = -s;',
                '	}',
                '	float sd = s * sqrt(d);',
                '',
                '	vec2 uv = (p - uBBox.xy) / max(uBBox.zw, vec2(1e-6));',
                '	float t = uGradMode == 0 ? length(uv - uGradGeom.xy) / uGradGeom.z : uv.y;',
                '	t = clamp(t, 0.0, 1.0);',
                // SVG gradients interpolate color and opacity separately in sRGB
                '	vec4 col = t < uStopOff.y',
                '		? mix(uStop0, uStop1, clamp((t - uStopOff.x) / max(uStopOff.y - uStopOff.x, 1e-6), 0.0, 1.0))',
                '		: mix(uStop1, uStop2, clamp((t - uStopOff.y) / max(uStopOff.z - uStopOff.y, 1e-6), 0.0, 1.0));',
                '',
                '	float a = col.a * clamp(0.5 - sd / uAA, 0.0, 1.0);',
                '	vec3 rgb = col.rgb;',
                '	if (uStrokeHW > 0.0) {',
                // stroke straddles the path edge, painted over the fill
                '		float sa = uStroke.a * clamp(0.5 - (abs(sd) - uStrokeHW) / uAA, 0.0, 1.0);',
                '		float outA = sa + a * (1.0 - sa);',
                '		if (outA > 0.0) rgb = (uStroke.rgb * sa + rgb * a * (1.0 - sa)) / outA;',
                '		a = outA;',
                '	}',
                '	gl_FragColor = vec4(rgb * a, a);', // premultiplied
                '}'
            ].join('\n');

            // Batched uneven-capsule SDF quads (same scheme as
            // webgl_phys_renderer.js) for constraint lines, node circles,
            // the hexagon marker and sleepy-eye strokes.
            const vsBatch = [
                'attribute vec2 aPos;',
                'attribute vec4 aSeg;',
                'attribute vec2 aRad;',
                'attribute vec4 aFill;',
                'attribute vec4 aStroke;',
                'attribute vec2 aParams;',
                'uniform vec2 uResolution;',
                'varying vec2 vPos;',
                'varying vec4 vSeg;',
                'varying vec2 vRad;',
                'varying vec4 vFill;',
                'varying vec4 vStroke;',
                'varying vec2 vParams;',
                'void main() {',
                '	vPos = aPos; vSeg = aSeg; vRad = aRad;',
                '	vFill = aFill; vStroke = aStroke; vParams = aParams;',
                '	gl_Position = vec4(aPos.x / uResolution.x * 2.0 - 1.0, 1.0 - aPos.y / uResolution.y * 2.0, 0.0, 1.0);',
                '}'
            ].join('\n');

            const fsBatch = [
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                'varying vec2 vPos;',
                'varying vec4 vSeg;',
                'varying vec2 vRad;',
                'varying vec4 vFill;',
                'varying vec4 vStroke;',
                'varying vec2 vParams;', // x: stroke half-width, y: AA ramp px
                '',
                // Uneven capsule SDF (hull of two circles); circles when a==b
                'float sdShape(vec2 p, vec2 pa, vec2 pb, float ra, float rb) {',
                '	vec2 ba = pb - pa;',
                '	float h = dot(ba, ba);',
                '	float b = ra - rb;',
                '	if (h < 1e-6 || h <= b * b) {',
                '		return min(length(p - pa) - ra, length(p - pb) - rb);',
                '	}',
                '	vec2 pp = p - pa;',
                '	vec2 q = vec2(dot(pp, vec2(ba.y, -ba.x)), dot(pp, ba)) / h;',
                '	q.x = abs(q.x);',
                '	vec2 c = vec2(sqrt(h - b * b), b);',
                '	float k = c.x * q.y - c.y * q.x;',
                '	float m = dot(c, q);',
                '	float n = dot(q, q);',
                '	if (k < 0.0) return sqrt(h * n) - ra;',
                '	if (k > c.x) return sqrt(h * (n + 1.0 - 2.0 * q.y)) - rb;',
                '	return m - ra;',
                '}',
                '',
                'void main() {',
                '	float d = sdShape(vPos, vSeg.xy, vSeg.zw, vRad.x, vRad.y);',
                '	float aa = vParams.y;',
                '	vec3 rgb = vFill.rgb;',
                '	float a = vFill.a * clamp(0.5 - d / aa, 0.0, 1.0);',
                '	if (vParams.x > 0.0) {',
                '		float sa = vStroke.a * clamp(0.5 - (abs(d) - vParams.x) / aa, 0.0, 1.0);',
                '		float outA = sa + a * (1.0 - sa);',
                '		if (outA > 0.0) rgb = (vStroke.rgb * sa + rgb * a * (1.0 - sa)) / outA;',
                '		a = outA;',
                '	}',
                '	gl_FragColor = vec4(rgb * a, a);',
                '}'
            ].join('\n');

            // Textured quad: plain copy, shadow colorize (black × 0.15 ×
            // alpha, exactly feDropShadow's flood step), or the constraint
            // layer's radial opacity mask.
            const vsTex = [
                'attribute vec2 aPos;',
                'attribute vec2 aUV;',
                'uniform vec2 uResolution;',
                'varying vec2 vUV;',
                'varying vec2 vPos;',
                'void main() {',
                '	vUV = aUV; vPos = aPos;',
                '	gl_Position = vec4(aPos.x / uResolution.x * 2.0 - 1.0, 1.0 - aPos.y / uResolution.y * 2.0, 0.0, 1.0);',
                '}'
            ].join('\n');

            const fsTex = [
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                'varying vec2 vUV;',
                'varying vec2 vPos;',
                'uniform sampler2D uTex;',
                'uniform int uMode;',     // 0 copy, 1 shadow, 2 masked
                'uniform vec4 uShadow;',  // premultiplied shadow color
                'uniform vec4 uMask;',    // cx, cy, hover radius (<=0 none), base
                'uniform float uMaskMax;',
                'void main() {',
                '	vec4 c = texture2D(uTex, vUV);',
                '	if (uMode == 1) { gl_FragColor = uShadow * c.a; return; }',
                '	if (uMode == 2) {',
                '		float m = uMask.w;',
                '		if (uMask.z > 0.0) {',
                '			float t = length(vPos - uMask.xy) / uMask.z;',
                // gradient stops: 0%→max, 50%→0.8, 80%→0.3, 100%→0
                '			float g;',
                '			if (t < 0.5) g = mix(uMaskMax, 0.8, t * 2.0);',
                '			else if (t < 0.8) g = mix(0.8, 0.3, (t - 0.5) / 0.3);',
                '			else if (t < 1.0) g = mix(0.3, 0.0, (t - 0.8) / 0.2);',
                '			else g = 0.0;',
                // hover circle over the base rect: white luminance,
                // alpha = g + base*(1-g)
                '			m = uMask.w + (1.0 - uMask.w) * g;',
                '		}',
                '		c *= m;',
                '	}',
                '	gl_FragColor = c;',
                '}'
            ].join('\n');

            // Separable gaussian with paired linear-filter taps. Symmetric
            // kernel, so the texture-space y flip is irrelevant.
            const fsBlur = [
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                'varying vec2 vUV;',
                'varying vec2 vPos;',
                'uniform sampler2D uTex;',
                'uniform vec2 uStep;',                          // uv per texel along the axis
                'uniform vec2 uOW[' + MAX_BLUR_TAPS + '];',     // x: offset texels, y: weight
                'uniform int uTaps;',
                'void main() {',
                '	vec4 acc = texture2D(uTex, vUV) * uOW[0].y;',
                '	for (int j = 1; j < ' + MAX_BLUR_TAPS + '; j++) {',
                '		if (j >= uTaps) break;',
                '		vec2 o = uStep * uOW[j].x;',
                '		acc += (texture2D(uTex, vUV + o) + texture2D(uTex, vUV - o)) * uOW[j].y;',
                '	}',
                '	gl_FragColor = acc;',
                '}'
            ].join('\n');

            const blob = this._createProgram(vsBlob, fsBlob);
            const batch = this._createProgram(vsBatch, fsBatch);
            const tex = this._createProgram(vsTex, fsTex);
            const blur = this._createProgram(vsTex, fsBlur);
            if (!blob || !batch || !tex || !blur) return false;

            const u = (p, n) => gl.getUniformLocation(p, n);
            const a = (p, n) => gl.getAttribLocation(p, n);

            this._blob = {
                program: blob,
                aPos: a(blob, 'aPos'),
                uResolution: u(blob, 'uResolution'), uPts: u(blob, 'uPts'),
                uCount: u(blob, 'uCount'), uBBox: u(blob, 'uBBox'),
                uGradMode: u(blob, 'uGradMode'), uGradGeom: u(blob, 'uGradGeom'),
                uStopOff: u(blob, 'uStopOff'), uStop0: u(blob, 'uStop0'),
                uStop1: u(blob, 'uStop1'), uStop2: u(blob, 'uStop2'),
                uStroke: u(blob, 'uStroke'), uStrokeHW: u(blob, 'uStrokeHW'),
                uAA: u(blob, 'uAA')
            };
            this._batch = {
                program: batch,
                aPos: a(batch, 'aPos'), aSeg: a(batch, 'aSeg'), aRad: a(batch, 'aRad'),
                aFill: a(batch, 'aFill'), aStroke: a(batch, 'aStroke'), aParams: a(batch, 'aParams'),
                uResolution: u(batch, 'uResolution'),
                buffer: gl.createBuffer(),
                verts: new Float32Array(8192),
                count: 0
            };
            this._tex = {
                program: tex,
                aPos: a(tex, 'aPos'), aUV: a(tex, 'aUV'),
                uResolution: u(tex, 'uResolution'), uTex: u(tex, 'uTex'),
                uMode: u(tex, 'uMode'), uShadow: u(tex, 'uShadow'),
                uMask: u(tex, 'uMask'), uMaskMax: u(tex, 'uMaskMax')
            };
            this._blur = {
                program: blur,
                aPos: a(blur, 'aPos'), aUV: a(blur, 'aUV'),
                uResolution: u(blur, 'uResolution'), uTex: u(blur, 'uTex'),
                uStep: u(blur, 'uStep'), uOW: u(blur, 'uOW'), uTaps: u(blur, 'uTaps')
            };

            this._quadBuffer = gl.createBuffer();
            this._quadData = new Float32Array(16); // 4 verts × (pos2, uv2)
            this._ptsData = new Float32Array((MAX_BLOB_PTS + 1) * 2);
            this._kernelCache = {};
            this._maxTex = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));

            // Offscreen ping-pong targets for the filter chain (grow-only)
            this._fbos = null;
            this._fboW = 0;
            this._fboH = 0;

            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied src-over
            gl.clearColor(0, 0, 0, 0);

            this._glReady = true;
            return true;
        }

        _createProgram(vsSource, fsSource) {
            const gl = this.gl;
            const compile = (type, source) => {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.error('[SlimeRendererGL] shader error:', gl.getShaderInfoLog(shader));
                    gl.deleteShader(shader);
                    return null;
                }
                return shader;
            };
            const vs = compile(gl.VERTEX_SHADER, vsSource);
            const fs = compile(gl.FRAGMENT_SHADER, fsSource);
            if (!vs || !fs) return null;
            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('[SlimeRendererGL] link error:', gl.getProgramInfoLog(program));
                return null;
            }
            return program;
        }

        // ── Colors and gradients ────────────────────────────────────────────

        // Parses #RGB/#RRGGBB/#RRGGBBAA and rgb()/rgba() into [r,g,b,a] 0-1
        _parseColor(str, alpha = 1) {
            const cache = this._colorCache || (this._colorCache = {});
            const key = str + '|' + alpha;
            if (cache[key]) return cache[key];
            let r = 0, g = 0, b = 0, a = 1;
            if (str[0] === '#') {
                let h = str.slice(1);
                if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
                r = parseInt(h.slice(0, 2), 16) / 255;
                g = parseInt(h.slice(2, 4), 16) / 255;
                b = parseInt(h.slice(4, 6), 16) / 255;
                if (h.length >= 8) a = parseInt(h.slice(6, 8), 16) / 255;
            } else {
                const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/);
                if (m) {
                    r = parseFloat(m[1]) / 255;
                    g = parseFloat(m[2]) / 255;
                    b = parseFloat(m[3]) / 255;
                    a = m[4] !== undefined ? parseFloat(m[4]) : 1;
                }
            }
            const c = [r, g, b, a * alpha];
            cache[key] = c;
            return c;
        }

        // Mirrors SlimeRenderer.updateGradientColors: derive the body and
        // highlight stop colors from a single base color (the default blue
        // keeps the exact original palette).
        updateGradientColors(baseColor = '#4A90E2') {
            const toRgb = (hex) => {
                let h = hex.replace('#', '');
                if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
                const num = parseInt(h, 16);
                return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
            };
            const fromRgb = ({ r, g, b }) => {
                const toHex = (c) => ('0' + Math.round(Math.min(255, Math.max(0, c))).toString(16)).slice(-2);
                return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            };
            const lighten = (hex, amt) => {
                const rgb = toRgb(hex);
                return fromRgb({
                    r: rgb.r + (255 - rgb.r) * amt,
                    g: rgb.g + (255 - rgb.g) * amt,
                    b: rgb.b + (255 - rgb.b) * amt
                });
            };
            const darken = (hex, amt) => {
                const rgb = toRgb(hex);
                return fromRgb({ r: rgb.r * (1 - amt), g: rgb.g * (1 - amt), b: rgb.b * (1 - amt) });
            };

            let bodyColors, highlightColors;
            if (baseColor.toLowerCase() === '#4a90e2') {
                bodyColors = ['#C8E6FF', '#4A90E2', '#2E5BBA'];
                highlightColors = ['#E6F3FF', '#B3D9FF', '#E6F3FF'];
            } else {
                bodyColors = [lighten(baseColor, 0.65), baseColor, darken(baseColor, 0.45)];
                highlightColors = [lighten(baseColor, 0.85), lighten(baseColor, 0.55), lighten(baseColor, 0.85)];
            }

            const stop = (hex, op) => {
                const c = this._parseColor(hex);
                return [c[0], c[1], c[2], op];
            };
            // radialGradient cx 30% cy 30% r 70%, stops at 0/40/100%
            this._bodyGrad = {
                mode: 0, geom: [0.3, 0.3, 0.7], off: [0, 0.4, 1],
                stops: [stop(bodyColors[0], 0.15), stop(bodyColors[1], 0.25), stop(bodyColors[2], 0.35)]
            };
            // radialGradient cx 25% cy 25% r 50%, stops at 0/70/100%
            this._highlightGrad = {
                mode: 0, geom: [0.25, 0.25, 0.5], off: [0, 0.7, 1],
                stops: [stop(highlightColors[0], 0.3), stop(highlightColors[1], 0.1), stop(highlightColors[2], 0)]
            };
            // vertical linearGradient, stops at 0/70/100%
            this._eyeGrad = {
                mode: 1, geom: [0, 0, 1], off: [0, 0.7, 1],
                stops: [stop('#1a1a1a', 1), stop('#333333', 1), stop('#4a4a4a', 1)]
            };
            this._shineGrad = {
                mode: 1, geom: [0, 0, 1], off: [0, 0.7, 1],
                stops: [stop('#FFFFFF', 0.9), stop('#FFFFFF', 0.9), stop('#FFFFFF', 0.9)]
            };
        }

        // ── SlimeRenderer-compatible API (retained scene state) ─────────────

        createSlime(verts, pixelsPerUnit = 120, baseColor = '#4A90E2', disableShader = true) {
            this.updateGradientColors(baseColor);
            if (!verts || verts.length < 3) {
                throw new Error('Slime needs at least 3 vertices');
            }

            const slimeId = `slime-${this.slimeCounter++}`;
            const centroid = this.calculateCentroid(verts);

            const eyeWorldSize = 0.12; // world units
            const eyeWidth = eyeWorldSize * pixelsPerUnit;
            const eyeHeight = eyeWidth * 1.4;
            const shineWidth = eyeWidth * 0.25;
            const shineHeight = eyeWidth * 0.42;
            const eyeOffsetX = 0.225 * pixelsPerUnit;
            const eyeOffsetY = 0.075 * pixelsPerUnit;

            const slime = {
                id: slimeId,
                element: this.root, // truthy element for controller checks
                shader: null,
                baseColor: baseColor,
                verts: [...verts],
                initialEyeWidth: eyeWidth,
                initialEyeHeight: eyeHeight,
                initialShineWidth: shineWidth,
                initialShineHeight: shineHeight,
                currentLeftEyePos: { x: centroid.x - eyeOffsetX, y: centroid.y - eyeOffsetY },
                currentRightEyePos: { x: centroid.x + eyeOffsetX, y: centroid.y - eyeOffsetY },
                initialMassCenter: this.calculateMassCenter(verts),
                initialBBoxSize: pixelsPerUnit,
                pixelsPerUnit: pixelsPerUnit,
                expandedBBox: null,
                eyeStyle: 'normal'
            };
            this._slime = slime;
            return slime;
        }

        updateSlime(slime, newVerts, pixelsPerUnit = 120) {
            if (!slime || !newVerts || newVerts.length < 2) return;

            let processedVerts = newVerts;
            if (newVerts.length === 2) {
                processedVerts = this.createMinimumThicknessVerts(newVerts, pixelsPerUnit);
            } else if (newVerts.length < 3) {
                return;
            }

            // Smooth the eye targets exactly like the SVG renderer
            const eyePositions = this.calculateStableEyePositions(slime, processedVerts, pixelsPerUnit);
            slime.currentLeftEyePos = eyePositions.leftEye;
            slime.currentRightEyePos = eyePositions.rightEye;

            slime.verts = [...processedVerts];
        }

        removeSlime(slime) {
            if (this._slime === slime) this._slime = null;
        }

        setSlimeEyeStyle(slime, eyeStyle) {
            if (!slime) return;
            slime.eyeStyle = eyeStyle === 'sleepy' ? 'sleepy' : 'normal';
        }

        renderConstraints(points, constraints, mousePos = null, options = {}) {
            const {
                pointRadius = 1.5,
                pointColor = 'rgba(60, 60, 60, 1.0)',
                constraintColor = 'rgba(120, 120, 120, 1.0)',
                constraintWidth = 0.5,
                showPoints = true,
                showConstraints = true,
                baseOpacity = 0.25,
                hoverRadius = 150,
                maxOpacity = 1.0
            } = options;

            this._constraintScene = {
                points: showPoints && points ? points : [],
                lines: showConstraints && constraints ? constraints : [],
                pointRadius,
                pointFill: this._parseColor(pointColor),
                pointStroke: this._parseColor('rgba(40, 40, 40, 1.0)'),
                lineColor: this._parseColor(constraintColor),
                lineHW: constraintWidth / 2,
                mask: { pos: mousePos, base: baseOpacity, radius: hoverRadius, max: maxOpacity }
            };
        }

        clearConstraints() {
            this._constraintScene = null;
        }

        renderSelectionMarker(point, options = {}) {
            if (!point) {
                this._marker = null;
                return;
            }
            const { outerRadius = 8, outerColor = 'black', strokeWidth = 1 } = options;
            this._marker = {
                x: point.x, y: point.y,
                radius: outerRadius,
                color: this._parseColor(outerColor),
                halfWidth: strokeWidth / 2
            };
        }

        clearSelectionMarker() {
            this._marker = null;
        }

        // ── Geometry helpers (mirroring the SVG renderer's math) ────────────

        calculateCentroid(verts) {
            let x = 0, y = 0;
            for (const v of verts) { x += v.x; y += v.y; }
            return { x: x / verts.length, y: y / verts.length };
        }

        calculateMassCenter(verts) {
            if (verts.length < 3) return this.calculateCentroid(verts);
            let area = 0, cx = 0, cy = 0;
            for (let i = 0; i < verts.length; i++) {
                const j = (i + 1) % verts.length;
                const cross = verts[i].x * verts[j].y - verts[j].x * verts[i].y;
                area += cross;
                cx += (verts[i].x + verts[j].x) * cross;
                cy += (verts[i].y + verts[j].y) * cross;
            }
            area *= 0.5;
            if (Math.abs(area) < 1e-10) return this.calculateCentroid(verts);
            return { x: cx / (6 * area), y: cy / (6 * area) };
        }

        lerp(a, b, t) {
            return a + (b - a) * t;
        }

        calculateStableEyePositions(slime, newVerts, pixelsPerUnit) {
            const massCenter = this.calculateMassCenter(newVerts);
            const baseOffsetX = 0.225 * pixelsPerUnit;
            const baseOffsetY = 0.075 * pixelsPerUnit;

            const targetLeftEyePos = { x: massCenter.x - baseOffsetX, y: massCenter.y - baseOffsetY };
            const targetRightEyePos = { x: massCenter.x + baseOffsetX, y: massCenter.y - baseOffsetY };

            const leftDistance = Math.sqrt(
                Math.pow(targetLeftEyePos.x - slime.currentLeftEyePos.x, 2) +
                Math.pow(targetLeftEyePos.y - slime.currentLeftEyePos.y, 2));
            const rightDistance = Math.sqrt(
                Math.pow(targetRightEyePos.x - slime.currentRightEyePos.x, 2) +
                Math.pow(targetRightEyePos.y - slime.currentRightEyePos.y, 2));

            const maxJumpDistance = pixelsPerUnit * 0.3;
            const leftLerpSpeed = leftDistance > maxJumpDistance ? 0.4 : 0.8;
            const rightLerpSpeed = rightDistance > maxJumpDistance ? 0.4 : 0.8;

            slime.currentLeftEyePos.x = this.lerp(slime.currentLeftEyePos.x, targetLeftEyePos.x, leftLerpSpeed);
            slime.currentLeftEyePos.y = this.lerp(slime.currentLeftEyePos.y, targetLeftEyePos.y, leftLerpSpeed);
            slime.currentRightEyePos.x = this.lerp(slime.currentRightEyePos.x, targetRightEyePos.x, rightLerpSpeed);
            slime.currentRightEyePos.y = this.lerp(slime.currentRightEyePos.y, targetRightEyePos.y, rightLerpSpeed);

            return {
                leftEye: { ...slime.currentLeftEyePos },
                rightEye: { ...slime.currentRightEyePos }
            };
        }

        createMinimumThicknessVerts(twoVerts, pixelsPerUnit) {
            if (twoVerts.length !== 2) return twoVerts;
            const [p1, p2] = twoVerts;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length < 0.1) {
                const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                const radius = 0.3;
                const verts = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    verts.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
                }
                return verts;
            }
            const perpX = -dy / length;
            const perpY = dx / length;
            const halfThickness = 10 / 2;
            return [
                { x: p1.x + perpX * halfThickness, y: p1.y + perpY * halfThickness },
                { x: p2.x + perpX * halfThickness, y: p2.y + perpY * halfThickness },
                { x: p2.x - perpX * halfThickness, y: p2.y - perpY * halfThickness },
                { x: p1.x - perpX * halfThickness, y: p1.y - perpY * halfThickness }
            ];
        }

        // Tessellates the same closed cubic-Bézier outline that
        // createSmoothPathData builds (tension 0.3), optionally scaled
        // around the centroid. Returns a flat [x0,y0,x1,y1,…] array with at
        // most MAX_BLOB_PTS points.
        _tessellateSmooth(verts, scale = 1) {
            const n = verts.length;
            if (n < 3) return null;
            let pts = verts;
            if (scale !== 1) {
                const centroid = this.calculateCentroid(verts);
                pts = verts.map(v => ({
                    x: centroid.x + (v.x - centroid.x) * scale,
                    y: centroid.y + (v.y - centroid.y) * scale
                }));
            }
            const samples = Math.max(2, Math.floor(MAX_BLOB_PTS / n));
            const out = new Float32Array(n * samples * 2);
            const tension = 0.3;
            let k = 0;
            for (let i = 0; i < n; i++) {
                const current = pts[i];
                const next = pts[(i + 1) % n];
                const prev = pts[(i - 1 + n) % n];
                const nextNext = pts[(i + 2) % n];
                const c1x = current.x + (next.x - prev.x) * tension;
                const c1y = current.y + (next.y - prev.y) * tension;
                const c2x = next.x - (nextNext.x - current.x) * tension;
                const c2y = next.y - (nextNext.y - current.y) * tension;
                for (let j = 0; j < samples; j++) {
                    const t = j / samples;
                    const mt = 1 - t;
                    const w0 = mt * mt * mt, w1 = 3 * mt * mt * t, w2 = 3 * mt * t * t, w3 = t * t * t;
                    out[k++] = w0 * current.x + w1 * c1x + w2 * c2x + w3 * next.x;
                    out[k++] = w0 * current.y + w1 * c1y + w2 * c2y + w3 * next.y;
                }
            }
            return out;
        }

        _ellipsePts(cx, cy, rx, ry, rotDeg = 0) {
            const N = 32;
            const out = new Float32Array(N * 2);
            const rot = rotDeg * Math.PI / 180;
            const cos = Math.cos(rot), sin = Math.sin(rot);
            for (let i = 0; i < N; i++) {
                const a = (i / N) * Math.PI * 2;
                const x = Math.cos(a) * rx;
                const y = Math.sin(a) * ry;
                out[i * 2] = cx + x * cos - y * sin;
                out[i * 2 + 1] = cy + x * sin + y * cos;
            }
            return out;
        }

        // ── Frame assembly ──────────────────────────────────────────────────

        // Draws the retained scene. offsetX/offsetY convert the controller's
        // page coordinates into viewport coordinates (scroll position in
        // pageBottomMode, 0 otherwise); cssW/cssH are the controller's cached
        // viewport metrics so no layout-forcing reads happen here.
        flush(offsetX, offsetY, cssW, cssH) {
            const gl = this.gl;
            if (!gl || !this._glReady || gl.isContextLost()) return;

            const dpr = window.devicePixelRatio || 1;
            const canvas = this.root;
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.right = '0';
            canvas.style.bottom = '0';

            const rect = canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                offsetX += rect.left;
                offsetY += rect.top;
                cssW = rect.width;
                cssH = rect.height;
            }

            const devW = Math.max(1, Math.round(cssW * dpr));
            const devH = Math.max(1, Math.round(cssH * dpr));
            if (canvas.width !== devW || canvas.height !== devH) {
                canvas.width = devW;
                canvas.height = devH;
            }
            this._dpr = dpr;
            this._devW = devW;
            this._devH = devH;
            this._cssW = cssW;
            this._cssH = cssH;

            const slime = this._slime;
            const cons = this._constraintScene;
            const hasConstraints = !!(cons && (cons.lines.length || cons.points.length));
            if (!slime && !hasConstraints && !this._marker) {
                this._clearScreenOnce();
                return;
            }

            // Tessellate the body outline in viewport css px and accumulate
            // the AABB over everything that will be drawn
            let bodyPts = null;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const grow = (x, y, r) => {
                if (x - r < minX) minX = x - r;
                if (x + r > maxX) maxX = x + r;
                if (y - r < minY) minY = y - r;
                if (y + r > maxY) maxY = y + r;
            };

            if (slime && slime.verts.length >= 3) {
                const viewVerts = slime.verts.map(v => ({ x: v.x - offsetX, y: v.y - offsetY }));
                bodyPts = this._tessellateSmooth(viewVerts);
                for (let i = 0; i < bodyPts.length; i += 2) grow(bodyPts[i], bodyPts[i + 1], 0);
            }
            if (hasConstraints) {
                for (const l of cons.lines) {
                    grow(l.pointA.x - offsetX, l.pointA.y - offsetY, 2);
                    grow(l.pointB.x - offsetX, l.pointB.y - offsetY, 2);
                }
                for (const p of cons.points) grow(p.x - offsetX, p.y - offsetY, 3);
            }
            if (this._marker) grow(this._marker.x - offsetX, this._marker.y - offsetY, this._marker.radius + 2);
            if (slime) {
                grow(slime.currentLeftEyePos.x - offsetX, slime.currentLeftEyePos.y - offsetY, slime.initialEyeHeight + 2);
                grow(slime.currentRightEyePos.x - offsetX, slime.currentRightEyePos.y - offsetY, slime.initialEyeHeight + 2);
            }
            if (minX > maxX || isNaN(minX) || isNaN(maxY)) {
                this._clearScreenOnce();
                return;
            }

            // Off-screen cull: clear once and stop — this replaces the SVG
            // renderer's visibility toggling (and its stale-frame teleports)
            const regX = minX - REGION_PAD;
            const regY = minY - REGION_PAD;
            const regW = (maxX - minX) + REGION_PAD * 2;
            const regH = (maxY - minY) + REGION_PAD * 2;
            if (regX > cssW + CULL_BUFFER || regX + regW < -CULL_BUFFER ||
                regY > cssH + CULL_BUFFER || regY + regH < -CULL_BUFFER) {
                this._clearScreenOnce();
                return;
            }

            const regionScale = Math.min(dpr, this._maxTex / Math.max(1, regW), this._maxTex / Math.max(1, regH));
            const rdw = Math.max(1, Math.ceil(regW * regionScale));
            const rdh = Math.max(1, Math.ceil(regH * regionScale));
            this._ensureFBOs(rdw, rdh);
            this._regX = regX;
            this._regY = regY;
            this._regW = regW;
            this._regH = regH;
            this._rdw = rdw;
            this._rdh = rdh;
            this._regionScale = regionScale;

            this._bindScreen();
            gl.clear(gl.COLOR_BUFFER_BIT);
            this._screenCleared = false;

            // 1) Constraint layer behind the slime: draw unmasked into an
            //    offscreen target, then composite with the radial opacity
            //    mask so overlaps behave exactly like the SVG <g mask=…>
            if (hasConstraints) this._drawConstraintLayer(cons, offsetX, offsetY);

            // 2) Slime body with its glow + drop-shadow filter chain
            if (bodyPts) this._drawBody(bodyPts, slime);

            // 3) Highlight (hidden by default, see header), eyes, shines
            if (slime) {
                if (this.drawHighlight && bodyPts) {
                    const viewVerts = slime.verts.map(v => ({ x: v.x - offsetX, y: v.y - offsetY }));
                    const hlPts = this._tessellateSmooth(viewVerts, 0.8);
                    if (hlPts) {
                        this._drawBlobScreen(hlPts, null, this._highlightGrad, null, 0);
                    }
                }
                this._drawEyes(slime, offsetX, offsetY);
            }

            // 4) Selection hexagon on top, unmasked
            if (this._marker) this._drawMarker(this._marker, offsetX, offsetY);
        }

        // ── Internal drawing passes ─────────────────────────────────────────

        _clearScreenOnce() {
            if (this._screenCleared) return;
            const gl = this.gl;
            this._bindScreen();
            gl.clear(gl.COLOR_BUFFER_BIT);
            this._screenCleared = true;
        }

        _bindScreen() {
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this._devW, this._devH);
        }

        // Binds FBO i, clears the whole texture (so blur taps outside the
        // used region read transparent), and sets the used-size viewport
        _beginFBO(i) {
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbos[i].fbo);
            gl.viewport(0, 0, this._fboW, this._fboH);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, this._rdw, this._rdh);
        }

        _ensureFBOs(w, h) {
            const gl = this.gl;
            if (this._fbos && this._fboW >= w && this._fboH >= h) return;
            const newW = Math.max(w, this._fboW);
            const newH = Math.max(h, this._fboH);
            if (!this._fbos) this._fbos = [];
            for (let i = 0; i < 3; i++) {
                let t = this._fbos[i];
                if (!t) {
                    t = this._fbos[i] = { tex: gl.createTexture(), fbo: gl.createFramebuffer() };
                    gl.bindTexture(gl.TEXTURE_2D, t.tex);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                }
                gl.bindTexture(gl.TEXTURE_2D, t.tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, newW, newH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this._fboW = newW;
            this._fboH = newH;
        }

        // Draws a textured quad. dst* are in the CURRENT target's pixel
        // space; the source region is the used part of an FBO texture
        // rendered with the shared y-down convention, hence v runs from
        // vMax (top) to 0 (bottom).
        _texQuad(texture, dstX, dstY, dstW, dstH, resW, resH, prog, setUniforms) {
            const gl = this.gl;
            const uMax = this._rdw / this._fboW;
            const vMax = this._rdh / this._fboH;
            const q = this._quadData;
            q[0] = dstX; q[1] = dstY; q[2] = 0; q[3] = vMax;
            q[4] = dstX + dstW; q[5] = dstY; q[6] = uMax; q[7] = vMax;
            q[8] = dstX; q[9] = dstY + dstH; q[10] = 0; q[11] = 0;
            q[12] = dstX + dstW; q[13] = dstY + dstH; q[14] = uMax; q[15] = 0;

            gl.useProgram(prog.program);
            gl.uniform2f(prog.uResolution, resW, resH);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(prog.uTex, 0);
            if (setUniforms) setUniforms();

            gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, q, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(prog.aPos);
            gl.vertexAttribPointer(prog.aPos, 2, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(prog.aUV);
            gl.vertexAttribPointer(prog.aUV, 2, gl.FLOAT, false, 16, 8);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.disableVertexAttribArray(prog.aPos);
            gl.disableVertexAttribArray(prog.aUV);
        }

        // Linear-sampled gaussian kernel taps for a given device-px sigma
        _kernel(sigma) {
            const key = sigma.toFixed(3);
            let k = this._kernelCache[key];
            if (k) return k;
            const R = Math.min((MAX_BLUR_TAPS - 1) * 2, Math.max(1, Math.ceil(sigma * 3)));
            const w = [];
            let sum = 0;
            for (let i = 0; i <= R; i++) {
                const v = Math.exp(-(i * i) / (2 * sigma * sigma));
                w.push(v);
                sum += v * (i === 0 ? 1 : 2);
            }
            const flat = new Float32Array(MAX_BLUR_TAPS * 2);
            flat[0] = 0;
            flat[1] = w[0] / sum;
            let taps = 1;
            for (let i = 1; i <= R; i += 2) {
                const w1 = w[i] / sum;
                const w2 = i + 1 <= R ? w[i + 1] / sum : 0;
                const wp = w1 + w2;
                flat[taps * 2] = wp > 0 ? (w1 * i + w2 * (i + 1)) / wp : i;
                flat[taps * 2 + 1] = wp;
                taps++;
            }
            k = { flat, taps };
            this._kernelCache[key] = k;
            return k;
        }

        // Separable gaussian: src FBO index → dst FBO index along one axis
        _blurPass(srcIdx, dstIdx, sigmaDev, horizontal) {
            const gl = this.gl;
            const prog = this._blur;
            const k = this._kernel(sigmaDev);
            this._beginFBO(dstIdx);
            this._texQuad(this._fbos[srcIdx].tex, 0, 0, this._rdw, this._rdh, this._rdw, this._rdh, prog, () => {
                gl.uniform2f(prog.uStep, horizontal ? 1 / this._fboW : 0, horizontal ? 0 : 1 / this._fboH);
                gl.uniform2fv(prog.uOW, k.flat);
                gl.uniform1i(prog.uTaps, k.taps);
            });
        }

        // ── Blob (polygon SDF) drawing ──────────────────────────────────────

        // pts: flat css-px outline (current viewport space). When drawing
        // into the region FBO, pass toRegion=true to convert to region-local
        // device px. bboxOverride supplies an exact objectBoundingBox (used
        // for ellipses); otherwise the tessellated points' bbox is used,
        // matching the SVG path bbox to within the tessellation tolerance.
        _drawBlobInternal(pts, bboxOverride, grad, stroke, strokeHW, toRegion) {
            const gl = this.gl;
            const prog = this._blob;
            const dpr = this._dpr;
            const regionScale = this._regionScale || dpr;
            const count = pts.length / 2;

            const data = this._ptsData;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < count; i++) {
                let x = pts[i * 2], y = pts[i * 2 + 1];
                if (toRegion) {
                    x = (x - this._regX) * regionScale;
                    y = (y - this._regY) * regionScale;
                }
                data[i * 2] = x;
                data[i * 2 + 1] = y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
            data[count * 2] = data[0];
            data[count * 2 + 1] = data[1];

            let bx = minX, by = minY, bw = maxX - minX, bh = maxY - minY;
            if (bboxOverride) {
                bx = bboxOverride[0]; by = bboxOverride[1]; bw = bboxOverride[2]; bh = bboxOverride[3];
                if (toRegion) {
                    bx = (bx - this._regX) * regionScale;
                    by = (by - this._regY) * regionScale;
                    bw *= regionScale;
                    bh *= regionScale;
                }
            }

            const aa = toRegion ? 1 : 1 / dpr;
            const hw = toRegion ? strokeHW * regionScale : strokeHW;
            const resW = toRegion ? this._rdw : this._cssW;
            const resH = toRegion ? this._rdh : this._cssH;
            const pad = hw + aa * 2 + 1;

            gl.useProgram(prog.program);
            gl.uniform2f(prog.uResolution, resW, resH);
            gl.uniform2fv(prog.uPts, data.subarray(0, (MAX_BLOB_PTS + 1) * 2));
            gl.uniform1i(prog.uCount, count);
            gl.uniform4f(prog.uBBox, bx, by, bw, bh);
            gl.uniform1i(prog.uGradMode, grad.mode);
            gl.uniform3fv(prog.uGradGeom, grad.geom);
            gl.uniform3fv(prog.uStopOff, grad.off);
            gl.uniform4fv(prog.uStop0, grad.stops[0]);
            gl.uniform4fv(prog.uStop1, grad.stops[1]);
            gl.uniform4fv(prog.uStop2, grad.stops[2]);
            gl.uniform4fv(prog.uStroke, stroke || [0, 0, 0, 0]);
            gl.uniform1f(prog.uStrokeHW, hw);
            gl.uniform1f(prog.uAA, aa);

            const q = this._quadData;
            q[0] = minX - pad; q[1] = minY - pad;
            q[4] = maxX + pad; q[5] = minY - pad;
            q[8] = minX - pad; q[9] = maxY + pad;
            q[12] = maxX + pad; q[13] = maxY + pad;

            gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, q, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(prog.aPos);
            gl.vertexAttribPointer(prog.aPos, 2, gl.FLOAT, false, 16, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.disableVertexAttribArray(prog.aPos);
        }

        _drawBlobScreen(pts, bboxOverride, grad, stroke, strokeHW) {
            this._drawBlobInternal(pts, bboxOverride, grad, stroke, strokeHW, false);
        }

        // ── Body: gradient fill + stroke, then glow and drop-shadow ────────

        _drawBody(bodyPts, slime) {
            const gl = this.gl;
            const dpr = this._regionScale || this._dpr;
            const stroke = this._parseColor(slime.baseColor, 0.2);

            // SourceGraphic → FBO 0
            this._beginFBO(0);
            this._drawBlobInternal(bodyPts, null, this._bodyGrad, stroke, 0.5, true);

            // url(#slime-glow): feGaussianBlur σ3 merged under the source
            this._blurPass(0, 1, 3 * dpr, true);
            this._blurPass(1, 2, 3 * dpr, false);
            this._beginFBO(1);
            this._texQuad(this._fbos[2].tex, 0, 0, this._rdw, this._rdh, this._rdw, this._rdh, this._tex, () => {
                gl.uniform1i(this._tex.uMode, 0);
            });
            this._texQuad(this._fbos[0].tex, 0, 0, this._rdw, this._rdh, this._rdw, this._rdh, this._tex, () => {
                gl.uniform1i(this._tex.uMode, 0);
            });

            // url(#slime-drop-shadow): blur σ4 of the glow result's alpha
            this._blurPass(1, 2, 4 * dpr, true);
            this._blurPass(2, 0, 4 * dpr, false);

            // Composite to screen: shadow (offset 3,6, black 0.15) under
            // the glow result
            this._bindScreen();
            this._texQuad(this._fbos[0].tex, this._regX + 3, this._regY + 6, this._regW, this._regH,
                this._cssW, this._cssH, this._tex, () => {
                    gl.uniform1i(this._tex.uMode, 1);
                    gl.uniform4f(this._tex.uShadow, 0, 0, 0, 0.15);
                });
            this._texQuad(this._fbos[1].tex, this._regX, this._regY, this._regW, this._regH,
                this._cssW, this._cssH, this._tex, () => {
                    gl.uniform1i(this._tex.uMode, 0);
                });
        }

        // ── Constraint layer (offscreen, then masked composite) ────────────

        _drawConstraintLayer(cons, offsetX, offsetY) {
            const gl = this.gl;
            const dpr = this._regionScale || this._dpr;
            const toRX = (x) => (x - offsetX - this._regX) * dpr;
            const toRY = (y) => (y - offsetY - this._regY) * dpr;

            this._beginFBO(0);
            // Lines first so points draw over them, like the SVG layer
            for (const l of cons.lines) {
                this._pushShape(
                    toRX(l.pointA.x), toRY(l.pointA.y), toRX(l.pointB.x), toRY(l.pointB.y),
                    cons.lineHW * dpr, cons.lineHW * dpr, cons.lineColor, null, 0, 1);
            }
            for (const p of cons.points) {
                const x = toRX(p.x), y = toRY(p.y);
                this._pushShape(x, y, x, y, cons.pointRadius * dpr, cons.pointRadius * dpr,
                    cons.pointFill, cons.pointStroke, 0.15 * dpr, 1);
            }
            this._flushBatch(this._rdw, this._rdh);

            // Composite with the per-pixel opacity mask (mask coords in
            // viewport css px)
            this._bindScreen();
            const mask = cons.mask;
            const hover = mask.pos && mask.pos.x !== -1000 && mask.pos.y !== -1000;
            this._texQuad(this._fbos[0].tex, this._regX, this._regY, this._regW, this._regH,
                this._cssW, this._cssH, this._tex, () => {
                    gl.uniform1i(this._tex.uMode, 2);
                    gl.uniform4f(this._tex.uMask,
                        hover ? mask.pos.x - offsetX : 0,
                        hover ? mask.pos.y - offsetY : 0,
                        hover ? mask.radius : 0,
                        mask.base);
                    gl.uniform1f(this._tex.uMaskMax, mask.max);
                });
        }

        // ── Eyes and shines ─────────────────────────────────────────────────

        _drawEyes(slime, offsetX, offsetY) {
            const lx = slime.currentLeftEyePos.x - offsetX;
            const ly = slime.currentLeftEyePos.y - offsetY;
            const rx = slime.currentRightEyePos.x - offsetX;
            const ry = slime.currentRightEyePos.y - offsetY;
            const ew = slime.initialEyeWidth;
            const eh = slime.initialEyeHeight;

            if (slime.eyeStyle === 'sleepy') {
                // Curved stroke lines (quadratic Béziers, stroke #2a2a2a
                // width 2, round caps) tessellated into capsule chains
                const color = this._parseColor('#2a2a2a');
                const drawCurve = (sx, sy, cx, cy, ex, ey) => {
                    const SEG = 12;
                    let px = sx, py = sy;
                    for (let i = 1; i <= SEG; i++) {
                        const t = i / SEG;
                        const mt = 1 - t;
                        const x = mt * mt * sx + 2 * mt * t * cx + t * t * ex;
                        const y = mt * mt * sy + 2 * mt * t * cy + t * t * ey;
                        this._pushShape(px, py, x, y, 1, 1, color, null, 0, 1 / this._dpr);
                        px = x;
                        py = y;
                    }
                };
                drawCurve(lx - ew * 0.8, ly - eh * 0.1, lx, ly - eh * 0.2, lx + ew * 0.8, ly + eh * 0.3);
                drawCurve(rx - ew * 0.8, ry + eh * 0.3, rx, ry - eh * 0.2, rx + ew * 0.8, ry - eh * 0.1);
                this._flushBatch(this._cssW, this._cssH);
                return;
            }

            // Normal anime eyes: gradient ellipses + rotated white shines
            this._drawBlobScreen(this._ellipsePts(lx, ly, ew, eh),
                [lx - ew, ly - eh, ew * 2, eh * 2], this._eyeGrad, null, 0);
            this._drawBlobScreen(this._ellipsePts(rx, ry, ew, eh),
                [rx - ew, ry - eh, ew * 2, eh * 2], this._eyeGrad, null, 0);

            const sw = slime.initialShineWidth;
            const sh = slime.initialShineHeight;
            this._drawBlobScreen(this._ellipsePts(lx - ew * 0.4, ly - eh * 0.3, sw, sh, 16),
                null, this._shineGrad, null, 0);
            this._drawBlobScreen(this._ellipsePts(rx - ew * 0.4, ry - eh * 0.3, sw, sh, 16),
                null, this._shineGrad, null, 0);
        }

        // ── Selection marker ────────────────────────────────────────────────

        _drawMarker(marker, offsetX, offsetY) {
            const cx = marker.x - offsetX;
            const cy = marker.y - offsetY;
            const r = marker.radius;
            const aa = 1 / this._dpr;
            let px = cx + r, py = cy;
            for (let i = 1; i <= 6; i++) {
                const a = (i % 6) * Math.PI / 3;
                const x = cx + r * Math.cos(a);
                const y = cy + r * Math.sin(a);
                this._pushShape(px, py, x, y, marker.halfWidth, marker.halfWidth, marker.color, null, 0, aa);
                px = x;
                py = y;
            }
            this._flushBatch(this._cssW, this._cssH);
        }

        // ── Capsule/circle batch ────────────────────────────────────────────

        _pushShape(ax, ay, bx, by, r1, r2, fill, stroke, strokeHW, aa) {
            const b = this._batch;
            const pad = Math.max(r1, r2) + strokeHW + aa + 1;
            const minX = Math.min(ax, bx) - pad, maxX = Math.max(ax, bx) + pad;
            const minY = Math.min(ay, by) - pad, maxY = Math.max(ay, by) + pad;

            if (b.count + 6 * 18 > b.verts.length) {
                const grown = new Float32Array(b.verts.length * 2);
                grown.set(b.verts);
                b.verts = grown;
            }

            const s = stroke || [0, 0, 0, 0];
            const corners = [
                minX, minY, maxX, minY, maxX, maxY,
                minX, minY, maxX, maxY, minX, maxY
            ];
            let i = b.count;
            const v = b.verts;
            for (let c = 0; c < 6; c++) {
                v[i++] = corners[c * 2];
                v[i++] = corners[c * 2 + 1];
                v[i++] = ax; v[i++] = ay; v[i++] = bx; v[i++] = by;
                v[i++] = r1; v[i++] = r2;
                v[i++] = fill[0]; v[i++] = fill[1]; v[i++] = fill[2]; v[i++] = fill[3];
                v[i++] = s[0]; v[i++] = s[1]; v[i++] = s[2]; v[i++] = s[3];
                v[i++] = strokeHW; v[i++] = aa;
            }
            b.count = i;
        }

        _flushBatch(resW, resH) {
            const gl = this.gl;
            const b = this._batch;
            if (b.count === 0) return;

            gl.useProgram(b.program);
            gl.uniform2f(b.uResolution, resW, resH);
            gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, b.verts.subarray(0, b.count), gl.DYNAMIC_DRAW);

            const stride = 18 * 4;
            gl.enableVertexAttribArray(b.aPos);
            gl.vertexAttribPointer(b.aPos, 2, gl.FLOAT, false, stride, 0);
            gl.enableVertexAttribArray(b.aSeg);
            gl.vertexAttribPointer(b.aSeg, 4, gl.FLOAT, false, stride, 8);
            gl.enableVertexAttribArray(b.aRad);
            gl.vertexAttribPointer(b.aRad, 2, gl.FLOAT, false, stride, 24);
            gl.enableVertexAttribArray(b.aFill);
            gl.vertexAttribPointer(b.aFill, 4, gl.FLOAT, false, stride, 32);
            gl.enableVertexAttribArray(b.aStroke);
            gl.vertexAttribPointer(b.aStroke, 4, gl.FLOAT, false, stride, 48);
            gl.enableVertexAttribArray(b.aParams);
            gl.vertexAttribPointer(b.aParams, 2, gl.FLOAT, false, stride, 64);

            gl.drawArrays(gl.TRIANGLES, 0, b.count / 18);
            b.count = 0;

            gl.disableVertexAttribArray(b.aPos);
            gl.disableVertexAttribArray(b.aSeg);
            gl.disableVertexAttribArray(b.aRad);
            gl.disableVertexAttribArray(b.aFill);
            gl.disableVertexAttribArray(b.aStroke);
            gl.disableVertexAttribArray(b.aParams);
        }
    }

    window.SlimeRendererGL = SlimeRendererGL;
})();
