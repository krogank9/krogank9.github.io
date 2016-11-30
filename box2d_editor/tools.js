$("[name='tool_button']").change(function() {
	if(this.checked)
		set_current_tool(this.value);
});

$("#joint_select").change(function() {
	set_current_joint(this.value);
});

$( document ).ready(function() {
	document.getElementById("select_tool").checked = true;
	set_current_tool("Select");
	set_current_joint("Revolute");
});

function set_current_tool(name) {
	var radio_name = "#" + name.toLowerCase() + "_tool";
	$(radio_name).prop('checked', true);
	
	$("#tool_options_label").html(name + " Options");
	$(".tool_options_tab").css({display: "none"});
	var tab_name = "#" + name + "_options";
	$(tab_name).css({display: "block"});
	
	current_tool.action_cancelled();
	current_tool = tools_list[name];
	current_tool.tool_selected();
	
	current_tool.edit_in_progress = false;
}

function set_current_joint(name) {
	$("#joint_select").val(name);
	
	$(".joint_options").css({display: "none"});
	var current_joint_tab = "#" + name + "_options";
	$(current_joint_tab).css({display: "block"});
	
	current_tool.action_cancelled();
	current_joint = name;
}

function tool() {
	this.mousedown = function(evt) {};
	this.mouseup = function(evt) {};
	this.mousemove = function(evt) {};
	this.tool_selected = function () {};
	this.action_cancelled = function() {};
	this.draw = function() {};
	this.edit_in_progress = false;
}
var select_tool = new tool();
var move_tool = new tool();
var rotate_tool = new tool();
var scale_tool = new tool();
var box_tool = new tool();
var polygon_tool = new tool();
var joint_tool = new tool();
var tools_list = {
	"Select": select_tool,
	"Move": move_tool,
	"Rotate": rotate_tool,
	"Scale": scale_tool,
	"Box": box_tool,
	"Polygon": polygon_tool,
	"Joint": joint_tool
};
var current_tool = tools_list["Select"];
var current_joint = "Revolute";

/*-------------
 * 
 * Select tool
 *
 *------------*/

// Dialog to allow changing the properties of selected objects
$("#selection_properties_dialog").dialog({
	autoOpen: false,
	modal: true,
	buttons: {
		"Confirm": function() {
			var sel = viewport.selection;
			var sel_empty = (sel.length === 0);
			var sel_all_bodies = (sel.length === filter_bodies(sel).length) && !sel_empty;
			var sel_all_joints = (sel.length === filter_joints(sel).length) && !sel_empty;
			if(sel_all_bodies) {
				if(selection_properties_static.checked === true) {
					sel.forEach(function(el){el.type=BODY_TYPES.STATIC});
				}
				else if(selection_properties_dynamic.checked === true) {
					sel.forEach(function(el){el.type=BODY_TYPES.DYNAMIC});
				}
				else if(selection_properties_kinematic.checked === true) {
					sel.forEach(function(el){el.type=BODY_TYPES.KINEMATIC});
				}
				
				sel.forEach(function(el){el.density=parseFloat(selection_properties_density.value)});
			}
			else if(sel_all_joints) {
				sel.forEach(function(el){el.collide_connected=selection_collide_connected.checked;});
			}
			
			if(selection_properties_name.value.length > 0) {
				sel.forEach(function(el){el.name=selection_properties_name.value});
			}
			$( this ).dialog("close");
		},
		"Cancel": function() {
			$( this ).dialog("close");
		}
	},
	open: function() {
		update_selection();
		
		var selection = viewport.selection;
		var selection_empty = (selection.length === 0);
		selection_properties_button.disabled = selection_empty;
		
		// If the selection is only bodies or only joints, you can display 
		// options pertaining to bodies or joints 
		var selection_all_bodies = (selection.length === filter_bodies(selection).length) && !selection_empty;
		var selection_all_joints = (selection.length === filter_joints(selection).length) && !selection_empty;
		
		var bodies_css = selection_all_bodies? "initial" : "none";
		var joints_css = selection_all_joints? "initial" : "none";
		
		selection_joint_properties.style.display = selection_all_joints? "initial" : "none";
		selection_body_properties.style.display = selection_all_bodies? "initial" : "none";
		
		selection_properties_name.value = selection.length === 1 ? selection[0].name : "";
		
		if(selection_all_bodies) {
			selection_properties_density.value = selection[0].density;
			selection_properties_static.checked = selection.every(function(b){return b.type==BODY_TYPES.STATIC});
			selection_properties_dynamic.checked = selection.every(function(b){return b.type==BODY_TYPES.DYNAMIC});
			selection_properties_kinematic.checked = selection.every(function(b){return b.type==BODY_TYPES.KINEMATIC});
		} else if(selection_all_joints) {
			selection_collide_connected.checked = selection[0].collide_connected;
		}
	}
});

