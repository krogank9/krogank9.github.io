function hookFunction(object, functionName, callback) {
    (function(originalFunction) {
        object[functionName] = function () {
            var returnValue = originalFunction.apply(this, arguments);

            callback.apply(this, [returnValue, originalFunction, arguments]);

            return returnValue;
        };
    }(object[functionName]));
}

hookFunction(window, "main_loop", function(){
	cur_lesson.think();
	update_cursor();
});

var need_call_placed = false;
hookFunction(window, "tick", function(){
	if(need_call_placed)
	{
		cur_lesson.placed();
		need_call_placed = false;
	}
});
hookFunction(window, "place_on_board", function(){
	need_call_placed = true;
});

var last_move = 0;
var dir = 1;
var incr = 0;
// instruction sets:
// moving left and right
var movement =
{
	help_text: "Drag left and right to move the piece",
	setup: function()
	{
		clear_game_board();
		show_cursor();
		set_cursor_pos( game_board_pos.x, game_board_pos.y + board_height_px/2 );
		set_cursor_dest(game_board_pos.x + board_width_px, game_board_pos.y + board_height_px/2, 2000 );
	},
	placed: function()
	{
		clear_game_board();
	},
	think: function()
	{
		var now = get_time();
		var elapsed = now - last_move;
		if(elapsed > 200)
		{
			last_move = now;
			move_piece(1*dir);
			incr++;
			if(incr > 10)
			{
				dir*=-1;
				incr = 0;
				set_cursor_dest(game_board_pos.x + (dir==1?board_width_px:0), game_board_pos.y + board_height_px/2, 2000 );
			}
		}
	},
};

// rotation
var rotation =
{
	help_text: "Tap to rotate the piece",
	setup: function()
	{
		reset();
		if(cur_pieces[0].type == pieces["O"])
			cur_pieces[0] = generate_piece("T");
			
		set_cursor_pos(game_board_pos.x + board_width_px/2, game_board_pos.y + board_height_px/2);
		
		hide_cursor();
	},
	placed: function()
	{
		clear_game_board();
		if(cur_pieces[0].type == pieces["O"])
			cur_pieces[0] = generate_piece("T");
			
		set_cursor_pos(game_board_pos.x + board_width_px/2, game_board_pos.y + board_height_px/2);
			
		hide_cursor();
	},
	think: function()
	{
		var now = get_time();
		var elapsed = now - last_move;
		if(elapsed > 1300)
			show_cursor();
		if(elapsed > 1500)
		{
			last_move = now;
			rotate();
			hide_cursor();
		}
	},
};

var drop_count = 0;
var last_drop = 0;
var set_dest = false;
var set_show = false;
// instant dropping
var instant_drop = 
{
	help_text: "Swipe down quickly to drop the piece",
	setup: function()
	{
		reset();
		last_drop = get_time();
		set_show = set_dest = false;
	},
	placed: function()
	{
		drop_count++;
		if(drop_count > 3)
		{
			clear_game_board();
			drop_count = 0;
		}
	},
	think: function()
	{
		var now = get_time();
		if( !set_show && now - last_drop > 2500 )
		{
			set_show = true;
			set_cursor_pos(game_board_pos.x + board_width_px/2, game_board_pos.y + board_height_px*0.25);
			show_cursor();
		}
		if( !set_dest && now - last_drop > 2800 )
		{
			set_dest = true;
			set_cursor_dest(game_board_pos.x + board_width_px/2, game_board_pos.y + board_height_px*0.75, 200);
		}
		if( now - last_drop > 3000 )
		{
			last_drop = now;
			drop();
			hide_cursor();
			set_dest = set_show = false;
		}
	}
}

