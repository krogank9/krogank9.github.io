var world = {
	gravity: -9.8,
	velocity_iterations: 6,
	position_iterations: 2,
	bodies: [], joints: []
};

var BODY_TYPES = { STATIC: 0, DYNAMIC: 1 };
function body(pos, angle, type) {
	this.pos = pos || new vec();
	this.type =  type || BODY_TYPES.STATIC;
	this.angle = angle || 0.0;
	this.fixtures = [];
}

function fixture(shape, density, friction) {
	this.shape = shape;
	this.density = density || 1.0;
	this.friction = friction || 0.3;
}

// Shapes
function polygon_shape(verts) {
	this.verts = verts;
	this.type = "polygon";
}

function circle_shape(radius) {
	this.radius = radius;
	this.type = "circle";
}
