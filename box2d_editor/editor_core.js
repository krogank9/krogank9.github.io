var document_info = document.getElementById("document_info")
var canvas = document.getElementById("editor_canvas")
var ctx = canvas.getContext("2d")

var viewport = {
	pos: new vec(canvas.width*0.5,canvas.height*0.75),
	zoom: 1.0,
	selection: []
}

resize_canvas_dpi(viewport)
window.onresize = function() { resize_canvas_dpi(viewport) }

var left_mouse_down = false;
var right_mouse_down = false;

var cur_mouse_pos = new vec(0,0);
var start_mouse_pos = new vec(0,0);

var cursor_pos = new vec(0,0);

var Z_KEYCODE = 90;
var B_KEYCODE = 66;
var DELETE_KEYCODE = 46;
window.onkeydown = function(evt) {
	switch(evt.keyCode) {
		case Z_KEYCODE:
			if(evt.ctrlKey && evt.shiftKey)
				redo_one_command();
			else if(evt.ctrlKey)
				undo_one_command();
			break;
		case 32: //tmp spin command
			viewport.selection.forEach(function(elem) {
				elem.rotation += 5;
				elem.aabb = calculate_aabb(elem);
			});
			break;
		case B_KEYCODE:
			add_box(1, 1); // add a 1m by 1m box
			break;
		case DELETE_KEYCODE:
			remove_bodies(bodies_to_indices(viewport.selection));
			break;
	}
}

canvas.onmousedown = function(evt) {
	var x = evt.pageX - this.offsetLeft
	var y = evt.pageY - this.offsetTop
	var pos = new vec(x,y)

	if(evt.button == 0) {
		left_mouse_down = true
		if(evt.shiftKey) {
			cursor_pos = canvas_to_viewport(cur_mouse_pos, viewport)
		}
	}
	else if(evt.button == 2) {
		right_mouse_down = true
	}
	
	cur_mouse_pos.set_equal_to(pos)
	start_mouse_pos.set_equal_to(pos)
}
canvas.onmouseup = function(evt) {
	canvas.style.cursor = "default"
	var x = evt.pageX - this.offsetLeft;
	var y = evt.pageY - this.offsetTop;
	var pos = new vec(x,y);
	var mouse_world_pos = canvas_to_viewport(pos, viewport);
	
	if(evt.button == 0) {
		left_mouse_down = false;
		var drag_distance = cur_mouse_pos.subtract(start_mouse_pos).magnitude();
		// Make a selection with left mouse
		if(!evt.shiftKey && drag_distance < 5)
		{
			// Click
			var new_selection = get_selection_pt(mouse_world_pos);
			if(evt.ctrlKey)
				viewport.selection = merge_selections(viewport.selection, new_selection, true);
			else
				viewport.selection = new_selection;
		}
		else if( drag_distance >= 5 )
		{
			// Click and drag
			var start_world_pos = canvas_to_viewport(start_mouse_pos, viewport);
			var aabb = new AABB(mouse_world_pos, start_world_pos);
			aabb = aabb.normalize();
			var new_selection = get_selection_box(aabb);
			if(evt.ctrlKey)
				viewport.selection = merge_selections(viewport.selection, new_selection, false);
			else
				viewport.selection = new_selection;
		}
	}
	else if(evt.button == 2) {
		right_mouse_down = false;
	}
	
	cur_mouse_pos.set_equal_to(pos)
}
canvas.onmousemove = function(evt) {
	var x = evt.pageX - this.offsetLeft
	var y = evt.pageY - this.offsetTop
	var pos = new vec(x,y)
	var pos_change = pos.subtract(cur_mouse_pos)
	
	if(right_mouse_down && !evt.ctrlKey)
	{
		// pan with right mouse
		canvas.style.cursor = "move";
		viewport.pos = viewport.pos.add(pos_change);
	}
	else if(right_mouse_down && evt.ctrlKey) {
		// zoom with right mouse & ctrl
		var pre_cursor = viewport_to_canvas(cursor_pos, viewport);
		var zoom_change = pos_change.y/canvas.height;
		viewport.zoom -= zoom_change;
		
		// Disallow super large zooms
		if(viewport.zoom < 0.1) {
			viewport.zoom = 0.1;
		}
		else if(viewport.zoom > 5.0) {
			viewport.zoom = 5.0;
		}
		else {
			// zoom using the cursor as an anchor
			var post_cursor = viewport_to_canvas(cursor_pos, viewport);
			var change = post_cursor.subtract(pre_cursor);
			viewport.pos = viewport.pos.subtract(change);
		}			
	}
	
	if(start_mouse_pos.subtract(pos).magnitude > 3) {
		click_cancelled = true
	}
	
	cur_mouse_pos.set_equal_to(pos)
}
canvas.onmouseout = function() {
	canvas.style.cursor = "default";
	// End zooming right mouse but don't end panning left,
	// because it feels more natural while editing.
	right_mouse_down = false;
}
window.onblur = function() {
	canvas.style.cursor = "default";
	left_mouse_down = right_mouse_down = false;
}
canvas.oncontextmenu = function() { return false }

function update_info_div() {
	document_info.innerHTML = "";
	
	var m = canvas_to_viewport(cur_mouse_pos, viewport);
	var c = cursor_pos;
	document_info.innerHTML += "Cursor position: ("+float2str(c.x,2)+","+float2str(c.y,2)+") ";
	document_info.innerHTML += "Mouse position: ("+float2str(m.x,2)+","+float2str(m.y,2)+") ";
	
	document_info.innerHTML += "untitled.qbe";
}

function render() {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	draw_grid( viewport.pos, viewport.zoom);
	draw_axes( viewport.pos, viewport.zoom );
	draw_cursor( viewport_to_canvas(cursor_pos, viewport) );
	update_info_div();
	draw_all_bodies();
	
	if(left_mouse_down && !cur_mouse_pos.compare(start_mouse_pos)) {
		var aabb = new AABB(cur_mouse_pos, start_mouse_pos);
		aabb = aabb.normalize();
		draw_selection_box(aabb);
	}
}
var ONE_FRAME_TIME = 1000/30
setInterval(render, ONE_FRAME_TIME)