var start_time = 0;
// fast dropping
var fast_drop = 
{
	help_text: "Swipe down and hold to drop fast",
	setup: function()
	{
		drop_count = 0;
		clear_game_board();
		start_time = get_time();
		
		hide_cursor();
		set_show = set_dest = false;
	},
	placed: function()
	{
		start_time = get_time();
		drop_count++;
		if(drop_count > 3)
		{
			reset();
			drop_count = 0;
		}
		
		hide_cursor();
		set_show = set_dest = false;
	},
	think: function()
	{
		var now = get_time();
		if( !set_show && now - start_time > 2500 )
		{
			set_show = true;
			set_cursor_pos(game_board_pos.x + board_width_px/2, game_board_pos.y + board_height_px*0.25);
			show_cursor();
		}
		if( !set_dest && now - start_time > 2800 )
		{
			set_dest = true;
			set_cursor_dest(game_board_pos.x + board_width_px/2, game_board_pos.y + board_height_px*0.75, 200);
		}
		if( now - start_time  > 3000 )
			drop_fast = true;
	}
}
//hold
var holding = 
{
	help_text: "Use the hold function to store a piece",
	setup: function()
	{
		reset();
		start_time = get_time();
		hide_cursor();
		set_show = false;
		incr = 0;
	},
	placed: function(){},
	think: function()
	{
		var now = get_time();
		if( !set_show && now - start_time > 2800 )
		{
			set_show = true;
			if(incr++%2==0)
				set_cursor_pos(hold_div_pos.x + hold_div_size.x/2, hold_div_pos.y + hold_div_size.y/2);
			else
				set_cursor_pos(paw_div_pos.x + paw_div_size.x/2, paw_div_pos.y + paw_div_size.y/2);
			show_cursor();
		}
		if( now - start_time > 3000 )
		{
			swap_held_piece();
			hide_cursor();
		}
		if( now - start_time > 7000 )
		{
			cycle_next_piece();
			held_piece = null;
			draw_all();
			start_time = now;
			set_show = false;
		}
	}
}
// 2 line clear
var board_state1 = '[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":9,"piece":"O","corners":0},{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":12,"piece":"O","corners":0}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":3,"piece":"O","corners":0},{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":6,"piece":"O","corners":0}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[1,0.42,0],[0.6699999999999999,0.2814,0],[0.75,0.315,0],[1,0.71,0.5]],"border":11,"piece":"L","corners":15},{"colors":[[1,0.42,0],[0.6699999999999999,0.2814,0],[0.75,0.315,0],[1,0.71,0.5]],"border":12,"piece":"L","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":15,"piece":"J","corners":15},{"colors":[[1,0.42,0],[0.6699999999999999,0.2814,0],[0.75,0.315,0],[1,0.71,0.5]],"border":7,"piece":"L","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.86,0,0.24],[0.5761999999999999,0,0.16079999999999997],[0.645,0,0.18],[0.9299999999999999,0.5,0.62]],"border":15,"piece":"Z","corners":15},{"colors":[[0.09,0.62,0.78],[0.06029999999999999,0.41539999999999994,0.5226],[0.0675,0.46499999999999997,0.585],[0.545,0.81,0.89]],"border":13,"piece":"I","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.64,0.18,0.86],[0.42879999999999996,0.12059999999999998,0.5761999999999999],[0.48,0.135,0.645],[0.8200000000000001,0.59,0.9299999999999999]],"border":13,"piece":"T","corners":15},{"colors":[[0.09,0.62,0.78],[0.06029999999999999,0.41539999999999994,0.5226],[0.0675,0.46499999999999997,0.585],[0.545,0.81,0.89]],"border":5,"piece":"I","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.64,0.18,0.86],[0.42879999999999996,0.12059999999999998,0.5761999999999999],[0.48,0.135,0.645],[0.8200000000000001,0.59,0.9299999999999999]],"border":5,"piece":"T","corners":15},{"colors":[[0.09,0.62,0.78],[0.06029999999999999,0.41539999999999994,0.5226],[0.0675,0.46499999999999997,0.585],[0.545,0.81,0.89]],"border":5,"piece":"I","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.64,0.18,0.86],[0.42879999999999996,0.12059999999999998,0.5761999999999999],[0.48,0.135,0.645],[0.8200000000000001,0.59,0.9299999999999999]],"border":7,"piece":"T","corners":15},{"colors":[[0.09,0.62,0.78],[0.06029999999999999,0.41539999999999994,0.5226],[0.0675,0.46499999999999997,0.585],[0.545,0.81,0.89]],"border":7,"piece":"I","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]]';
function load_state_small()
{
	reset();

	cur_pieces[0] = generate_piece("O");
	cur_pos.x = board_width-3;
	cur_pieces[1] = generate_piece("T");
	cur_pieces[2] = generate_piece("Z");
	cur_pieces[3] = generate_piece("L");
	cur_pieces[4] = generate_piece("S");
	
	draw_all();

	game_board = JSON.parse(board_state1);

	level = 10;
	score = 1100;
	update_score();
}
var small_clear = 
{
	help_text: "Stack rows to clear lines and earn points",
	placed: function()
	{
		load_state_small();
	},
	setup: function()
	{
		load_state_small();
		hide_cursor();
		draw_all();
	},
	think: function()
	{
	}
}

