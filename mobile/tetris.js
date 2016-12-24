var game = new Phaser.Game(800, 600, Phaser.WEBGL, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {
}

var board_width = 10;
var board_height = 20;
var scale = 20; //block size in px
var offset = {x:0, y:0};
var game_board;

var graphics;

var shape_names = ["SQUARE", "L", "L_BACKWARDS", "S", "Z", "T", "I"];
function random_shape() { return shape_names[Math.floor(Math.random()*shape_names.length)]; }
var block_color = {"SQUARE":0xBBBB00, "L":0xBB3700, "L_BACKWARDS":0x0000BB, "S":0x00BB00, "Z":0xBB0000, "T":0xBB00BB, "I":0x3737BB}
var shapes = {
	"SQUARE":[[1,1],[1,1]],
	"L":[[1,1,1],[0,0,1]],
	"L_BACKWARDS":[[0,0,1],[1,1,1]],
	"S":[[0,1],[1,1],[1,0]],
	"Z":[[1,0],[1,1],[0,1]],
	"T":[[1,0],[1,1],[1,0]],
	"I":[[1,1,1,1]]
}
//bit flags for borders
var block_border = {"TOP":1, "RIGHT":2, "BOTTOM":4, "LEFT":8, "ALL":1|2|4|8, "NONE":0} //bit flags

var cur_piece;

function get_time() { return (new Date()).getTime(); }

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
	cur_piece = new piece(random_shape());
	
	// resize the drawing scale so the game board fits on screen
	scale = game.renderer.height/board_height;
}

function update() {
	if(get_time() - last_tick > tick_gap)
		tick();
}

function piece(shape_name)
{
	var shape = shapes[shape_name];
	this.width = shape.length;
	this.height = shape[0].length;
	this.x = 5;
	this.y = this.height * -1;
	// populate blocks array
	this.blocks = new Array(this.width);
	for(let x=0; x<this.width; x++)
	{
		this.blocks[x] = new Array(this.height);
		for(let y=0; y<this.height; y++)
		{
			if(shape[x][y] == 1)
			{
				this.blocks[x][y] = new block(block_color[shape_name], block_border["ALL"]);
				// turn off the bit flags for borders except on the edges of the shape
				if(x < (this.width-1) && shape[x+1][y] == 1)
					this.blocks[x][y].border ^= block_border["RIGHT"];
				if(x > 0 && shape[x-1][y] == 1)
					this.blocks[x][y].border ^= block_border["LEFT"];
				if(y < (this.height-1) && shape[x][y+1] == 1)
					this.blocks[x][y].border ^= block_border["BOTTOM"];
				if(y > 0 && shape[x][y-1] == 1)
					this.blocks[x][y].border ^= block_border["TOP"];
			}
			else
				this.blocks[x][y] = null;
		}
	}
	
	this.loop_blocks = function(callback) {
		for(let x=0; x<this.width; x++)
		{
			for(let y=0; y<this.height; y++)
			{
				if(this.blocks[x][y] == null)
					continue;
				var world_x = this.x + x;
				var world_y = this.y + y;
				if( callback(this.blocks[x][y], x, y, world_x, world_y) == false )
					return;
			}
		}
	}
	this.rotate = function() {
		// try to rotate piece once clockwise
		var new_width = this.height;
		var new_height = this.width;
		var new_blocks = new Array(new_width);
		for(let x=0; x<new_width; x++)
			new_blocks[x] = new Array(new_height);
		this.loop_blocks(function(block, x, y) {
			var new_x = (new_width-1)-y;
			var new_y = x;

			if(this.blocks[x][y] == null)
			{
				new_blocks[new_x][new_y] = null;
				return;
			}		
			var color = block.color;
			var border = block.border;
			new_blocks[new_x][new_y] = new block(color, border);
			new_blocks[new_x][new_y].rotate();
		});
		var old_blocks = this.blocks;
		var old_width = this.width;
		var old_height = this.height;
		var old_y = this.y;
		var old_x = this.x;
		this.blocks = new_blocks;
		this.width = new_width;
		this.height = new_height;
		// after rotating, change the x & y based on new width and height
		// to keep piece centered
		
		// sometimes the rotated piece will end up overlapping with something,
		// if possible just move the piece by 1 to try and correct it.
		if(this.check_overlap() == true)
		{
			this.x -= 1;
			if(this.check_overlap() == false)
				return true;
			this.x += 2;
			if(this.check_overlap() == false)
				return true;
				
			this.x -= 1;
			this.y -= 1;
			if(this.check_overlap() == false)
				return true;
			
			// block overlaps, unable to rotate. undo and return false.
			this.x = old_x;
			this.y = old_y;
			this.blocks = old_blocks;
			this.width = old_width;
			this.height = old_height;
			return false;
		}
		else
			return true;
	}
	this.check_overlap = function() {
		this.loop_blocks
		var overlap = false;
		this.loop_blocks( function(block, x, y, world_x, world_y) {
			overlap = game_board[world_x][world_y] != null;
			if(overlap)
				return false;
		});
		return overlap;
	}
	this.check_touching = function() {
		var touching = false;
		this.loop_blocks(function(block, x, y, world_x, world_y) {
			if(world_y < 0)
				return;
			touching = (world_y+1 >= board_height) || (game_board[world_x][world_y+1] != null);
			if(touching)
				return false;
		});
		return touching;
	}
	this.place_on_board = function() {
		var in_bounds = true;
		// place the piece on the game board
		this.loop_blocks(function(block, x, y, world_x, world_y) {
			game_board[world_x][world_y] = block;
			if(world_y < 0) {
				console.log('ya');
				in_bounds = false;
				return false;
			}
		});
		return in_bounds;
	}
}

