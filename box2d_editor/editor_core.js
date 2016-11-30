var toolbox = document.getElementById("toolbox")
var bottombar = document.getElementById("bottombar")
var document_info = document.getElementById("document_info")
var canvas = document.getElementById("editor_canvas")

var viewport = {
	pos: new vec(canvas.width*0.5,canvas.height*0.75),
	zoom: 1.0,
	selection: [],
	clipboard: []
}

var left_mouse_down = false;
var right_mouse_down = false;
var undo_locked = false;

var cur_mouse_pos = new vec(0,0);
var start_mouse_pos = new vec(0,0);

//iter through alphabet to get keycodes
var key = {};
var char, count;
for(char="A", count=0; count<=26; count++) {
	key[char] = 65+count;
	char = String.fromCharCode(char.charCodeAt(0) + 1);
}
var DELETE_KEYCODE = 46;

// Hotkeys
window.onkeydown = function(evt) {
	
	// If a dialog is open, don't allow hotkeys to be pressed
	if( $('#selection_properties_dialog').dialog('isOpen') === true
	|| $('#save_dialog').dialog('isOpen') === true ) {
		return;
	}
	
	switch(evt.keyCode) {
		case key.A:
			if(evt.ctrlKey) {
				current_tool.action_cancelled();
				if(evt.shiftKey)
					set_selection([]);
				else
					set_selection(world.objects.slice());
				evt.preventDefault();
			}
			break;
		case key.Z:
			if(undo_locked || current_tool.edit_in_progress)
				break;
			else if(evt.ctrlKey) {
				undo_one_command();
				evt.preventDefault();
			}
			break;
		case key.Y:
			if(undo_locked || current_tool.edit_in_progress)
				break;
			else if(evt.ctrlKey) {
				redo_one_command();
				evt.preventDefault();
			}
			else if(current_tool == move_tool)
				move_tool.move_y_axis.checked = !(move_tool.move_y_axis.checked);
			else if(current_tool == scale_tool)
				scale_tool.scale_y_axis.checked = !(scale_tool.scale_y_axis.checked);
			break;
		case key.X:
			if(current_tool.edit_in_progress)
				break;
			if(current_tool == move_tool)
				move_tool.move_x_axis.checked = !(move_tool.move_x_axis.checked);
			else if(current_tool == scale_tool)
				scale_tool.scale_x_axis.checked = !(scale_tool.scale_x_axis.checked);
			break;
		case DELETE_KEYCODE:
			remove_objects(objects_to_indices(viewport.selection));
			evt.preventDefault();
			break;
		case key.C:
			if(evt.ctrlKey && viewport.selection.length > 0)
				viewport.clipboard = generate_duplicate_objects(viewport.selection);
				evt.preventDefault();
			break;
		case key.V:
			if(evt.ctrlKey && viewport.clipboard.length > 0) {
				duplicate_objects(viewport.clipboard);
				evt.preventDefault();
			}
			break;
		case key.S:
			if(evt.shiftKey)
				set_current_tool("Scale");
			else
				set_current_tool("Select");
			break;
		case key.M:
		case key.T:
			set_current_tool("Move");
			break;
		case key.R:
			set_current_tool("Rotate");
			break;
		case key.B:
			set_current_tool("Box");
			break;
		case key.J:
			set_current_tool("Joint");
			break;
		case key.G:
			move_tool.move_snap_grid.checked = !(move_tool.move_snap_grid.checked);
			break;
		case key.P:
			if(viewport.selection.length > 0) {
				evt.preventDefault();
				$("#selection_properties_dialog").dialog("open");
			}
			break;
	}
}

canvas.onmousedown = function(evt) {
	var x = evt.pageX - this.offsetLeft
	var y = evt.pageY - this.offsetTop
	var pos = new vec(x,y)
	canvas.style.cursor = "default"

	if(evt.button == 0) {
		left_mouse_down = true;
		current_tool.mousedown(evt);
	}
	else if(evt.button == 2) {
		right_mouse_down = true
	}
	
	cur_mouse_pos.set_equal_to(pos);
	start_mouse_pos.set_equal_to(pos);
}
canvas.onmouseup = function(evt) {
	canvas.style.cursor = "default"
	var x = evt.pageX - this.offsetLeft;
	var y = evt.pageY - this.offsetTop;
	var pos = new vec(x,y);
	
	if(evt.button == 0) {
		current_tool.mouseup(evt);
		left_mouse_down = false;
	}
	else if(evt.button == 2) {
		right_mouse_down = false;
	}
	
	cur_mouse_pos.set_equal_to(pos);
}
canvas.onmousemove = function(evt) {
	var x = evt.pageX - this.offsetLeft
	var y = evt.pageY - this.offsetTop
	var pos = new vec(x,y);
	var pos_change = pos.subtract(cur_mouse_pos);
	
	if(left_mouse_down) {
		current_tool.mousemove(evt);
	}
	else if(right_mouse_down && !evt.ctrlKey)
	{
		// pan with right mouse
		canvas.style.cursor = "move";
		viewport.pos = viewport.pos.add(pos_change);
	}
	else if(right_mouse_down && evt.ctrlKey) {
		// zoom with right mouse & ctrl, using middle of screen as anchor
		var pre_middle = new vec(canvas.width/2, canvas.height/2);
		pre_middle = canvas_to_viewport(pre_middle);
		var zoom_change = pos_change.y/canvas.height;
		var new_zoom = viewport.zoom - zoom_change;
		if(new_zoom >= 0.2 && new_zoom <= 3.0) {
			viewport.zoom = new_zoom;
			pre_middle = viewport_to_canvas(pre_middle);
			var post_middle = new vec(canvas.width/2, canvas.height/2);
			var change = post_middle.subtract(pre_middle);
			viewport.pos = viewport.pos.add(change);
		}
	}
	
	if(start_mouse_pos.subtract(pos).magnitude >= 5) {
		click_cancelled = true
	}
	
	cur_mouse_pos.set_equal_to(pos);
}
window.onblur = function() {
	canvas.style.cursor = "default";
	left_mouse_down = right_mouse_down = false;
}
canvas.onmouseout = function() {
	canvas.style.cursor = "default";
	right_mouse_down = false;
}
canvas.oncontextmenu = function() { return false }
canvas.ondragstart = function() { return false }

function update_info_div() {
	document_info.innerHTML = "";
	
	var m = canvas_to_viewport(cur_mouse_pos);
	document_info.innerHTML += "Mouse position: ("+float2str(m.x,2)+","+float2str(m.y,2)+")";
}
