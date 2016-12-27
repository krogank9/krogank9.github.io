
function preload() {
}

var board_width = 10;
var board_height = 20;
var spacing = 1;
var scale = 30; //block size in px
var offset = {x:0, y:0};
var game_board;

var game = new Phaser.Game(board_width*(scale + spacing)-1, board_height*(scale + spacing)-1, Phaser.AUTO, 'phaser-container', { preload: preload, create: create, update: update, render: render });

var graphics;

function get_time() { return (new Date()).getTime(); }


var down_key;

function create() {
	graphics = game.add.graphics(0, 0);
	
	game_board = new Array(board_width);
	for(let x=0; x<game_board.length; x++)
	{
		game_board[x] = new Array(board_height);
		for(let y=0; y<game_board[0].length; y++)
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

function draw_border(x,y,width,height,thickness,border_mask,corner_mask)
{
	function draw_corner(x,y){ graphics.drawRect(x,y,thickness,thickness) }

	if(corner_mask & block_corners["TOP_LEFT"])
		draw_corner(x,y);
	if(corner_mask & block_corners["TOP_RIGHT"])
		draw_corner(x+width-thickness,y);
	if(corner_mask & block_corners["BOTTOM_RIGHT"])
		draw_corner(x+width-thickness,y+height-thickness);
	if(corner_mask & block_corners["BOTTOM_LEFT"])
		draw_corner(x,y+height-thickness);
		
	if(border_mask & block_border["TOP"])
		graphics.drawRect(x,y,width,thickness);
	if(border_mask & block_border["LEFT"])
		graphics.drawRect(x,y,thickness,height);
	if(border_mask & block_border["BOTTOM"])
		graphics.drawRect(x,y+height-thickness,width,thickness);
	if(border_mask & block_border["RIGHT"])
		graphics.drawRect(x+width-thickness,y,thickness,height);
}

function draw_block(block,x,y)
{
	var board_x = x;
	var board_y = y;
	// get the screen pos
	x *= scale;
	y *= scale;
	x += offset.x;
	y += offset.y;
	
	
	//some code to deal with the 1px spacing between blocks
	var mask = block.border;
	var right = mask & block_border["RIGHT"];
	var left = mask & block_border["LEFT"];
	var top = mask & block_border["TOP"];
	var bottom = mask & block_border["BOTTOM"];

	x += board_x*spacing;
	y += board_y*spacing;
	//border thickness
	var thickness = 3;

	function dr(x,y,width,height,col){ graphics.beginFill(col);graphics.drawRect(x,y,width,height);graphics.endFill(); }
	var is_square = block.color == shape_colors["SQUARE"];
	// fill in the spots between the spacing
	if(!right)
	{
		//grid
		dr(x+scale,y,spacing,scale,block.border_color);

		// connect corners and borders, square is a special case
		if(!is_square || top|right)
			dr(x+scale,y,spacing,thickness,0xFFFFFF);//top right
		if(!is_square || bottom|right)
			dr(x+scale,y+scale-thickness,spacing,thickness,0xFFFFFF);//bottom right
	}
	if(!bottom)
	{
		//grid
		dr(x,y+scale,scale,spacing,block.border_color);

		// connect corners and borders, square is a special case
		if(!is_square || bottom|left)
			dr(x,y+scale,thickness,spacing,0xffffff);//bottom left
		if(!is_square || bottom|right)
			dr(x+scale-thickness,y+scale,thickness,spacing,0xffffff);//bottom right
	}
	if(!bottom && !right)
	{
		dr(x+scale,y+scale,spacing,spacing,block.border_color);
	}
	
	// draw the block
	dr(x,y,scale,scale,block.color);
	// draw the border
	graphics.beginFill(0xffffff);
	draw_border(x,y,scale,scale,thickness,block.border,block.corners);
	graphics.endFill();
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
			for(let x=0; x<board_width; x++)
			{
				for(let y=0; y<board_height; y++)
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
	// draw the gameboard
	for(let x=0; x<board_width; x++)
	{
		for(let y=0; y<board_height; y++)
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
