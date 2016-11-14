// Every command creates & pushes a function to the undo history
// that will undo itself. See existing base commands for example.
// The history of the undo/redo stack is preserved when calling 
// functions in it, so you can reuse commands when pushing to the stack.
var undo_history = [];
var redo_history = [];

var tmp_undo_history, tmp_redo_history;
function undo_history_save() {
	tmp_undo_history = undo_history;
	undo_history = [];
}
function undo_history_restore() {
	undo_history = tmp_undo_history;
}
function redo_history_save() {
	tmp_redo_history = redo_history;
	redo_history = [];
}
function redo_history_restore() {
	redo_history = tmp_redo_history;
}

function undo_one_command() {
	if(undo_history.length == 0)
		return false;
		
	var action = undo_history.pop();
	
	// Preserve undo history for any commands that reuse commands for undoing
	undo_history_save();
	// And preserve redo history so that doesn't get cleared either
	redo_history_save();
	action.undo();
	undo_history_restore();
	redo_history_restore();
		
	redo_history.push(action);
}
function redo_one_command() {
	if(redo_history.length == 0)
		return false;

	var action = redo_history.pop();
	
	// Preserve chain of redos when redoing an action in the chain. If
	// not saved and restored, the command, when redid, would clear the 
	// redo history.
	redo_history_save();
	action.redo();
	redo_history_restore();
}
// Make sure to clear redo history if any command is executed, as it
// will corrupt the perfect chain of undos/redos
function clear_redo_history() {
	redo_history = [];
}

// Base commands, these need undos:

// Add an array of bodies to the world, with optional indices parameter
// of where exactly to add them in the world.objects array
function add_objects(objects, opt_indices) {
	clear_redo_history();
	
	var indices = [];
	var has_indices = false;
	if(opt_indices != null && opt_indices !== 'undefined') {
		indices = opt_indices;
		has_indices = true;
	}
		
	for(let i=0; i<objects.length; i++) {
		var obj = objects[i];
		
		if(obj.is_body == true)
			obj.aabb = calculate_aabb(obj);
			
		var index;
		if(has_indices) {
			index = indices[i];
		}
		else { // object doesn't have a registered index, create one
			index = world.objects.length;
			indices.push(index);
		}
		
		world.objects.splice(index, 0, obj);
	}
	
	var prev_selection = viewport.selection.slice();
	viewport.selection = objects;
	update_selection();
	
	var action = {
		redo: function() { add_objects(objects, indices) },
		undo: function() {
			remove_objects(indices);
			viewport.selection = prev_selection;
		}
	};
	
	undo_history.push(action);
}

function remove_objects(indices) {
	clear_redo_history();
	
	var deleted_objects = [];
	
	var objects = indices_to_objects(indices);
	// Delete joints when deleting the bodies they are attached to
	objects = add_joints_to_objects(objects);
	indices = objects_to_indices(objects);
	
	// Filter bodies and remove the numbered indices listed
	world.objects = world.objects.filter(function(obj, index) {
		var to_filter = indices.some(function(elem) {
			return index==elem;
		});
		
		if(to_filter) {
			deleted_objects.push(obj);
			return false;
		} else {
			return true;
		}
	});
	
	update_selection();
	var saved_selection = viewport.selection.slice();
	
	var action = {
		redo: function() { remove_objects(indices) },
		undo: function() {
			add_objects(deleted_objects, indices)
			viewport.selection = saved_selection;
		}
	};
	
	undo_history.push(action);
}

function commit_transform(save_state, new_state) {
	clear_redo_history();
	var save_state = save_state;
	var new_state = new_state;
	var action = {
		redo: function() {
			restore_transforms(new_state);
			commit_transform(save_state, new_state);
		},
		undo: function() {
			restore_transforms(save_state);
		}
	};
	undo_history.push(action);
}

function set_selection(objects) {
	// No need to perform command if the selection doesn't change
	if(viewport.selection.length === 0 && objects.length === 0)
		return;
	if(viewport.selection.length === objects.length === 1
	&& objects[0] === viewport.selection[0])
		return;
	
	clear_redo_history();
	
	var old_selection = viewport.selection.slice();
	viewport.selection = objects;
	var new_selection = viewport.selection.slice();
	
	update_selection();
	
	var action = {
		redo: function() { set_selection(new_selection); },
		undo: function() { set_selection(old_selection); }
	};
	undo_history.push(action);
}


// Some composite commands, no need for undoing because they are
// made up of the base commands: 
function duplicate_objects(bodies) {
	var copies = generate_duplicate_objects(viewport.clipboard);
	var copypos = find_bodies_center(copies);
	var curpos = find_bodies_center(viewport.selection);
	var travel = curpos.subtract(copypos);
	// offset the position a bit so bodies don't overlap
	travel = travel.add( new vec(0.1, 0.1) );
	// dont offset if the movement is locked on an axis
	if(move_tool.move_x_axis.checked == false)
		travel.x = 0;
	if(move_tool.move_y_axis.checked == false)
		travel.y = 0;
	move_objects(copies, travel);
	add_objects(copies);
}
