var upper_body = null;
var arm_joints = [];
var hip_joints = [];
var knee_joints = [];
var leg_joints = [];
var all_joints = [];
var max_rads = 2*Math.PI;
function normalize_rads(rads) {
	return ((rads%max_rads)+max_rads)%max_rads;
}
function rad_to_fraction(rads) {
	return normalize_rads(rads)/max_rads;
}
function get_joint_angles(joints) {
	var arr = [];
	for(i=0; i<joints.length; i++)
		arr.push(rad_to_fraction(joints[i].GetJointAngle()));
	return arr;
}
function set_joint_motors(joints, arr) {
	// 0.5 = 0 speed
	// 1.0 = max torque
	// 0.0 = max torque in the negative direction
	
	for(i=0; i<joints.length; i++) {
		var j = joints[i];
		// make between -1 and 1
		var val = (arr[i] - 0.5)*2;
		var speed = val*j.GetMotorTorque();
		j.SetMaxMotorTorque(40);
		j.SetMotorSpeed(speed);
	}
}

function get_angle_closeness(ang1, ang2) {
	var diff = Math.abs( find_angle_difference(ang1, ang2) );
	return 1.0 - diff/max_rads;
}

function keep_upright(body) {
	var ang = body.GetAngle();
	var diff = find_angle_difference(ang, 0);
	var direction = diff > 0 ? -1 : 1;
	var intensity = 1.0-get_angle_closeness(ang, 0);
	body.ApplyTorque(intensity*500*direction);
}

function straighten_joint(j) {
	var start = normalize_rads(j.start_angle);
	var cur = normalize_rads(j.GetJointAngle());
	
	var diff = find_angle_difference(start, cur);
	var direction = diff > 0 ? 1 : -1;
	
	var straightness = get_angle_closeness(start, cur);
	j.SetMaxMotorTorque(40);
	if(straightness > 0.99999) {
		//j.SetMotorSpeed(0);
		return;
	}
	var intensity = 1.0-straightness;
	j.SetMotorSpeed( intensity*10*direction );
}

function step_world() {
	leg_joints.forEach(function(j){ straighten_joint(j) });

	all_joints.forEach(function(j) {
		if(Math.abs(j.GetMotorSpeed()) < 0.1 && j.name.indexOf('hip') == j.name.indexOf('knee') == -1)
			;//j.SetMaxMotorTorque(0);
		else
			;//j.SetMaxMotorTorque(40);
			
		//j.SetMotorSpeed( j.GetMotorSpeed()/2 );
	});
	
	// keep_upright(upper_body);
	
	b2d_world.Step(1 / 60, 10, 10);
	b2d_world.ClearForces();
}

function init() {
	upper_body = getNamedBodies(b2d_world, "upper_body")[0];
	for (let j = b2d_world.m_jointList; j; j = j.m_next) {
		if( j.GetType() == 1 ) // revolute
			j.start_angle = j.GetJointAngle();
			
		if( j.name.indexOf('hip') > -1 || j.name.indexOf('knee') > -1 ) {
			leg_joints.push(j);
			if(j.name.indexOf('hip') > -1)
				hip_joints.push(j);
			else
				knee_joints.push(j);
		} else if( j.name.indexOf('shoulder') > -1 || j.name.indexOf('elbow') > -1 ) {
			arm_joints.push(j);
		}
	}
	all_joints = arm_joints.concat(leg_joints);
}
load_b2d_world();
init();

function update_world() {
	if(draw_world == false)
		return;
	
	step_world();
	
	//black background
	player_context.fillStyle = 'rgb(0,0,0)';
	player_context.clearRect( 0, 0, player_canvas.width, player_canvas.height );
	
	player_context.save();
	player_context.scale(1,-1);
	player_context.translate(0,-player_canvas.height);
	player_context.translate(player_offset.x,-player_offset.y);
	b2d_world.DrawDebugData();
	player_context.restore();
	
	b2d_world.ClearForces();
	
	requestAnimationFrame(update_world);
};
update_world();
