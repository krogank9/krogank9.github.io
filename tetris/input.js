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
		
	last_tap = get_time();
}

var last = get_touch_pos();
var start = get_touch_pos();
var cur = get_touch_pos();
var start_time = 0;
var last_tap = 0;
var last_time = 0;

var velocity_x = 0;
var velocity_y = 0;

touch_area.ontouchstart = function(evt) {
	start_time = last_time = get_time();
	
	start = get_touch_pos(evt);
	cur = get_touch_pos(evt);
	last = get_touch_pos(evt);
	
	return false;
}

touch_area.ontouchmove = function(evt)
{
	var now = get_time();
	var touch_dur = now - start_time;
	cur = get_touch_pos(evt);
	var travel = diff(cur, start);
	velocity_x = travel.x / (now - last_time); // px / s
	velocity_y = travel.y / (now - last_time);
	
	var move = diff(cur, last);
	// shift block left to right
	if(move.x > board_width_px/10)
	{
		if(Math.abs(move.x) > Math.abs(move.y))
			move_piece(1);
		last = cur;
	}
	else if(move.x < -board_width_px/10)
	{
		if(Math.abs(move.x) > Math.abs(move.y))
			move_piece(-1);
		last = cur;
	}
	
	console.log(velocity_y + ", " + (board_scale*4/200));
	// fast dropping
	//if( touch_dur < 200 && travel.y > board_scale*4 )
	if( velocity_y > board_scale/3 )
		drop_fast = true;
		
	last_time = now;
	
	return false;
}

touch_area.ontouchend = function(evt) {
	var touch_dur = get_time() - start_time;
	var travel = diff(cur, start);
	var travel_dist = mag(travel);

	if(touch_dur < 200
	&& travel_dist > board_scale*3
	&& travel.y > 0 
	&& travel.y > Math.abs(travel.x)
	&& get_time() - last_tap > 100)
		drop();
	else if(touch_dur < 200 && travel_dist < board_scale/4)
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
				down_key_time = get_time();
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
	var now = get_time();
	if(evt.keyCode == 40) //down arrow
	{
		var elapsed = now - down_key_time;
		if(elapsed < 120 && drop_fast)
			drop();
			
		drop_fast = false;
		down_held = false;
	}
}
