TWO_PI = Math.PI * 2;
HALF_PI = Math.PI / 2;
DEG_TO_RAD = Math.PI / 180;
RAD_TO_DEG = 180 / Math.PI;
epsilon = 1 / 1000000;
function sign(n) { n>=0?1:-1; }
function equals0(n) { return Math.abs(n) < epsilon; }

//////////
// Vec2 //
//////////

function vec2(x, y) {
	if ( !(this instanceof vec2) ) return new vec2(x, y);
	this.x = x || 0;
	this.y = y || 0;
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

vec2.prototype.set = function(vec_or_x, y) {
	if(vec_or_x instanceof vec2) {
		this.x = vec_or_x.x;
		this.y = vec_or_x.y;
		return;
	}
	this.x = vec_or_x || 0;
	this.y = y || 0;
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

vec2.prototype.cross = function(other) {
	return this.x*other.y - this.y*other.x;
}

vec2.prototype.mag = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
}

vec2.prototype.normal = function() {
	var mag = this.mag();
	if(mag == 0)
		return vec2(0,0);
	else
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

vec2.prototype.closeTo = function(other) {
	return Math.abs(this.x-other.x)<3
		&& Math.abs(this.y-other.y)<3;
}

//////////
// Line //
//////////

function line(a, b) {
	if ( !(this instanceof line) ) return new line(a, b);
	this.a = a;
	this.b = b;
	this.a_to_b = b.sub(a);
	this.intersects = [];
}

line.prototype.lineOverlapColinear = function(other) {
	var dir = this.a_to_b.normal();
	var pts = [this.a, this.b, other.a, other.b];
	var pjs = [this.a.dot(dir), this.b.dot(dir),
			   other.a.dot(dir), other.b.dot(dir)];

	var min = 0;
	var max = 0;
	for(var i=0; i<pjs.length; i++) {
		if( pjs[min] > pjs[i] )
			min = i;
		if( pjs[max] < pjs[i] )
			max = i;
	}
	if(max == min)
		max = (max+1)%4;
	
	pts.splice(min, 1);
	if(max > min)
		max--;
	pts.splice(max, 1);
	
	return line(pts[0], pts[1]);
}

// adapted from https://gist.github.com/tp/75cb619a7e40e6ad008ef2a6837bbdb2
// https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
line.prototype.checkIntersection = function(other) {
	var p = this.a;
	var r = this.a_to_b;
	var q = other.a;
	var s = other.a_to_b;
	
	var q_sub_p = q.sub(p);
	
	var r_s = r.cross(s);
	var q_p_r = q_sub_p.cross(r);
	var q_p_s = q_sub_p.cross(s);
	
	if(equals0(r_s) && !equals0(q_p_r))
		return { type: 'no-intersection' };
	if(equals0(r_s) && equals0(q_p_r)) {
		var rr = r.dot(r);
		
		var t0 = q_sub_p.dot(r) / rr;
		var t1 = t0 + s.dot(r) / rr;
		if ( (t0 >= 0 && t0 <= 1) || (t1 >= 0 && t1 <= 1) ) {
			var overlap = this.lineOverlapColinear(other);
			return {type: 'intersection-colinear-overlapping', at: overlap.a, at2: overlap.b};
		}
	}
	
	var t = q_p_s / r_s;
	var u = q_p_r / r_s;
	
	if (!equals0(r_s) && t >= 0 && t <= 1 && u >= 0 && u <= 1)
		return { type: 'intersection', at: p.add(r.scale(t)) };
	
	return { type: 'no-intersection' };
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
	var p = poly( this.verts.map( (v) => v.add(vec) ) );
	p.center = this.center.add(vec);
	return p;
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
	ctx.stroke();
}

poly.prototype.getLines = function() {
	var lines = [];
	for(var i=0; i<this.verts.length; i++) {
		var v1 = this.verts[i];
		var v2 = this.verts[ (i+1)%this.verts.length ];
		lines.push( new line(v1, v2) );
	}
	return lines;
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

poly.prototype.getIntersections = function(other) {
	var thisSides = this.getSides();
	var otherSides = this.getSides();
}

poly.prototype.getCollisionPoint = function(other) {
	// find the points of intersection
	var intersectPts = [];
	var thisLines = this.getLines();
	var otherLines = other.getLines();
	for(var i=0; i<thisLines.length; i++) {
		var thisLine = thisLines[i];
		for(var j=0; j<otherLines.length; j++) {
			var otherLine = otherLines[j];
			var intersectInfo = thisLine.checkIntersection(otherLine);
			if(intersectInfo.type.startsWith('intersection-colinear')) {
				var p1 = intersectInfo.at;
				var p2 = intersectInfo.at2;
				// wish there was a more elegant way to do this
				if( !intersectPts.some( (p) => p.closeTo(p1) ) && !intersectPts.some( (p) => p.closeTo(p2) ) ) {
					thisLine.intersects.push({other:otherLine, at:intersectInfo.at});
					otherLine.intersects.push({other:thisLine, at:intersectInfo.at});
					thisLine.intersects.push({other:otherLine, at:intersectInfo.at2});
					otherLine.intersects.push({other:thisLine, at:intersectInfo.at2});
					intersectPts.push(intersectInfo.at);
					intersectPts.push(intersectInfo.at2);
				}
			}
			else if(intersectInfo.type.startsWith('intersection')) {
				if( !intersectPts.some( (p) => p.closeTo(intersectInfo.at) ) ) {
					thisLine.intersects.push({other:otherLine, at:intersectInfo.at});
					otherLine.intersects.push({other:thisLine, at:intersectInfo.at});
					intersectPts.push(intersectInfo.at);
				}
			}
		}
	}
	
	// one poly is inside the other
	if(intersectPts.length == 0) {
		if(this.contains(other.verts[0]))
			return other.center;
		else
			return this.center;
	}
	
	if(intersectPts.length == 1)
		return intersectPts[0];
	
	// find all overlapping points between the intersection points on both polys
	var thisOverlapPts = [];
	var otherOverlapPts = [];
	for(var i=0; i<this.verts.length; i++) {
		if(other.contains(this.verts[i]) && !intersectPts.some( (p2) => this.verts[i].closeTo(p2) ))
			thisOverlapPts.push(this.verts[i]);
	}
	for(var i=0; i<other.verts.length; i++) {
		if(this.contains(other.verts[i]) && !intersectPts.some( (p2) => other.verts[i].closeTo(p2) ))
			otherOverlapPts.push(other.verts[i]);
	}
	
	// avg all those points for contact
	var pt = vec2(0,0);
	thisOverlapPts.forEach( (p) => pt.setAdd(p) );
	otherOverlapPts.forEach( (p) => pt.setAdd(p) );
	intersectPts.forEach( (p) => pt.setAdd(p) );
	//console.log( "num contact weights: " + (intersectPts.length + thisOverlapPts.length + otherOverlapPts.length) );
	pt = pt.divide( intersectPts.length + thisOverlapPts.length + otherOverlapPts.length );
	
	return pt;
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
	return {mtv:mtv, normal:mtv.normal(), separate:separate, contact:this.getCollisionPoint(other)};
}

poly.prototype.contains = function(test) {
	var points = this.verts;
	var result = false;
	for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
		if ((points[i].y > test.y) != (points[j].y > test.y) &&
			(test.x < (points[j].x - points[i].x) * (test.y - points[i].y) / (points[j].y-points[i].y) + points[i].x)) {
			result = !result;
		}
	}
	return result;
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

ent.prototype.getCollisionInfo = function(other) {
	return this.getPoly().getCollisionInfo(other.getPoly());
}

ent.prototype.applyImpulse = function(vec, offset) {
	var offsetNormal = offset.normal();
	var perpOffsetNormal = offsetNormal.getPerpVec();
	var radius = offset.mag();
	var lin_vel = offsetNormal.scale(vec.dot(offsetNormal));
	var p_ang_vel = vec.dot(perpOffsetNormal);
	var ang_vel = p_ang_vel / radius;
	this.addVel(lin_vel);
	this.addRotVel(ang_vel);
}

ent.prototype.handleCollision = function(other) {
	if(this.mass == 0 && other.mass == 0)
		return;
	
	var collisionInfo = this.getCollisionInfo(other);
	if(!collisionInfo.separate) {
		var contact = collisionInfo.contact;
		var contactVelThis = this.getVelOfPoint(contact);
		var contactVelOther = other.getVelOfPoint(contact);
		var relVel = contactVelThis.sub(contactVelOther);
		var velAlongNormal = collisionInfo.normal.dot(relVel);
		
		//drawArrow(contact, contact.add(contactVelOther));
		
		// Don't handle if objects are separating
		if(velAlongNormal > 0) {
			//console.log("skipping");
			return;
		}
			
		//console.log("solving");
		
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
		
		this.applyImpulse(cVel.scale(massRatioOther), contact.sub(this.pos));
		other.applyImpulse(cVel.scale(-massRatioThis), contact.sub(other.pos));
		
		// Positional correction to prevent sinking
		var penetrate = Math.max(collisionInfo.mtv.mag() - 0.01, 0);
		var correction = collisionInfo.normal.scale(penetrate * 0.2);
		this.addPos( correction.scale(massRatioOther) );
		other.subPos( correction.scale(massRatioThis) );
	}
}

ent.prototype.getVelOfPoint = function(pt) {
	var rel = pt.sub(this.pos);
	var radius = rel.mag();
	var lin_vel = radius*this.rotVel;
	// not sure why have to multiply by -1 here but not in applyImpulse
	var dir_vec = rel.getPerpVec().normal();
	var rel_vel = dir_vec.scale(lin_vel);
	return rel_vel.add( this.vel );
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
ent.prototype.addVel = function(vec) { this.vel.setAdd(vec); }
ent.prototype.addRotVel = function(r) { this.rotVel += r; }

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
		if(ent.mass != 0) {
			var tm = elapsed/1000;
			var moved = ent.vel.scale(tm);
			var rotated = ent.rotVel * tm;
			ent.addPos(moved);
			ent.addRot(rotated);
		}
		
		if(ent.mass != 0) {
			//ent.vel.y += 9.8; // gravity
		}
			
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
