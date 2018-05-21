//////////////////
// touch screen //
//////////////////
var touch_area = get("touch_area");
var hold_div = get("hold");

function get_touch_pos(evt)
{
	if(!evt || !evt.touches[0])
		return {x:0, y:0}
	else
		return {x:evt.touches[0].clientX, y:evt.touches[0].clientY};
}

function diff(p2,p1)
{
	return {x:p2.x-p1.x, y:p2.y-p1.y};
}

function mag(p)
{
	return Math.sqrt(p.x*p.x + p.y*p.y);
}

function dist(p1,p2)
{
	return mag( diff(p1,p2) );
}

var paw_div = get("paw_div");
function tap(evt)
{
	if(hold_div.contains(evt.target) || paw_div.contains(evt.target))
		swap_held_piece();
	else
		rotate();
		
	last_tap = Date.now();
}

var last = get_touch_pos();
var start = get_touch_pos();
var cur = get_touch_pos();
var prev = get_touch_pos();
var start_time = 0;
var start_placed = 0;
var last_drop_placed = 0;
var last_tap = 0;
var last_time = 0;
var started_dropping = 0;

var velocity_x = 0;
var velocity_y = 0;

var moved = false;

touch_area.ontouchstart = function(evt) {
	start_time = last_time = Date.now();
	start_placed = last_placed;
	
	start = get_touch_pos(evt);
	cur = get_touch_pos(evt);
	prev = get_touch_pos(evt);
	last = get_touch_pos(evt);
	
	velocity_x = velocity_y = 0;
	
	moved = false;
	
	return false;
}

touch_area.ontouchmove = function(evt)
{
	var now = Date.now();
	var touch_dur = now - start_time;
	cur = get_touch_pos(evt);
	var travel = diff(cur, prev);
	velocity_x = travel.x / (now - last_time); // px / s
	velocity_y = travel.y / (now - last_time);
	
	
	var can_move = (now - started_dropping) > 400
				|| last_drop_placed < start_placed;
				
	var move = diff(cur, last);
	// shift block left to right
	if(move.x > board_scale)
	{
		if( Math.abs(velocity_x) > velocity_y && can_move )
		{
			move_piece(1);
			moved = true;
			drop_fast = false;
			last = cur;
		}
	}
	else if(move.x < -board_scale)
	{
		if( Math.abs(velocity_x) > velocity_y && can_move )
		{
			move_piece(-1);
			moved = true;
			drop_fast = false;
			last = cur;
		}
	}
	
	if( !drop_fast && velocity_y > board_scale/30 )
	{
		drop_fast = true;
		started_dropping = Date.now();
		last_drop_placed = start_placed;
	}
		
	last_time = now;
	prev = cur;
	
	return false;
}

touch_area.ontouchend = function(evt) {
	var now = Date.now();
	
	last_drop_placed--;
	
	var touch_dur = now - start_time;
	var travel = diff(cur, start);
	var travel_dist = mag(travel);

	if(drop_fast && (now - started_dropping) < 400 && start_placed == last_placed)
		drop();
	else if(drop_fast == false && moved == false && start_placed == last_placed)
		tap(evt);
		
	drop_fast = false;
		
	return false;
}

//////////////
// keyboard //
//////////////
var down_key_time = 0;
var down_held = false;

window.onkeydown = function(evt)
{
	switch(evt.keyCode)
	{
		case 37: //left
			move_piece(-1);
			break;
		case 39: //right
			move_piece(1);
			break;
		case 38: // up
			rotate();
			break;
		case 40: //down
			if(down_held == false)
				down_key_time = Date.now();
			drop_fast = true;
			down_held = true;
			break;
		case 72: // h
			swap_held_piece();
			break;
		default:
			return;
	}
}

window.onkeyup = function(evt)
{
	if(evt.keyCode == 40) //down arrow
	{
		var elapsed = Date.now() - down_key_time;
		if(elapsed < 120 && drop_fast)
			drop();
			
		drop_fast = false;
		down_held = false;
	}
}
