var upper_body = null;
var ragdoll = [];
var ground = null;

var arm_joints = [];

var hip_joints = [];
var knee_joints = [];
var leg_joints = [];
var l_foot_body = null;
var r_foot_body = null;

var r_leg = { joints: [], bodies : [] };
var l_leg = { joints: [], bodies : [] };

var ideal_feet_distance = 0;
var upper_leg_length = 0;
var lower_leg_length = 0;
var leg_length = 0;

var all_joints = [];

var MAX_TORQUE = 40;

function get_angle_closeness(ang1, ang2) {
	var diff = Math.abs( find_angle_difference(ang1, ang2) );
	return 1.0 - diff/MAX_RADS;
}

//problem: sometimes it tries to reach the given angle by rotating in the wrong direction
//so it hits the joint's limits.
function rotate_joint(j, ang) {
	var dest = normalize_ang(ang);
	var cur = normalize_ang(j.GetJointAngle());
	
	var diff = find_angle_difference(dest, cur);
	var direction = diff > 0 ? 1 : -1;
	
	var straightness = get_angle_closeness(dest, cur);
	j.SetMaxMotorTorque(MAX_TORQUE);
	var intensity = 1.0-straightness;
	j.SetMotorSpeed( intensity*MAX_TORQUE*direction );
}

function straighten_joint(j)
{
	rotate_joint(j, j.start_angle);
}

function set_joint_speeds(joints, speed)
{
	joints.forEach(function(j){
		if(j.SetMotorSpeed)
		{
			j.SetMaxMotorTorque(MAX_TORQUE);
			j.SetMotorSpeed(speed);
		}
	});
}

function get_center_mass(bodies)
{
	total_pos = new vec(0, 0);
	
	var total_mass = 0;
	bodies.forEach(function(b){total_mass+=b.GetMass()});
	var center = new vec(0,0);
	bodies.forEach(function(b) {
		var mass = b.GetMass();
		var weight = mass/total_mass;
		var pos = b2vec2_to_vec( b.GetPosition() );
		center = center.add( pos.scale(weight) );
	});
	
	return center;
}

function get_contact(body_a, body_b)
{
	var contact = (body_a.GetContactList() || {}).contact;
	while( contact )
	{
		var a = contact.GetFixtureA().GetBody();
		var b = contact.GetFixtureB().GetBody();
		if( (a === body_a && b === body_b) || (a === body_b && b === body_a) )
			return contact;
		else
			contact = contact.GetNext();
	}
	return null;
}

function avg_contact_point(contact)
{
	if(!contact)
		return null;
		
	var wm = new b2WorldManifold();
	contact.GetWorldManifold(wm);
	contact_points = wm.m_points;
	var pointCount = contact.GetManifold().m_pointCount;
	if(pointCount == 0)
		return null;
	var pt = b2vec2_to_vec(contact_points[0]);
	
	for(let i=1; i<pointCount; i++)
	{
		pt.x += contact_points[i].x;
		pt.y += contact_points[i].y;
	}
	
	return new vec(pt.x/pointCount, pt.y/pointCount);
}

function determine_pivot_leg(center, l_foot_contact, r_foot_contact) {
	var l_pos = avg_contact_point(l_foot_contact);
	var r_pos = avg_contact_point(r_foot_contact);

	if(l_pos == null && r_pos == null)
		return null
	else if(l_pos != null && r_pos == null)
		return l_leg;
	else if(r_pos != null && l_pos == null)
		return r_leg;
	else if(l_pos != null && r_pos != null)
	{
		if(l_pos.x > center.x && r_pos.x > center.x)
			return l_leg;
		else if(l_pos.x < center.x && r_pos.x < center.x)
			return r_leg;
			
		// when both feet touch the ground on both sides of the center of mass
		var l_dist = Math.abs( center.x - l_pos.x );
		var r_dist = Math.abs( center.x - r_pos.x );
		return l_dist < r_dist ? l_leg : r_leg;
	}
}

var r_last = new vec(0,0);
var l_last = new vec(0,0);

