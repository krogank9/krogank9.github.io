var hammer = new Hammer(get("touch_area"));

var last_x = 0;
var last_y = 0;
hammer.on("panstart", function(evt) {
	last_x = 0;
	last_y = 0;
});

hammer.on("panmove", function(evt) {
	var moved_x = evt.deltaX - last_x;
	var moved_y = evt.deltaY - last_y;
	if(moved_x > board_width_px/10)
	{
		if(Math.abs(moved_x) > Math.abs(moved_y))
		{
			move_right();
			draw_all();
		}
		last_x = evt.deltaX;
		last_y = evt.deltaY;
	}
	else if(moved_x < -board_width_px/10)
	{
		if(Math.abs(moved_x) > Math.abs(moved_y))
		{
			move_left();
			draw_all();
		}
		last_x = evt.deltaX;
		last_y = evt.deltaY;
	}
});

hammer.get('swipe').set({ direction: Hammer.DIRECTION_DOWN });
hammer.on("swipe", function(evt){
	drop();
});

var hold_div = get("hold");
get("touch_area").onclick = function(evt) {
	
	if(hold_div.contains(evt.target))
		swap_held_piece();
	else
		rotate();

	draw_all();
};
