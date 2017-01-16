//////////////////
// touch screen //
//////////////////
var hammer = new Hammer(get("touch_area"));

var last_x = 0;
var last_y = 0;
hammer.on("panstart", function(evt) {
	last_x = 0;
	last_y = 0;
});

hammer.on("panmove", function(evt) {
	// shifting block left and right
	var moved_x = evt.deltaX - last_x;
	var moved_y = evt.deltaY - last_y;
	if(moved_x > board_width_px/10)
	{
		if(Math.abs(moved_x) > Math.abs(moved_y))
		{
			move_piece(1);
			draw_all();
		}
		last_x = evt.deltaX;
		last_y = evt.deltaY;
	}
	else if(moved_x < -board_width_px/10)
	{
		if(Math.abs(moved_x) > Math.abs(moved_y))
		{
			move_piece(-1);
			draw_all();
		}
		last_x = evt.deltaX;
		last_y = evt.deltaY;
	}
	// fast drop -- velocity in px/ms, convert to px/s
	if(evt.velocityY*1000 > board_height_px)
		drop_fast = true;
});
hammer.on("panend", function(evt){
	drop_fast = false;
});

hammer.get('swipe').set({ direction: Hammer.DIRECTION_DOWN });
hammer.on("swipe", function(evt){
	drop();
});

var hold_div = get("hold");
hammer.on('tap', function(evt){
	if(hold_div.contains(evt.target))
		swap_held_piece();
	else
		rotate();

	draw_all();
});

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
	draw_all();
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
