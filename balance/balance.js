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

var MAX_TORQUE = 20;

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
		var l_dist = Math.abs( center.x - l_pos.x );
		var r_dist = Math.abs( center.x - r_pos.x );
		return l_dist < r_dist ? l_leg : r_leg;
	}
}

// check which corner of the foot will hit the ground first to be able to
// place it more precisely
function predict_contact(body)
{
	var verts = body.m_fixtureList.m_shape.m_vertices;
	var body_angle = body.GetAngle();
	verts = verts.map(function(vert){
		var pos = new vec(vert.x, vert.y);
		return pos.rotate_by(body_angle);
	});
	bottom = new vec(0,0);
	verts.forEach(function(v){if(v.y < bottom.y) bottom.y=v.y;});

	var prediction = copy_vec(verts[0]);
	for(let i=0; i<verts.length; i++)
	{
		var cur_dist = prediction.subtract(bottom).magnitude();
		var vert_dist = bottom.subtract(verts[i]).magnitude();
		if(vert_dist < cur_dist)
			prediction.set_equal_to(verts[i]);
		
		var midpt = verts[i].add(verts[(i+1)%verts.length]).scale(0.5);
		var midpt_dist = bottom.subtract(midpt).magnitude();
		if(midpt_dist < cur_dist)
			prediction.set_equal_to(midpt);
	}

	return prediction;
}

var r_last = new vec(0,0);
var l_last = new vec(0,0);

function lowest_vert_pos(body)
{
	return b2vec2_to_vec(body.GetPosition()).add(predict_contact(body));
}

function set_feet_position()
{
	set_joint_speeds( r_leg.joints, 0 );
	set_joint_speeds( l_leg.joints, 0 );
	
	var center = get_center_mass(ragdoll);
	var l_foot_contact = get_contact(l_leg.bodies[2], ground);
	var r_foot_contact = get_contact(r_leg.bodies[2], ground);
	l_last = avg_contact_point(l_foot_contact) || lowest_vert_pos(l_leg.bodies[2]);
	r_last = avg_contact_point(r_foot_contact) || lowest_vert_pos(r_leg.bodies[2]);

	var pivot_leg = determine_pivot_leg(center, l_foot_contact, r_foot_contact);
	if(pivot_leg == null)
		return;
	var step_leg = pivot_leg===r_leg ? l_leg : r_leg;
		
	pivot_leg.contact_pos = avg_contact_point( get_contact(pivot_leg.bodies[2], ground) );
	
	pivot_leg.contact_pos.x -= center.x;

	var step_leg_goal = copy_vec(pivot_leg.contact_pos);
	// both legs equidistant from center of mass
	step_leg_goal.x *= -1;
	// IK positions relative to bodies center, predict which corner
	// of body makes contact with ground and position relative to that
	step_leg_goal = step_leg_goal.subtract( predict_contact(step_leg.bodies[2]) );
	step_leg_goal.x += center.x;
	
	var step_rel = step_leg_goal.subtract( get_joint_pos(step_leg.joints[0]) );
	var step_leg_angles = fabrIK([upper_leg_length, lower_leg_length], step_rel);
	
	rotate_joint( pivot_leg.joints[0], absolute_ang_to_rel(step_leg.joints[0], step_leg_angles[0]) );
	rotate_joint( pivot_leg.joints[1], absolute_ang_to_rel(step_leg.joints[1], step_leg_angles[1]) );
	
	// make the pivot leg's foot always point towards ground
	rotate_joint( pivot_leg.joints[1], absolute_ang_to_rel(pivot_leg.joints[1], -90/rad2deg) );
}

/*

this old function's pretty interesting. i noticed if you rotate the pivot leg
to the angles meant for the stepping leg, it almost balances.

function set_feet_position()
{
	set_joint_speeds( r_leg.joints, 0 );
	set_joint_speeds( l_leg.joints, 0 );
	
	var center = get_center_mass(ragdoll);
	var l_foot_contact = get_contact(l_leg.bodies[2], ground);
	var r_foot_contact = get_contact(r_leg.bodies[2], ground);
	l_last = avg_contact_point(l_foot_contact) || lowest_vert_pos(l_leg.bodies[2]);
	r_last = avg_contact_point(r_foot_contact) || lowest_vert_pos(r_leg.bodies[2]);

	var pivot_leg = determine_pivot_leg(center, l_foot_contact, r_foot_contact);
	if(pivot_leg == null)
		return;
	var step_leg = pivot_leg===r_leg ? l_leg : r_leg;
		
	pivot_leg.contact_pos = avg_contact_point( get_contact(pivot_leg.bodies[2], ground) );
	
	pivot_leg.contact_pos.x -= center.x;

	var step_leg_goal = copy_vec(pivot_leg.contact_pos);
	// both legs equidistant from center of mass
	step_leg_goal.x *= -1;
	// IK positions relative to bodies center, predict which corner
	// of body makes contact with ground and position relative to that
	step_leg_goal = step_leg_goal.subtract( predict_contact(step_leg.bodies[2]) );
	step_leg_goal.x += center.x;
	
	var step_rel = step_leg_goal.subtract( get_joint_pos(step_leg.joints[0]) );
	var step_leg_angles = fabrIK([upper_leg_length, lower_leg_length], step_rel);
	
	rotate_joint( pivot_leg.joints[0], absolute_ang_to_rel(step_leg.joints[0], step_leg_angles[0]) );
	rotate_joint( pivot_leg.joints[1], absolute_ang_to_rel(step_leg.joints[1], step_leg_angles[1]) );
	
	// make the pivot leg's foot always point towards ground
	rotate_joint( pivot_leg.joints[1], absolute_ang_to_rel(pivot_leg.joints[1], -90/rad2deg) );
}
*/
/*function set_feet_position()
{
	var center = get_center_mass(ragdoll);
	
	var l_hip = get_joint_pos(l_leg.joints[0]);
	var r_hip = get_joint_pos(r_leg.joints[0]);
	
	var l_foot = get_joint_pos(l_leg.joints[2]);
	var r_foot = get_joint_pos(r_leg.joints[2]);
	
	l_foot.x -= center.x;
	r_foot.x -= center.x;

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

	rotate_joint(l_leg.joints[0], absolute_ang_to_rel(l_leg.joints[0], l_goal[0]));
	rotate_joint(l_leg.joints[1], absolute_ang_to_rel(l_leg.joints[1], l_goal[1]));

	rotate_joint(r_leg.joints[0], absolute_ang_to_rel(r_leg.joints[0], r_goal[0]));
	rotate_joint(r_leg.joints[1], absolute_ang_to_rel(r_leg.joints[1], r_goal[1]));
}*/

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
