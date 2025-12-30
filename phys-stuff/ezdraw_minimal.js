// ezdraw_minimal.js - Optimized for physics renderer
// License: CC0 public domain

const ez = {
    canvas: null,
    ctx: null,
    camera: null,
    centerOrigin: false,
    centerOriginX: false,
    centerOriginY: false,
    fast2DModeWithNoCameraRotation: true, // Always true for this build
    // Cached camera values (updated once per frame)
    _camPosX: 0,
    _camPosY: 0,
    _camScaleX: 1,
    _camScaleY: 1,
    _halfWidth: 0,
    _halfHeight: 0,
    _centerX: false,
    _centerY: false,
};

// Pre-allocated scratch objects for hot paths
const _scratch = {
    v2a: {x: 0, y: 0},
    v2b: {x: 0, y: 0},
    v3a: {x: 0, y: 0, z: 0},
};

///////////////////////
// SETUP BOILERPLATE //
///////////////////////

const _canvasWidthProperty = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
const _canvasHeightProperty = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'height');

ez._devicePixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

ez._applyCanvasScale = function(canvas, ctx) {
    if (!canvas || !ctx) return;
    const dpr = canvas._ezDevicePixelRatio || ez._devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

ez._patchCanvasForHiDPI = function(canvas) {
    if (!canvas || canvas._ezHiDPIPatched) return;
    canvas._ezHiDPIPatched = true;

    Object.defineProperty(canvas, 'width', {
        configurable: true, enumerable: true,
        get() {
            if (this._ezLogicalWidth !== undefined) return this._ezLogicalWidth;
            return _canvasWidthProperty.get.call(this) / (this._ezDevicePixelRatio || 1);
        },
        set(value) {
            const numericValue = +value || 0;
            const dpr = window.devicePixelRatio || 1;
            this._ezDevicePixelRatio = dpr;
            this._ezLogicalWidth = numericValue;
            _canvasWidthProperty.set.call(this, Math.max(Math.round(numericValue * dpr), 1));
        }
    });

    Object.defineProperty(canvas, 'height', {
        configurable: true, enumerable: true,
        get() {
            if (this._ezLogicalHeight !== undefined) return this._ezLogicalHeight;
            return _canvasHeightProperty.get.call(this) / (this._ezDevicePixelRatio || 1);
        },
        set(value) {
            const numericValue = +value || 0;
            const dpr = window.devicePixelRatio || 1;
            this._ezDevicePixelRatio = dpr;
            this._ezLogicalHeight = numericValue;
            _canvasHeightProperty.set.call(this, Math.max(Math.round(numericValue * dpr), 1));
        }
    });
};

ez.createCanvasAndAddToPage = function() {
    ez.canvas = document.createElement("canvas");
    document.body.appendChild(ez.canvas);

    const canvas = ez.canvas;
    canvas.style.cssText = 'display:block;position:absolute;left:0;top:0;width:100%;height:100%;outline:none;touch-action:pan-y';
    document.body.style.cssText = 'margin:0;overflow:hidden;width:100%;height:100%';
    document.documentElement.style.cssText = 'width:100%;height:100%;overflow:hidden';

    // Store references to original property descriptors BEFORE overriding
    const origWidthDesc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
    const origHeightDesc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'height');
    
    // Override width/height getters to return logical size FIRST
    Object.defineProperty(canvas, 'width', {
        get() { return this._logicalWidth || 0; },
        set(v) { 
            this._logicalWidth = v;
            // Always use fresh DPR
            const d = window.devicePixelRatio || 1;
            this._dpr = d;
            origWidthDesc.set.call(this, Math.round(v * d));
        }
    });
    Object.defineProperty(canvas, 'height', {
        get() { return this._logicalHeight || 0; },
        set(v) { 
            this._logicalHeight = v;
            // Always use fresh DPR
            const d = window.devicePixelRatio || 1;
            this._dpr = d;
            origHeightDesc.set.call(this, Math.round(v * d));
        }
    });
    
    const resize = () => {
        // Use clientWidth/Height which works correctly in iframes
        const w = document.documentElement.clientWidth || window.innerWidth;
        const h = document.documentElement.clientHeight || window.innerHeight;
        
        // Get fresh DPR on every resize
        const dpr = window.devicePixelRatio || 1;
        canvas._dpr = dpr;
        
        // Set dimensions (this also sets _logicalWidth/_logicalHeight via our setter)
        canvas.width = Math.max(w, 1);
        canvas.height = Math.max(h, 1);
        
        // Scale context to match DPI (setting canvas dimensions clears transform)
        if (ez.ctx) {
            ez.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    };
    
    window.addEventListener('resize', resize);
    canvas.tabIndex = 0;

    ez.addInputEventListeners(canvas);
    ez.ctx = canvas.getContext("2d");
    
    // Call resize AFTER ctx is created so the transform can be set
    resize();
    
    ez.camera = ez.camera || new mat3x4();
    return canvas;
};

ez.clear = function() {
    ez.ctx.clearRect(0, 0, ez.canvas.width, ez.canvas.height);
};

// Lightweight save/restore - only saves what we actually modify
let _savedCtxCount = 0;
ez.save = function() {
    ez.ctx.save();
    _savedCtxCount++;
};
ez.restore = function() {
    if (_savedCtxCount > 0) {
        ez.ctx.restore();
        _savedCtxCount--;
    }
};

// Update cached camera values - call once per frame before rendering
ez._updateCameraCache = function() {
    const m = ez.camera.matrix;
    ez._camPosX = m.col4.x;
    ez._camPosY = m.col4.y;
    ez._camScaleX = m.col1.x;
    ez._camScaleY = m.col2.y;
    ez._halfWidth = ez.canvas.width * 0.5;
    ez._halfHeight = ez.canvas.height * 0.5;
    ez._centerX = ez.centerOrigin || ez.centerOriginX;
    ez._centerY = ez.centerOrigin || ez.centerOriginY;
};

/////////////////
// INPUT STUFF //
/////////////////

ez.mousePos = {x: 0, y: 0};
ez.mouseDown = {left: false, middle: false, right: false};
ez.mouseMoveCallbacks = [];
ez.mouseDownCallbacks = [];
ez.mouseUpCallbacks = [];

ez.isMouseDown = function(button) { return ez.mouseDown[button || 'left']; };
ez.onMouseMove = function(cb) { ez.mouseMoveCallbacks.push(cb); };
ez.onMouseDown = function(cb) { ez.mouseDownCallbacks.push(cb); };
ez.onMouseUp = function(cb) { ez.mouseUpCallbacks.push(cb); };
ez.getMousePos = function() { return ez.mousePos; };

ez.addInputEventListeners = function(canvas) {
    if (canvas._ezEvents) return;
    canvas._ezEvents = true;

    canvas.addEventListener('pointerdown', function(e) {
        const rect = canvas.getBoundingClientRect();
        ez.mousePos.x = e.clientX - rect.left;
        ez.mousePos.y = e.clientY - rect.top;
        if (e.button === 0) ez.mouseDown.left = true;
        else if (e.button === 1) ez.mouseDown.middle = true;
        else if (e.button === 2) ez.mouseDown.right = true;
        for (let i = 0; i < ez.mouseDownCallbacks.length; i++) ez.mouseDownCallbacks[i](e);
    });

    canvas.addEventListener('pointermove', function(e) {
        const rect = canvas.getBoundingClientRect();
        ez.mousePos.x = e.clientX - rect.left;
        ez.mousePos.y = e.clientY - rect.top;
        for (let i = 0; i < ez.mouseMoveCallbacks.length; i++) ez.mouseMoveCallbacks[i](e);
    });

    canvas.addEventListener('pointerup', function(e) {
        if (e.button === 0) ez.mouseDown.left = false;
        else if (e.button === 1) ez.mouseDown.middle = false;
        else if (e.button === 2) ez.mouseDown.right = false;
        for (let i = 0; i < ez.mouseUpCallbacks.length; i++) ez.mouseUpCallbacks[i](e);
    });

    canvas.addEventListener('pointerleave', function(e) {
        ez.mouseDown.left = ez.mouseDown.middle = ez.mouseDown.right = false;
        for (let i = 0; i < ez.mouseUpCallbacks.length; i++) ez.mouseUpCallbacks[i](e);
    });
};

/////////////////////
// FAST TRANSFORMS //
/////////////////////

// Ultra-fast worldToScreen for 2D - returns {x, y} object (reuses scratch)
ez.worldToScreen2D = function(px, py, transform) {
    let wx, wy;
    if (transform) {
        const m = transform.matrix;
        wx = m.col1.x * px + m.col2.x * py + m.col4.x;
        wy = m.col1.y * px + m.col2.y * py + m.col4.y;
    } else {
        wx = px;
        wy = py;
    }
    let sx = (wx - ez._camPosX) / ez._camScaleX;
    let sy = (wy - ez._camPosY) / ez._camScaleY;
    if (ez._centerX) sx += ez._halfWidth;
    if (ez._centerY) sy += ez._halfHeight;
    return {x: sx, y: sy};
};

// worldToScreen that returns a vec2-like object (for compatibility)
ez.worldToScreen = function(point, transform) {
    const px = point.x || 0, py = point.y || 0;
    let wx, wy;
    if (transform) {
        const m = transform.matrix;
        wx = m.col1.x * px + m.col2.x * py + m.col4.x;
        wy = m.col1.y * px + m.col2.y * py + m.col4.y;
    } else {
        wx = px;
        wy = py;
    }
    let sx = (wx - ez._camPosX) / ez._camScaleX;
    let sy = (wy - ez._camPosY) / ez._camScaleY;
    if (ez._centerX) sx += ez._halfWidth;
    if (ez._centerY) sy += ez._halfHeight;
    return new vec2(sx, sy);
};

ez.screenToWorld = function(pos) {
    let x = pos.x || 0, y = pos.y || 0;
    if (ez._centerX) x -= ez._halfWidth;
    if (ez._centerY) y -= ez._halfHeight;
    // For simple 2D case with no rotation
    const wx = x * ez._camScaleX + ez._camPosX;
    const wy = y * ez._camScaleY + ez._camPosY;
    return new vec2(wx, wy);
};

ez.getMousePosWorld = function() {
    return ez.screenToWorld(ez.mousePos);
};

///////////////////
// SHAPE DRAWING //
///////////////////

// rect
function ezRect(pos, size, rot) {
    this.hw = (size.x !== undefined ? size.x : size[0]) * 0.5;
    this.hh = (size.y !== undefined ? size.y : size[1]) * 0.5;
    const cos = Math.cos(rot || 0), sin = Math.sin(rot || 0);
    const px = pos.x !== undefined ? pos.x : (pos[0] || 0);
    const py = pos.y !== undefined ? pos.y : (pos[1] || 0);
    this.transform = new mat3x4Fast(cos, sin, -sin, cos, px, py);
}
ezRect.prototype.drawPath = function() {
    const t = this.transform, hw = this.hw, hh = this.hh;
    const c0 = ez.worldToScreen2D(-hw, -hh, t);
    const c1 = ez.worldToScreen2D(hw, -hh, t);
    const c2 = ez.worldToScreen2D(hw, hh, t);
    const c3 = ez.worldToScreen2D(-hw, hh, t);
    const ctx = ez.ctx;
    ctx.beginPath();
    ctx.moveTo(c0.x, c0.y);
    ctx.lineTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.lineTo(c3.x, c3.y);
    ctx.closePath();
};
ez.rect = function(pos, size, rot) { return new ezRect(pos, size, rot); };

// circle
function ezCircle(pos, radius) {
    this.radius = radius;
    const px = pos.x !== undefined ? pos.x : (pos[0] || 0);
    const py = pos.y !== undefined ? pos.y : (pos[1] || 0);
    this.transform = new mat3x4Fast(1, 0, 0, 1, px, py);
}
ezCircle.prototype.drawPath = function() {
    const center = ez.worldToScreen2D(0, 0, this.transform);
    const edge = ez.worldToScreen2D(0, this.radius, this.transform);
    const r = Math.sqrt((center.x - edge.x) ** 2 + (center.y - edge.y) ** 2);
    ez.ctx.beginPath();
    ez.ctx.arc(center.x, center.y, r, 0, 6.283185307179586);
    ez.ctx.closePath();
};
ez.circle = function(pos, radius) { return new ezCircle(pos, radius); };

// arc
function ezArc(pos, rot, spanAngle, radius, closeAsTriangle) {
    this.spanAngle = spanAngle ?? 3.141592653589793;
    this.closeAsTriangle = closeAsTriangle !== false;
    this.radius = radius;
    const cos = Math.cos(rot || 0), sin = Math.sin(rot || 0);
    const px = pos.x !== undefined ? pos.x : (pos[0] || 0);
    const py = pos.y !== undefined ? pos.y : (pos[1] || 0);
    this.transform = new mat3x4Fast(cos, sin, sin, -cos, px, py);
    this._rot = rot || 0;
}
ezArc.prototype.drawPath = function() {
    const center = ez.worldToScreen2D(0, 0, this.transform);
    const edge = ez.worldToScreen2D(this.radius, 0, this.transform);
    const r = Math.sqrt((center.x - edge.x) ** 2 + (center.y - edge.y) ** 2);
    const rot = Math.atan2(this.transform.matrix.col1.y, this.transform.matrix.col1.x);
    const ctx = ez.ctx;
    ctx.beginPath();
    if (this.closeAsTriangle) {
        ctx.moveTo(center.x, center.y);
        ctx.arc(center.x, center.y, r, rot, rot + this.spanAngle);
        ctx.closePath();
    } else {
        ctx.arc(center.x, center.y, r, rot, rot + this.spanAngle);
    }
};
ez.arc = function(pos, rot, spanAngle, radius, closeAsTriangle) {
    return new ezArc(pos, rot, spanAngle, radius, closeAsTriangle);
};

// capsule
function ezCapsule(pos, rot, length, r1, r2) {
    this.length = length || 0;
    this.r1 = r1 || 1;
    this.r2 = r2 || 1;
    const cos = Math.cos(rot || 0), sin = Math.sin(rot || 0);
    const px = pos.x !== undefined ? pos.x : (pos[0] || 0);
    const py = pos.y !== undefined ? pos.y : (pos[1] || 0);
    this.transform = new mat3x4Fast(cos, sin, -sin, cos, px, py);
}
ezCapsule.prototype.drawPath = function() {
    const L = this.length, r1 = this.r1, r2 = this.r2, t = this.transform;
    
    if (L <= Math.abs(r2 - r1)) {
        const rad = Math.max(r1, r2);
        const off = r2 > r1 ? L * 0.5 : -L * 0.5;
        const c = ez.worldToScreen2D(off, 0, t);
        const e = ez.worldToScreen2D(off + rad, 0, t);
        const r = Math.sqrt((c.x - e.x) ** 2 + (c.y - e.y) ** 2);
        ez.ctx.beginPath();
        ez.ctx.arc(c.x, c.y, r, 0, 6.283185307179586);
        ez.ctx.closePath();
        return;
    }

    const hL = L * 0.5;
    const factor = Math.sqrt(1 - ((r2 - r1) / L) ** 2);
    const leftC = ez.worldToScreen2D(-hL, 0, t);
    const rightC = ez.worldToScreen2D(hL, 0, t);
    const leftR = ez.worldToScreen2D(-hL, r1, t);
    const rightR = ez.worldToScreen2D(hL, r2, t);
    const tR1 = Math.sqrt((leftC.x - leftR.x) ** 2 + (leftC.y - leftR.y) ** 2);
    const tR2 = Math.sqrt((rightC.x - rightR.x) ** 2 + (rightC.y - rightR.y) ** 2);

    const denom = L;
    const ltx = -hL - ((r2 - r1) * r1) / denom;
    const lty = r1 * factor;
    const rtx = hL - ((r2 - r1) * r2) / denom;
    const rty = r2 * factor;

    const ltTop = ez.worldToScreen2D(ltx, lty, t);
    const ltBot = ez.worldToScreen2D(ltx, -lty, t);
    const rtTop = ez.worldToScreen2D(rtx, rty, t);
    const rtBot = ez.worldToScreen2D(rtx, -rty, t);

    const ctx = ez.ctx;
    ctx.beginPath();
    ctx.moveTo(ltTop.x, ltTop.y);
    ctx.arc(rightC.x, rightC.y, tR2,
        Math.atan2(rtTop.y - rightC.y, rtTop.x - rightC.x),
        Math.atan2(rtBot.y - rightC.y, rtBot.x - rightC.x), false);
    ctx.arc(leftC.x, leftC.y, tR1,
        Math.atan2(ltBot.y - leftC.y, ltBot.x - leftC.x),
        Math.atan2(ltTop.y - leftC.y, ltTop.x - leftC.x), false);
    ctx.closePath();
};
ez.capsule = function(pos, rot, length, r1, r2) { return new ezCapsule(pos, rot, length, r1, r2); };

// line
function ezLine(startPos, endPos, options) {
    this.sx = startPos.x !== undefined ? startPos.x : (startPos[0] || 0);
    this.sy = startPos.y !== undefined ? startPos.y : (startPos[1] || 0);
    this.ex = endPos.x !== undefined ? endPos.x : (endPos[0] || 0);
    this.ey = endPos.y !== undefined ? endPos.y : (endPos[1] || 0);
    this.options = options || {};
}
ezLine.prototype.stroke = function(color) {
    let s = ez.worldToScreen2D(this.sx, this.sy, null);
    let e = ez.worldToScreen2D(this.ex, this.ey, null);
    if (this.options.roundToNearestPixel) {
        s = { x: Math.round(s.x), y: Math.round(s.y) };
        e = { x: Math.round(e.x), y: Math.round(e.y) };
    }
    const ctx = ez.ctx;
    ctx.save();
    if (color) ctx.strokeStyle = ez.parseColor(color);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    ctx.restore();
};
ez.line = function(startPos, endPos, options) { return new ezLine(startPos, endPos, options); };

// grid
function ezGrid(cellSize, numCells, roundToNearestPixel) {
    this.cellSize = typeof cellSize === 'number' ? { x: cellSize, y: cellSize } : cellSize;
    this.numCells = typeof numCells === 'number' ? { x: numCells, y: numCells } : numCells;
    this.roundToNearestPixel = roundToNearestPixel !== false;
}
ezGrid.prototype.stroke = function(color) {
    const ctx = ez.ctx;
    ctx.save();
    if (color) ctx.strokeStyle = ez.parseColor(color);
    ctx.beginPath();

    const halfNumCellsX = Math.floor(this.numCells.x / 2);
    const halfNumCellsY = Math.floor(this.numCells.y / 2);
    const gridSizeX = this.cellSize.x * this.numCells.x;
    const gridSizeY = this.cellSize.y * this.numCells.y;

    // Calculate screen bounds in world coordinates
    const screenCorners = [
        ez.screenToWorld({ x: 0, y: 0 }),
        ez.screenToWorld({ x: ez.canvas.width, y: 0 }),
        ez.screenToWorld({ x: 0, y: ez.canvas.height }),
        ez.screenToWorld({ x: ez.canvas.width, y: ez.canvas.height })
    ];

    const minX = Math.min(screenCorners[0].x, screenCorners[1].x, screenCorners[2].x, screenCorners[3].x);
    const maxX = Math.max(screenCorners[0].x, screenCorners[1].x, screenCorners[2].x, screenCorners[3].x);
    const minY = Math.min(screenCorners[0].y, screenCorners[1].y, screenCorners[2].y, screenCorners[3].y);
    const maxY = Math.max(screenCorners[0].y, screenCorners[1].y, screenCorners[2].y, screenCorners[3].y);

    // Calculate visible grid line indices
    const startX = Math.max(-halfNumCellsX, Math.floor(minX / this.cellSize.x));
    const endX = Math.min(halfNumCellsX, Math.ceil(maxX / this.cellSize.x));
    const startY = Math.max(-halfNumCellsY, Math.floor(minY / this.cellSize.y));
    const endY = Math.min(halfNumCellsY, Math.ceil(maxY / this.cellSize.y));

    // Vertical lines
    for (let i = startX; i <= endX; i++) {
        const pos = i * this.cellSize.x;
        const sy = Math.max(-gridSizeY / 2, minY);
        const ey = Math.min(gridSizeY / 2, maxY);
        let s = ez.worldToScreen({ x: pos, y: sy });
        let e = ez.worldToScreen({ x: pos, y: ey });
        if (this.roundToNearestPixel) {
            s = { x: Math.round(s.x), y: Math.round(s.y) };
            e = { x: Math.round(e.x), y: Math.round(e.y) };
        }
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
    }

    // Horizontal lines
    for (let i = startY; i <= endY; i++) {
        const pos = i * this.cellSize.y;
        const sx = Math.max(-gridSizeX / 2, minX);
        const ex = Math.min(gridSizeX / 2, maxX);
        let s = ez.worldToScreen({ x: sx, y: pos });
        let e = ez.worldToScreen({ x: ex, y: pos });
        if (this.roundToNearestPixel) {
            s = { x: Math.round(s.x), y: Math.round(s.y) };
            e = { x: Math.round(e.x), y: Math.round(e.y) };
        }
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
    }

    ctx.stroke();
    ctx.restore();
};
ez.grid = function(cellSize, numCells, roundToNearestPixel) { return new ezGrid(cellSize, numCells, roundToNearestPixel); };

// path
function ezPath(points, closed, smoothed) {
    this.points = points;
    this.closed = closed;
    this.smoothed = smoothed;
    this.transform = new mat3x4Fast(1, 0, 0, 1, 0, 0);
}
ezPath.prototype.drawPath = function() {
    const pts = this.points, len = pts.length;
    if (len < 2) return;
    const ctx = ez.ctx, t = this.transform;
    
    const p0 = pts[0];
    const s0 = ez.worldToScreen2D(p0.x, p0.y, t);
    ctx.beginPath();
    ctx.moveTo(s0.x, s0.y);

    if (this.smoothed && len > 2) {
        for (let i = 1; i < len - 1; i++) {
            const cur = pts[i], next = pts[i + 1];
            const mx = (cur.x + next.x) * 0.5, my = (cur.y + next.y) * 0.5;
            const sc = ez.worldToScreen2D(cur.x, cur.y, t);
            const sm = ez.worldToScreen2D(mx, my, t);
            ctx.quadraticCurveTo(sc.x, sc.y, sm.x, sm.y);
        }
    } else {
        for (let i = 1; i < len - 1; i++) {
            const p = pts[i];
            const sp = ez.worldToScreen2D(p.x, p.y, t);
            ctx.lineTo(sp.x, sp.y);
        }
    }
    const pEnd = pts[len - 1];
    const sEnd = ez.worldToScreen2D(pEnd.x, pEnd.y, t);
    ctx.lineTo(sEnd.x, sEnd.y);
    if (this.closed) ctx.closePath();
};
ez.path = function(points, closed, smoothed) { return new ezPath(points, closed, smoothed); };

// Add fill/stroke methods to shapes
const shapeProtos = [ezRect.prototype, ezCircle.prototype, ezArc.prototype, ezCapsule.prototype, ezPath.prototype];
for (let i = 0; i < shapeProtos.length; i++) {
    const proto = shapeProtos[i];
    proto.fill = function(color) {
        const ctx = ez.ctx;
        ctx.save();
        if (color) ctx.fillStyle = ez.parseColor(color);
        this.drawPath();
        ctx.fill();
        ctx.restore();
    };
    proto.stroke = function(color) {
        const ctx = ez.ctx;
        ctx.save();
        if (color) ctx.strokeStyle = ez.parseColor(color);
        this.drawPath();
        ctx.stroke();
        ctx.restore();
    };
    proto.fillAndStroke = function(fillColor, strokeColor) {
        const ctx = ez.ctx;
        ctx.save();
        if (fillColor) ctx.fillStyle = ez.parseColor(fillColor);
        if (strokeColor) ctx.strokeStyle = ez.parseColor(strokeColor);
        this.drawPath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };
}

////////////////
// MATH STUFF //
////////////////

function vec2(x, y) {
    if (!(this instanceof vec2)) return new vec2(x, y);
    if (typeof x === 'number') {
        this.x = x;
        this.y = typeof y === 'number' ? y : x;
    } else if (x && typeof x === 'object') {
        this.x = x.x !== undefined ? x.x : (x[0] || 0);
        this.y = x.y !== undefined ? x.y : (x[1] || 0);
    } else {
        this.x = 0;
        this.y = 0;
    }
}
vec2.prototype.add = function(o) { return new vec2(this.x + o.x, this.y + o.y); };
vec2.prototype.sub = vec2.prototype.subtract = function(o) { return new vec2(this.x - o.x, this.y - o.y); };
vec2.prototype.dot = function(o) { return this.x * o.x + this.y * o.y; };
vec2.prototype.scale = vec2.prototype.scaled = vec2.prototype.multiply = function(s) {
    if (typeof s === 'number') return new vec2(this.x * s, this.y * s);
    return new vec2(this.x * s.x, this.y * s.y);
};
vec2.prototype.length = vec2.prototype.magnitude = function() { return Math.sqrt(this.x * this.x + this.y * this.y); };
vec2.prototype.normalized = vec2.prototype.normalize = function() { const l = this.length() || 1; return new vec2(this.x / l, this.y / l); };
vec2.prototype.rotated = vec2.prototype.rotate = function(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new vec2(c * this.x - s * this.y, s * this.x + c * this.y);
};
vec2.prototype.angle = function() { return Math.atan2(this.y, this.x); };
vec2.prototype.abs = function() { return new vec2(Math.abs(this.x), Math.abs(this.y)); };
vec2.prototype.clone = function() { return new vec2(this.x, this.y); };
vec2.prototype.floored = function() { return new vec2(Math.floor(this.x), Math.floor(this.y)); };
vec2.prototype.rounded = function() { return new vec2(Math.round(this.x), Math.round(this.y)); };

function vec3(x, y, z) {
    if (!(this instanceof vec3)) return new vec3(x, y, z);
    if (typeof x === 'number') {
        this.x = x;
        this.y = typeof y === 'number' ? y : x;
        this.z = typeof z === 'number' ? z : (typeof y === 'number' ? 0 : x);
    } else if (x && typeof x === 'object') {
        this.x = x.x !== undefined ? x.x : (x[0] || 0);
        this.y = x.y !== undefined ? x.y : (x[1] || 0);
        this.z = x.z !== undefined ? x.z : (x[2] || 0);
    } else {
        this.x = 0; this.y = 0; this.z = 0;
    }
}
vec3.prototype.add = function(o) { return new vec3(this.x + o.x, this.y + o.y, this.z + o.z); };
vec3.prototype.sub = function(o) { return new vec3(this.x - o.x, this.y - o.y, this.z - o.z); };
vec3.prototype.scale = vec3.prototype.scaled = function(s) {
    if (typeof s === 'number') return new vec3(this.x * s, this.y * s, this.z * s);
    return new vec3(this.x * s.x, this.y * s.y, this.z * s.z);
};
vec3.prototype.length = function() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); };

