var canvas = document.getElementById("editor_canvas");
var renderer = PIXI.autoDetectRenderer(canvas.width, canvas.height, {view: canvas, backgroundColor: 0xFFFFFF});
var graphics = new PIXI.Graphics();
graphics.lineStyle(0);
graphics.beginFill(0);
graphics.drawRect(0,100);
graphics.endFill();
var stage = new PIXI.Container();
stage.addChild(graphics);

// 100px = 1m for Box2D
var meters_to_px = 100.0;
var px_to_meters = 1.0/meters_to_px;

$(document).ready(function() {
	animate();
});
function animate() {
	renderer.render(stage);
	requestAnimationFrame(animate);

	graphics.clear();
	
	draw_grid( viewport.pos, viewport.zoom);
	draw_axes( viewport.pos, viewport.zoom );
	update_info_div();
	draw_all_bodies();
	current_tool.draw()
}

function resize_canvas_dpi() {
	// save viewport's relative position:
	var x_ratio = viewport.pos.x/canvas.width;
	var y_ratio = viewport.pos.y/canvas.height;

	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	// restore viewport position
	viewport.pos.x = canvas.width*x_ratio;
	viewport.pos.y = canvas.height*y_ratio;
}

function resize_elems() {
	var bottombar_height = bottombar.offsetHeight;
	// resize the toolbox
	toolbox.style.top = "0px";
	toolbox.style.bottom = bottombar_height + "px";
	var toolbox_width = toolbox.offsetWidth;
	// resize the canvas
	canvas.style.left = "0px";
	canvas.style.top = "0px";
	canvas.style.width = window.innerWidth - toolbox_width + "px";
	canvas.style.height = window.innerHeight - bottombar_height + "px";
}

function resize_all() {
	resize_elems();
	resize_canvas_dpi();
	renderer.resize(canvas.width, canvas.height);
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

function draw_arrow(start, end, color) {
	graphics.lineStyle(2, color||0);
	graphics.beginFill(color||0,1);
	var dir = end.subtract(start);
	var ang = dir.angle();
	var head_size = 10; // 5px
	var head_end = end.add(dir.normalize().scale(head_size));
	
	//arrow base --
	graphics.moveTo(Math.round(start.x),Math.round(start.y));
	graphics.lineTo(Math.round(end.x),Math.round(end.y));
	graphics.endFill();
	//arrow head   >
	graphics.lineStyle(1, color||0);
	graphics.beginFill(color||0,1);
	var cur_pos = end;
	var arrow_head_a = end.add( ang2normal(ang + 90).scale(head_size*0.5) );
	var arrow_head_b = end.add( ang2normal(ang).scale(head_size) );
	var arrow_head_c = end.add( ang2normal(ang - 90).scale(head_size*0.5) );
	graphics.lineTo(Math.round(arrow_head_a.x), Math.round(arrow_head_a.y));
	graphics.lineTo(Math.round(arrow_head_b.x), Math.round(arrow_head_b.y));
	graphics.lineTo(Math.round(arrow_head_c.x), Math.round(arrow_head_c.y));
	graphics.lineTo(Math.round(end.x),Math.round(end.y));
	graphics.endFill();
}

function draw_axes(pos, scale) {
	var len = 100*scale;
	// x
	var x_end = pos.add( new vec(len,0) );
	x_end.x = Math.round(x_end.x);
	x_end.y = Math.round(x_end.y);
	draw_arrow(pos, x_end, 0xFF0000);
	// y
	var y_end = pos.add( new vec(0,-len) );
	y_end.x = Math.round(y_end.x);
	y_end.y = Math.round(y_end.y);
	draw_arrow(pos, y_end, 0x00FF00);
}

// Draw grid lines every 5m
function draw_grid(pos, zoom) {
	graphics.lineStyle(1, 0x808080);
	graphics.beginFill(0,0);
	
	var line_spacing = 5*meters_to_px*zoom;
	var startx = Math.round(viewport.pos.x)%line_spacing;
	var starty = Math.round(viewport.pos.y)%line_spacing;

	// vertical lines
	for(let x=startx; x<canvas.width; x+=line_spacing) {
		graphics.moveTo(x, 0);
		graphics.lineTo(x, canvas.height);
	}
	// horizontal lines
	for(let y=starty; y<canvas.height; y+=line_spacing) {
		graphics.moveTo(0, y);
		graphics.lineTo(canvas.width, y);
	}
	
	graphics.endFill();
}

function draw_selection_box(aabb) {
	graphics.lineStyle(1, 0x0000FF);
	draw_aabb(aabb);
}

function draw_polygon(pos, verts, scale, rotation) {
	graphics.beginFill(0,0); //transparent fill
	graphics.lineStyle(1, 0x000000);
	var begin = new vec(0,0);
	for(var v=0; v<verts.length; v++) {
		var vert = verts[v];
		var transformed = vert.scale(-1*scale).rotate_by(rotation);
		var draw_pos = pos.add(transformed);
		if(v == 0)
			graphics.moveTo(begin.x=draw_pos.x, begin.y=draw_pos.y);
		else
			graphics.lineTo(draw_pos.x, draw_pos.y);
	}
	graphics.lineTo(begin.x, begin.y);
	graphics.endFill();
}

function draw_all_bodies() {
	for(var i=0; i<world.bodies.length; i++) {
		var body = world.bodies[i];
		var draw_pos = viewport_to_canvas(body.pos);
		var rot = body.rotation;
		var scale = meters_to_px*viewport.zoom;
		
		draw_polygon(draw_pos, body.verts, scale, rot);

		if( viewport.selection.some(function(s_body) {return s_body==body}) )
			graphics.lineStyle(1, 0xFF0000);//red
		else
			graphics.lineStyle(1, 0x0000FF);//blue

		if(body.aabb !== null && body.aabb !== 'undefined')
			draw_aabb(body.aabb, true);
	}
}

function draw_aabb(aabb, world_coords) {
	graphics.beginFill(0,0);
	var max = aabb.max;
	var min = aabb.min;
	if(world_coords == true) {
		max = viewport_to_canvas(max);
		min = viewport_to_canvas(min);
	}
	var width = max.x - min.x;
	var height = max.y - min.y;
	graphics.drawRect(min.x, min.y, width, height);
}
