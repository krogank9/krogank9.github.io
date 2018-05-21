var rad2deg = 57.2958;

function vec(x,y) {
	this.x = x||0;
	this.y = y||0;
	
	this.magnitude = function()
	{
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}
	this.normalize = function()
	{
		var mag = this.magnitude();
		return new vec(this.x/mag, this.y/mag);
	}
	this.abs = function() {
		return new vec(Math.abs(this.x), Math.abs(this.y));
	}
	this.add = function(other)
	{
		return new vec(this.x+other.x, this.y+other.y);
	}
	this.subtract = function(other)
	{
		return new vec(this.x-other.x, this.y-other.y);
	}
	this.scale = function(scalar)
	{
		return new vec(this.x*scalar, this.y*scalar);
	}
	this.scale_by_vec = function(v) {
		return new vec(this.x*v.x, this.y*v.y);
	}
	this.perpendicular = function()
	{
		return new vec(this.y, this.x);
	}
	this.angle = function()
	{
		return Math.atan2(this.y,this.x)*rad2deg;
	}
	this.rotate_by = function(by_ang)
	{
		var new_ang = this.angle() + by_ang;
		var normal = ang2normal(new_ang);
		return normal.scale(this.magnitude());
	}
	this.rotate_around = function(origin_vec, by_ang) {
		var rel = this.subtract(origin_vec);
		rel = rel.rotate_by(by_ang);
		return origin_vec.add(rel);
	}
	this.scale_around = function(origin_vec, scale_vec) {
		var rel = this.subtract(origin_vec);
		rel = rel.scale_by_vec(scale_vec);
		return origin_vec.add(rel);
	}
	this.compare = function(other) {
		return this.x==other.x && this.y==other.y;
	}
	this.set_equal_to = function(other_vec) {
		this.x = other_vec.x;
		this.y = other_vec.y;
	}
	this.dist = function(other_vec) {
		return this.subtract(other_vec).magnitude();
	}
}

function copy_vec(v) {
	return new vec(v.x||0, v.y||0);
}

function ang2normal(ang) {
	var rads = ang / rad2deg;

	var x = Math.cos( rads );
	var y = Math.sin( rads );
	
	return new vec(x, y);
}

function round_to_place(num, num_places) {
	var factor = Math.pow(10,num_places);
	return Math.round(num*factor)/factor;
}

function float2str(num, num_places) {
	var rounded = round_to_place(num, num_places);
	var sign = rounded<0 ? -1:1;
	var fraction = Math.abs(rounded%1);

	rounded = Math.floor( Math.abs(rounded) );
	var num_str = rounded + "";
	
	while(fraction%1 != 0)
		fraction *= 10;
	var fract_str = fraction + "";
	
	fract_str = fract_str.substring(0,num_places);
	
	while(fract_str.length < num_places) {
		fract_str += "0";
	}
	
	var full_str = num_str;
	if(fract_str.length > 0)
		full_str += "." + fract_str;
	if(sign == -1)
		full_str = "-" + full_str;
	
	return full_str;
}

//Mirror an angle vertically
function mirror_angle_v(ang) {
	return -ang;
}
//Mirror an angle horizontally
function mirror_angle_h(ang) {
	return -ang + 180;
}

function normalize_ang(ang) {
	while(ang < 0)
		ang += 360;
	return ang%360;
}

function make_ang_small(ang) {
	ang = normalize_ang(ang);
 	if(ang > 180)
		ang -= 360;
	return ang;
}

// Find the smallest possible distance between 2 angles
function find_angle_difference(to, from) {
	to = normalize_ang(to);
	from = normalize_ang(from);
	
	// simply take to-from, this will be correct, unless something like
	// to=359 from=0 to-from = 359, we want -1
	var dist1 = to-from;
	
	if(to>from)
		from += 360;
	else if(from>to)
		to += 360;
		
	var dist2 = to-from;
	
	return Math.abs(dist2) < Math.abs(dist1) ? dist2 : dist1;
}
