TWO_PI = Math.PI * 2;
HALF_PI = Math.PI / 2;
DEG_TO_RAD = Math.PI / 180;
RAD_TO_DEG = 180 / Math.PI;

function radNormal(rad) {
	rad %= TWO_PI;
	rad += TWO_PI;
	rad %= TWO_PI;
	return rad;
}

function degNormal(deg) {
	deg %= 360;
	deg += 360;
	deg %= 360;
	return deg;
}

//////////
// Vec2 //
//////////

function vec2(x, y) {
	if ( !(this instanceof vec2) ) return new vec2(x, y);
	this.x = x;
	this.y = y;
}

vec2.prototype.rotate = function(rad) {
	var cos = Math.cos( rad );
	var sin = Math.sin( rad );
	return vec2(
		this.x*cos - this.y*sin,
		this.y*cos + this.x*sin
	);
}

vec2.prototype.rotateDeg = function(deg) {
	return this.rotate(deg*DEG_TO_RAD);
}

vec2.prototype.add = function(other) {
	return vec2( this.x + other.x, this.y + other.y );
}

vec2.prototype.sub = function(other) {
	return vec2( this.x - other.x, this.y - other.y );
}

vec2.prototype.dot = function(other) {
	return this.x*other.x + this.y*other.y;
}

vec2.prototype.getPerpVec = function() {
	return vec2(-this.y, this.x);
}

vec2.prototype.ang = function() {
	return Math.atan2( this.y, this.x );
}

vec2.prototype.perpAng = function() {
	return Math.atan2( -this.x, this.y );
}

//////////
// Poly //
//////////

function poly(verts) {
	if ( !(this instanceof poly) ) return new poly(verts);
	this.verts = verts;
	if(this.verts[0] instanceof Array)
		for(var i=0; i<this.verts.length; i++)
			this.verts[i] = vec2(this.verts[i][0], this.verts[i][1]);
}

poly.prototype.translate = function(vec) {
	return poly( this.verts.map( (v) => v.add(vec) ) );
}

poly.prototype.rotate = function(rad) {
	return poly( this.verts.map( (v) => v.rotate(rad) ) );
}

poly.prototype.draw = function(ctx) {
	ctx.beginPath();
	ctx.moveTo(this.verts[0].x, this.verts[0].y);
	for(var i=1; i<this.verts.length; i++)
		ctx.lineTo(this.verts[i].x, this.verts[i].y);
	ctx.closePath();
	ctx.fill();
}

poly.prototype.getPerpAngles = function() {
	var angs = [];
	for(var i=0; i<this.verts.length; i++) {
		var v1 = this.verts[i];
		var v2 = this.verts[ (i+1)%this.verts.length ];
		var ang = v2.sub(v1).perpAng();
		angs.push( ang );
	}
	return angs;
}

poly.prototype.getPerpVecs = function() {
	var vecs = [];
	for(var i=0; i<this.verts.length; i++) {
		var v1 = this.verts[i];
		var v2 = this.verts[ (i+1)%this.verts.length ];
		vecs.push( v2.sub(v1).getPerpVec() );
	}
	return vecs;
}

poly.prototype.getProjection = function(vec) {
	var min = this.verts[0].dot(vec);
	var max = min;
	for(var i=0; i<this.verts.length; i++) {
		var d = this.verts[i].dot(vec);
		min = Math.min(d, min);
		max = Math.max(d, max);
	}
	return {min:min, max:max};
}

poly.prototype.checkProjectionsSeparate = function(vec, other) {
	var thisProj = this.getProjection(vec);
	var otherProj = other.getProjection(vec);
	return thisProj.max < otherProj.min || otherProj.max < thisProj.min;
}

poly.prototype.isOverlapping = function(other) {
	var testVecs = this.getPerpVecs().concat(other.getPerpVecs());
	// try to find separating axis
	for(var i=0; i<testVecs.length; i++)
		if( this.checkProjectionsSeparate(testVecs[i], other) )
			return false;
	// couldn't find axis, they are overlapping
	return true;
}

poly.makeBox = function(w,h) {
	return poly([
		vec2(-w/2, -h/2), // top left
		vec2(w/2, -h/2), // top right
		vec2(w/2, h/2), // bot right
		vec2(-w/2, h/2) // bot left
	]);
}

////////////
// Entity //
////////////

function ent(opts) {
	if (!(this instanceof ent)) return new ent(opts);
	this.poly = opts.poly;
	if(this.poly instanceof Array)
		this.poly = poly(this.poly);
	this.pos = opts.pos || vec2(opts.x || 0, opts.y || 0);
	this.rot = opts.rot || 0;
	if(!opts.rot && !!opts.rotDeg)
		this.rot = opts.rotDeg*DEG_TO_RAD;
	this.vel = opts.vel || vec2(opts.xVel || 0, opts.yVel || 0);
	this.rotVel = opts.rotVel || 0;
	if(!opts.rotVel && !!opts.rotVelDeg)
		this.rotVel = opts.rotVelDeg*DEG_TO_RAD;
}

ent.prototype.getPoly = function() {
	return this.poly.rotate(this.rot).translate(this.pos);
}

ent.prototype.draw = function(ctx) {
	this.getPoly().draw(ctx);
}

ent.prototype.isOverlapping = function(other) {
	return this.getPoly().isOverlapping(other.getPoly());
}

ent.prototype.setX = function(x) { this.pos.x = x; }
ent.prototype.setY = function(y) { this.pos.y = y; }
ent.prototype.setRot = function(r) { this.rot = r; }
ent.prototype.setRotDeg = function(d) { this.rot = d*DEG_TO_RAD; }
ent.prototype.setRotVel = function(rv) { this.rotVel = rv; }
ent.prototype.setRotVelDeg = function(rvd) { this.rotVel = rvd*DEG_TO_RAD; }
ent.prototype.addRot = function(r) { this.rot = radNormal(this.rot + r); }
ent.prototype.addRotDeg = function(d) { this.addRot(d*DEG_TO_RAD); }