selection_properties_dynamic = document.getElementById("selection_properties_dynamic");
selection_properties_static = document.getElementById("selection_properties_static");
selection_properties_density = document.getElementById("selection_properties_density");
selection_properties_name = document.getElementById("selection_properties_name");
selection_collide_connected = document.getElementById("selection_collide_connected");

selection_joint_properties = document.getElementById("selection_joint_properties");
selection_body_properties = document.getElementById("selection_body_properties");

selection_properties_button = document.getElementById("selection_properties_button");
selection_properties_button.onclick = function() {
	$("#selection_properties_dialog").dialog("open");
};

select_tool.start_pos = new vec(0,0);
select_tool.mousedown = function() {
	if(this.edit_in_progress == false) {
		this.start_pos = copy_vec(cur_mouse_pos);
		this.edit_in_progress = true;
	}
}
select_tool.mouseup = function(evt) {
	if(this.edit_in_progress == false)
		return;
	
	var drag_distance = cur_mouse_pos.subtract(this.start_pos).magnitude();
	var mouse_world_pos = canvas_to_viewport(cur_mouse_pos, viewport);
	
	if(drag_distance < 5)	// Click
	{
		var new_selection = get_selection_pt(mouse_world_pos);
		if(evt.ctrlKey)
			set_selection(merge_selections(viewport.selection, new_selection, true));
		else
			set_selection(new_selection);
	}
	else if( drag_distance >= 5 )	// Click and drag
	{
		var start_world_pos = canvas_to_viewport(this.start_pos, viewport);
		var aabb = new AABB(mouse_world_pos, start_world_pos);
		aabb = aabb.normalize();
		var new_selection = get_selection_box(aabb);
		if(evt.ctrlKey)
			set_selection(merge_selections(viewport.selection, new_selection, false));
		else
			set_selection(new_selection);
	}
	

	this.edit_in_progress = false;
}

select_tool.action_cancelled = function() {
	this.edit_in_progress = false;
}

select_tool.draw = function() {
	if(this.edit_in_progress) {
		var aabb = new AABB(cur_mouse_pos, this.start_pos);
		aabb = aabb.normalize();
		draw_selection_box(aabb);
	}
}

/*-------------
 * 
 * Move tool
 *
 *------------*/

move_tool.move_snap_grid = document.getElementById("move_snap_grid");
move_tool.move_x_axis = document.getElementById("move_x_axis");
move_tool.move_y_axis = document.getElementById("move_y_axis");

move_tool.move_flip_x = document.getElementById("move_flip_x");
move_tool.move_flip_y = document.getElementById("move_flip_y");
move_tool.move_flip_x.onclick = function() {
	if(viewport.selection.length == 0)
		return;
	var save_state = save_transforms(viewport.selection);
	var cur_pos = find_bodies_center(viewport.selection);
	var travel = new vec(cur_pos.x*-2, 0);
	move_objects(viewport.selection, travel);
	commit_transform(save_state, save_transforms(viewport.selection));
}
move_tool.move_flip_y.onclick = function() {
	if(viewport.selection.length == 0)
		return;
	var save_state = save_transforms(viewport.selection);
	var cur_pos = find_bodies_center(viewport.selection);
	var travel = new vec(0, cur_pos.y*-2);
	move_objects(viewport.selection, travel);
	commit_transform(save_state, save_transforms(viewport.selection));
}

