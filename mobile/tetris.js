// music ideas for the game, probably going to use keygen music
// https://www.youtube.com/watch?v=cYkaG5CT53I
//
// 0:00
// slow music: 39:43, 1:20:26, 1:27:38
// medium music: 38:52, 48:40, 1:22:02, 1:24:33
// fast music: 15:27, 21:56
//
// https://www.youtube.com/watch?v=N5vt4c3pREk
//
// slow music: 0:00
//


function preload() {
	 game.load.bitmapFont('sans', 'sans.png', 'sans.xml');
}

var board_width = 10;
var board_height = 20;
var spacing = mobilecheck() ? 2:1;
var scale = 30; //block size in px
var offset = {x:0, y:0};
var game_board;

var score = 0;
var level = 0;
var score_text, hold_text, next_text;
var font_size = 0;

//percents of the screen left surrounding the game board
var top_pad = 0.1;
var bottom_pad = 0.025;
var side_pad = 0.3;

// maximum width and height the board can take up
var board_spacing_y = window.innerHeight*(1.0 - bottom_pad - top_pad);
var board_spacing_x = window.innerHeight*(1.0 - side_pad*2);
var board_padding = 0.02 * board_spacing_y;
scale = Math.floor((board_spacing_y - board_padding*2)/board_height)-spacing;
if((scale+spacing)*board_width > board_spacing_x)
	scale = Math.floor((board_spacing_x - board_padding*2)/board_width)-spacing;
	
var side_pad_px = window.innerWidth * side_pad;
var right_pad_pos = side_pad_px + board_spacing_x;

offset.y = Math.floor(window.innerHeight*top_pad + board_padding);
var calc_width = (scale+spacing)*board_width;
var calc_height = (scale+spacing)*board_height;
offset.x = Math.floor(window.innerWidth/2 - calc_width/2 + board_padding);

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'phaser-container', { preload: preload, create: create, update: update, render: render });
var graphics;

function get_time() { return (new Date()).getTime(); }
function update_score() { score_text.text = "SCORE\n"+score; }

var down_key;

function create() {
	graphics = game.add.graphics(0, 0);
	game.stage.backgroundColor = "#161674";
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
    score_text = game.add.bitmapText(0, 0, 'sans', "SCORE\n0",font_size);
	hold_text = game.add.bitmapText(0, offset.y, 'sans', "HOLD",font_size);
    next_text = game.add.bitmapText(0, offset.y, 'sans', "NEXT",font_size);
    
    // adjust text size till it fits around the edges
    while(font_size*6 > side_pad_px*0.9 || font_size*2 > offset.y*0.8)
		score_text.fontSize = next_text.fontSize = hold_text.fontSize = --font_size;
		
	score_text.anchor.x = 0.5;
	next_text.anchor.x = 0;
	hold_text.anchor.x = 1.0;
	score_text.align = next_text.align = hold_text.align = "center";
	
	score_text.position.set(game.world.centerX, offset.y/2 - font_size);
	hold_text.position.set(offset.x-font_size/2,offset.y);
	next_text.position.set(offset.x+calc_width+font_size/2,offset.y);

	init();
	
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
		case k.H:
			swap_held_piece();
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
}

function render() {
	graphics.clear();
	var width = board_width*(scale+spacing)-spacing;
	var height = board_height*(scale+spacing)-spacing;
	var border_rad = border_radius*scale;

	// draw gameboard background
	graphics.beginFill(0x3131a4);
	graphics.drawRoundedRect(offset.x - board_padding, offset.y - board_padding, width + board_padding*2, height + board_padding*2, border_rad);
	graphics.endFill();

	graphics.beginFill(0);
	graphics.drawRect(offset.x, offset.y, width, height);
	graphics.endFill();
	
	graphics.beginFill( fade(0x333333,0.75) );
	for(var x=1; x<board_width; x++)
		graphics.drawRect(offset.x  + x*(spacing+scale) - spacing,offset.y,spacing,height);
	for(var y=1; y<board_height; y++)
		graphics.drawRect(offset.x,offset.y + y*(spacing+scale) - spacing,width,spacing);
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

	var tmp = cur_pos.y;
	while(check_touching_bottom() == false)
		cur_pos.y++;
	var ghost_y = cur_pos.y;
	cur_pos.y = tmp;
	
	// draw the current piece and the ghost of where it will land
	cur_piece().loop_blocks(function(block, x, y){
		var world_x = cur_pos.x + x;
		var world_y = cur_pos.y + y;
		
		var px_x = world_x*(spacing+scale) + offset.x;
		var px_y = world_y*(spacing+scale) + offset.y;

		var ghost_world_y = ghost_y + y;
		var ghost_px_y = ghost_world_y*(spacing+scale) + offset.y;

		if(ghost_world_y >= 0)
			draw_block(block, px_x, ghost_px_y,scale,ghost_colors);
		if(world_y >= 0)
			draw_block(block, px_x, px_y,scale);
	});
	
	var box_size = font_size*3;
	var preview_scale = Math.floor(box_size/4 * 0.9); //fit 4 blocks inside preview *0.9 for padding
	var v_spacer = font_size/2;
	var side_offset_y = offset.y+font_size*1.5;
	
	// draw the preview of the next pieces
	for(var i=1; i<cur_pieces.length; i++)
	{
		var start_x = offset.x+calc_width+font_size/2;
		var start_y = side_offset_y + (box_size)*(i-1) + (i>1?v_spacer:0);
		graphics.beginFill(0);
		graphics.drawRoundedRect(start_x,start_y,box_size,box_size,border_rad);
		if(i > 1 && i < (cur_pieces.length-1) )
			graphics.drawRect(start_x,start_y+border_rad,box_size,box_size); //unround bottom edges
		graphics.endFill();

		var cur = cur_piece(i);

		// calculate where the midpoint of the piece will be for centering
		var mid_x = (cur.top_left.x + cur.bottom_right.x)/2 + 0.5;
		var mid_y = (cur.top_left.y + cur.bottom_right.y)/2 + 0.5;
		mid_x *= spacing + preview_scale;
		mid_y *= spacing + preview_scale;

		start_x += box_size/2 - mid_x;
		start_y += box_size/2 - mid_y;
		cur.loop_blocks(function(block, x, y){
			var px_x = start_x + x*(spacing+preview_scale);
			var px_y = start_y + y*(spacing+preview_scale);
			draw_block(block, Math.floor(px_x), Math.floor(px_y), preview_scale);
		});
	}
	
	// draw the held piece
	var start_x = offset.x-font_size/2-box_size;
	var start_y = side_offset_y;
	graphics.beginFill(0);
	graphics.drawRoundedRect(start_x,start_y,box_size,box_size,border_rad);
	graphics.endFill();
	var held = held_piece && held_piece.type[held_piece.rotation];
	if(held)
	{
		var mid_x = (held.top_left.x + held.bottom_right.x)/2 + 0.5;
		var mid_y = (held.top_left.y + held.bottom_right.y)/2 + 0.5;
		mid_x *= spacing + preview_scale;
		mid_y *= spacing + preview_scale;
		
		start_x += box_size/2 - mid_x;
		start_y += box_size/2 - mid_y;

		held.loop_blocks(function(block, x, y) {	
			var px_x = start_x + x*(spacing+preview_scale);
			var px_y = start_y + y*(spacing+preview_scale);
			draw_block(block, Math.floor(px_x), Math.floor(px_y), preview_scale);
		});
	}
}
