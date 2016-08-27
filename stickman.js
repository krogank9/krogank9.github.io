var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.lineWidth = 4;

// ptPhys engine. A point-only physics engine
// goals: points with physics
// also, constraints between points including rotation

var rad2deg = 180 / Math.PI;

function vec(x, y) {
	this.x = x;
	this.y = y;
}
vec.prototype.add = function(v) {
	return new vec(this.x + v.x, this.y + v.y);
}
vec.prototype.subtract = function(v) {
	return new vec(this.x - v.x, this.y - v.y);
}
vec.prototype.scale = function(scalar) {
	return new vec(this.x * scalar, this.y * scalar);
}
vec.prototype.normalize = function() {
	if(this.x > this.y)
		return vec(1, this.y/this.x);
	else
		return vec(this.x/this.y, 1);
}
vec.prototype.magnitude = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
}

function ang2normal(ang) {
	var hyp = len;
	var opp = Math.sin( ang / rad2deg ) * hyp;
	var adj = Math.cos( ang / rad2deg ) * hyp;
	var normal = new vec(adj, opp);
	return normal;
}

function pt(x, y, rot) {	
	this.pos = new vec(x||0, y||0);
	this.vel = new vec(0,0);
	this.rot = rot||0;
}

var pts = [];
(function populatePts(){
	for(var i=0; i<canvas.width; i+=5) {
		var numCrossed = Math.floor( i/canvas.height );
		var spill = i%canvas.height;
		if( numCrossed%2 )
			spill = canvas.height - spill;
		pts.push( new pt(i, spill) );
	}
})();

function drawPts() {
	for(var i=0; i<pts.length; i++){
		var pt = pts[i];
		ctx.fillRect(pt.pos.x - 2, pt.pos.y - 2, 4, 4); 
	}
}

function updatePts(delta) {
	for(var i=0; i<pts.length; i++) {
		var pt = pts[i];
		// apply gravity
		pt.vel.y += 9*delta;
		// update position from velocity
		pt.pos = pt.pos.add( pt.vel );
		// check collision
		if( pt.pos.y > canvas.height )
			pt.pos.y = canvas.height, pt.vel.y *= -0.8;
	}
}

var lastUpdate = Date.now();
function mainLoop() {
	var now = Date.now();
	var delta = now - lastUpdate;
	delta /= 1000;
	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawPts();
	updatePts(delta);
	
	lastUpdate = now;
}

var ONE_FRAME_TIME = 1000/60;
setInterval(mainLoop, ONE_FRAME_TIME);
