$("#save_dialog").dialog({
	autoOpen: false,
	modal: true,
	resizable: false,
	buttons: {
		"Save": function() {
			var file_name = $( "#save_as_input" ).val();
			if(file_name.length === 0)
				file_name = "untitled.qbe"
				
			var blob = new Blob([save_world(world)], {type: "text/plain;charset=utf-8"});
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

var rube_format = document.getElementById("rube_format");
var qbe_format = document.getElementById("qbe_format");
rube_format.onclick = function() {
	var file_name = $( "#save_as_input" ).val();
	var prd_loc = file_name.indexOf(".");
	if(prd_loc <= 0)
		file_name = "untitled.json";
	else
		file_name = file_name.substring(0,prd_loc) + ".json";
	$( "#save_as_input" ).val(file_name)
}
qbe_format.onclick = function() {
	var file_name = $( "#save_as_input" ).val();
	var prd_loc = file_name.indexOf(".");
	if(prd_loc <= 0)
		file_name = "untitled.qbe";
	else
		file_name = file_name.substring(0,prd_loc) + ".qbe";
	$( "#save_as_input" ).val(file_name)
}

var save_button = document.getElementById("save_button");

var open_file = document.getElementById("open_file");
open_file.onclick = function() {
	var self = this;
	// Prevent clicking twice
	setTimeout(function(){ self.disabled = true; }, 1);
	setTimeout(function(){ self.disabled = false; }, 2000);
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
				world = load_world(text);
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

function check_clockwise(verts) {
	if(verts.length < 3)
		return false;
	
	var ang1 = normalize_ang( verts[0].angle() );
	var ang2 = normalize_ang( verts[1].angle() );
	
	return ang2 < ang1;
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

function save_world(world_to_save) {
	var world = copy_world(world_to_save);
	
	filter_joints(world.objects).forEach(function(elem) {
		export_joint(elem);
	});

	filter_bodies(world.objects).forEach(function(body) {
		// Make sure verts are specified in counter clockwise order, for Box2D
		if(check_clockwise(body.verts))
			body.verts = body.verts.reverse();
	});
	return JSON.stringify(world);
}

function load_world(json) {
	var world = JSON.parse(json);
	filter_bodies(world.objects).forEach(function(elem) {
		import_body(elem);
	});
	filter_joints(world.objects).forEach(function(elem) {
		import_joint(elem, world);
	});
	return world;
}

// Export the world into RUBE's json format
function export_world_rube(world_to_export) {
	var world = copy_world(world_to_export);
	
	filter_bodies(world.objects).forEach(function(body) {
		// Make sure verts are specified in counter clockwise order, for Box2D
		if(check_clockwise(body.verts))
			body.verts = body.verts.reverse();
	});
	
	var b2d_world = {
		gravity: world.gravity,
		allowSleep: true,
		autoClearForces: true,
		positionIterations: world.position_iterations,
		velocityIterations: world.velocity_iterations,
		stepsPerSecond: 60,
		warmStarting: true,
		continuousPhysics: true,
		subStepping: false,
		body: [],
		joint: [],
		image: []
	};
	
	var bodies = filter_bodies(world.objects);
	var joints = [];
	// Convert the references to body a & b affected by each joint to
	// indices, how the RUBE format expects it
	filter_joints(world.objects).forEach(function(joint) {
		var copy = copy_joint(joint);
		copy.body_a = search_arr(bodies, copy.body_a);
		copy.body_b = search_arr(bodies, copy.body_b);
		joints.push(copy);
	});
	
	for(let i=0; i<bodies.length; i++) {
		var b = bodies[i];
		b2d_world.body.push({
			name: b.name,
			type: b.type,
			angle: b.rotation/rad2deg,
			angularDamping: 0,
			angularVelocity: 0,
			awake: true,
			bullet: false,
			fixedRotation: false,
			linearDamping: 0,
			linearVelocity: new vec(0,0),
			"massData-mass": 1,
			"massData-center": new vec(0,0),
			"massData-I": 1,
			position: body.pos,
			fixture: {
				name: "fixture",
				density: b.density,
				"filter-categoryBits": 1,
				"filter-maskBits": 1,
				"filter-groupIndex": 1,
				friction: b.friction,
				restitution: b.restitution,
				sensor: false,
				customProperties: [],
				polygon: {
					vertices: copy_vert_array(b.verts)
				}
			},
			customProperties: []
		});
	}
	
	return JSON.stringify(b2d_world);
}