function block(color, border)
{
	this.color = color || 0;
	this.border = border || 0;
	this.rotate = function() {
		// rotate border once clockwise
		var old = this.border;
		this.border = block_border["NONE"];
		if(old & block_border["TOP"])
			this.border |= block_border["RIGHT"];
		if(old & block_border["RIGHT"])
			this.border |= block_border["BOTTOM"];
		if(old & block_border["BOTTOM"])
			this.border |= block_border["LEFT"];
		if(old & block_border["LEFT"])
			this.border |= block_border["TOP"];
	}
}

function delete_block(x,y)
{
	var block = game_board[x][y];
	
	// when deleting a block, change the borders of the ones surrounding it
	// to keep the shape closed
	if(block.border ^ block_border["TOP"] && block.border & block_border["BOTTOM"])
		game_board[x][y-1].border |= block_border["BOTTOM"];
	else if(block.border ^ block_border["BOTTOM"] && block.border & block_border["TOP"])
		game_board[x][y+1].border |= block_border["TOP"];
		
	game_board[x][y] = null;
}

function draw_block(block,x,y)
{
	// get the screen pos
	x *= scale;
	y *= scale;
	x += offset.x;
	y += offset.y;
	// draw the block
	graphics.fillAlpha = 1;
	graphics.beginFill(block.color);
	graphics.lineStyle(1, block.color*1.0001, 1);
	graphics.moveTo(x,y);
	graphics.lineTo(x+scale, y);
	graphics.lineTo(x+scale, y+scale);
	graphics.lineTo(x, y+scale);
	graphics.lineTo(x, y);
	graphics.endFill();
	// draw the border
	graphics.fillAlpha = 0;
	graphics.lineStyle(3, 0xFFFFFF, 1);
	graphics.moveTo(x,y);
	if(block.border & block_border["TOP"])
		graphics.lineTo(x+scale, y);
	graphics.moveTo(x+scale,y);
	if(block.border & block_border["RIGHT"])
		graphics.lineTo(x+scale, y+scale);
	graphics.moveTo(x+scale,y+scale);
	if(block.border & block_border["BOTTOM"])
		graphics.lineTo(x, y+scale);
	graphics.moveTo(x, y+scale);
	if(block.border & block_border["LEFT"])
		graphics.lineTo(x, y);
	graphics.endFill();
}

// move piece down screen, place piece & check for any lines to clear
var tick_gap = 100;
var last_tick = get_time();
function tick()
{
	last_tick = get_time();

	if(cur_piece.check_touching())
	{
		var result = cur_piece.place_on_board();
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
		cur_piece = new piece(random_shape());
	}
	else
	{	
		cur_piece.y += 1;
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
	for(let x=0; x<cur_piece.width; x++)
	{
		for(let y=0; y<cur_piece.height; y++)
		{
			if(cur_piece.blocks[x][y] == null)
				continue;
			var world_x = cur_piece.x + x;
			var world_y = cur_piece.y + y;
			draw_block(cur_piece.blocks[x][y], world_x, world_y);
		}
	}
}
