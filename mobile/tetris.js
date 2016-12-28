
function preload() {
}

var board_width = 10;
var board_height = 20;
var spacing = 1;
var scale = 30; //block size in px
var offset = {x:0, y:0};
var game_board;

//percents of the screen left surrounding the game board
var top_pad = 0.15;
var bottom_pad = 0.05;
var left_pad = 0.15;
var right_pad = 0.15;


// maximum width and height the board can take up
var board_spacing_y = window.innerHeight*(1.0 - bottom_pad - top_pad);
var board_spacing_x = window.innerHeight*(1.0 - left_pad - right_pad);
scale = Math.floor(board_spacing_y/board_height)-1;
if((scale+spacing)*board_width > board_spacing_x)
	scale = Math.floor(board_spacing_x/board_height)-1;

offset.y = window.innerHeight*top_pad;
var calc_width = (scale+spacing)*board_width;
offset.x = Math.floor(window.innerWidth/2 - calc_width/2);

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'phaser-container', { preload: preload, create: create, update: update, render: render });
var graphics;

function get_time() { return (new Date()).getTime(); }

var down_key;

function create() {
	graphics = game.add.graphics(0, 0);
	game.stage.backgroundColor = "#304d66";
	game_board = new Array(board_width);
	for(var x=0; x<game_board.length; x++)
	{
		game_board[x] = new Array(board_height);
		for(var y=0; y<game_board[0].length; y++)
		{
			game_board[x][y] = null;
		}
	}

	init();
	new_rand_piece();
	
	game.input.keyboard.onDownCallback = key_pressed;
	down_key = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
}

function key_pressed(evt)
{
	var k = Phaser.Keyboard;
	switch(evt.keyCode)
	{
		case k.UP:
			rotate();
			break;
		case k.LEFT:
			move_left();
			break;
		case k.RIGHT:
			move_right();
			break;
	}
}

function update() {
	var time = get_time();
	if(time - last_tick > tick_gap)
	{
		tick();
	}
	else if(check_touching_bottom() == false && down_key.isDown && (time - last_tick) > tick_gap_fast )
	{
		tick();
	}
}

// move piece down screen, place piece & check for any lines to clear
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
		}
		new_rand_piece();
	}
	else
	{	
		cur_pos.y += 1;
	}
}

function render() {
	graphics.clear();
	// draw gameboard background
	graphics.beginFill(0);
	graphics.drawRect(offset.x, offset.y, board_width*(scale+spacing), board_height*(scale+spacing)-1);
	graphics.endFill();
	// draw the gameboard
	for(var x=0; x<board_width; x++)
	{
		for(var y=0; y<board_height; y++)
		{
			if(game_board[x][y] != null)
				draw_block(game_board[x][y],x,y);
		}
	}
	// and draw the current piece
	cur_piece().loop_blocks(function(block, x, y){
		var world_x = cur_pos.x + x;
		var world_y = cur_pos.y + y;
		draw_block(block, world_x, world_y);
	});
}
