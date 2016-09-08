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

function AABB(bottom_left, top_right) {
	this.bottom_left = new vec(bottom_left.x, bottom_left.y)
	this.top_right = new vec(top_right.x, top_right.y)
}

function calculate_aabb(body) {
	var aabb = new AABB(body.pos, body.pos);

	// enlarge the AABB to encompass all verts
	body.verts.forEach( function(vert) {
		var rotated = vert.rotate_by(body.rotation);
		var real_pos = body.pos.add(rotated);
		
		if(aabb.bottom_left.x > real_pos.x)
			aabb.bottom_left.x = real_pos.x;
		else if(aabb.top_right.x < real_pos.x)
			aabb.top_right.x = real_pos.x;
		if(aabb.bottom_left.y > real_pos.y)
			aabb.bottom_left.y = real_pos.y;
		else if(aabb.top_right.y < real_pos.y)
			aabb.top_right.y = real_pos.y;
	});
	
	return aabb;
}

AABB.prototype.test = function(test_point) {
	let bottom_left = this.bottom_left;
	let top_right = this.top_right;
	return (test_point.x > bottom_left.x
	&& test_point.x < top_right.x
	&& test_point.y > bottom_left.y
	&& test_point.y < top_right.y);
}

AABB.prototype.contains = function(aabb) {
	return (this.test(aabb.bottom_left) && this.test(aabb.top_right));
}

AABB.prototype.normalize = function() {
	let b_l = new vec(this.bottom_left.x, this.bottom_left.y);
	let t_r = new vec(this.top_right.x, this.top_right.y);
	if(b_l.x > t_r.x) {
		var tmp = b_l.x;
		b_l.x = t_r.x;
		t_r.x = tmp;
	}
	if(b_l.y > t_r.y) {
		var tmp = b_l.y;
		b_l.y = t_r.y;
		t_r.y = tmp;
	}
	return new AABB(b_l, t_r);
}