move_tool.save_state = null;
move_tool.start_pos = new vec(0,0);

move_tool.mousedown = function(evt) {
	if(viewport.selection.length > 0) {
		this.edit_in_progress = true;
		this.save_state = save_transforms(viewport.selection);
		this.start_pos = copy_vec(cur_mouse_pos);
	}
}

move_tool.mousemove = function(evt) {
	if(left_mouse_down && this.save_state != null && this.edit_in_progress) {
		var world_mouse = canvas_to_viewport(cur_mouse_pos);
		var world_start = canvas_to_viewport(this.start_pos);
		var travel = world_mouse.subtract(world_start);
		if(this.move_x_axis.checked == false)
			travel.x = 0;
		if(this.move_y_axis.checked == false)
			travel.y = 0;
		restore_transforms(this.save_state);
		if( this.move_snap_grid.checked == true ) {
			var cur_pos = find_bodies_center(viewport.selection);
			var next_pos = cur_pos.add(travel);
			var next_pos_rounded = copy_vec(next_pos.x, next_pos.y);
			
			// Round to the nearest 1m gridline. Just use Math.round,
			// viewport coords are measured in meters
			if(this.move_x_axis.checked == true)
				next_pos_rounded.x = Math.round(next_pos.x)
			if(this.move_y_axis.checked == true)
				next_pos_rounded.y = Math.round(next_pos.y);
				
			var px_diff = next_pos_rounded.subtract(next_pos).abs();
			px_diff = px_diff.scale(meters_to_px*viewport.zoom);
			
			// Snap to grid if within 10 pixels from the gridline
			if(px_diff.x < 10 && this.move_x_axis.checked == true)
				next_pos.x = next_pos_rounded.x;
			if(px_diff.y < 10 && this.move_y_axis.checked == true)
				next_pos.y = next_pos_rounded.y;
			
			var new_travel = next_pos.subtract(cur_pos);
			travel = new_travel;
		}
		move_objects(viewport.selection, travel);
	}
}

move_tool.mouseup = function(evt) {
	if(this.edit_in_progress == false || this.start_pos.dist(cur_mouse_pos) === 0) {
		this.action_cancelled();
		return;
	}
	
	if(this.save_state.length > 0)
		commit_transform(this.save_state, save_transforms(viewport.selection));
	this.save_state = null;
	this.edit_in_progress = false;
}

move_tool.action_cancelled = function() {
	this.edit_in_progress = false;
	if(this.save_state == null)
		return;
	else
		restore_transforms(this.save_state);
	this.save_state = null;
}

move_tool.draw = function() {
	if(this.edit_in_progress) {
		//drag line
		graphics.lineStyle(1,0);
		graphics.beginFill(0,0);
		var end = copy_vec(cur_mouse_pos);
		if(this.move_x_axis.checked == false)
			end.x = this.start_pos.x;
		if(this.move_y_axis.checked == false)
			end.y = this.start_pos.y;
		graphics.moveTo(this.start_pos.x, this.start_pos.y);
		graphics.lineTo(end.x, end.y);
		graphics.endFill();
	}
	if(viewport.selection.length > 0) {
		//center
		var center = find_bodies_center(viewport.selection);
		center = viewport_to_canvas(center);
		graphics.lineStyle(1,0);
		graphics.beginFill(0,1);
		graphics.drawRect(Math.round(center.x)-2,Math.round(center.y)-2,4,4);
		graphics.endFill();
	}
}

/*-------------
 * 
 * Rotate tool
 *
 *------------*/

