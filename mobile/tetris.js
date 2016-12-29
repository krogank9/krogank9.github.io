
function preload() {
	 game.load.bitmapFont('lcd14', 'lcd14.png', 'lcd14.xml');
}

var board_width = 10;
var board_height = 20;
var spacing = 1;
var scale = 30; //block size in px
var offset = {x:0, y:0};
var game_board;

var score = 0;
var score_text, hold_text, next_text;
var font_size = 0;

//percents of the screen left surrounding the game board
var top_pad = 0.1;
var bottom_pad = 0.025;
var side_pad = 0.25;

// maximum width and height the board can take up
var board_spacing_y = window.innerHeight*(1.0 - bottom_pad - top_pad);
var board_spacing_x = window.innerHeight*(1.0 - side_pad*2);
scale = Math.floor(board_spacing_y/board_height)-spacing;
if((scale+spacing)*board_width > board_spacing_x)
	scale = Math.floor(board_spacing_x/board_width)-spacing;
	
var side_pad_px = window.innerWidth * side_pad;
var right_pad_pos = side_pad_px + board_spacing_x;

offset.y = Math.floor(window.innerHeight*top_pad);
var calc_width = (scale+spacing)*board_width;
var calc_height = (scale+spacing)*board_height;
offset.x = Math.floor(window.innerWidth/2 - calc_width/2);

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'phaser-container', { preload: preload, create: create, update: update, render: render });
var graphics;

function get_time() { return (new Date()).getTime(); }
function update_score() { score_text.text = "SCORE\n"+score; }

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

	font_size = Math.floor(offset.y);
    score_text = game.add.bitmapText(0, 0, 'lcd14', "SCORE\n0",font_size);
	hold_text = game.add.bitmapText(0, offset.y, 'lcd14', " HOLD ",font_size);
    next_text = game.add.bitmapText(0, offset.y, 'lcd14', " NEXT ",font_size);
    
    // adjust text size till it fits around the edges
    while(font_size*0.8*6 > side_pad_px*0.9 || font_size*2 > offset.y*0.8)
		score_text.fontSize = next_text.fontSize = hold_text.fontSize = --font_size;
		
	score_text.anchor.x = 0.5;
	hold_text.anchor.x = 1.0;
	score_text.align = next_text.align = hold_text.align = "center";
	
	score_text.position.set(game.world.centerX, offset.y/2 - font_size);
	var pad = (side_pad_px - font_size*0.8*4)/2;
	hold_text.position.set(offset.x,offset.y);
	next_text.position.set(offset.x+calc_width,offset.y);

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
	graphics.drawRect(offset.x, offset.y, board_width*(scale+spacing)-spacing, board_height*(scale+spacing)-spacing);
	graphics.endFill();
	// draw the gameboard
	for(var x=0; x<board_width; x++)
	{
		for(var y=0; y<board_height; y++)
		{
			var px_x = x*(spacing+scale) + offset.x;
			var px_y = y*(spacing+scale) + offset.y;
			if(game_board[x][y] != null)
				draw_block(game_board[x][y],px_x,px_y,scale);
		}
	}
	// and draw the current piece
	cur_piece().loop_blocks(function(block, x, y){
		var world_x = cur_pos.x + x;
		var world_y = cur_pos.y + y;
		px_x = world_x*(spacing+scale) + offset.x;
		px_y = world_y*(spacing+scale) + offset.y;
		
		if(world_y >= 0)
			draw_block(block, px_x, px_y,scale);
	});
}
