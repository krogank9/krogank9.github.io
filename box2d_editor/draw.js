var canvas = document.getElementById("editor_canvas");
var ctx = canvas.getContext("2d");

// 100px = 1m for Box2D
var meters_to_px = 100.0;
var px_to_meters = 1.0/meters_to_px;

function resize_canvas_dpi() {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
}

// Turn a position from the canvas into a position relative to a viewport
function canvas_to_viewport(pos, viewport_pos, viewport_zoom) {
	// Get the canvas position in terms relative to the viewport position
	var relative = pos.subtract(viewport_pos);
	// Invert the y position, as viewport coordinates have y=0 at the
	// bottom, for Box2D
	relative.y *= -1;
	// Convert to meters
	relative = relative.scale(px_to_meters);
	// Account for viewport zoom
	relative.x /= viewport_zoom;
	relative.y /= viewport_zoom;
	
	return relative;
}
// Inverse of the above function
function viewport_to_canvas(pos, viewport_pos, viewport_zoom) {
	var unzoomed = new vec(pos.x*viewport_zoom, pos.y*viewport_zoom);
	unzoomed.y *= -1;
	unzoomed = unzoomed.scale(meters_to_px);
	return viewport_pos.add(unzoomed);
}

function draw_arrow(start, end) {
	var dir = end.subtract(start);
	var ang = dir.angle();
	var head_size = 10; // 5px
	var head_end = end.add(dir.normalize().scale(head_size));
	
	ctx.beginPath();
	//arrow base --
	ctx.moveTo(Math.round(start.x),Math.round(start.y));
	ctx.lineTo(Math.round(end.x),Math.round(end.y));
	ctx.stroke();
	//arrow head   >
	var cur_pos = end;
	var arrow_head_a = end.add( ang2normal(ang + 90).scale(head_size*0.5) );
	var arrow_head_b = end.add( ang2normal(ang).scale(head_size) );
	var arrow_head_c = end.add( ang2normal(ang - 90).scale(head_size*0.5) );
	ctx.lineTo(Math.round(arrow_head_a.x), Math.round(arrow_head_a.y));
	ctx.lineTo(Math.round(arrow_head_b.x), Math.round(arrow_head_b.y));
	ctx.lineTo(Math.round(arrow_head_c.x), Math.round(arrow_head_c.y));
	ctx.lineTo(Math.round(end.x),Math.round(end.y));
	ctx.closePath();
	ctx.fill();
}

function drawAxes(pos, scale) {
	// x
	ctx.fillStyle = "red";
	ctx.strokeStyle = "red";
	ctx.lineWidth = 2;
	var x_end = pos.add( new vec(scale,0) );
	draw_arrow(pos, x_end);
	// y
	ctx.fillStyle = "green";
	ctx.strokeStyle = "green";
	var y_end = pos.add( new vec(0,-scale) );
	draw_arrow(pos, y_end);
}

function draw_cursor(pos) {
	ctx.lineWidth = 1;
	ctx.strokeStyle = "white";
	ctx.beginPath();
	ctx.arc(Math.floor(pos.x), Math.floor(pos.y), 10, 0, 2 * Math.PI, false);
	ctx.closePath();
	ctx.stroke();

	ctx.strokeStyle = "red";
	ctx.setLineDash([5,4]);
	ctx.beginPath();
	ctx.arc(Math.floor(pos.x), Math.floor(pos.y), 10, 0, 2 * Math.PI, false);
	ctx.closePath();
	ctx.stroke();
	
	ctx.setLineDash([1,0]);
}

function draw_polygon(pos, verts, scale) {
	ctx.lineWidth = 1;
	ctx.strokeStyle = "black";
	ctx.beginPath();
	for(var v=0; v<verts.length; v++) {
		var vert = verts[v];
		var draw_pos = pos.add(vert.scale(-1*scale));
		if(v == 0)
			ctx.moveTo(draw_pos.x, draw_pos.y);
		else
			ctx.lineTo(draw_pos.x, draw_pos.y);
	}
	ctx.closePath();
	ctx.stroke();
}

function draw_all_bodies() {
	for(var i=0; i<world.bodies.length; i++) {
		var body = world.bodies[i];
		for(var f=0; f<body.fixtures.length; f++) {
			var fixture = body.fixtures[f];
			if(fixture.shape.type == "polygon") {
				var draw_pos = viewport_to_canvas(body.pos, viewport_pos, viewport_zoom);
				var scale = meters_to_px*viewport_zoom;
				draw_polygon(draw_pos, fixture.shape.verts, scale);
			}
		}
	}
}
