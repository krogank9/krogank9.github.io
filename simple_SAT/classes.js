TWO_PI = Math.PI * 2;
HALF_PI = Math.PI / 2;
DEG_TO_RAD = Math.PI / 180;
RAD_TO_DEG = 180 / Math.PI;
function sign(n) { n>=0?1:-1; }

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

vec2.prototype.setAdd = function(other) {
	this.x += other.x;
	this.y += other.y;
}

vec2.prototype.setSub = function(other) {
	this.x -= other.x;
	this.y -= other.y;
}

vec2.prototype.scale = function(scalar) {
	return vec2(this.x*scalar, this.y*scalar);
}

vec2.prototype.divide = function(scalar) {
	return vec2(this.x/scalar, this.y/scalar);
}

vec2.prototype.dot = function(other) {
	return this.x*other.x + this.y*other.y;
}

vec2.prototype.mag = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
}

vec2.prototype.normal = function() {
	var mag = this.mag();
	return vec2(this.x/mag, this.y/mag);
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
	this.center = vec2(0,0);
	if(this.verts[0] instanceof Array)
		for(var i=0; i<this.verts.length; i++)
			this.verts[i] = vec2(this.verts[i][0], this.verts[i][1]);
}

poly.prototype.translate = function(vec) {
	this.center = this.center.add(vec);
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

poly.prototype.getNormals = function() {
	var vecs = [];
	for(var i=0; i<this.verts.length; i++) {
		var v1 = this.verts[i];
		var v2 = this.verts[ (i+1)%this.verts.length ];
		var perp = v2.sub(v1).getPerpVec();
		vecs.push( perp.normal() );
	}
	return vecs;
}

poly.prototype.getProjection = function(normalVec) {
	var projs = [ this.verts[0].dot(normalVec) ];
	var min = projs[0];
	var max = projs[0];
	for(var i=1; i<this.verts.length; i++) {
		var d = this.verts[i].dot(normalVec);
		min = Math.min(d, min);
		max = Math.max(d, max);
		projs.push(d);
	}
	return {min:min, max:max, projs:projs};
}

poly.prototype.getProjectionInfo = function(normalVec, other) {
	var p1 = this.getProjection(normalVec);
	var p2 = other.getProjection(normalVec);
	
	// minimum translation vector for body 1
	var mtv;
	if(p1.max < p2.max)
		mtv = normalVec.scale(p2.min - p1.max);
	else // if(p1.min > p2.min)
		mtv = normalVec.scale(p2.max - p1.min);
	mtv.calcMag = mtv.mag();
	
	var separate = p1.max < p2.min || p1.min > p2.max;
	return {mtv:mtv, separate:separate}
}

poly.prototype.getCollisionInfo = function(other) {
	var testAxes = this.getNormals().concat(other.getNormals());
	var projInfo = this.getProjectionInfo(testAxes[0], other);
	var mtv = projInfo.mtv;
	var separate = projInfo.separate;
	// try to find separating axis
	for(var i=1; i<testAxes.length; i++) {
		projInfo = this.getProjectionInfo(testAxes[i], other);
		if(separate || (projInfo.mtv.calcMag < mtv.calcMag && !projInfo.separate)) {
			mtv = projInfo.mtv;
		}
		separate = separate || projInfo.separate;
	}
	// couldn't find axis, they are overlapping
	return {mtv:mtv, normal:mtv.normal(), separate:separate};
}

poly.prototype.isOverlapping = function(other) {
	var testAxes = this.getNormals().concat(other.getNormals());
	// try to find separating axis
	for(var i=0; i<testAxes.length; i++)
		if( this.getProjectionInfo(testAxes[i], other).separate )
			return false;
	// couldn't find axis, they are overlapping
	return true;
}

////////////
// Entity //
////////////

function ent(opts) {
	if ( !(this instanceof ent) ) return new ent(opts);
	this.poly = opts.poly;
	this.pos = opts.pos || vec2(opts.x || 0, opts.y || 0);
	this.rot = opts.rot || 0;
	this.vel = opts.vel || vec2(opts.xVel || 0, opts.yVel || 0);
	this.rotVel = opts.rotVel || 0;
	this.mass = opts.mass || 0;
	this.restitution = opts.restitution || 0.5;
	
	if(this.poly instanceof Array)
		this.poly = poly(this.poly);
	if(!opts.rot && !!opts.rotDeg)
		this.rot = opts.rotDeg*DEG_TO_RAD;
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

ent.prototype.getCollisionInfo = function(other) {
	return this.getPoly().getCollisionInfo(other.getPoly());
}

ent.prototype.applyImpulse = function(vec) {
	this.vel = this.vel.add(vec);
}

ent.prototype.handleCollision = function(other) {
	if(this.mass == 0 && other.mass == 0)
		return;
	
	var collisionInfo = this.getCollisionInfo(other);
	if(!collisionInfo.separate) {
		var relVel = this.vel.sub(other.vel);
		var velAlongNormal = collisionInfo.normal.dot(relVel);
		
		// Don't handle if objects are separating
		if(velAlongNormal > 0)
			return;
		
		var massSum = this.mass + other.mass;
		var massRatioThis = this.mass / massSum;
		var massRatioOther = other.mass / massSum;
		
		if(this.mass == 0) {
			massRatioThis = 1;
			massRatioOther = 0;
		}
		if(other.mass == 0) {
			massRatioThis = 0;
			massRatioOther = 1;
		}
		
		var e = Math.min(this.restitution, other.restitution);
		var j = -(1 + e) * velAlongNormal;
		var cVel = collisionInfo.normal.scale(j);
		
		this.vel = this.vel.add(cVel.scale(massRatioOther));
		other.vel = other.vel.sub(cVel.scale(massRatioThis));
		
		// Positional correction to prevent sinking
		var penetrate = Math.max(collisionInfo.mtv.mag(0 - 0.01, 0));
		var correction = collisionInfo.normal.scale(penetrate * 0.4);
		this.addPos( correction.scale(massRatioOther) );
		other.subPos( correction.scale(massRatioThis) );
	}
}

ent.prototype.setX = function(x) { this.pos.x = x; }
ent.prototype.setY = function(y) { this.pos.y = y; }
ent.prototype.addX = function(x) { this.pos.x += x; }
ent.prototype.addY = function(y) { this.pos.y += y; }
ent.prototype.setPos = function(vec) { this.pos = vec; }
ent.prototype.addPos = function(vec) { this.pos.setAdd(vec); }
ent.prototype.subPos = function(vec) { this.pos.setSub(vec); }
ent.prototype.setRot = function(r) { this.rot = r; }
ent.prototype.setRotDeg = function(d) { this.rot = d*DEG_TO_RAD; }
ent.prototype.setRotVel = function(rv) { this.rotVel = rv; }
ent.prototype.setRotVelDeg = function(rvd) { this.rotVel = rvd*DEG_TO_RAD; }
ent.prototype.addRot = function(r) { this.rot = (this.rot + r) % TWO_PI; }
ent.prototype.addRotDeg = function(d) { this.addRot(d*DEG_TO_RAD); }

///////////
// World //
///////////

function world() {
	if ( !(this instanceof world) ) return new world();
	this.ents = [];
}

world.prototype.createEnt = function(opts) {
	this.ents.push( ent(opts) );
}

world.prototype.step = function() {
	if( !this.lastStep )
		this.lastStep = Date.now();
	var elapsed = Math.min(Date.now() - this.lastStep, 100);
	for(var i=0; i<this.ents.length; i++) {
		var ent = this.ents[i];
		var tm = elapsed/1000;
		var moved = ent.vel.scale(tm);
		var rotated = ent.rotVel * tm;
		ent.addPos(moved);
		ent.addRot(rotated);
		
		if(ent.mass != 0)
			ent.vel.y = Math.max( ent.vel.y + 9.8, -100) // gravity
			
		for(var j=i+1; j<this.ents.length; j++) {
			ent.handleCollision(this.ents[j]);
		}
	}
	this.lastStep = Date.now();
}

world.prototype.makeBox = function(opts) {
	var w = opts.w || 0;
	var h = opts.h || 0;
	opts.poly = poly([
		vec2(-w/2, -h/2), // top left
		vec2(w/2, -h/2), // top right
		vec2(w/2, h/2), // bot right
		vec2(-w/2, h/2) // bot left
	]);
	if(opts.mass != 0)
		opts.mass = opts.mass || (w*h*(opts.density||1));
	this.ents.push( ent(opts) );
}

world.prototype.makeTriangle = function(opts) {
	var h = opts.h || 0;
	var b = opts.b || 0;
	opts.poly = poly([
		vec2(0, -h/2), // tip
		vec2(-b/2, h/2), // bot left
		vec2(b/2, h/2) // bot right
	]);
	if(opts.mass != 0)
		opts.mass = opts.mass || (0.5*b*h*(opts.density||1));
	this.ents.push( ent(opts) );
}
