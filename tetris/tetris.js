var webaudio = new WebAudio();
var click_sound = webaudio.createSound();
click_sound.load("click1.wav");

window.onload = function()
{
	load_highscore();
	init_layout();
	init_pieces();
	
	reset();
	draw_all();
	requestAnimationFrame(main_loop);
}

var game_board;
var level = 0, score = 0;
var max_level = 20;
var paused = false;

var score_text = get("score_text");
function update_score()
{
	score_text.innerHTML = "SCORE "+numberWithCommas(score)+"<br>LEVEL "+level;
}

function hide_overlays()
{
	pause_div.style.visibility = "hidden";
	highscore_div.style.visibility = "hidden";
	ask_exit_overlay.style.visibility = "hidden";
	ask_restart_overlay.style.visibility = "hidden";
}

var pause_div = get("pause_overlay");
function toggle_pause()
{
	if(!paused)
	{
		paused = true;
		show_pause();
	}
	else if(paused)
	{
		paused = false;
		hide_overlays();
	}
}
function unpause() { if(paused) toggle_pause() }
function pause() { if(!paused) toggle_pause() }

function save_highscore()
{
	if(typeof(Storage) === "undefined" || !localStorage)
		return;

	localStorage.setItem("catris_highscore", highscore);
}
function load_highscore()
{
	if(typeof(Storage) === "undefined" || !localStorage)
		return;

	highscore = localStorage.catris_highscore || 0;
}

var highscore = 0;
var highscore_div = get("highscore_overlay");
var highscore_span = get("highscore_span");
var yourscore_span = get("yourscore_span");

function show_highscore()
{
	hide_overlays();
	
	paused = true;
	if(score > highscore)
	{
		highscore = score;
		save_highscore();
	}
	yourscore_span.innerHTML = "YOUR SCORE<br>"+numberWithCommas(score);
	highscore_span.innerHTML = "HIGH SCORE<br>"+numberWithCommas(highscore);
	highscore_div.style.visibility = "visible";
}

var ask_exit_overlay = get("ask_exit_overlay");
function show_ask_exit()
{
	hide_overlays();
	ask_exit_overlay.style.visibility = "visible";
}
var ask_restart_overlay = get("ask_restart_overlay");
function show_ask_restart()
{
	hide_overlays();
	ask_restart_overlay.style.visibility = "visible";
}
function show_pause()
{
	hide_overlays();
	pause_div.style.visibility = "visible";
}

var max_speed = 50;
var min_speed = 750;

var place_delay = min_speed;

var drop_fast = false;
function get_tick_speed() {
	var speed = min_speed - (min_speed-max_speed) * (level/max_level);
	if(drop_fast)
		speed = max_speed/1.5;
	return speed;
}

var tick_gap = 250;
var tick_gap_fast = 50;
var last_tick = Date.now();
function tick()
{
	last_tick = Date.now();
	
	if(check_touching_bottom())
	{
		var result = place_on_board(cur_piece);
		drop_fast = false;
		
		if(!result)
		{
			show_highscore();
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

var window_focus = true;
window.onfocus = function(){window_focus = true; draw_all(); init_layout();}
window.onblur = function(){window_focus = false; }
function main_loop()
{
	var now = Date.now();
	var elapsed = now - last_tick;
	
	var tick_gap = check_touching_bottom() ? place_delay : get_tick_speed();

	if( window_focus && elapsed > tick_gap && !paused )
		tick();
		
	requestAnimationFrame(main_loop);
}
