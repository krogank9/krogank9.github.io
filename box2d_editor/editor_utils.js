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
			if(body.aabb.contains(select.aabb))
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
		if(select_box.contains(body.aabb))
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