function vec4(x, y, z, w) {
    if (!(this instanceof vec4)) return new vec4(x, y, z, w);
    this.x = x || 0; this.y = y || 0; this.z = z || 0; this.w = w || 0;
}

function mat3(c1, c2, c3) {
    if (!(this instanceof mat3)) return new mat3(c1, c2, c3);
    this.col1 = c1 ? new vec3(c1.x || c1[0] || 1, c1.y || c1[1] || 0, c1.z || c1[2] || 0) : new vec3(1, 0, 0);
    this.col2 = c2 ? new vec3(c2.x || c2[0] || 0, c2.y || c2[1] || 1, c2.z || c2[2] || 0) : new vec3(0, 1, 0);
    this.col3 = c3 ? new vec3(c3.x || c3[0] || 0, c3.y || c3[1] || 0, c3.z || c3[2] || 1) : new vec3(0, 0, 1);
}
mat3.prototype.multiplyVec3 = function(v) {
    return new vec3(
        this.col1.x * v.x + this.col2.x * v.y + this.col3.x * v.z,
        this.col1.y * v.x + this.col2.y * v.y + this.col3.y * v.z,
        this.col1.z * v.x + this.col2.z * v.y + this.col3.z * v.z
    );
};

// Fast mat3x4 for 2D transforms only
function mat3x4Fast(c1x, c1y, c2x, c2y, tx, ty) {
    this.matrix = {
        col1: {x: c1x, y: c1y, z: 0, w: 0},
        col2: {x: c2x, y: c2y, z: 0, w: 0},
        col3: {x: 0, y: 0, z: 1, w: 0},
        col4: {x: tx, y: ty, z: 0, w: 1}
    };
}
mat3x4Fast.prototype.getRotation2D = function() {
    return Math.atan2(this.matrix.col2.x, this.matrix.col1.x);
};

