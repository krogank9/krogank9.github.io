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
				
			var blob = new Blob([file_contents], {type: "text/plain;charset=ascii"});
			saveAs(blob, file_name);

			$( this ).dialog("close");
		},
		"Cancel": function() {
			$( this ).dialog("close");
		}
	},
	open: function() {
		current_tool.action_cancelled();
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
	
	var diff = find_angle_difference(ang2, ang1);
	
	return diff < 0;
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
		// remember, -30 and +330 are not the same for joint limits. do not normalize angle to positive or %360
		// you can have it rotate multiple times forward i.e. lower limit 0 upper limit 1080 or -1080
		converted.lowerLimit = joint.lower_angle/rad2deg;
		converted.upperLimit = joint.upper_angle/rad2deg;
		converted.enableMotor = false;
		converted.maxMotorTorque = 0;
		converted.motorSpeed = 0;
		
		// refAngle example: If you set refAngle to -45, getJointAngle() will return 0 when
		// body b's rotation is -45. Angles are measured as body b's angle in relation to body a's angle
		var ang_diff = joint.body_b.rotation - joint.body_a.rotation;
		var joint_rel = joint.body_b.pos.subtract(joint.pos).angle();
		var offset = normalize_ang(joint.rotation-joint_rel) - 360;
		var reference_angle = ang_diff+offset;
		converted.refAngle = reference_angle/rad2deg;
		
	} else if(joint.type == JOINT_TYPES["Weld"]) {
		var ang_diff = joint.body_b.rotation - joint.body_a.rotation;
		converted.refAngle = ang_diff/rad2deg;
	}
	
	return converted;
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
	return JSON.stringify(world, null, 2);
}

function load_world(json) {
	var world = JSON.parse(json);
	var objects = world.objects;
	
	// Remake all the objects from the JSON so they have their functions.
	// i.e. vec's have .magnitude() and isn't just an object with x&y properties
	var remade_objects_arr = [];
	for(let i=0; i<objects.length; i++) {
		var obj = objects[i];
		
		if(obj.is_body)
			remade_objects_arr.push( new body(obj) );
		else if(obj.is_joint)
			remade_objects_arr.push( new joint(obj) );
	}
	
	// When saved, the joint's body a and b are set to the indexes of bodies,
	// set them back to the actual objects
	filter_joints(remade_objects_arr).forEach(function(joint) {
		joint.body_a = remade_objects_arr[joint.body_a];	
		joint.body_b = remade_objects_arr[joint.body_b];
	});
	
	world.objects = remade_objects_arr;
	
	return world;
}

// Get area and moment of intertia from triangle
function get_triangle_data(verts) {
	var base_ang = verts[1].subtract(verts[0]).angle();
	// rotate all to the axis of the base of the triangle
	var rotated = [
		verts[0].rotate_by(-base_ang),
		verts[1].rotate_by(-base_ang),
		verts[2].rotate_by(-base_ang)
	];
	var b = Math.abs(rotated[1].x - rotated[0].x); // base
	var h = Math.abs(rotated[2].y - rotated[0].y); // height
	var area = b*h/2;
	
	var a = Math.abs(rotated[2].x - rotated[0].x); // dist from side of base to tip for MoI formula:
	var MoI = Math.pow(b,3)*h - Math.pow(b,2)*h*a + b*h*Math.pow(a,2) + b*Math.pow(h,3);
	MoI /= 36;
	return {area:area, MoI:MoI};
}

// Most box2d loaders won't calculate mass, inertia, and mass center for you.
// Need to calculate it yourself or it's set to default values like 1 or 0
function calculate_massdata(body) {
	var area = 0;
	var MoI = 0;
	var verts = body.verts;
	var length = verts.length;
	for(let i=0; i<length; i++) {
		var data = get_triangle_data([new vec(0,0), verts[i], verts[(i+1)%length]]);
		area += data.area;
		MoI += data.MoI;
	}
	var massData = {
		"massData-mass": area*body.density,
		"massData-center": new vec(0,0), // not supporting offcenter masses for now, just boxes
		"massData-I": MoI,
	}
	return massData;
}

// Export the world into RUBE's json format
function export_world_rube(world_to_export) {
	var bodies = filter_bodies(world.objects);
	
	bodies.forEach(function(body) {
		// Make sure verts are specified in counter clockwise order, for Box2D
		if(check_clockwise(body.verts)) {
			body.verts.reverse();
		}
		
		body.rotation = normalize_ang(body.rotation);
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
			position: b.pos,
			fixture: [
				{
					name: "fixture",
					density: b.density,
					friction: b.friction,
					"filter-categoryBits": b.category_bits,
					"filter-maskBits": b.mask_bits,
					"filter-groupIndex": b.group_index,
					polygon: {
						vertices: {x: [], y: []}
					}
				}
			]
		}
		
		if(b.type !== BODY_TYPES.STATIC) {
			var massData = calculate_massdata(b);
			new_body["massData-mass"] = massData["massData-mass"];
			new_body["massData-I"] = massData["massData-I"];
			new_body["massData-center"] = massData["massData-center"];
		}
		
		// Convert array of verts to x/y array, different format
		for(let j=0; j<b.verts.length; j++) {
			new_body.fixture[0].polygon.vertices.x.push(b.verts[j].x);
			new_body.fixture[0].polygon.vertices.y.push(b.verts[j].y);
		}
		b2d_world.body.push(new_body);
	}
	
	filter_joints(world.objects).forEach(function(joint) {
		joint.rotation = normalize_ang(joint.rotation);
		var exported = export_joint(joint, bodies);
		b2d_world.joint.push(exported);
	});
	
	return JSON.stringify(b2d_world, null, 2);
}
