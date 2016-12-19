var upper_body = null;
var ragdoll = [];

var arm_joints = [];

var hip_joints = [];
var knee_joints = [];
var leg_joints = [];
var l_leg_joints = [];
var r_leg_joints = [];

var ideal_feet_distance = 0;
var upper_leg_length = 0;
var lower_leg_length = 0;
var leg_length = 0;

var all_joints = [];

function get_angle_closeness(ang1, ang2) {
	var diff = Math.abs( find_angle_difference(ang1, ang2) );
	return 1.0 - diff/MAX_RADS;
}

function rotate_joint(j, ang) {
	var dest = normalize_ang(ang);
	var cur = normalize_ang(j.GetJointAngle());
	
	var diff = find_angle_difference(dest, cur);
	var direction = diff > 0 ? 1 : -1;
	
	var straightness = get_angle_closeness(dest, cur);
	j.SetMaxMotorTorque(50);
	var intensity = 1.0-straightness;
	j.SetMotorSpeed( intensity*50*direction );
}

function straighten_joint(j)
{
	rotate_joint(j, j.start_angle);
}

function get_center_mass(bodies)
{
	var total_mass = bodies[0].GetMass();
	var total_pos = bodies[0].GetPosition();
	total_pos = new vec(total_pos.x, total_pos.y);
	
	// weight many centers of mass with their corresponding masses to
	// determine the center of mass of multiple bodies
	for(let i = 1; i < bodies.length; i++)
	{
		var pos = bodies[i].GetPosition();
		pos = new vec(pos.x, pos.y);

		var mass = bodies[i].GetMass();
		var max_mass = total_mass > mass ? total_mass : mass;

		var cur = mass/max_mass;
		var total = total_mass/max_mass;

		var x = pos.x*cur + total_pos.x*total;
		var y = pos.y*cur + total_pos.y*total;
		
		total_pos.x = x;
		total_pos.y = y;
	}
	
	return total_pos
}

function set_feet_position()
{
	var center = get_center_mass(ragdoll);
	
	var l_foot = get_joint_pos(l_leg_joints[2]);
	var r_foot = get_joint_pos(r_leg_joints[2]);
	l_foot.x = center.x - l_foot.x;
	r_foot.x = center.x - r_foot.x;
	
	if( Math.abs(l_foot.x) > Math.abs(r_foot.x) )
		;//l_foot.x = r_foot.x * -1;
	else
		;//r_foot.x = l_foot.x * -1;
		
	// make legs as extended as possible to stay standing
	l_foot.y = -1*get_y_pos_circle(leg_length, l_foot.x);
	r_foot.y = -1*get_y_pos_circle(leg_length, r_foot.x);
	
	// use inverse kinematics to iterate and find what angles are needed to reach the desired positions
	var l_goal = fabrIK([upper_leg_length, lower_leg_length], get_pos_relative_to_joint(l_foot, l_leg_joints[0]));
	var r_goal = fabrIK([upper_leg_length, lower_leg_length], get_pos_relative_to_joint(r_foot, r_leg_joints[0]));
	
	rotate_joint(l_leg_joints[0], absolute_ang_to_rel(l_leg_joints[0], l_goal[0]));
	rotate_joint(l_leg_joints[1], absolute_ang_to_rel(l_leg_joints[1], l_goal[1]));

	rotate_joint(r_leg_joints[0], absolute_ang_to_rel(r_leg_joints[0], r_goal[0]));
	rotate_joint(r_leg_joints[1], absolute_ang_to_rel(r_leg_joints[1], r_goal[1]));
	
	//...
	// if they can't be placed at the ideal position because of joint limits, that
	// means the ragdoll is falling over. to maintain the center of balance one leg
	// will cross over the other while staying as close to the ideal distance as possible
}

function step_world()
{
	set_feet_position();
	b2d_world.Step(1 / 60, 10, 10);
	b2d_world.ClearForces();
}

function init() {
	upper_body = getNamedBodies(b2d_world, "upper_body")[0];
	for (let j = b2d_world.m_jointList; j; j = j.m_next) {
		if( j.GetType() == 1 ) // revolute
		{
			j.start_angle = j.GetJointAngle();
			j.EnableMotor(true);
		}
			
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
	for(let b = b2d_world.m_bodyList; b; b = b.m_next)
	{
		b.start_x_pos = b.GetPosition().x;
		b.start_y_pos = b.GetPosition().y;
		b.start_angle = b.GetAngle();
		
		if( b.GetType() == 2 )
			ragdoll.push(b);
	}
	
	l_leg_joints.push( getNamedJoints(b2d_world, "l_hip")[0] );
	l_leg_joints.push( getNamedJoints(b2d_world, "l_knee")[0] );
	l_leg_joints.push( getNamedJoints(b2d_world, "l_ankle")[0] );
	
	r_leg_joints.push( getNamedJoints(b2d_world, "r_hip")[0] );
	r_leg_joints.push( getNamedJoints(b2d_world, "r_knee")[0] );
	r_leg_joints.push( getNamedJoints(b2d_world, "r_ankle")[0] );
	
	var foot0 = get_joint_pos(l_leg_joints[2]);
	var foot1 = get_joint_pos(r_leg_joints[2]);
	ideal_feet_distance = foot0.subtract(foot1).magnitude()/2;
	
	var leg0 = get_joint_pos(l_leg_joints[0]);
	var leg1 = get_joint_pos(l_leg_joints[1]);
	var leg2 = get_joint_pos(l_leg_joints[2]);
	upper_leg_length = leg0.subtract(leg1).magnitude();
	lower_leg_length = leg1.subtract(leg2).magnitude();
	leg_length = upper_leg_length+lower_leg_length;
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
	
	player_context.strokeStyle = "green";
	player_context.beginPath();
	var center = get_center_mass(ragdoll).x;
	player_context.moveTo(player_offset.x+center*player_scale,0);
	player_context.lineTo(player_offset.x+center*player_scale,player_canvas.height);
	player_context.stroke();
	
	requestAnimationFrame(update_world);
};
update_world();
