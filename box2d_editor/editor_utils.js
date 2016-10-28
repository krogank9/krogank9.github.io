// Animation for the label radio buttons used
$(".custom_label_button").mousedown( function() {
	this.style.background = "linear-gradient(#ffffff,#dddddd)";
});
$(".custom_label_button").mouseup( function() {
	this.style.background = "";
});

function get_radio_value(radio_name) {
	var radios = document.getElementsByName(radio_name);
	for(var r in radios)
		if(r.checked)
			return r.value;
}

function get_selection_pt(pt) {
	var selection = [];
	// Get all bodies that the mouse hits
	for(let i=0; i<world.objects.length; i++) {
		var obj = world.objects[i];
		if(obj.is_body == true) {
			if(obj.aabb.test(pt))
				selection.push(obj);
		}
		else if(obj.is_joint == true) {
			var pt_canvas = viewport_to_canvas(pt);
			var joint_canvas = viewport_to_canvas(obj.pos);
			if(joint_canvas.subtract(pt_canvas).magnitude() <= 10) {
				selection.push(obj);
			}
		}
	}

	// Filter overlapping bodies
	selection = selection.filter(function(obj) {
		if(obj.is_joint == true)
			return true;
			
		var aabb = obj.aabb;
		for(let i=0; i<selection.length; i++) {
			var select = selection[i];
			if(select.is_joint == true)
				continue;
			// Check if the current body overlaps any others
			if(select != obj && obj.aabb.contains(select.aabb))
				return false;
		}
		return true;
	});
	
	// Make sure to return only 1 object when testing using a single click
	if(selection.length >= 1) {
		var get_joints = filter_joints(selection);
		if(get_joints.length >= 1)
			return [ get_joints[0] ];
		else
			return [ selection[0] ];
	}
	else
		return [];
}

function get_selection_box(select_box) {
	var selection = [];
	for(let i=0; i<world.objects.length; i++) {
		var obj = world.objects[i];
		if(obj.is_body == true && select_box.overlaps(obj.aabb))
			selection.push(obj);
		else if(obj.is_joint == true && select_box.test(obj.pos))
			selection.push(obj);
	}
	return selection;
}

function merge_selections(cur_selection, add_selection, allow_deselect) {
	// Make copies so we can modify the arrays
	var cur = cur_selection.slice();
	var add = add_selection.slice();
	
	// Filter each array for duplicates in the other. This is so selecting
	// something twice will cause it to be deselected
	var cur_filtered = cur.filter(function(body) {
		for(let i=0; i<add.length && allow_deselect; i++)
			if(add[i] == body)
				return false;
		return true;
	});
	var add_filtered = add.filter(function(body) {
		for(let i=0; i<cur.length; i++)
			if(cur[i] == body)
				return false;
		return true;
	});
	
	return cur_filtered.concat(add_filtered);
}

// Remove deleted bodies from selection
function update_selection() {
	var selection = viewport.selection.filter(function(s_body) {
		// Make sure each selection body exists in world's list of bodies too
		return world.objects.some(function(w_body) {
			return s_body==w_body;
		});
	});
	
	viewport.selection = selection;
}

function search_arr(arr, elem) {
	for(let i=0; i<arr.length; i++)
	{
		if(arr[i] === elem)
			return i;
	}
	return -1;
}

function find_object_index(obj) {
	for(let i=0; i<world.objects.length; i++) {
		if(world.objects[i] === obj)
			return i;
	}
	return -1;
}

function indices_to_bodies(indices) {
	var bodies = [];
	for(let i=0; i<indices.length; i++) {
		bodies.push( indices[i] );
	}
	return bodies;
}
function bodies_to_indices(bodies) {
	var indices = [];
	for(let i=0; i<bodies.length; i++) {
		var body = bodies[i];
		var index = find_object_index(body);
		if(index != -1)
			indices.push( index );
	}
	return indices;
}

function copy_vert_array(verts) {
	var copied_verts = [];
	for(let i=0; i<verts.length; i++)
		copied_verts.push(copy_vec(verts[i]));
	return copied_verts;
}

function save_transforms(objects) {
	var save_state = [];
	for(let i=0; i<objects.length; i++) {
		var object = objects[i];
		var obj_info = {
			is_body: object.is_body==true,
			is_joint: object.is_joint==true,
			pos: copy_vec(object.pos),
			type: object.type
		}
		if(object.is_body) {
			obj_info.body = object;
			obj_info.aabb = copy_aabb(object.aabb);
			obj_info.verts = copy_vert_array(object.verts);
			obj_info.rotation = object.rotation;
		} else if(object.is_joint) {
			obj_info.joint = object;
		}
		save_state.push(obj_info);
	}
	return save_state;
}

