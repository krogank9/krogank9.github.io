function get_time() { return (new Date()).getTime(); }

var game_board;
var level = 0, score = 0;
var max_level = 20;

var score_text = get("score_text");
function update_score()
{
	score_text.innerHTML = "SCORE: "+score+"<br>LEVEL "+level;
}

window.onkeydown = function(evt)
{
	switch(evt.keyCode)
	{
		case 37: //left
			move_left();
			break;
		case 39: //right
			move_right();
			break;
		case 38: // up
			rotate();
			break;
		case 40: //down
			drop();
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
	if(evt.keyCode == 40 && dropping)
	{
		dropping = false;
		clearTimeout(tick_timeout);
		setTimeout(tick, get_tick_speed());
	}
}

var max_speed = 100;
var min_speed = 500;
function get_tick_speed() { return min_speed - (min_speed-max_speed) * (level/max_level); }

var dropping = false;

var tick_gap = 250;
var tick_gap_fast = 50;
var last_tick = get_time();
function tick()
{
	last_tick = get_time();
	
	if(check_touching_bottom())
	{
		var result = place_on_board(cur_piece);
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
	}
	else
	{	
		cur_pos.y += 1;
	}
	
	draw_all();
}

function init()
{
	init_pieces();
	reset();
	draw_all();
	requestAnimationFrame(main_loop);
}

function main_loop()
{
	var now = get_time();
	if( now - last_tick > get_tick_speed() )
	{
		tick();
	}
	requestAnimationFrame(main_loop);
}
