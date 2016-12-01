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
		
		// If you set refAngle to -45, getJointAngle() will return 0 when
		// body b's rotation is -45 (in relation to a)
		// so it will also return 45 when body b's rotation is 0
		//
		// Reference angle is what you want body_b.rotation - body_a.rotation to be when the joint is at 0
		var diff = find_angle_difference(joint.body_b.rotation, joint.body_a.rotation);
		var joint_rel = joint.body_b.pos.subtract(joint.pos).angle();
		// the body within the joint limits how you want it
		// to the bodies angle relative to each other, add
		// the joints rotation and offset from the body. 
		// i do make_ang_small on that to combine the offset into one angle... it's a bit confusing but this seemingly works:
		console.log(diff);
		var ref = diff+make_ang_small(joint.rotation-joint_rel);
		converted.refAngle = ref/rad2deg;
		
	} else if(joint.type == JOINT_TYPES["Weld"]) {
		// setting the reference angle is done a bit differently for the weld
		// just need to set it so they maintain the same rotation, no joint limits to account for
		var diff = joint.body_b.rotation - joint.body_a.rotation;
		converted.refAngle = diff/rad2deg;
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
	return JSON.stringify(world, null, 2);
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
			//console.log(search_arr(world.objects,body)+"'s verts reversed");
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
