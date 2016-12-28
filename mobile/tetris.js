
function preload() {
}

var board_width = 10;
var board_height = 20;
var spacing = 1;
var scale = 30; //block size in px
var offset = {x:0, y:0};
var game_board;

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'phaser-container', { preload: preload, create: create, update: update, render: render });

var graphics;

function get_time() { return (new Date()).getTime(); }


var down_key;

function create() {
	graphics = game.add.graphics(0, 0);
	
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

function draw_border(x,y,width,height,thickness,border_mask,corner_mask,top_color,bottom_color,is_square)
{
	function dr(x,y,width,height,col){ graphics.beginFill(col);graphics.drawRect(x,y,width,height);graphics.endFill(); }
	function draw_corner(x,y,col){ dr(x,y,thickness,thickness,col) }
		
	if(corner_mask & block_corners["TOP_LEFT"])
		draw_corner(x,y,bottom_color);
	if(corner_mask & block_corners["TOP_RIGHT"])
		draw_corner(x+width-thickness,y,top_color);
	if(corner_mask & block_corners["BOTTOM_RIGHT"])
		draw_corner(x+width-thickness,y+height-thickness,top_color);
	if(corner_mask & block_corners["BOTTOM_LEFT"])
		draw_corner(x,y+height-thickness,bottom_color);
		
	var top = border_mask & block_border["TOP"];
	var left = border_mask & block_border["LEFT"];
	var bottom = border_mask & block_border["BOTTOM"];
	var right = border_mask & block_border["RIGHT"];
	
	if(top)
		dr(x,y,width,thickness,top_color);
	if(left)
		dr(x,y,thickness,height,bottom_color);
	if(bottom)
		dr(x,y+height-thickness,width,thickness,bottom_color);
	if(right)
		dr(x+width-thickness,y,thickness,height,top_color);
		
	function draw_slant(x,y,top,bottom) {
		for(var x1=0;x1<thickness;x1++)
			for(var y1=0;y1<thickness;y1++)
				dr(x+x1,y+y1,1,1,x1>y1?top:bottom);
	}
	// draw the slanted edges for 3d effect
	if(left&&top)
		draw_slant(x,y,top_color,bottom_color);
	if(right&&bottom)
		draw_slant(x+width-thickness,y+height-thickness,top_color,bottom_color);

	if(!is_square && !(left|top))
		draw_slant(x,y,bottom_color,top_color);
	if(!is_square && !(right|bottom))
		draw_slant(x+width-thickness,y+height-thickness,bottom_color,top_color);
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
	
	var color = block.colors[0];
	var border_color = block.colors[1];
	var bottom_edge_color = block.colors[2];
	var top_edge_color = block.colors[3];

	function dr(x,y,width,height,col){ graphics.beginFill(col);graphics.drawRect(x,y,width,height);graphics.endFill(); }
	var is_square = color == shape_colors["SQUARE"];
	// fill in the spots between the spacing
	if(!right)
	{
		//grid
		dr(x+scale,y,spacing,scale,border_color);

		// connect corners and borders, square is a special case
		if(!is_square || top|right)
			dr(x+scale,y,spacing,thickness,top_edge_color);//top right
		if(!is_square || bottom|right)
			dr(x+scale,y+scale-thickness,spacing,thickness,bottom_edge_color);//bottom right
	}
	if(!bottom)
	{
		//grid
		dr(x,y+scale,scale,spacing,border_color);

		// connect corners and borders, square is a special case
		if(!is_square || bottom|left)
			dr(x,y+scale,thickness,spacing,bottom_edge_color);//bottom left
		if(!is_square || bottom|right)
			dr(x+scale-thickness,y+scale,thickness,spacing,top_edge_color);//bottom right
	}
	if(is_square && !bottom && !right)
	{
		dr(x+scale,y+scale,spacing,spacing,border_color);
	}
	
	// draw the block
	dr(x,y,scale,scale,color);
	// draw the border
	draw_border(x,y,scale,scale,thickness,block.border,block.corners,top_edge_color,bottom_edge_color,is_square);
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