function set_feet_position()
{
	set_joint_speeds( r_leg.joints, 0 );
	set_joint_speeds( l_leg.joints, 0 );
	
	rotate_joint( l_leg.joints[2], absolute_ang_to_rel(l_leg.joints[2], -90/rad2deg) );
	rotate_joint( r_leg.joints[2], absolute_ang_to_rel(r_leg.joints[2], -90/rad2deg) );
	
	var center = get_center_mass(ragdoll);
	var l_foot_contact = get_contact(l_leg.bodies[2], ground);
	var r_foot_contact = get_contact(r_leg.bodies[2], ground);
	
	var pivot_leg = determine_pivot_leg(center, l_foot_contact, r_foot_contact);
	if(pivot_leg == null)
		return;
	var step_leg = pivot_leg===r_leg ? l_leg : r_leg;
		
	pivot_leg.pos = get_joint_pos(pivot_leg.joints[2]);
	
	pivot_leg.pos.x -= center.x;

	var step_leg_goal = copy_vec(pivot_leg.pos);
	// both legs equidistant from center of mass
	step_leg_goal.x *= -1;
	step_leg_goal.x += center.x;
	pivot_leg.pos.x += center.x;
	
	r_last = pivot_leg.pos;
	l_last = step_leg_goal;
	
	var step_rel = step_leg_goal.subtract( get_joint_pos(step_leg.joints[0]) );
	var step_leg_angles = fabrIK([upper_leg_length, lower_leg_length], step_rel);
	
	rotate_joint( step_leg.joints[0], absolute_ang_to_rel(step_leg.joints[0], step_leg_angles[0]) );
	rotate_joint( step_leg.joints[1], absolute_ang_to_rel(step_leg.joints[1], step_leg_angles[1]) );
}

function step_world()
{
	if(player_paused)
		return;
	b2d_world.Step(1 / 60*player_speed, 10, 10);
	set_feet_position();
	b2d_world.ClearForces();
}

function init() {
	upper_body = getNamedBodies(b2d_world, "upper_body")[0];
	ground = getNamedBodies(b2d_world, "ground")[0];
	for (let j = b2d_world.m_jointList; j; j = j.m_next) {
		if( j.GetType() == 1 ) // revolute
		{
			j.start_angle = j.GetJointAngle();
			j.EnableMotor(true);
			all_joints.push(j);
		}
	}
	for(let b = b2d_world.m_bodyList; b; b = b.m_next)
	{
		b.start_x_pos = b.GetPosition().x;
		b.start_y_pos = b.GetPosition().y;
		b.start_angle = b.GetAngle();
		
		if( b.GetType() == 2 ) {
			ragdoll.push(b);
		}
	}
	
	l_leg.joints.push( getNamedJoints(b2d_world, "l_hip")[0] );
	l_leg.joints.push( getNamedJoints(b2d_world, "l_knee")[0] );
	l_leg.joints.push( getNamedJoints(b2d_world, "l_ankle")[0] );

	l_leg.bodies.push( getNamedBodies(b2d_world, "l_thigh")[0] );
	l_leg.bodies.push( getNamedBodies(b2d_world, "l_shin")[0] );
	l_leg.bodies.push( getNamedBodies(b2d_world, "l_foot")[0] );
	
	r_leg.joints.push( getNamedJoints(b2d_world, "r_hip")[0] );
	r_leg.joints.push( getNamedJoints(b2d_world, "r_knee")[0] );
	r_leg.joints.push( getNamedJoints(b2d_world, "r_ankle")[0] );
	
	r_leg.bodies.push( getNamedBodies(b2d_world, "r_thigh")[0] );
	r_leg.bodies.push( getNamedBodies(b2d_world, "r_shin")[0] );
	r_leg.bodies.push( getNamedBodies(b2d_world, "r_foot")[0] );
	
	set_joint_speeds( l_leg.joints.concat(r_leg.joints), 0 );
	
	var foot0 = get_joint_pos(l_leg.joints[2]);
	var foot1 = get_joint_pos(r_leg.joints[2]);
	ideal_feet_distance = foot0.subtract(foot1).magnitude()/2;
	
	var leg0 = get_joint_pos(l_leg.joints[0]);
	var leg1 = get_joint_pos(l_leg.joints[1]);
	var leg2 = b2vec2_to_vec(l_leg.bodies[2].GetPosition());
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
	
	player_context.strokeStyle = "red";
	player_context.beginPath();//foot
	var right = world_to_canvas(r_last);
	player_context.moveTo(right.x,right.y-5);
	player_context.lineTo(right.x,right.y+5);
	player_context.stroke();
	
	requestAnimationFrame(update_world);
};
update_world();