function restore_transforms(save_state) {
	for(let i=0; i<save_state.length; i++) {
		var save = save_state[i];
		if(save.is_body == true) {
			var body = save.body;
			body.pos = copy_vec(save.pos);
			body.rotation = save.rotation;
			body.verts = copy_vert_array(save.verts);
			body.aabb = copy_aabb(save.aabb);
		}
		else if(save.is_joint == true) {
			var joint = save.joint;
			joint.pos = copy_vec(save.pos);
		}
	}
}

function copy_body(b) {
	var copy = new body(copy_vec(b.pos), b.rotation, copy_vert_array(b.verts));
	copy.aabb = calculate_aabb(b);
	return copy;
}
function copy_joint(j) {
	var copy = new joint(copy_vec(j.pos), j.type, j.body_a, j.body_b);
	return copy;
}

// Duplicate bodies & joints. If duplicating a joint and its corresponding
// bodies, update the joints body_a and body_b to the newly duplicated ones.
function generate_duplicate_objects(objects) {
	var duplicates = [];
	// First loop through and duplicate all the bodies
	var bodies = filter_bodies(objects);
	for(let i=0; i<bodies.length; i++) {
		var old_body = bodies[i];
		// Save which index the body is placed in for the joints
		old_body.new_index = duplicates.length;
		duplicates.push( copy_body(old_body) );
	}
	// Next, loop through and duplicate all joints and attach to the new bodies
	var joints = filter_joints(objects);
	for(let i=0; i<joints.length; i++) {
		var joint = joints[i];
		if(joint.body_a !== null) {
			// Check if the joints body is in the original array
			var index = search_arr(objects, joint.body_a);
			if(index > -1) {
				// If it is, attach it to the new body.
				var new_body = duplicates[objects[index].new_index]
				joint.body_a = new_body;
			}
		}
		if(joint.body_b !== null) {
			var index = search_arr(objects, joint.body_b);
			if(index > -1) {
				var new_body = duplicates[objects[index].new_index]
				joint.body_b = new_body;
			}
		}
		duplicates.push( copy_joint(joint) );
	}
	return duplicates;
}

function move_objects(objects, travel) {
	for(let i=0; i<objects.length; i++) {
		var obj = objects[i];
		obj.pos = obj.pos.add(travel);
		if(obj.is_body) {
			obj.aabb = calculate_aabb(obj);
		}
	}
}

function rotate_objects(objects, degrees, localize) {
	var center = find_bodies_center(objects);
	for(let i=0; i<objects.length && degrees!=0; i++) {
		var obj = objects[i];
		if(localize !== true)
			obj.pos = obj.pos.rotate_around(center, degrees);
		if(obj.is_body == true) {
			obj.rotation += degrees;
			obj.aabb = calculate_aabb(obj);
		}
	}
}

function scale_objects(objects, scale_vec, origin_vec, localize) {
	for(let i=0; i<objects.length; i++) {
		var obj = objects[i];
		// Scale the body's position around the anchor
		if(localize != true)
			obj.pos = obj.pos.scale_around(origin_vec, scale_vec);
		// Scale the body's vertices
		for(let v=0; obj.is_body == true && v<obj.verts.length; v++) {
			var vert = obj.verts[v];
			// Scale the vertices at their current rotated position
			if(localize != true)
				vert = vert.rotate_by(obj.rotation);
			vert = vert.scale_by_vec(scale_vec);
			if(localize != true)
				vert = vert.rotate_by(obj.rotation*-1);
			obj.verts[v] = vert;
		}
		if(obj.is_body == true)
			obj.aabb = calculate_aabb(obj);
	}
}

function find_bodies_center(bodies) {
	if(bodies.length == 0)
		return new vec(0,0);
		
	var center = new vec(0,0);
	for(let i=0; i<bodies.length; i++) {
		var body = bodies[i];
		center = center.add(body.pos);
	}
	center.x /= bodies.length;
	center.y /= bodies.length;
	return center;
}

// Vertex positions are relative to each body. Here's a function to 
// transform them to world positions and then to canvas.
function body_verts_to_canvas(body) {
	var rot = body.rotation;
	var pos = body.pos;
	
	var world_positions = [];
	for(let i=0; i<body.verts.length; i++)
		world_positions.push(body.verts[i].rotate_by(rot).add(pos));
		
	var canvas_positions = [];
	for(let i=0; i<world_positions.length; i++)
		canvas_positions.push( viewport_to_canvas(world_positions[i]) );
		
	return canvas_positions;
}

function filter_joints(objects) {
	var filtered = [];
	for(let i=0; i<objects.length; i++) {
		var obj = objects[i];
		if(obj.is_joint == true)
			filtered.push(obj);
	}
	return filtered;
}

function filter_bodies(objects) {
	var filtered = [];
	for(let i=0; i<objects.length; i++) {
		var obj = objects[i];
		if(obj.is_body == true)
			filtered.push(obj);
	}
	return filtered;
}
