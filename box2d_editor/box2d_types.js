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
			copy.objects.push( new body(obj) );
		else if(obj.is_joint)
			copy.objects.push( new joint(obj) );
	}
	
	return copy;
}

var BODY_TYPES = { STATIC: 0, KINEMATIC: 1, DYNAMIC: 2 }

function body(props_to_copy) {
	var props = !props_to_copy ? {} : props_to_copy;
	
	this.pos = props.hasOwnProperty('pos') ? copy_vec(props.pos) : new vec();
	this.type = props.hasOwnProperty('type') ? props.type : BODY_TYPES.DYNAMIC;
	this.rotation = props.hasOwnProperty('rotation') ? props.rotation : 0;
	this.verts = props.hasOwnProperty('verts') ? copy_vert_array(props.verts) : [new vec(), new vec(), new vec()];
	this.density = props.hasOwnProperty('density') ? props.density : 1;
	this.friction = props.hasOwnProperty('friction') ? props.friction : 0.3;
	this.restitution = props.hasOwnProperty('restitution') ? props.restitution : 0.1;
	this.aabb = props.hasOwnProperty('aabb') ? copy_aabb(props.aabb) : calculate_aabb(this);
	this.name = props.hasOwnProperty('name') ? copy_string(props.name) : "body";
	
	// default 1st category and collide with all other categories
	this.category_bits = props.hasOwnProperty('category_bits') ? props.category_bits : 0x0001;
	this.mask_bits = props.hasOwnProperty('mask_bits') ? props.mask_bits : 0xFFFF;
	
	this.is_body = true;
}

var JOINT_TYPES = { "Revolute": 0, "Weld": 1 }
function joint(props_to_copy) {
	var props = !props_to_copy ? {} : props_to_copy;
	
	this.pos = props.hasOwnProperty('pos') ? copy_vec(props.pos) : new vec();
	this.rotation = props.hasOwnProperty('rotation') ? props.rotation : 0;
	this.enable_limit = props.hasOwnProperty('enable_limit') ? props.enable_limit : false;
	this.lower_angle = props.hasOwnProperty('lower_angle') ? props.lower_angle : 0;
	this.upper_angle = props.hasOwnProperty('upper_angle') ? props.upper_angle : 0;
	this.collide_connected = props.hasOwnProperty('collide_connected') ? props.collide_connected : false;
	this.body_a = props.hasOwnProperty('body_a') ? props.body_a : null;
	this.body_b = props.hasOwnProperty('body_b') ? props.body_b : null;
	this.type = props.hasOwnProperty('type') ? props.type : JOINT_TYPES["Revolute"];
	this.name = props.hasOwnProperty('name' ) ? copy_string(props.name) : "joint";
	
	this.is_joint = true;
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
