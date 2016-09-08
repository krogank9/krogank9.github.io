// Every command creates & pushes a function to the undo history
// that will undo itself.
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
// of where exactly to add them in the world.bodies array
function add_bodies(bodies, opt_indices) {
	clear_redo_history();
	
	var indices = [];
	var has_indices = false;
	if(opt_indices != null && opt_indices !== 'undefined') {
		indices = opt_indices;
		has_indices = true;
	}
		
	for(let i=0; i<bodies.length; i++) {
		var body = bodies[i];
		body.aabb = calculate_aabb(body);
		var index;
		if(has_indices) {
			index = indices[i];
		}
		else {
			// create index
			index = world.bodies.length;
			indices.push(index);
		}
		world.bodies.splice(index, 0, body);
	}
	
	var action = {
		redo: function() { add_bodies(bodies, indices) },
		undo: function() { remove_bodies(indices); }
	};
	
	undo_history.push(action);
}
function remove_bodies(indices) {
	clear_redo_history();
	
	var deleted_bodies = [];	
	// Filter bodies with matching indices to remove them
	world.bodies = world.bodies.filter(function(body, index) {
		var to_filter = indices.some(function(elem) {
			return index==elem;
		});
		
		if(to_filter) {
			deleted_bodies.push(body);
			return false;
		} else {
			return true;
		}
	});
	
	update_selection();
	
	var action = {
		redo: function() { remove_bodies(indices) },
		undo: function() { add_bodies(deleted_bodies, indices) }
	};
	
	undo_history.push(action);
}

// Composite commands, don't need undos because they are made up of
// base commands:

function add_box(width, height) {
	width = Math.abs(width) || 1;
	height = Math.abs(height) || 1;
	
	var pos = new vec(cursor_pos.x, cursor_pos.y);
	var rot = 0;
	
	var top_left = new vec(-width/2,height/2);
	var max = new vec(width/2,height/2);
	var bottom_right = new vec(width/2,-height/2);
	var min = new vec(-width/2,-height/2);
	var verts = [min, bottom_right, max, top_left];
	
	var box = new body(pos, rot, verts);
	
	add_bodies([box]);
}
