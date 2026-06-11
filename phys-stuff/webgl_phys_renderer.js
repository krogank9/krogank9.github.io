// ══════════════════════════════════════════════════════════════════════════
// WebGL SDF Physics Renderer
// Drop-in replacement for PhysRenderer's drawing passes (shadows, bodies,
// revolute joint pivots) using batched signed-distance-field quads.
//
// Visual parity targets (from simple_phys_ezdraw_renderer_minimal.js):
//   - Shadow pass: silhouette filled rgba(0,0,0,0.2), plus canvas-style
//     drop shadow (shadowBlur 10 → gaussian sigma 5, offset (5,5), color
//     rgba(0,0,0,0.55) → effective peak alpha 0.55*0.2 = 0.11). Canvas2D
//     shadows are applied in device pixels (they ignore the DPR transform),
//     so the offsets/sigma here are divided by devicePixelRatio.
//   - Body pass: fill = limb color + "EE" alpha over the shadow underfill,
//     1px #2F3437 outline straddling the edge, and a 1px rotation indicator
//     line on single-circle bodies.
//   - Revolute pivot circles: radius 0.015 world units, #2F3437 fill and
//     stroke at lineWidth 2.
// Contact markers and joint limit arcs (debug visuals) are intentionally
// not rendered.
//
// The blurred shadow needs no blur pass: the silhouette of a gaussian-blurred
// shape equals erf-falloff applied to the shape's signed distance, so both
// crisp and blurred edges use one coverage function with different sigma.
// ══════════════════════════════════════════════════════════════════════════