rotate_tool.localize_rotation = document.getElementById("localize_rotation");
rotate_tool.rotate_45 = document.getElementById("rotate_45");
rotate_tool.rotate_90 = document.getElementById("rotate_90");
rotate_tool.rotate_180 = document.getElementById("rotate_180");
rotate_tool.rotate_45.onclick = function() {
	if(viewport.selection.length == 0)
		return;
	var save = save_transforms(viewport.selection);
	rotate_objects(viewport.selection, 45, rotate_tool.localize_rotation.checked);
	commit_transform(save, save_transforms(viewport.selection));
}
rotate_tool.rotate_90.onclick = function() {
	if(viewport.selection.length == 0)
		return;
	var save = save_transforms(viewport.selection);
	rotate_objects(viewport.selection, 90, rotate_tool.localize_rotation.checked);
	commit_transform(save, save_transforms(viewport.selection));
}
rotate_tool.rotate_180.onclick = function() {
	if(viewport.selection.length == 0)
		return;
	var save = save_transforms(viewport.selection);
	rotate_objects(viewport.selection, 180, rotate_tool.localize_rotation.checked);
	commit_transform(save, save_transforms(viewport.selection));
}

rotate_tool.save_state = null;
rotate_tool.start_pos = new vec(0,0);
rotate_tool.mousedown = function(evt) {
	this.edit_in_progress = true;
	this.save_state = save_transforms(viewport.selection);
	this.start_pos = copy_vec(cur_mouse_pos);
}

rotate_tool.mousemove = function(evt) {
	if(left_mouse_down && this.save_state !== null && this.edit_in_progress) {
		restore_transforms(this.save_state);
		var selection = viewport.selection;
		var world_mouse_end = canvas_to_viewport(cur_mouse_pos);
		var world_mouse_start = canvas_to_viewport(this.start_pos);
		// rotate all the bodies around their averaged center
		var center = find_bodies_center(selection);
		var start_off = world_mouse_start.subtract(center);
		var end_off = world_mouse_end.subtract(center);
		var rot_amount = end_off.angle() - start_off.angle();
		rotate_objects(selection, rot_amount, this.localize_rotation.checked);
	}
}

rotate_tool.mouseup = function(evt) {
	if(this.edit_in_progress == false || this.start_pos.dist(cur_mouse_pos) === 0) {
		this.action_cancelled();
		return;
	}
	
	this.edit_in_progress = false;
	commit_transform(this.save_state, save_transforms(viewport.selection));
	this.save_state = null;
}

rotate_tool.draw = function() {
	if(viewport.selection.length == 0)
		return;
	var center = find_bodies_center(viewport.selection);
	var pos = viewport_to_canvas(center);
	graphics.lineStyle(1,0);
	graphics.beginFill(0,1);
	graphics.drawRect(Math.round(pos.x)-2,Math.round(pos.y)-2,4,4);
	graphics.endFill();
}

rotate_tool.action_cancelled = function() {
	this.edit_in_progress = false;
	if(this.save_state == null)
		return;
	else
		restore_transforms(this.save_state);
	this.save_state = null;
}

/*-------------
 * 
 * Scale tool
 *
 *------------*/

scale_tool.scale_flip_x = document.getElementById("scale_flip_x");
scale_tool.scale_flip_y = document.getElementById("scale_flip_y");
scale_tool.scale_flip_x.onclick = function() {
	if(viewport.selection.length == 0)
		return;
	var save_state = save_transforms(viewport.selection);
	var scale = new vec(-1.0, 1.0);
	var center = find_bodies_center(viewport.selection);
	scale_objects(viewport.selection, scale, center, scale_tool.localize_scale.checked);
	commit_transform(save_state, save_transforms(viewport.selection));
}
scale_tool.scale_flip_y.onclick = function() {
	if(viewport.selection.length == 0)
		return;
	var save_state = save_transforms(viewport.selection);
	var scale = new vec(1.0, -1.0);
	var center = find_bodies_center(viewport.selection);
	scale_objects(viewport.selection, scale, center, scale_tool.localize_scale.checked);
	commit_transform(save_state, save_transforms(viewport.selection));
}