// Full mat3x4 for compatibility
function mat3x4(c1, c2, c3, c4) {
    if (!(this instanceof mat3x4)) return new mat3x4(c1, c2, c3, c4);
    if (c1 instanceof vec4) {
        this.matrix = {col1: c1, col2: c2, col3: c3, col4: c4};
    } else {
        this.matrix = {
            col1: new vec4(c1 ? (c1[0] || 1) : 1, c1 ? (c1[1] || 0) : 0, c1 ? (c1[2] || 0) : 0, 0),
            col2: new vec4(c2 ? (c2[0] || 0) : 0, c2 ? (c2[1] || 1) : 1, c2 ? (c2[2] || 0) : 0, 0),
            col3: new vec4(c3 ? (c3[0] || 0) : 0, c3 ? (c3[1] || 0) : 0, c3 ? (c3[2] || 1) : 1, 0),
            col4: new vec4(c4 ? (c4[0] || 0) : 0, c4 ? (c4[1] || 0) : 0, c4 ? (c4[2] || 0) : 0, 1)
        };
    }
}
mat3x4.prototype.getOrigin = function() { return new vec3(this.matrix.col4.x, this.matrix.col4.y, this.matrix.col4.z); };
mat3x4.prototype.setOrigin = function(v) { this.matrix.col4.x = v.x; this.matrix.col4.y = v.y; this.matrix.col4.z = v.z; };
mat3x4.prototype.setBasis = function(b) {
    this.matrix.col1.x = b.col1.x; this.matrix.col1.y = b.col1.y; this.matrix.col1.z = b.col1.z;
    this.matrix.col2.x = b.col2.x; this.matrix.col2.y = b.col2.y; this.matrix.col2.z = b.col2.z;
    this.matrix.col3.x = b.col3.x; this.matrix.col3.y = b.col3.y; this.matrix.col3.z = b.col3.z;
};
mat3x4.prototype.getBasis = function() {
    return new mat3(
        new vec3(this.matrix.col1.x, this.matrix.col1.y, this.matrix.col1.z),
        new vec3(this.matrix.col2.x, this.matrix.col2.y, this.matrix.col2.z),
        new vec3(this.matrix.col3.x, this.matrix.col3.y, this.matrix.col3.z)
    );
};
mat3x4.prototype.getRotation2D = function() { return Math.atan2(this.matrix.col2.x, this.matrix.col1.x); };
mat3x4.prototype.scaled = function(s) {
    const sx = typeof s === 'number' ? s : s.x;
    const sy = typeof s === 'number' ? s : s.y;
    const sz = typeof s === 'number' ? s : s.z;
    const m = this.matrix;
    const r = new mat3x4();
    r.matrix.col1.x = m.col1.x * sx; r.matrix.col1.y = m.col1.y * sx; r.matrix.col1.z = m.col1.z * sx;
    r.matrix.col2.x = m.col2.x * sy; r.matrix.col2.y = m.col2.y * sy; r.matrix.col2.z = m.col2.z * sy;
    r.matrix.col3.x = m.col3.x * sz; r.matrix.col3.y = m.col3.y * sz; r.matrix.col3.z = m.col3.z * sz;
    r.matrix.col4.x = m.col4.x; r.matrix.col4.y = m.col4.y; r.matrix.col4.z = m.col4.z;
    return r;
};