const PhysRendererGL = {
	available: false,
	canvas: null,
	gl: null,

	_program: null,
	_buffer: null,
	_attribs: null,
	_uResolution: null,
	_verts: new Float32Array(32768),
	_count: 0, // floats written this frame
	_frameStarted: false,

	FLOATS_PER_VERT: 18,

	// ── Setup ───────────────────────────────────────────────────────────

	// Creates the WebGL canvas layered directly beneath ez.canvas.
	// Returns true if WebGL is available; callers can fall back to the
	// Canvas2D PhysRenderer when it is not.
	init() {
		if (this.available) return true;
		if (typeof ez === 'undefined' || !ez.canvas || !ez.canvas.parentNode) return false;

		const canvas = document.createElement('canvas');
		canvas.style.cssText = 'display:block;position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
		ez.canvas.parentNode.insertBefore(canvas, ez.canvas);

		// MSAA for the triangle-mesh props; SDF shapes carry their own AA
		const opts = { alpha: true, antialias: true, premultipliedAlpha: true, depth: false, stencil: false };
		const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
		if (!gl) {
			canvas.remove();
			return false;
		}

		const vsSource = [
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
			'	vec2 ndc = vec2(aPos.x / uResolution.x * 2.0 - 1.0, 1.0 - aPos.y / uResolution.y * 2.0);',
			'	gl_Position = vec4(ndc, 0.0, 1.0);',
			'}'
		].join('\n');

		const fsSource = [
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
			'varying vec2 vParams;', // x: stroke half-width px, y: edge sigma px
			'',
			'float erfApprox(float x) {',
			'	float x2 = x * x;',
			'	float ax2 = 0.147 * x2;',
			'	return sign(x) * sqrt(1.0 - exp(-x2 * (1.273239545 + ax2) / (1.0 + ax2)));',
			'}',
			'',
			// Pixel coverage at signed distance d. Positive sigma = gaussian
			// falloff (blurred shadows). Negative sigma = linear coverage ramp
			// of width |sigma| px — matches Canvas2D antialiasing, which is a
			// 1-device-pixel box filter (gaussian tails read as blur on edges).
			'float coverage(float d, float sigma) {',
			'	if (sigma < 0.0) {',
			'		return clamp(0.5 + d / sigma, 0.0, 1.0);',
			'	}',
			'	return 0.5 * (1.0 - erfApprox(d / (sigma * 1.414213562)));',
			'}',
			'',
			// Uneven capsule SDF (hull of two circles). Degenerate cases
			// (zero length, or one circle containing the other) reduce to
			// the min of the two circle distances, matching ezCapsule.
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
			'	float sigma = vParams.y;',
			'	vec3 rgb = vFill.rgb;',
			'	float a = vFill.a * coverage(d, sigma);',
			'	if (vParams.x > 0.0) {',
			// Stroke straddles the edge (canvas lineWidth behavior),
			// composited over the fill like fillAndStroke().
			'		float sa = vStroke.a * coverage(abs(d) - vParams.x, sigma);',
			'		float outA = sa + a * (1.0 - sa);',
			'		if (outA > 0.0) rgb = (vStroke.rgb * sa + rgb * a * (1.0 - sa)) / outA;',
			'		a = outA;',
			'	}',
			'	gl_FragColor = vec4(rgb * a, a);', // premultiplied
			'}'
		].join('\n');

		const program = this._createProgram(gl, vsSource, fsSource);
		if (!program) {
			canvas.remove();
			return false;
		}

		this._attribs = {
			aPos: gl.getAttribLocation(program, 'aPos'),
			aSeg: gl.getAttribLocation(program, 'aSeg'),
			aRad: gl.getAttribLocation(program, 'aRad'),
			aFill: gl.getAttribLocation(program, 'aFill'),
			aStroke: gl.getAttribLocation(program, 'aStroke'),
			aParams: gl.getAttribLocation(program, 'aParams')
		};
		this._uResolution = gl.getUniformLocation(program, 'uResolution');
		this._buffer = gl.createBuffer();

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied src-over
		gl.clearColor(0, 0, 0, 0);

		this.canvas = canvas;
		this.gl = gl;
		this._program = program;

		if (!this._initMeshProgram(gl)) {
			canvas.remove();
			return false;
		}

		this.available = true;
		console.log('[PhysRendererGL] WebGL renderer active (ragdoll bodies/shadows/joints on GL layer)');
		return true;
	},

	// ── Packed SVG mesh rendering ───────────────────────────────────────
	// Meshes come from scripts/pack-svgs.mjs: flat triangles with per-vertex
	// RGBA in the SVG's viewBox coordinate space. True vector rendering —
	// no rasterization, so props stay sharp at any scale and DPR.

	_meshProgram: null,
	_meshAttribs: null,
	_meshUniforms: null,
	_meshes: {},

	_initMeshProgram(gl) {
		const vs = [
			'attribute vec2 aPos;',
			'attribute vec4 aColor;',
			'uniform vec2 uResolution;',
			'uniform vec4 uMatA;', // a, b, c, d  (x' = a*x + c*y + e ...)
			'uniform vec2 uMatT;', // e, f
			'varying vec4 vColor;',
			'void main() {',
			'	vColor = aColor;',
			'	vec2 p = vec2(uMatA.x * aPos.x + uMatA.z * aPos.y + uMatT.x,',
			'	              uMatA.y * aPos.x + uMatA.w * aPos.y + uMatT.y);',
			'	vec2 ndc = vec2(p.x / uResolution.x * 2.0 - 1.0, 1.0 - p.y / uResolution.y * 2.0);',
			'	gl_Position = vec4(ndc, 0.0, 1.0);',
			'}'
		].join('\n');
		const fs = [
			'precision mediump float;',
			'varying vec4 vColor;',
			'void main() {',
			'	gl_FragColor = vec4(vColor.rgb * vColor.a, vColor.a);', // premultiplied
			'}'
		].join('\n');

		const program = this._createProgram(gl, vs, fs);
		if (!program) return false;

		this._meshProgram = program;
		this._meshAttribs = {
			aPos: gl.getAttribLocation(program, 'aPos'),
			aColor: gl.getAttribLocation(program, 'aColor')
		};
		this._meshUniforms = {
			uResolution: gl.getUniformLocation(program, 'uResolution'),
			uMatA: gl.getUniformLocation(program, 'uMatA'),
			uMatT: gl.getUniformLocation(program, 'uMatT')
		};
		return true;
	},

	// Fetches the packed mesh JSON and uploads static buffers. Until this
	// resolves, hasMesh() is false and callers fall back to Canvas2D.
	loadMeshes(url) {
		if (!this.available) return Promise.resolve(false);
		return fetch(url)
			.then(r => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				return r.json();
			})
			.then(data => {
				const gl = this.gl;
				for (const [name, mesh] of Object.entries(data)) {
					const posBuf = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW);

					const colorBuf = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
					gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(mesh.colors), gl.STATIC_DRAW);

					const idxBuf = gl.createBuffer();
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
					gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

					this._meshes[name] = {
						posBuf, colorBuf, idxBuf,
						indexCount: mesh.indices.length,
						viewBox: mesh.viewBox
					};
				}
				console.log('[PhysRendererGL] packed SVG meshes loaded:', Object.keys(this._meshes).join(', '),
					'— props now render as WebGL vector meshes');
				return true;
			})
			.catch(err => {
				console.warn('PhysRendererGL.loadMeshes failed, props fall back to Canvas2D:', err);
				return false;
			});
	},

	hasMesh(name) {
		return !!this._meshes[name];
	},

	// Draws a packed mesh with the same semantics as the Canvas2D path:
	// translate(screenX, screenY), rotate(-rotation), destination rect
	// [-drawW/2 + offsetX, -drawH/2 + offsetY, drawW, drawH] mapped from
	// the mesh's viewBox. Coordinates in logical CSS pixels.
	drawMesh(name, screenX, screenY, rotation, drawW, drawH, offsetX, offsetY) {
		const mesh = this._meshes[name];
		if (!mesh || !this.available) return false;

		const gl = this.gl;
		const { cssW, cssH } = this._resize();
		this.beginFrame();

		const [vbx, vby, vbw, vbh] = mesh.viewBox;
		const sxx = drawW / vbw, syy = drawH / vbh;
		const tx0 = -vbx * sxx - drawW / 2 + offsetX;
		const ty0 = -vby * syy - drawH / 2 + offsetY;
		const rot = -rotation; // canvas used ctx.rotate(-rotation)
		const cos = Math.cos(rot), sin = Math.sin(rot);

		gl.useProgram(this._meshProgram);
		gl.uniform2f(this._meshUniforms.uResolution, cssW, cssH);
		gl.uniform4f(this._meshUniforms.uMatA, cos * sxx, sin * sxx, -sin * syy, cos * syy);
		gl.uniform2f(this._meshUniforms.uMatT,
			cos * tx0 - sin * ty0 + screenX,
			sin * tx0 + cos * ty0 + screenY);

		const a = this._meshAttribs;
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuf);
		gl.enableVertexAttribArray(a.aPos);
		gl.vertexAttribPointer(a.aPos, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colorBuf);
		gl.enableVertexAttribArray(a.aColor);
		gl.vertexAttribPointer(a.aColor, 4, gl.UNSIGNED_BYTE, true, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idxBuf);
		gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
		gl.disableVertexAttribArray(a.aPos);
		gl.disableVertexAttribArray(a.aColor);
		return true;
	},

	_createProgram(gl, vsSource, fsSource) {
		const compile = (type, source) => {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error('PhysRendererGL shader error:', gl.getShaderInfoLog(shader));
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
			console.error('PhysRendererGL link error:', gl.getProgramInfoLog(program));
			return null;
		}
		return program;
	},

	// ── Color helpers ───────────────────────────────────────────────────

	_colorCache: {},

	// Parses #RGB / #RRGGBB / #RRGGBBAA into [r, g, b, a] in 0-1.
	_parseColor(hex) {
		let c = this._colorCache[hex];
		if (c) return c;
		let h = hex.replace('#', '');
		if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
		const r = parseInt(h.slice(0, 2), 16) / 255;
		const g = parseInt(h.slice(2, 4), 16) / 255;
		const b = parseInt(h.slice(4, 6), 16) / 255;
		const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
		c = [r, g, b, a];
		this._colorCache[hex] = c;
		return c;
	},

	// ── Geometry batching ───────────────────────────────────────────────

	// Appends one SDF shape (uneven capsule; circle when a==b) as a quad.
	// Coordinates and radii are in logical CSS pixels.
	_pushShape(ax, ay, bx, by, r1, r2, fill, stroke, strokeHW, sigma) {
		// sigma is negative for linear-ramp (crisp) edges; pad by magnitude
		const pad = Math.max(r1, r2) + strokeHW + Math.abs(sigma) * 3.5 + 1;
		const minX = Math.min(ax, bx) - pad, maxX = Math.max(ax, bx) + pad;
		const minY = Math.min(ay, by) - pad, maxY = Math.max(ay, by) + pad;

		if (this._count + 6 * this.FLOATS_PER_VERT > this._verts.length) {
			const grown = new Float32Array(this._verts.length * 2);
			grown.set(this._verts);
			this._verts = grown;
		}

		const s = stroke || [0, 0, 0, 0];
		const corners = [
			minX, minY, maxX, minY, maxX, maxY, // triangle 1
			minX, minY, maxX, maxY, minX, maxY  // triangle 2
		];
		let i = this._count;
		const v = this._verts;
		for (let cIdx = 0; cIdx < 6; cIdx++) {
			v[i++] = corners[cIdx * 2];
			v[i++] = corners[cIdx * 2 + 1];
			v[i++] = ax; v[i++] = ay; v[i++] = bx; v[i++] = by;
			v[i++] = r1; v[i++] = r2;
			v[i++] = fill[0]; v[i++] = fill[1]; v[i++] = fill[2]; v[i++] = fill[3];
			v[i++] = s[0]; v[i++] = s[1]; v[i++] = s[2]; v[i++] = s[3];
			v[i++] = strokeHW; v[i++] = sigma;
		}
		this._count = i;
	},

	// Invokes cb(ax, ay, bx, by, r1, r2) in screen px for each silhouette of
	// a body: the capsule hull for capsule bodies, circles for circle shapes.
	// Polygon bodies are not emitted (the only ones in this scene are
	// _renderHidden: the floor and the SVG prop bodies).
	_eachSilhouette(obj, ppu, cb) {
		if (obj._capsuleHints) {
			const { length, r1, r2, offset } = obj._capsuleHints;
			const cos = Math.cos(obj.rotation), sin = Math.sin(obj.rotation);
			const halfLen = length / 2;
			const axLocal = -halfLen - offset, bxLocal = halfLen - offset;
			const aw = { x: obj.position.x + axLocal * cos, y: obj.position.y + axLocal * sin };
			const bw = { x: obj.position.x + bxLocal * cos, y: obj.position.y + bxLocal * sin };
			const aScr = ez.worldToScreen2D(aw.x, aw.y);
			const ax = aScr.x, ay = aScr.y;
			const bScr = ez.worldToScreen2D(bw.x, bw.y);
			cb(ax, ay, bScr.x, bScr.y, r1 * ppu, r2 * ppu);
		} else if (obj.shapes && Array.isArray(obj.shapes)) {
			for (const shape of obj.shapes) {
				if (typeof CircleShape !== 'undefined' && shape instanceof CircleShape) {
					const center = obj.localToWorld(shape.offset);
					const scr = ez.worldToScreen2D(center.x, center.y);
					const r = shape.radius * ppu;
					cb(scr.x, scr.y, scr.x, scr.y, r, r);
				}
			}
		}
	},

	_resize() {
		const dpr = window.devicePixelRatio || 1;
		const cssW = ez.canvas.width;   // ez patches these to logical px
		const cssH = ez.canvas.height;
		const devW = Math.max(1, Math.round(cssW * dpr));
		const devH = Math.max(1, Math.round(cssH * dpr));
		if (this.canvas.width !== devW || this.canvas.height !== devH) {
			this.canvas.width = devW;
			this.canvas.height = devH;
		}
		this.gl.viewport(0, 0, devW, devH);
		return { cssW, cssH };
	},

	// Begins a new GL frame (clear). Later draws in the same rAF tick (e.g.
	// packed SVG props) composite over this without clearing.
	beginFrame() {
		if (this._frameStarted) return;
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this._frameStarted = true;
	},

	_flush(cssW, cssH) {
		const gl = this.gl;
		if (this._count === 0) return;

		gl.useProgram(this._program);
		gl.uniform2f(this._uResolution, cssW, cssH);
		gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this._verts.subarray(0, this._count), gl.DYNAMIC_DRAW);

		const stride = this.FLOATS_PER_VERT * 4;
		const a = this._attribs;
		gl.enableVertexAttribArray(a.aPos);
		gl.vertexAttribPointer(a.aPos, 2, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(a.aSeg);
		gl.vertexAttribPointer(a.aSeg, 4, gl.FLOAT, false, stride, 8);
		gl.enableVertexAttribArray(a.aRad);
		gl.vertexAttribPointer(a.aRad, 2, gl.FLOAT, false, stride, 24);
		gl.enableVertexAttribArray(a.aFill);
		gl.vertexAttribPointer(a.aFill, 4, gl.FLOAT, false, stride, 32);
		gl.enableVertexAttribArray(a.aStroke);
		gl.vertexAttribPointer(a.aStroke, 4, gl.FLOAT, false, stride, 48);
		gl.enableVertexAttribArray(a.aParams);
		gl.vertexAttribPointer(a.aParams, 2, gl.FLOAT, false, stride, 64);

		gl.drawArrays(gl.TRIANGLES, 0, this._count / this.FLOATS_PER_VERT);
		this._count = 0;

		// Leave no enabled arrays behind: the mesh program uses different
		// attribute locations, and stale enabled arrays can fail validation.
		for (const loc of Object.values(a)) gl.disableVertexAttribArray(loc);
	},

	// ── Main render ─────────────────────────────────────────────────────

	render(world) {
		if (!this.available) {
			if (!this._warnedFallback) {
				this._warnedFallback = true;
				console.log('[PhysRendererGL] not available — using Canvas2D PhysRenderer fallback');
			}
			PhysRenderer.render(world);
			return;
		}
		if (!world || !world.objects) return;

		ez._updateCameraCache();
		PhysRenderer.update(); // mouse grab constraint upkeep

		const { cssW, cssH } = this._resize();
		this._frameStarted = false;
		this.beginFrame();

		const dpr = window.devicePixelRatio || 1;
		const ppu = 1 / Math.abs(ez._camScaleX); // logical px per world unit

		// Canvas2D shadow params live in device px; convert to logical px.
		const shadowOff = 5 / dpr;
		const shadowSigma = 5 / dpr; // shadowBlur 10 → gaussian sigma 5
		// Crisp edges: linear coverage ramp exactly 1 device pixel wide
		// (negative value selects the linear mode in the shader)
		const aaSigma = -(1 / dpr);

		const shadowBlurColor = [0, 0, 0, 0.55 * 0.2];
		const shadowFillColor = [0, 0, 0, 0.2];
		const outline = this._parseColor(PhysRenderer.colors.outline);
		const pivotFill = this._parseColor(PhysRenderer.colors.constraintPoint);

		const sorted = PhysRenderer.getSortedObjects(world);

		// 1) Shadow pass: blurred drop shadow + crisp dark underfill per shape
		for (const obj of sorted) {
			if (obj._renderHidden) continue;
			this._eachSilhouette(obj, ppu, (ax, ay, bx, by, r1, r2) => {
				this._pushShape(ax + shadowOff, ay + shadowOff, bx + shadowOff, by + shadowOff,
					r1, r2, shadowBlurColor, null, 0, shadowSigma);
				this._pushShape(ax, ay, bx, by, r1, r2, shadowFillColor, null, 0, aaSigma);
			});
		}

		// 2) Body pass: colored fill + 1px outline, then rotation indicator
		//    lines on single-circle bodies (head, hands)
		for (const obj of sorted) {
			if (obj._renderHidden) continue;
			const colorHex = (obj._renderColorHint ?? PhysRenderer._getObjectColor(obj)) +
				(obj._renderTransparencyHint ?? 'EE');
			const fill = this._parseColor(colorHex);
			this._eachSilhouette(obj, ppu, (ax, ay, bx, by, r1, r2) => {
				this._pushShape(ax, ay, bx, by, r1, r2, fill, outline, 0.5, aaSigma);
			});

			if (obj.shapes && obj.shapes.length === 1 &&
				typeof CircleShape !== 'undefined' && obj.shapes[0] instanceof CircleShape) {
				const shape = obj.shapes[0];
				const center = obj.localToWorld(shape.offset);
				const endX = center.x + shape.radius * Math.cos(obj.rotation);
				const endY = center.y + shape.radius * Math.sin(obj.rotation);
				const sScr = ez.worldToScreen2D(center.x, center.y);
				const sx = sScr.x, sy = sScr.y;
				const eScr = ez.worldToScreen2D(endX, endY);
				this._pushShape(sx, sy, eScr.x, eScr.y, 0.5, 0.5, outline, null, 0, aaSigma);
			}
		}

		// 3) Revolute joint pivot circles (r=0.015 world, lineWidth 2).
		//    Contact markers and limit arcs are debug-only and skipped.
		if (PhysRenderer._renderConstraints && world.constraints) {
			for (const c of world.constraints) {
				if (typeof RevoluteConstraint === 'undefined' || !(c instanceof RevoluteConstraint)) continue;
				if ((c.bodyA && c.bodyA._renderHidden) || (c.bodyB && c.bodyB._renderHidden)) continue;
				const worldPos = c.bodyA.localToWorld
					? c.bodyA.localToWorld(c.localA)
					: c.bodyA.position.add(c.localA);
				const scr = ez.worldToScreen2D(worldPos.x, worldPos.y);
				const r = 0.015 * ppu;
				this._pushShape(scr.x, scr.y, scr.x, scr.y, r, r, pivotFill, outline, 1, aaSigma);
			}
		}

		this._flush(cssW, cssH);
	}
};
