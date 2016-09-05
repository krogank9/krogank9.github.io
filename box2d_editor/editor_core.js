var document_info = document.getElementById("document_info");
var canvas = document.getElementById("editor_canvas");
var ctx = canvas.getContext("2d");

resize_canvas_dpi();
window.onresize = function() { resize_canvas_dpi(); }

var shift_held_down = false;
var ctrl_held_down = false;
var left_mouse_down = false;
var right_mouse_down = false;

var cur_mouse_pos = new vec(0,0);
var start_mouse_pos = new vec(0,0);
var click_cancelled = false;

var viewport_pos = new vec(canvas.width*0.5,canvas.height*0.75);
var viewport_zoom = 1.0;
var cursor_pos = new vec(0,0);

var CTRL_KEYCODE = 17;
var SHIFT_KEYCODE = 16;
var Z_KEYCODE = 90;
var B_KEYCODE = 66;
var C_KEYCODE = 67;
window.onkeydown = function(evt) {
	switch(evt.keyCode) {
		case CTRL_KEYCODE:
			ctrl_held_down = true;
			break;
		case SHIFT_KEYCODE:
			shift_held_down = true;
			break;
		case Z_KEYCODE:
			if(ctrl_held_down && shift_held_down)
				redo_one_command();
			else if(ctrl_held_down)
				undo_one_command();
			break;
		case B_KEYCODE:
			add_box(1, 1);// add a 1m by 1m box
			break;
		case C_KEYCODE:
			cursor_pos = canvas_to_viewport(cur_mouse_pos, viewport_pos, viewport_zoom);
			break;
	}
}
window.onkeyup = function(evt) {
	switch(evt.keyCode) {
		case CTRL_KEYCODE:
			ctrl_held_down = false;
			break;
		case SHIFT_KEYCODE:
			shift_held_down = false;
			break;
	}

}
canvas.onmousedown = function(evt) {
	var x = evt.pageX - this.offsetLeft;
	var y = evt.pageY - this.offsetTop;
	var pos = new vec(x,y);

	if(evt.button == 0) {
		left_mouse_down = true;
	}
	else if(evt.button == 2) {
		right_mouse_down = true;
	}
	
	cur_mouse_pos.set_equal_to(pos);
	start_mouse_pos.set_equal_to(pos);
	click_cancelled = false;
}
canvas.onmouseup = function(evt) {
	canvas.style.cursor = "default";
	var x = evt.pageX - this.offsetLeft;
	var y = evt.pageY - this.offsetTop;
	var pos = new vec(x,y);
	
	if(evt.button == 0)
		left_mouse_down = false;
	if(evt.button == 2)
		right_mouse_down = false;
	
	cur_mouse_pos.set_equal_to(pos);
}
canvas.onmousemove = function(evt) {
	var x = evt.pageX - this.offsetLeft;
	var y = evt.pageY - this.offsetTop;
	var pos = new vec(x,y);
	
	if(left_mouse_down && ctrl_held_down)
	{
		canvas.style.cursor = "move";
		var pos_change = pos.subtract(cur_mouse_pos);
		viewport_pos = viewport_pos.add(pos_change);
	}
	
	if(start_mouse_pos.subtract(pos).magnitude > 3) {
		click_cancelled = true;
	}
	
	cur_mouse_pos.set_equal_to(pos);
}
canvas.onmouseout = function() {
	canvas.style.cursor = "default";
	left_mouse_down = right_mouse_down = false;
}
canvas.oncontextmenu = function() { return false; }

function update_info_div() {
	document_info.innerHTML = "";
	
	var m = canvas_to_viewport(cur_mouse_pos, viewport_pos, viewport_zoom);
	var c = cursor_pos;
	document_info.innerHTML += "Cursor position: ("+float2str(c.x,2)+","+float2str(c.y,2)+") ";
	document_info.innerHTML += "Mouse position: ("+float2str(m.x,2)+","+float2str(m.y,2)+") ";
	
	document_info.innerHTML += "untitled.qbe";
}

function render() {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	var axes_len = 100;
	drawAxes( viewport_pos, axes_len*viewport_zoom );
	draw_cursor( viewport_to_canvas(cursor_pos, viewport_pos, viewport_zoom) );
	update_info_div();
	draw_all_bodies();
}
var ONE_FRAME_TIME = 1000/30;
setInterval(render, ONE_FRAME_TIME);