///////////////////////
// GLOBAL MATH UTILS //
///////////////////////

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
function lerpClamp(a, b, t) { const v = a + (b - a) * t; return v < Math.min(a,b) ? Math.min(a,b) : (v > Math.max(a,b) ? Math.max(a,b) : v); }
ez.lerp = lerp;
ez.clamp = clamp;
ez.lerpClamp = lerpClamp;

//////////////////
// COLOR PARSER //
//////////////////

const _colorCache = new Map();
let _colorCanvas = null, _colorCtx = null;

ez.parseColor = function(color) {
    if (typeof color === 'number' && color >= 0 && color <= 0xFFFFFF) {
        return '#' + color.toString(16).padStart(6, '0');
    }
    if (typeof color !== 'string') return '#000000';
    
    const cached = _colorCache.get(color);
    if (cached) return cached;
    
    // Fast path for hex colors
    if (color[0] === '#') {
        _colorCache.set(color, color);
        return color;
    }
    
    // Slow path: use canvas
    if (!_colorCanvas) {
        _colorCanvas = document.createElement('canvas');
        _colorCanvas.width = _colorCanvas.height = 1;
        _colorCtx = _colorCanvas.getContext('2d', {willReadFrequently: true});
    }
    
    _colorCtx.clearRect(0, 0, 1, 1);
    _colorCtx.fillStyle = color;
    _colorCtx.fillRect(0, 0, 1, 1);
    const d = _colorCtx.getImageData(0, 0, 1, 1).data;
    let hex = '#' + ((1 << 24) + (d[0] << 16) + (d[1] << 8) + d[2]).toString(16).slice(1);
    if (d[3] !== 255) hex += d[3].toString(16).padStart(2, '0');
    _colorCache.set(color, hex);
    return hex;
};

