var rad2deg = 57.2958;

function vec(x,y) {
	this.x = x||0.0;
	this.y = y||0.0;
	
	this.magnitude = function()
	{
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}
	this.normalize = function()
	{
		var mag = this.magnitude();
		return new vec(this.x/mag, this.y/mag);
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
	this.perpendicular = function()
	{
		return new vec(this.y, this.x);
	}
	this.angle = function()
	{
		if( this.x >= 0 )
			return Math.atan(this.y/this.x)*rad2deg;
		else
			return Math.atan(this.y/this.x)*rad2deg + 180;
	}
	this.rotate_by = function(by_ang)
	{
		var new_ang = this.angle() + by_ang;
		var normal = ang2normal(new_ang);
		return normal.scale(this.magnitude());
	}
	this.compare = function(other) {
		return this.x==other.x && this.y==other.y;
	}
	this.set_equal_to = function(other_vec) {
		this.x = other_vec.x;
		this.y = other_vec.y;
	}
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
	var fraction = Math.abs(rounded%1);
	
	while(fraction%1 != 0)
		fraction *= 10;
	
	var num_str = Math.floor(rounded) + "";
	var fract_str = fraction + "";
	
	fract_str = fract_str.substring(0,num_places);
	
	while(fract_str.length < num_places) {
		fract_str += "0";
	}
	
	var full_str = num_str;
	if(fract_str.length > 0) {
		full_str += "." + fract_str;
	}
	
	return full_str;
}