// 4 line clear
var board_state2 = '[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.09,0.62,0.78],[0.06029999999999999,0.41539999999999994,0.5226],[0.0675,0.46499999999999997,0.585],[0.545,0.81,0.89]],"border":11,"piece":"I","corners":15},{"colors":[[0.09,0.62,0.78],[0.06029999999999999,0.41539999999999994,0.5226],[0.0675,0.46499999999999997,0.585],[0.545,0.81,0.89]],"border":14,"piece":"I","corners":15},{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":11,"piece":"J","corners":15},{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":12,"piece":"J","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":13,"piece":"J","corners":15},{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":9,"piece":"O","corners":0},{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":12,"piece":"O","corners":0},{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":5,"piece":"J","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":5,"piece":"J","corners":15},{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":3,"piece":"O","corners":0},{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":6,"piece":"O","corners":0},{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":7,"piece":"J","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":3,"piece":"J","corners":15},{"colors":[[0.19,0.19,0.82],[0.1273,0.1273,0.5493999999999999],[0.14250000000000002,0.14250000000000002,0.615],[0.595,0.595,0.9099999999999999]],"border":14,"piece":"J","corners":15},{"colors":[[0.86,0,0.24],[0.5761999999999999,0,0.16079999999999997],[0.645,0,0.18],[0.9299999999999999,0.5,0.62]],"border":9,"piece":"Z","corners":15},{"colors":[[0.86,0,0.24],[0.5761999999999999,0,0.16079999999999997],[0.645,0,0.18],[0.9299999999999999,0.5,0.62]],"border":14,"piece":"Z","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.64,0.18,0.86],[0.42879999999999996,0.12059999999999998,0.5761999999999999],[0.48,0.135,0.645],[0.8200000000000001,0.59,0.9299999999999999]],"border":15,"piece":"T","corners":15},{"colors":[[0.86,0,0.24],[0.5761999999999999,0,0.16079999999999997],[0.645,0,0.18],[0.9299999999999999,0.5,0.62]],"border":11,"piece":"Z","corners":15},{"colors":[[0.86,0,0.24],[0.5761999999999999,0,0.16079999999999997],[0.645,0,0.18],[0.9299999999999999,0.5,0.62]],"border":6,"piece":"Z","corners":15},{"colors":[[0.02,0.67,0.17],[0.013399999999999999,0.44889999999999997,0.1139],[0.015,0.5025000000000001,0.1275],[0.51,0.835,0.585]],"border":13,"piece":"S","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.86,0,0.24],[0.5761999999999999,0,0.16079999999999997],[0.645,0,0.18],[0.9299999999999999,0.5,0.62]],"border":9,"piece":"Z","corners":15},{"colors":[[0.86,0,0.24],[0.5761999999999999,0,0.16079999999999997],[0.645,0,0.18],[0.9299999999999999,0.5,0.62]],"border":14,"piece":"Z","corners":15},{"colors":[[0.02,0.67,0.17],[0.013399999999999999,0.44889999999999997,0.1139],[0.015,0.5025000000000001,0.1275],[0.51,0.835,0.585]],"border":9,"piece":"S","corners":15},{"colors":[[0.02,0.67,0.17],[0.013399999999999999,0.44889999999999997,0.1139],[0.015,0.5025000000000001,0.1275],[0.51,0.835,0.585]],"border":6,"piece":"S","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[0.86,0,0.24],[0.5761999999999999,0,0.16079999999999997],[0.645,0,0.18],[0.9299999999999999,0.5,0.62]],"border":7,"piece":"Z","corners":15},{"colors":[[0.64,0.18,0.86],[0.42879999999999996,0.12059999999999998,0.5761999999999999],[0.48,0.135,0.645],[0.8200000000000001,0.59,0.9299999999999999]],"border":13,"piece":"T","corners":15},{"colors":[[0.02,0.67,0.17],[0.013399999999999999,0.44889999999999997,0.1139],[0.015,0.5025000000000001,0.1275],[0.51,0.835,0.585]],"border":7,"piece":"S","corners":15},{"colors":[[1,0.42,0],[0.6699999999999999,0.2814,0],[0.75,0.315,0],[1,0.71,0.5]],"border":13,"piece":"L","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":13,"piece":"O","corners":0},{"colors":[[0.64,0.18,0.86],[0.42879999999999996,0.12059999999999998,0.5761999999999999],[0.48,0.135,0.645],[0.8200000000000001,0.59,0.9299999999999999]],"border":1,"piece":"T","corners":15},{"colors":[[0.64,0.18,0.86],[0.42879999999999996,0.12059999999999998,0.5761999999999999],[0.48,0.135,0.645],[0.8200000000000001,0.59,0.9299999999999999]],"border":14,"piece":"T","corners":15},{"colors":[[1,0.42,0],[0.6699999999999999,0.2814,0],[0.75,0.315,0],[1,0.71,0.5]],"border":5,"piece":"L","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"colors":[[1,0.81,0.24],[0.6699999999999999,0.5427,0.16079999999999997],[0.75,0.6075,0.18],[1,0.905,0.62]],"border":7,"piece":"O","corners":0},{"colors":[[0.64,0.18,0.86],[0.42879999999999996,0.12059999999999998,0.5761999999999999],[0.48,0.135,0.645],[0.8200000000000001,0.59,0.9299999999999999]],"border":7,"piece":"T","corners":15},{"colors":[[1,0.42,0],[0.6699999999999999,0.2814,0],[0.75,0.315,0],[1,0.71,0.5]],"border":11,"piece":"L","corners":15},{"colors":[[1,0.42,0],[0.6699999999999999,0.2814,0],[0.75,0.315,0],[1,0.71,0.5]],"border":6,"piece":"L","corners":15}],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]]';
function load_state_big()
{
	reset();

	cur_pieces[0] = generate_piece("I");
	rotate();
	cur_pos.x = board_width-2;
	cur_pieces[1] = generate_piece("T");
	cur_pieces[2] = generate_piece("Z");
	cur_pieces[3] = generate_piece("L");
	cur_pieces[4] = generate_piece("S");

	draw_all();
	
	game_board = JSON.parse(board_state2);

	level = 10;
	score = 13200;
	update_score();
}
var big_clear = 
{
	help_text: "Clear 4 lines at once for max points",
	placed: function()
	{
		load_state_big();
	},
	setup: function()
	{
		load_state_big();
		hide_cursor();
		draw_all();
	},
	think: function()
	{
	}
}