//////////////////////
// ANIMATION SYSTEM //
//////////////////////

ez._animState = {running: false, frameId: null, callback: null, lastTime: 0, observer: null};
ez.debugPause = false;

ez.callAnimate = function(callback, pauseOnHidden) {
    if (ez._animState.frameId) cancelAnimationFrame(ez._animState.frameId);
    
    ez._animState.callback = callback;
    ez._animState.running = true;
    ez._animState.lastTime = performance.now();
    
    function animate(time) {
        if (!ez._animState.running) return;
        const dt = (time - ez._animState.lastTime) * 0.001;
        ez._animState.lastTime = time;
        ez._updateCameraCache();
        callback(ez.debugPause ? 0 : dt);
        if (ez._animState.running) ez._animState.frameId = requestAnimationFrame(animate);
    }
    
    ez._animState.frameId = requestAnimationFrame(animate);
    
    if (pauseOnHidden !== false && ez.canvas) {
        if (ez._animState.observer) ez._animState.observer.disconnect();
        ez._animState.observer = new IntersectionObserver(entries => {
            entries[0].isIntersecting ? ez.resumeAnimation() : ez.pauseAnimation();
        }, {threshold: 0.1});
        ez._animState.observer.observe(ez.canvas);
    }
    return {pause: ez.pauseAnimation, resume: ez.resumeAnimation, stop: ez.stopAnimation};
};

