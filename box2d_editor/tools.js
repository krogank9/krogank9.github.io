$("[name='tool_button']").change(function() {
	if(this.checked)
		set_current_tool(this.value);
});
$( document ).ready(function() {
	document.getElementById("select_tool").checked = true;
});

function set_current_tool(name) {
	var radio = "#" + name.toLowerCase() + "_tool";
	$(radio).prop('checked', true);
	
	$("#tool_options_label").html(name + " Options");
	$(".tool_options_tab").css({display: "none"});
	var tab_name = "#" + name + "_options";
	$(tab_name).css({display: "block"});
	
	current_tool.action_cancelled();
	current_tool = tools_list[name];
	
	left_mouse_down = false;
	undo_locked = false;
	canvas_dirty = true;
}

function tool() {
	this.mousedown = function(evt) {};
	this.mouseup = function(evt) {};
	this.mousemove = function(evt) {};
	this.action_cancelled = function() {};
	this.draw = function() {};
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

/*-------------
 * 
 * Select tool
 *
 *------------*/

select_tool.start_pos = new vec(0,0);
select_tool.mid_drag = false;
select_tool.mousedown = function() {
	if(this.mid_drag == false) {
		this.start_pos = copy_vec(cur_mouse_pos);
		this.mid_drag = true;
		undo_locked = true;
	}
}
select_tool.mouseup = function(evt) {
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
	
	this.mid_drag = false;
	undo_locked = false;
}
select_tool.draw = function() {
	if(left_mouse_down) {
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

move_tool.save_state = null;
move_tool.move_made = false;
move_tool.start_pos = new vec(0,0);
move_tool.mousedown = function(evt) {
	undo_locked = true;
	this.save_state = save_transforms(viewport.selection);
	this.move_made = false;
	this.start_pos = copy_vec(cur_mouse_pos);
}

move_tool.mousemove = function(evt) {
	if(left_mouse_down && this.save_state != null) {
		var world_mouse = canvas_to_viewport(cur_mouse_pos);
		var world_start = canvas_to_viewport(this.start_pos);
		var travel = world_mouse.subtract(world_start);
		if(travel.magnitude() == 0)
			return;
		restore_transforms(this.save_state);
		move_bodies(viewport.selection, travel);
		this.move_made = true;
	}
}

move_tool.mouseup = function(evt) {
	undo_locked = false;
	if(this.move_made == false)
		return;
	commit_transform(this.save_state, save_transforms(viewport.selection));
	this.save_state = null;
}

move_tool.draw = function() {
	if(left_mouse_down && viewport.selection.length > 0) {
		ctx.strokeStyle = "#000";
		ctx.beginPath();
		ctx.moveTo(start_mouse_pos.x, start_mouse_pos.y);
		ctx.lineTo(cur_mouse_pos.x, cur_mouse_pos.y);
		ctx.stroke();
	}
}

move_tool.action_cancelled = function() {
	undo_locked = false;
	if(this.save_state == null)
		return;
	else
		restore_transforms(this.save_state);
}

/*-------------
 * 
 * Rotate tool
 *
 *------------*/

var rotate_tool_local = document.getElementById("localize_rotation");
rotate_tool.save_state = null;
rotate_tool.move_made = false;
rotate_tool.start_pos = new vec(0,0);
rotate_tool.mousedown = function(evt) {
	undo_locked = true;
	this.save_state = save_transforms(viewport.selection);
	this.move_made = false;
	this.start_pos = copy_vec(cur_mouse_pos);
}

rotate_tool.mousemove = function(evt) {
	if(left_mouse_down && this.save_state !== null) {
		restore_transforms(this.save_state);
		var selection = viewport.selection;
		var world_mouse_end = canvas_to_viewport(cur_mouse_pos);
		var world_mouse_start = canvas_to_viewport(this.start_pos);
		// rotate all the bodies around their averaged center
		var center = find_bodies_center(selection);
		var start_off = world_mouse_start.subtract(center);
		var end_off = world_mouse_end.subtract(center);
		var rot_amount = end_off.angle() - start_off.angle();
		for(let i=0; i<selection.length && rot_amount!=0; i++) {
			var body = selection[i];
			body.rotation -= rot_amount;
			if(rotate_tool_local.checked == false)
				body.pos = body.pos.rotate_around(center, rot_amount);
			body.aabb = calculate_aabb(body);
			this.move_made = true;
		}
	}
}

rotate_tool.mouseup = function(evt) {
	undo_locked = false;
	if(this.move_made == false)
		return;
	commit_transform(this.save_state, save_transforms(viewport.selection));
	this.save_state = null;
}

rotate_tool.draw = function() {
	var center = find_bodies_center(viewport.selection);
	var pos = viewport_to_canvas(center);
	ctx.fillStyle = "#555";
	ctx.fillRect(Math.round(pos.x)-2,Math.round(pos.y)-2,4,4);
}

rotate_tool.action_cancelled = function() {
	undo_locked = false;
	if(this.save_state == null)
		return;
	else
		restore_transforms(this.save_state);
}

/*-------------
 * 
 * Box tool
 *
 *------------*/

box_tool.cur_box = null;
box_tool.start_pos = new vec(0,0);
box_tool.mousedown = function(evt) {
	undo_locked = true;
	if(this.cur_box !== null)
		return;
	var verts = [new vec(0,0), new vec(0,0), new vec(0,0), new vec(0,0)];
	var pos = canvas_to_viewport(cur_mouse_pos);
	this.cur_box = new body(pos, 0, verts);
	this.cur_box.aabb = null;
	world.bodies.push( this.cur_box );
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
box_tool.mouseup = function(evt) {
	undo_locked = false;
	if(this.cur_box == null)
		return;
	var new_box = world.bodies.pop();
	var dist = cur_mouse_pos.subtract(this.start_pos).magnitude();
	if(dist >= 10)
		add_bodies([new_box]);
	this.cur_box = null;
};
box_tool.draw = function() {};
box_tool.action_cancelled = function() {
	if(this.cur_box != null)
		world.bodies.pop();
};