var cur_lesson;
var help_text = get("help_text");
function next_lesson()
{
	if(lesson_num >= lesson_list.length)
		window.location.href = "main_menu.html";
	cur_lesson = window[ lesson_list[lesson_num++] ];
	cur_lesson.setup();
	
	help_text.innerHTML = cur_lesson.help_text;
}

var cursor;
var c_size;
function setup_cursor()
{
	cursor = get("cursor")
	c_size = Math.round(get("hold").offsetWidth*0.6);
	cursor.style.width = c_size + "px";
	cursor.style.height = c_size + "px";
}
function show_cursor() {cursor.style.visibility = "visible"}
function hide_cursor() {cursor.style.visibility = "hidden"}

var c_moving = false;

var c_start = 0;
var c_start_pos = {x: 0, y: 0};

var c_end = 0;
var c_end_pos = {x: 0, y: 0};

var c_travel = {x: 0, y: 0};

var c_time = 0;

var c_pos = {x: 0, y: 0}
function set_cursor_dest(x, y, ms)
{
	c_start = get_time();
	c_end = c_start + ms;
	
	c_start_pos.x = c_pos.x;
	c_start_pos.y = c_pos.y;
	
	c_end_pos.x = x;
	c_end_pos.y = y;
	
	c_time = c_end - c_start;
	
	c_travel.x = c_end_pos.x - c_start_pos.x;
	c_travel.y = c_end_pos.y - c_start_pos.y;
	
	c_moving = true;
}
function set_cursor_pos(x,y,moving)
{
	c_moving = moving || false;
	c_pos.x = x;
	c_pos.y = y;
	
	cursor.style.left = Math.round(c_pos.x - c_size/2) + "px";
	cursor.style.top = Math.round(c_pos.y - c_size/2) + "px";
}
function update_cursor()
{
	if(!c_moving)
		return;
		
	var now = get_time();
	var percent_finished = (now - c_start)/c_time;
	if(percent_finished > 1)
		percent_finished = 1;
	
	var add_x = percent_finished * c_travel.x;
	var add_y = percent_finished * c_travel.y;
	
	set_cursor_pos(c_start_pos.x + add_x, c_start_pos.y + add_y, true);
	
	if(percent_finished == 1)
		c_moving = false;
}

var cumulativeOffset = function(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {
        y: top,
        x: left
    };
};
var game_board_pos;
var hold_div_pos;
var hold_div_size = {x:0, y: 0};
var paw_div_pos;
var paw_div_size  = {x:0, y: 0};
hookFunction(window, "onload", function(){
	setup_cursor();
	hide_cursor();
	
	game_board_pos = cumulativeOffset(get("board_canvas"));
	hold_div_pos = cumulativeOffset(get("hold"));
	paw_div_pos = cumulativeOffset(get("paw_div"));
	hold_div_size.x = get("hold").offsetWidth;
	hold_div_size.y = get("hold").offsetHeight;
	paw_div_size.x = get("paw_div").offsetWidth;
	paw_div_size.y = get("paw_div").offsetHeight;
	
	next_lesson();
});

var lesson_list = [
	"movement", "rotation", "holding", "instant_drop", "fast_drop", "small_clear", "big_clear"
];
var lesson_num = 0;