scale_tool.scale_x_axis = document.getElementById("scale_x_axis");
scale_tool.scale_y_axis = document.getElementById("scale_y_axis");
scale_tool.scale_maintain_ar = document.getElementById("scale_maintain_ar");
scale_tool.localize_scale = document.getElementById("localize_scale");

scale_tool.save_state = null;
scale_tool.start_pos = new vec(0,0);
scale_tool.mousedown = function(evt) {
	if(viewport.selection.length == 0 || this.edit_in_progress)
		return;
	this.edit_in_progress = true;
	this.save_state = save_transforms(viewport.selection);
	this.start_pos = copy_vec(cur_mouse_pos);
	// Get the start size so we can scale relative to it with click and drag
	var start_aabb = find_aabb_around(viewport.selection);
	this.start_size = start_aabb.get_size();
	// Make sure the selection isn't completely flat, unscaleable
	if(this.start_size.x == 0 || this.start_size.y == 0)
		this.edit_in_progress = false;
}

scale_tool.mousemove = function(evt) {
	if(left_mouse_down && this.save_state !== null && this.edit_in_progress) {
		restore_transforms(this.save_state);
		var anchor_pt = find_bodies_center(viewport.selection);
		var v_start_pos = canvas_to_viewport(this.start_pos);
		var v_cur_pos = canvas_to_viewport(cur_mouse_pos);
		var drag_size = v_cur_pos.subtract(v_start_pos);
		// Invert when mouse < anchor_pt, so dragging away from it always scales up
		if(v_start_pos.x < anchor_pt.x)
			drag_size.x *= -1;
		if(v_start_pos.y < anchor_pt.y)
			drag_size.y *= -1;
		// Lock scaling to one axis or the other
		if(this.scale_x_axis.checked == false)
			drag_size.x = 0;
		if(this.scale_y_axis.checked == false)
			drag_size.y = 0;
		// Scale relative to the size of the selection
		var rel_drag_size = new vec(
			1.0 + drag_size.x/this.start_size.x,
			1.0 + drag_size.y/this.start_size.y
		);
		if( this.scale_maintain_ar.checked == true
		&& this.scale_x_axis.checked == true
		&& this.scale_y_axis.checked == true ) {
			var avg = (rel_drag_size.x + rel_drag_size.y)/2;
			rel_drag_size.x = rel_drag_size.y = avg;
		}
		scale_objects(viewport.selection, rel_drag_size, anchor_pt, this.localize_scale.checked);
	}
}

scale_tool.mouseup = function(evt) {
	if(this.edit_in_progress == false || this.start_pos.dist(cur_mouse_pos) === 0) {
		this.action_cancelled();
		return;
	}
	this.edit_in_progress = false;
	commit_transform(this.save_state, save_transforms(viewport.selection));
	this.save_state = null;
}

scale_tool.action_cancelled = function() {
	this.edit_in_progress = false;
	if(this.save_state == null)
		return;
	else
		restore_transforms(this.save_state);
	this.save_state = null;
}

scale_tool.draw = function() {
	if(viewport.selection == 0)
		return;
	var center = find_bodies_center(viewport.selection);
	var pos = viewport_to_canvas(center);
	graphics.lineStyle(1,0);
	graphics.beginFill(0,1);
	graphics.drawRect(Math.round(pos.x)-2,Math.round(pos.y)-2,4,4);
	graphics.endFill();
	
	if(this.edit_in_progress) {
		graphics.lineStyle(1,0);
		graphics.beginFill(0,0);
		var end = copy_vec(cur_mouse_pos);
		if(this.scale_x_axis.checked == false)
			end.x = this.start_pos.x;
		if(this.scale_y_axis.checked == false)
			end.y = this.start_pos.y;
		graphics.moveTo(this.start_pos.x, this.start_pos.y);
		graphics.lineTo(end.x, end.y);
		graphics.endFill();
	}
}

/*-------------
 * 
 * Box tool
 *
 *------------*/