ez.pauseAnimation = function() {
    ez._animState.running = false;
    if (ez._animState.frameId) { cancelAnimationFrame(ez._animState.frameId); ez._animState.frameId = null; }
};

ez.resumeAnimation = function() {
    if (!ez._animState.running && ez._animState.callback) {
        ez._animState.running = true;
        ez._animState.lastTime = performance.now();
        function animate(time) {
            if (!ez._animState.running) return;
            const dt = (time - ez._animState.lastTime) * 0.001;
            ez._animState.lastTime = time;
            ez._updateCameraCache();
            ez._animState.callback(dt);
            if (ez._animState.running) ez._animState.frameId = requestAnimationFrame(animate);
        }
        ez._animState.frameId = requestAnimationFrame(animate);
    }
};

ez.stopAnimation = function() {
    ez.pauseAnimation();
    ez._animState.callback = null;
    if (ez._animState.observer) { ez._animState.observer.disconnect(); ez._animState.observer = null; }
};

//////////////////
// CAMERA SETUP //
//////////////////

ez.letterBoxCamera = function(pos, size, flipY) {
    if (!ez.canvas) return;
    
    const px = pos.x !== undefined ? pos.x : (pos[0] || 0);
    const py = pos.y !== undefined ? pos.y : (pos[1] || 0);
    const sw = Math.abs(size.x !== undefined ? size.x : (size[0] || 1));
    const sh = Math.abs(size.y !== undefined ? size.y : (size[1] || 1));
    
    const cw = ez.canvas.width, ch = ez.canvas.height;
    const scale = 1 / Math.min(cw / sw, ch / sh);
    
    const cam = new mat3x4();
    cam.matrix.col1.x = scale;
    cam.matrix.col2.y = scale * (flipY ? -1 : 1);
    cam.matrix.col4.x = ez.centerOrigin || ez.centerOriginX ? px : px - sw * 0.5;
    cam.matrix.col4.y = ez.centerOrigin || ez.centerOriginY ? py : py + sh * 0.5;
    
    ez.camera = cam;
    ez._updateCameraCache();
};
