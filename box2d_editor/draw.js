var canvas = document.getElementById("editor_canvas");
var ctx = canvas.getContext("2d");

// 100px = 1m for Box2D
var meters_to_px = 100.0;
var px_to_meters = 1.0/meters_to_px;

function resize_canvas_dpi(viewport) {
	// save viewport's relative position:
	var x_ratio = viewport.pos.x/canvas.width;
	var y_ratio = viewport.pos.y/canvas.height;

	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	// restore viewport position
	viewport.pos.x = canvas.width*x_ratio;
	viewport.pos.y = canvas.height*y_ratio;
}

// Turn a position from the canvas into a position relative to a viewport
function canvas_to_viewport(pos) {
	// Get the canvas position in terms relative to the viewport position
	var relative = pos.subtract(viewport.pos);
	// Invert the y position, as viewport coordinates have y=0 at the
	// bottom, for Box2D
	relative.y *= -1;
	// Convert to meters
	relative = relative.scale(px_to_meters);
	// Account for viewport zoom
	relative.x /= viewport.zoom;
	relative.y /= viewport.zoom;
	
	return relative;
}
// Inverse of the above function
function viewport_to_canvas(pos) {
	var unzoomed = new vec(pos.x*viewport.zoom, pos.y*viewport.zoom);
	unzoomed.y *= -1;
	unzoomed = unzoomed.scale(meters_to_px);
	return viewport.pos.add(unzoomed);
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

// Draw grid lines every 5m
function draw_grid(pos, scale) {
	ctx.strokeStyle = "#cbcbcb";
	ctx.lineWidth = 1;
	
	var line_spacing = 5*meters_to_px*scale;
	var startx = viewport.pos.x%line_spacing;
	var starty = viewport.pos.y%line_spacing;

	// vertical lines
	for(let x=startx; x<canvas.width; x+=line_spacing) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canvas.height);
		ctx.closePath();
		ctx.stroke();
	}
	// horizontal lines
	for(let y=starty; y<canvas.height; y+=line_spacing) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(canvas.width, y);
		ctx.closePath();
		ctx.stroke();
	}
}

function draw_axes(pos, scale) {
	var len = 100*scale;
	// x
	ctx.fillStyle = "red";
	ctx.strokeStyle = "red";
	ctx.lineWidth = 2;
	var x_end = pos.add( new vec(len,0) );
	draw_arrow(pos, x_end);
	// y
	ctx.fillStyle = "green";
	ctx.strokeStyle = "green";
	var y_end = pos.add( new vec(0,-len) );
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

function draw_selection_box(aabb) {
	ctx.lineWidth = 2;
	ctx.strokeStyle = "blue";
	ctx.setLineDash([5,4]);
	draw_aabb(aabb);
	ctx.setLineDash([1,0]);
}

function draw_polygon(pos, verts, scale, rotation) {
	ctx.lineWidth = 1;
	ctx.strokeStyle = "black";
	ctx.beginPath();
	for(var v=0; v<verts.length; v++) {
		var vert = verts[v];
		var transformed = vert.scale(-1*scale).rotate_by(rotation);
		var draw_pos = pos.add(transformed);
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
		var draw_pos = viewport_to_canvas(body.pos);
		var rot = body.rotation;
		var scale = meters_to_px*viewport.zoom;
		
		draw_polygon(draw_pos, body.verts, scale, rot);

		if( viewport.selection.some(function(s_body) {return s_body==body}) )
			ctx.strokeStyle = 'red';
		else
			ctx.strokeStyle = 'blue';

		draw_aabb(body.aabb, true);
	}
}

function draw_aabb(aabb, world_coords) {
	var top = aabb.max;
	var bottom = aabb.min;
	if(world_coords == true) {
		top = viewport_to_canvas(top);
		bottom = viewport_to_canvas(bottom);
	}
	var width = bottom.x - top.x;
	var height = bottom.y - top.y;
	ctx.strokeRect(top.x, top.y, width, height);
}
