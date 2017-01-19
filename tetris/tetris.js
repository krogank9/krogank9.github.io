function get_time() { return (new Date()).getTime(); }

var leader_board = [
	["     ", 0],
	["     ", 0],
	["     ", 0],
	["     ", 0],
	["     ", 0],
	["     ", 0],
	["     ", 0],
	["     ", 0],
	["     ", 0],
	["     ", 0]
];
function show_leaderboard()
{
}

var game_board;
var level = 0, score = 0;
var max_level = 20;
var paused = false;

var score_text = get("score_text");
function update_score()
{
	function numberWithCommas(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
	score_text.innerHTML = "SCORE "+numberWithCommas(score)+"<br>LEVEL "+level;
}

var muted = false;
var sound_img = get("sound_img");
function toggle_mute()
{
	if(!muted)
	{
		muted = true;
		sound_img.src = "res/sound_off.png";
	}
	else if(muted)
	{
		muted = false;
		sound_img.src = "res/sound_on.png";
	}
}

var pause_div = get("pause_overlay");
function toggle_pause()
{
	if(!paused)
	{
		paused = true;
		pause_div.style.visibility = "visible";
	}
	else if(paused)
	{
		paused = false;
		pause_div.style.visibility = "hidden";
	}
}

var max_speed = 50;
var min_speed = 750;

var place_delay = min_speed;

var drop_fast = false;
function get_tick_speed() {
	var speed = min_speed - (min_speed-max_speed) * (level/max_level);
	if(drop_fast)
		speed = max_speed;
	return speed;
}

var tick_gap = 250;
var tick_gap_fast = 50;
var last_tick = get_time();
function tick()
{
	last_tick = get_time();
	
	if(check_touching_bottom())
	{
		var result = place_on_board(cur_piece);
		drop_fast = false;
		
		if(!result)
		{
			alert("game over");
			for(var x=0; x<board_width; x++)
			{
				for(var y=0; y<board_height; y++)
				{
					game_board[x][y] = null;
				}
			}
			score = 0;
			update_score();
			reset();
		}
		cycle_next_piece();
		
		draw_next();
	}
	else
	{	
		cur_pos.y += 1;
	}
	
	draw_board();
}

function init()
{
	init_pieces();
	reset();
	draw_all();
	requestAnimationFrame(main_loop);
}

var window_focus = true;
window.onfocus = function(){window_focus = true}
window.onblur = function(){window_focus = false}
function main_loop()
{
	var now = get_time();
	var elapsed = now - last_tick;
	
	var tick_gap = check_touching_bottom() ? place_delay : get_tick_speed();

	if( window_focus && elapsed > tick_gap && !paused )
		tick();
		
	requestAnimationFrame(main_loop);
}
