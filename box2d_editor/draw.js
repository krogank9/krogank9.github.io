var canvas = document.getElementById("editor_canvas");
var stage = new PIXI.Container();
var renderer = PIXI.autoDetectRenderer(canvas.width, canvas.height, {view: canvas});
renderer.backgroundColor = 0xFFFFFF;
renderer.render(stage);
var graphics = new PIXI.Graphics();
graphics.lineStyle(0);
graphics.beginFill(0);
graphics.drawRect(0,100);
graphics.endFill();
stage.addChild(graphics);

// 100px = 1m for Box2D
var meters_to_px = 100.0;
var px_to_meters = 1.0/meters_to_px;

$( document ).ready(function() {
	update_info_div();
	resize_all();
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

window.onresize = function() { resize_all(); }
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

function draw_polygon(verts) {
	graphics.beginFill(0,0); //transparent fill
	graphics.lineStyle(1, 0x000000);
	for(var i=0; i<verts.length; i++) {
		var vert = verts[i];
		if(i == 0)
			graphics.moveTo(vert.x, vert.y);
		else
			graphics.lineTo(vert.x, vert.y);
	}
	graphics.lineTo(verts[0].x, verts[0].y);
	graphics.endFill();
}

function draw_all_bodies() {
	for(var i=0; i<world.bodies.length; i++) {
		var body = world.bodies[i];
		var verts = body_verts_to_canvas(body);
		
		draw_polygon(verts);

		if( viewport.selection.some(function(sel) {return sel==body}) )
			graphics.lineStyle(1, 0xFF0000);//red
		else
			graphics.lineStyle(1, 0x0000FF);//blue

		if(body.aabb !== null && body.aabb !== 'undefined')
			draw_aabb(body.aabb, true);
	}
}

function draw_aabb(aabb, world_coords) {
	graphics.beginFill(0,0);
	var tmp = new AABB(aabb.min, aabb.max);
	if(world_coords == true) {
		tmp.max = viewport_to_canvas(tmp.max);
		tmp.min = viewport_to_canvas(tmp.min);
	}
	tmp = tmp.normalize();
	var size = tmp.get_size();
	graphics.drawRect(tmp.min.x, tmp.min.y, size.x, size.y);
}
