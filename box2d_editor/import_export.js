$("#save_dialog").dialog({
	autoOpen: false,
	modal: true,
	buttons: {
		"Save": function() {
			var file_name = $( "#save_as_input" ).val();
			if(file_name.length === 0)
				file_name = "untitled.qbe"
				
			var blob = new Blob([export_world(world)], {type: "text/plain;charset=utf-8"});
			saveAs(blob, file_name);

			$( this ).dialog("close");
		},
		"Cancel": function() {
			$( this ).dialog("close");
		}
	},
	open: function() {
		update_selection();
	}
});

var save_button = document.getElementById("save_button");

var open_file = document.getElementById("open_file");
open_file.onclick = function() {
	var self = this;
	// Prevent clicking twice
	setTimeout(function(){ self.disabled = true; }, 1);
	setTimeout(function(){ self.disabled = false; }, 3000);
};

var open_file = document.getElementById("open_file");
open_file.onchange = function() {
	if('files' in open_file && open_file.files.length > 0) {
		var file = open_file.files[0];

		var reader = new FileReader();
		reader.onload = function(evt) {
			var text = evt.target.result;

			// Check if it's a file compatible with the editor:
			try {
				var test = JSON.parse(text);
			}
			catch(err) {
				alert("Error loading file");
				this.value = null;
				return;
			}
			
			if(test.is_world === true) {
				world = import_world(text);
				update_selection();
				undo_history = [];
				redo_history = [];
			}
			else {
				alert("Wrong file type");
			}
		}
		reader.readAsText(file);
	}
	this.value = null;
}

function remake_vec(v) {
	return new vec(v.x, v.y);
}

function remake_aabb(aabb) {
	return new AABB(aabb.min, aabb.max);
}

function export_joint(joint) {
	var body_a_index = search_arr(world.objects, joint.body_a);
	var body_b_index = search_arr(world.objects, joint.body_b);
	joint.body_a = body_a_index;
	joint.body_b = body_b_index;
}

function import_joint(joint, world) {
	if(joint.body_a !== -1)
		joint.body_a = world.objects[joint.body_a];
	else
		joint.body_a = null;
		
	if(joint.body_b !== -1)
		joint.body_b = world.objects[joint.body_b];
	else
		joint.body_b = null;
	
	joint.pos = remake_vec(joint.pos);
}

function import_body(body) {
	if(body.aabb !== null && body.aabb !== 'undefined')
		body.aabb = remake_aabb(body.aabb);
	
	body.pos = remake_vec(body.pos);
	
	for(let i=0; i<body.verts.length; i++) {
		body.verts[i] = remake_vec(body.verts[i]);
	}
}

function export_world(world) {
	filter_joints(world.objects).forEach(function(elem) {
		export_joint(elem);
	});
	return JSON.stringify(world);
}

function import_world(json) {
	var world = JSON.parse(json);
	filter_bodies(world.objects).forEach(function(elem) {
		import_body(elem);
	});
	filter_joints(world.objects).forEach(function(elem) {
		import_joint(elem, world);
	});
	return world;
}
