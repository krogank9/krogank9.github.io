var world = {
	gravity: -9.8,
	velocity_iterations: 6,
	position_iterations: 2,
	bodies: [], joints: []
}

var BODY_TYPES = { STATIC: 0, DYNAMIC: 1 }
function body(pos, rotation, verts) {
	this.pos = pos || new vec();
	this.type =  BODY_TYPES.DYNAMIC;
	this.rotation = rotation || 0.0
	this.verts = verts;
	this.density = 1.0;
	this.friction = 0.3;
}

function AABB(min, max) {
	this.min = new vec(min.x, min.y)
	this.max = new vec(max.x, max.y)
}

function copy_aabb(aabb) {
	return new AABB(aabb.min, aabb.max);
}

function calculate_aabb(body) {
	var aabb = new AABB(body.pos, body.pos);

	// enlarge the AABB to encompass all verts
	body.verts.forEach( function(vert) {
		var rotated = vert.rotate_by(body.rotation);
		var real_pos = body.pos.add(rotated);
		
		if(aabb.min.x > real_pos.x)
			aabb.min.x = real_pos.x;
		else if(aabb.max.x < real_pos.x)
			aabb.max.x = real_pos.x;
		if(aabb.min.y > real_pos.y)
			aabb.min.y = real_pos.y;
		else if(aabb.max.y < real_pos.y)
			aabb.max.y = real_pos.y;
	});
	
	return aabb;
}

AABB.prototype.test = function(test_point) {
	let min = this.min;
	let max = this.max;
	return (test_point.x >= min.x)
	&& (test_point.x <= max.x)
	&& (test_point.y >= min.y)
	&& (test_point.y <= max.y);
}

AABB.prototype.contains = function(aabb) {
	return this.test(aabb.min) && this.test(aabb.max);
}

AABB.prototype.overlaps = function(aabb) {
	if (this.max.x < aabb.min.x) return false; // a is left of b
	if (this.min.x > aabb.max.x) return false; // a is right of b
	if (this.max.y < aabb.min.y) return false; // a is above b
	if (this.min.y > aabb.max.y) return false; // a is below b
	return true; // boxes overlap
}

AABB.prototype.normalize = function() {
	var min = new vec(this.min.x, this.min.y);
	var max = new vec(this.max.x, this.max.y);
	if(min.x > max.x) {
		var tmp = min.x;
		min.x = max.x;
		max.x = tmp;
	}
	if(min.y > max.y) {
		var tmp = min.y;
		min.y = max.y;
		max.y = tmp;
	}
	return new AABB(min, max);
}
