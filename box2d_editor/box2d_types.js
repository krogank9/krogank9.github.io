var world = {
	gravity: new vec(0,-9.8),
	velocity_iterations: 6,
	position_iterations: 2,
	objects: [],
	is_world: true
}
function copy_world(w) {
	var copy = {
		gravity: copy_vec(w.gravity),
		velocity_iterations: w.velocity_iterations,
		position_iterations: w.position_iterations,
		objects: [],
		is_world: true
	};
	for(let i=0; i<w.objects.length; i++) {
		var obj = w.objects[i];
		
		if(obj.is_body)
			copy.objects.push( copy_body(obj) );
		else if(obj.is_joint)
			copy.objects.push( copy_joint(obj) );
	}
	
	return copy;
}

var BODY_TYPES = { STATIC: 0, KINEMATIC: 1, DYNAMIC: 2 }
function body(pos, rotation, verts) {
	this.pos = pos || new vec();
	this.type = BODY_TYPES.DYNAMIC;
	this.rotation = rotation || 0.0;
	this.verts = verts;
	this.density = 1.0;
	this.friction = 0.3;
	this.restitution = 0.1;
	this.aabb = null;
	this.name = "body";
	this.is_body = true;
}
function copy_body(b) {
	var copy = new body();
	
	copy.pos = copy_vec(b.pos);
	copy.type = b.type;
	copy.rotation = b.rotation;
	copy.verts = copy_vert_array(b.verts);
	copy.density = b.density;
	copy.friction = b.friction;
	copy.restitution = b.restitution;
	copy.aabb = calculate_aabb(b);
	copy.name = (' '+b.name).slice(1);
	
	return copy;
}

var JOINT_TYPES = { "Revolute": 0, "Weld": 1 }
function joint(pos, type, body_a, body_b) {
	this.pos = pos || new vec();
	this.rotation = 0;
	this.enable_limit = false;
	this.lower_angle = 0;
	this.upper_angle = 360;
	this.collide_connected = false;
	this.body_a = body_a || null;
	this.body_b = body_b || null;
	this.type = type || 0;
	this.name = "joint";
	this.is_joint = true;
}
function copy_joint(j) {
	var copy = new joint();
	
	copy.pos = copy_vec(j.pos);
	copy.rotation = j.rotation;
	copy.enable_limit = j.enable_limit;
	copy.lower_angle = j.lower_angle;
	copy.upper_angle = j.upper_angle;
	copy.collide_connected = j.collide_connected;
	copy.body_a = j.body_a;
	copy.body_b = j.body_b;
	copy.type = j.type;
	copy.name = (' '+j.name).slice(1);
	
	return copy;
}

function AABB(min, max) {
	this.min = new vec(min.x, min.y)
	this.max = new vec(max.x, max.y)
}

function copy_aabb(aabb) {
	return new AABB(copy_vec(aabb.min), copy_vec(aabb.max));
}

function calculate_aabb(body) {
	var aabb = new AABB(body.pos, body.pos);

	// enlarge the AABB to encompass all verts
	body.verts.forEach( function(vert) {
		var vert_rotated = vert.rotate_by(body.rotation);
		var real_pos = body.pos.add(vert_rotated);
		
		aabb = aabb.expand(real_pos);
	});
	
	return aabb;
}

function find_aabb_around(objects) {
	if(objects.length == 0)
		return null;
	
	var all_aabb = new AABB(objects[0].pos, objects[0].pos);
	
	// enlarge the AABB to encompass all verts
	objects.forEach( function(obj) {
		if(obj.is_body) {
			all_aabb = all_aabb.expand(obj.aabb.min);
			all_aabb = all_aabb.expand(obj.aabb.max);
		}
		else if(obj.is_joint) {
			all_aabb = all_aabb.expand(obj.pos);
		}
	});
	
	return all_aabb;
}

// expand an aabb to contain the given point
AABB.prototype.expand = function(expand_point) {
	var min = copy_vec(this.min);
	var max = copy_vec(this.max);
	
	if(min.x > expand_point.x)
		min.x = expand_point.x;
	else if(max.x < expand_point.x)
		max.x = expand_point.x;
	if(min.y > expand_point.y)
		min.y = expand_point.y;
	else if(max.y < expand_point.y)
		max.y = expand_point.y;
		
	return new AABB(min, max);
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

AABB.prototype.get_size = function() {
	return new vec(this.max.x - this.min.x, this.max.y - this.min.y);
}
