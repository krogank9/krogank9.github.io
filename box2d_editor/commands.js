// Every command creates & pushes a function to the undo history
// that will undo itself.
var undo_history = [];
var redo_history = [];

function undo_one_command() {
	if(undo_history.length == 0)
		return false;
		
	var action = undo_history.pop();
	action.undo();
	redo_history.push(action);
}
function redo_one_command() {
	if(redo_history.length == 0)
		return false;

	var action = redo_history.pop();
	// Preserve chain of redos only when redoing an action in the chain
	var save = redo_history;
	action.redo();
	redo_history = save;
}
// Make sure to clear redo history if any command is executed, as it
// will corrupt the perfect chain of undos/redos
function clear_redo_history() {
	redo_history = [];
}

// Base commands, these need undos:

// Add a body, with an optional index parameter of where on the stack to add it
function add_body(body, opt_index) {
	clear_redo_history();
	
	var index = opt_index || world.bodies.length;
	world.bodies.splice(index, 0, body);
	
	var action = {
		redo: function() { add_body(body, index); },
		undo: function() { world.bodies.splice(index, 1); }
	};
	
	undo_history.push(action);
}
function remove_body(index) {
	clear_redo_history();
		
	var deleted = world.bodies[index];
	world.bodies.splice(index);
	var action = {
		redo: function() { remove_body(index) },
		undo: function() { add_body(deleted, index) }
	};
	undo_history.push(action);
}

// Composite commands, don't need undos because they are made up of
// base commands:

function add_box(width, height) {
	width = Math.abs(width) || 1;
	height = Math.abs(height) || 1;
	
	var box = new body(new vec(cursor_pos.x, cursor_pos.y));
	var top_left = new vec(-width/2,height/2);
	var top_right = new vec(width/2,height/2);
	var bottom_right = new vec(width/2,-height/2);
	var bottom_left = new vec(-width/2,-height/2);
	
	var shape = new polygon_shape(
		[bottom_left, bottom_right, top_right, top_left]
	);
	box.fixtures.push(new fixture(shape));
	
	add_body(box);
}
