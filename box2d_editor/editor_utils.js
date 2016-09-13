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
	for(let i=0; i<world.bodies.length; i++) {
		let body = world.bodies[i];
		if(body.aabb.test(pt)){
			selection.push(body);
		}
	}

	// Filter overlapping bodies
	selection = selection.filter(function(body) {
		var aabb = body.aabb;
		for(let i=0; i<selection.length; i++) {
			var select = selection[i];
			if(select != body && body.aabb.contains(select.aabb))
				return false;
		}
		return true;
	});
	
	// Make sure to return only 1 body when testing using a single click
	if(selection.length >= 1)
		return [ selection[0] ];
	else
		return [];
}

function get_selection_box(select_box) {
	var selection = [];
	for(let i=0; i<world.bodies.length; i++) {
		var body = world.bodies[i];
		if(select_box.overlaps(body.aabb))
			selection.push(body);
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
		return world.bodies.some(function(w_body) {
			return s_body==w_body;
		});
	});
	
	viewport.selection = selection;
}

function find_body_index(body) {
	for(let i=0; i<world.bodies.length; i++) {
		if(world.bodies[i] == body)
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
		var index = find_body_index(body);
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

function save_transforms(bodies) {
	var save_state = [];
	for(let i=0; i<bodies.length; i++) {
		var body = bodies[i];
		var body_info = {
			body: body,
			pos: copy_vec(body.pos),
			rotation: body.rotation,
			verts: copy_vert_array(body.verts),
			aabb: copy_aabb(body.aabb)
		};
		save_state.push(body_info);
	}
	return save_state;
}

function restore_transforms(save_state) {
	for(let i=0; i<save_state.length; i++) {
		var save = save_state[i];
		var body = save.body;
		body.pos = copy_vec(save.pos);
		body.rotation = save.rotation;
		body.verts = copy_vert_array(save.verts);
		body.aabb = copy_aabb(save.aabb);
	}
}

function copy_body(b) {
	var copy = new body(copy_vec(b.pos), b.rotation, copy_vert_array(b.verts));
	copy.aabb = calculate_aabb(b);
	return copy;
}

function generate_duplicate_bodies(bodies) {
	var duplicates = [];
	for(let i=0; i<bodies.length; i++) {
		duplicates.push( copy_body(bodies[i]) );
	}
	return duplicates;
}

function move_bodies(bodies, travel) {
	for(let i=0; i<bodies.length; i++) {
		var body = bodies[i];
		body.pos = body.pos.add(travel);
		body.aabb = calculate_aabb(body);
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
