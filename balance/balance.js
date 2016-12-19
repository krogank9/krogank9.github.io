var upper_body = null;
var ragdoll = [];
var ground = null;

var arm_joints = [];

var hip_joints = [];
var knee_joints = [];
var leg_joints = [];
var l_leg_joints = [];
var r_leg_joints = [];
var l_foot_body = null;
var r_foot_body = null;

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
	j.SetMaxMotorTorque(10);
	var intensity = 1.0-straightness;
	j.SetMotorSpeed( intensity*10*direction );
}

function straighten_joint(j)
{
	rotate_joint(j, j.start_angle);
}

function get_center_mass(bodies)
{
	total_pos = new vec(0, 0);
	
	var max = 0;
	bodies.forEach(function(b){max=b.GetMass()>max?b.GetMass():max;});
	var center = new vec(0,0);
	bodies.forEach(function(b) {
		var mass = b.GetMass();
		var weight = 1/bodies.length;
		var pos = b2vec_to_vec( b.GetPosition() );
		center = center.add( pos.scale(weight) );
	});
	
	return center;
}

function bodies_colliding(body_a, body_b)
{
	var contact = (body_a.GetContactList() || {}).contact;
	while( contact )
	{
		var a = contact.GetFixtureA().GetBody();
		var b = contact.GetFixtureB().GetBody();
		if( (a === body_a && b === body_b) || (a === body_b && b === body_a) )
			return true;
		else
			contact = contact.GetNext();
	}
	return false;
}

var r_last = new vec(0,0);
var l_last = new vec(0,0);

var r_hip_last = new vec(0,0);
var l_hip_last = new vec(0,0);

function set_feet_position()
{
	var center = get_center_mass(ragdoll);
	
	var l_hip = get_joint_pos(l_leg_joints[0]);
	var r_hip = get_joint_pos(r_leg_joints[0]);
	
	var l_foot = get_joint_pos(l_leg_joints[2]);
	var r_foot = get_joint_pos(r_leg_joints[2]);
	
	l_foot.x -= center.x;
	r_foot.x -= center.x;
		
	// if( right foot is touching ground )
		// l_foot.x = r_foot.x * -1
	// else if( left foot is touching ground )
		// r_foot.x = l_foot.x * -1;
	if( bodies_colliding(l_foot_body, ground) )
	{
		r_foot.x = l_foot.x * -1;
		r_foot.y = l_foot.y;
	}
	else if(bodies_colliding(r_foot_body, ground) )
	{
		l_foot.x = r_foot.x * -1;
		l_foot.y = r_foot.y;
	}
		
	// make legs as extended as possible to stay standing
	//l_foot.y = l_hip.y - get_y_pos_circle(leg_length, l_foot.x);
	//r_foot.y = r_hip.y - get_y_pos_circle(leg_length, r_foot.x);
	
	// turn x position back to absolute
	l_foot.x += center.x;
	r_foot.x += center.x;
	
	l_last.set_equal_to(l_foot);
	r_last.set_equal_to(r_foot);
	
	l_hip_last.set_equal_to(l_hip);
	r_hip_last.set_equal_to(r_hip);
	
	var l_rel = l_foot.subtract(l_hip);
	var r_rel = r_foot.subtract(r_hip);
	
	// use inverse kinematics to iterate and find what angles are needed to reach the desired positions
	var l_goal = fabrIK([upper_leg_length, lower_leg_length], l_rel);
	var r_goal = fabrIK([upper_leg_length, lower_leg_length], r_rel);

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
	ground = getNamedBodies(b2d_world, "ground")[0];
	l_foot_body = getNamedBodies(b2d_world, "l_foot")[0];
	r_foot_body = getNamedBodies(b2d_world, "r_foot")[0];
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
		
		if( b.GetType() == 2 ) {
			ragdoll.push(b);
		}
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

function world_to_canvas(world_vec) {
	var converted = new vec(world_vec.x, world_vec.y);
	converted = converted.scale(player_scale);
	converted.y *= -1;
	converted.y += player_canvas.height;
	return converted.add(player_offset);
}

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
	var center = world_to_canvas(get_center_mass(ragdoll));
	player_context.moveTo(center.x,0);
	player_context.lineTo(center.x,player_canvas.height);
	player_context.stroke();
	
	player_context.strokeStyle = "blue";
	player_context.beginPath();//foot
	var left = world_to_canvas(l_last);
	player_context.moveTo(left.x,left.y-5);
	player_context.lineTo(left.x,left.y+5);
	player_context.stroke();
	
	//hip
	player_context.beginPath();
	var left = world_to_canvas(l_hip_last);
	player_context.moveTo(left.x,left.y-5);
	player_context.lineTo(left.x,left.y+5);
	player_context.stroke();
	
	player_context.strokeStyle = "red";
	player_context.beginPath();//foot
	var right = world_to_canvas(r_last);
	player_context.moveTo(right.x,right.y-5);
	player_context.lineTo(right.x,right.y+5);
	player_context.stroke();
	
	//hip
	player_context.beginPath();
	var right = world_to_canvas(r_hip_last);
	player_context.moveTo(right.x,right.y-5);
	player_context.lineTo(right.x,right.y+5);
	player_context.stroke();
	
	
	requestAnimationFrame(update_world);
};
update_world();
