// Forwards and Backwards Reaching Inverse Kinematics
function fabrIK(sizes, goal, opt_start_angs, opt_margin_error)
{
	// Check if the goal is within reach and move it closer if not
	var total_size = sizes.reduce(function(a,b){return a+b});
	var goal_distance = goal.magnitude();
	if(total_size <= goal_distance)
	{
		goal = ang2normal(goal.angle()).scale(total_size); 
	}
	
	// First find all start positions based on sizes and optional angles
	var positions = [new vec(0,0)];
	while( positions.length < sizes.length+1 )
	{
		var i = positions.length - 1;
		var size = sizes[i];
		
		var ang = 0;
		if( opt_start_angs && i < opt_start_angs.length )
			ang = opt_start_angs[i];
			
		var next = (new vec(size, 0)).rotate_by(ang);
		positions.push(positions[i].add(next));
	}
	
	// Now that we have the start positions, start iterating through
	// FABRIK until the goal position is reached within the margin of error
	var margin_error = Math.abs(opt_margin_error) || 0.01;
	var last = positions.length - 1;
	var iter = 0;
	while( goal.subtract(positions[last]).magnitude() > margin_error )
	{
		// Iterate flipping between backwards and forwards through the positions,
		// moving closer and closer to the goal each time.

		positions[last].set_equal_to(goal);
		for(let i = last; i > 0; i--)
		{
			var ang = positions[i-1].subtract(positions[i]).angle();
			var diff = ang2normal(ang).scale(sizes[i-1]);
			positions[i-1].set_equal_to( positions[i].add(diff) );
		}
		positions[0].x = positions[0].y = 0;
		for(let i = 0; i < last; i++)
		{
			var ang = positions[i+1].subtract(positions[i]).angle();
			var diff = ang2normal(ang).scale(sizes[i]);
			positions[i+1].set_equal_to( positions[i].add(diff) );
		}

		if(++iter > 100)
			break;
	}
	
	// Now calculate the new angles and return them
	var end_angs = [];
	for(let i = 1; i < positions.length; i++)
	{
		var ang = positions[i].subtract(positions[i-1]).angle();
		end_angs.push(ang);
	}
	return end_angs;
}

function get_pos_circle(r,n)
{
	r = Math.abs(r)
	n = Math.abs(n)
	n = n>r?r:n;
	return Math.sqrt(r*r - n*n);
}

function get_joint_pos(joint)
{
	var anchor = joint.GetAnchorA();
	return new vec(anchor.x, anchor.y);
}

function absolute_ang_to_rel(joint, ang)
{
	ang -= joint.GetBodyA().GetAngle();
	ang -= joint.m_referenceAngle;
	return (ang + Math.PI/2) % MAX_RADS;
}

function b2vec2_to_vec(b2) {
	return new vec(b2.x, b2.y);
}

function sign(n) { return n<0?-1:1; }
