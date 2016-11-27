$("#save_dialog").dialog({
	autoOpen: false,
	modal: true,
	resizable: false,
	buttons: {
		"Save": function() {
			var file_name = $( "#save_as_input" ).val();
			if(file_name.length === 0)
				file_name = qbe_format.checked===true? "untitled.qbe" : "untitled.json";
			
			var file_contents = qbe_format.checked===true? save_world(world) : export_world_rube(world);
				
			var blob = new Blob([file_contents], {type: "text/plain;charset=utf-8"});
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

function save_joint(joint) {
	var body_a_index = search_arr(world.objects, joint.body_a);
	var body_b_index = search_arr(world.objects, joint.body_b);
	joint.body_a = body_a_index;
	joint.body_b = body_b_index;
}

// Make a position relative to a body
function make_pos_relative(pos, body) {
	var rel = pos.subtract(body.pos);
	return rel.rotate_by(body.rotation*-1);
}

function export_joint(joint, bodies_list) {
	//change into RUBE format
	var converted = {
		name: joint.name,
		bodyA: search_arr(bodies_list, joint.body_a),
		bodyB: search_arr(bodies_list, joint.body_b),
		anchorA: make_pos_relative(joint.pos, joint.body_a),
		anchorB: make_pos_relative(joint.pos, joint.body_b),
		refAngle: 0,
		type: invert(JOINT_TYPES)[joint.type].toLowerCase(),
		collideConnected: joint.collide_connected
	};
	if(joint.type == JOINT_TYPES["Revolute"]) {
		converted.enableLimit = joint.enable_limit;
		converted.lowerLimit = (joint.lower_angle-joint.rotation-90)/rad2deg;
		converted.upperLimit = (joint.upper_angle-joint.rotation-90)/rad2deg;
		converted.enableMotor = false;
		converted.maxMotorTorque = 0;
		converted.motorSpeed = 0;
	}
	
	return converted;
}

function load_joint(joint, world) {
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

function load_body(body) {
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
		save_joint(elem);
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
		load_body(elem);
	});
	filter_joints(world.objects).forEach(function(elem) {
		load_joint(elem, world);
	});
	return world;
}

// Export the world into RUBE's json format
function export_world_rube(world_to_export) {
	var bodies = filter_bodies(world.objects);
	
	bodies.forEach(function(body) {
		// Make sure verts are specified in counter clockwise order, for Box2D
		if(check_clockwise(body.verts))
			body.verts.reverse();
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
	
	for(let i=0; i<bodies.length; i++) {
		var b = bodies[i];
		var new_body = {
			name: b.name,
			type: b.type,
			angle: b.rotation/rad2deg,
			angularVelocity: 0,
			awake: true,
			linearVelocity: new vec(0,0),
			"massData-mass": 1,
			"massData-center": b.pos,
			"massData-I": 1,
			position: b.pos,
			fixture: [
				{
					name: "fixture",
					density: b.density,
					friction: b.friction,
					polygon: {
						vertices: {x: [], y: []}
					}
				}
			]
		}
		// Convert array of verts to x/y array, different format
		for(let j=0; j<b.verts.length; j++) {
			new_body.fixture[0].polygon.vertices.x.push(b.verts[j].x);
			new_body.fixture[0].polygon.vertices.y.push(b.verts[j].y);
		}
		b2d_world.body.push(new_body);
	}
	
	filter_joints(world.objects).forEach(function(joint) {
		var exported = export_joint(joint, bodies);
		b2d_world.joint.push(exported);
	});
	
	return JSON.stringify(b2d_world);
}