box_tool.cur_box = null;
box_tool.start_pos = new vec(0,0);

box_tool.mousedown = function(evt) {
	if(this.edit_in_progress === true)
		return;
		
	this.edit_in_progress = true;
	if(this.cur_box !== null)
		return;
	var verts = [new vec(0,0), new vec(0,0), new vec(0,0), new vec(0,0)];
	var pos = canvas_to_viewport(cur_mouse_pos);
	this.cur_box = new body(pos, 0, verts);
	this.cur_box.aabb = null;
	world.objects.push( this.cur_box );
	this.start_pos = copy_vec(cur_mouse_pos);
};
box_tool.mousemove = function(evt) {
	if(this.cur_box == null)
		return;
	var world_mouse = canvas_to_viewport(cur_mouse_pos);
	var world_start = canvas_to_viewport(this.start_pos);
	var offset = world_mouse.subtract(world_start);
	this.cur_box.pos = world_start.add( offset.scale(0.5) );
	// regenerate the boxes verts.
	var verts = this.cur_box.verts;
	var size = offset.abs();
	var half_width = size.x/2;
	var half_height = size.y/2;
	verts[0].x = -half_width;
	verts[0].y = half_height;//top left
	
	verts[1].x = half_width;
	verts[1].y = half_height;//top right
	
	verts[2].x = half_width;
	verts[2].y = -half_height;//bottom right
	
	verts[3].x = -half_width;
	verts[3].y = -half_height;//bottom left
};

var box_density = document.getElementById("box_density");
var box_type_static = document.getElementById("box_type_static");
var box_type_dynamic = document.getElementById("box_type_dynamic");
var box_type_kinematic = document.getElementById("box_type_kinematic");

box_tool.mouseup = function(evt) {
	if(this.edit_in_progress === false || cur_mouse_pos.dist(this.start_pos) < 5) {
		this.action_cancelled();
		return;
	}

	this.edit_in_progress = false;
	if(this.cur_box == null)
		return;
	var new_box = world.objects.pop();
	new_box.density = parseFloat(box_density.value) || 0;
	new_box.type = 0;

	if(box_type_static.checked === true)
		new_box.type = BODY_TYPES.STATIC;
	else if(box_type_dynamic.checked === true)
		new_box.type = BODY_TYPES.DYNAMIC;
	else
		new_box.type = BODY_TYPES.KINEMATIC;
		
	add_objects([new_box]);
	this.cur_box = null;
};

box_tool.action_cancelled = function() {
	if(this.cur_box != null)
		world.objects.pop();
	this.cur_box = null;
	this.edit_in_progress = false;
};


/*-------------
 * 
 * Joint tool
 *
 *------------*/

var joint_collide_connected = document.getElementById("joint_collide_connected");
var enable_joint_limit = document.getElementById("enable_joint_limit");
var lower_joint_limit = document.getElementById("lower_joint_limit");
var upper_joint_limit = document.getElementById("upper_joint_limit");

joint_tool.mousedown = function(evt) {
	if(viewport.selection.length !== 2)
		return;
	var b0 = viewport.selection[0];
	var b1 = viewport.selection[1];
	if(b0.is_body == false || b1.is_body == false)
		return;
	var pos = canvas_to_viewport(cur_mouse_pos);
	switch(current_joint) {
		case "Revolute":
			var j = new joint(pos, JOINT_TYPES["Revolute"], b0, b1);
			j.collide_connected = joint_collide_connected.checked===true;
			if(enable_joint_limit.checked === true) {
				j.enable_limit = true;
				j.lower_angle = parseFloat(lower_joint_limit.value) || 0;
				j.upper_angle = parseFloat(upper_joint_limit.value) || 0;
			}
			add_objects([j]);
			break;
		case "Weld":
			var j = new joint(pos, JOINT_TYPES["Weld"], b0, b1);
			add_objects([j]);
			break;
	}
}

joint_tool.mousemove = function(evt) {
}

joint_tool.mouseup = function(evt) {
}
