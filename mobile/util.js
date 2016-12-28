Array.matrix = function(numrows, numcols, initial)
{
    var arr = [];
    for (var i = 0; i < numrows; ++i)
    {
        var columns = [];
        for (var j = 0; j < numcols; ++j)
        {
            columns[j] = initial;
        }
        arr[i] = columns;
    }
    return arr;
}

function remap_hashmap(hashmap,callback)
{
	var new_map = {};
	for (var i = 0, keys = Object.keys(hashmap), ii = keys.length; i < ii; i++) {
		new_map[keys[i]] = callback(hashmap[keys[i]]);
	}
	return new_map;
}

function rand_int(ceiling)
{
	return Math.floor(Math.random()*ceiling);
}

function fade(hex,percent,opt_to)
{
	var to = opt_to || 0;
	var r, g, b;
	hex = hex.toString(16);
	while(hex.length < 6)
		hex = "0"+hex;
		
	r = parseInt(hex.substring(0,2), 16);
	g = parseInt(hex.substring(2,4), 16);
	b = parseInt(hex.substring(4,6), 16);
	
	var i = 1.0-percent;
	r = Math.floor(r*i + to*percent).toString(16);
	g = Math.floor(g*i + to*percent).toString(16);
	b = Math.floor(b*i + to*percent).toString(16);
	
	r = r.length<2?"0"+r:r;
	g = g.length<2?"0"+g:g;
	b = b.length<2?"0"+b:b;
	
	hex = r+g+b;

	return parseInt(hex,16);
}

function init()
{
	var shape_blueprints = {
		"SQUARE":[
			"    "+
			" XX "+
			" XX "+
			"    "
		],
		"L":[
			" X  "+
			" O  "+
			" XX "+
			"    ",
			
			"    "+
			"XOX "+
			"X   "+
			"    ",
			
			"XX  "+
			" O  "+
			" X  "+
			"    ",
			
			"  X "+
			"XOX "+
			"    "+
			"    ",
		],
		"L_BACKWARDS":[
			" X  "+
			" O  "+
			"XX  "+
			"    ",
			
			"X   "+
			"XOX "+
			"    "+
			"    ",
			
			" XX "+
			" O  "+
			" X  "+
			"    ",
			
			"    "+
			"XOX "+
			"  X "+
			"    ",
		],
		"S":[
			"    "+
			" OX "+
			"XX  "+
			"    ",
			
			"X   "+
			"XO  "+
			" X  "+
			"    "
		],
		"Z":[
			"    "+
			"XO  "+
			" XX "+
			"    ",
			
			"  X "+
			" OX "+
			" X  "+
			"    ",
		],
		"T":[
			"    "+
			"XOX "+
			" X  "+
			"    ",
			
			" X  "+
			"XO  "+
			" X  "+
			"    ",
			
			" X  "+
			"XOX "+
			"    "+
			"    ",
			
			" X  "+
			" OX "+
			" X  "+
			"    "
		],
		"I":[
			" X  "+
			" X  "+
			" O  "+
			" X  ",
			
			"    "+
			"    "+
			"XOXX"+
			"    "
		]
	}
	function generate_shapes(blueprints)
	{
		return blueprints.map(function(blueprint){
			var shape = Array.matrix(4,4);
			for(var i=0; i<blueprint.length; i++)
				shape[i%4][parseInt(i/4)] = blueprint.charAt(i)!=" "?1:0;
			return shape;
		});
	}
	shapes = {
		"SQUARE":generate_shapes(shape_blueprints["SQUARE"]),
		"L":generate_shapes(shape_blueprints["L"]),
		"L_BACKWARDS":generate_shapes(shape_blueprints["L_BACKWARDS"]),
		"S":generate_shapes(shape_blueprints["S"]),
		"Z":generate_shapes(shape_blueprints["Z"]),
		"T":generate_shapes(shape_blueprints["T"]),
		"I":generate_shapes(shape_blueprints["I"])
	}
	function generate_pieces(name)
	{
		return shapes[name].map(function(shape){
			var colors = [shape_colors[name], shape_border_colors[name],shape_border_colors2[name],shape_border_colors3[name]];
			return new piece(shape, colors);
		});
	}
	pieces = {
		"SQUARE":generate_pieces("SQUARE"),
		"L":generate_pieces("L"),
		"L_BACKWARDS":generate_pieces("L_BACKWARDS"),
		"S":generate_pieces("S"),
		"Z":generate_pieces("Z"),
		"T":generate_pieces("T"),
		"I":generate_pieces("I")
	}
	// turn off drawing corners for the square
	pieces["SQUARE"][0].loop_blocks(function(block,x,y){
		block.corners = 0;
	});
}
var shapes, pieces;

var shape_names = ["SQUARE", "L", "L_BACKWARDS", "S", "Z", "T", "I"];
var shape_colors = {"SQUARE":0xffcf3c, "L":0xff6b00, "L_BACKWARDS":0x3131d0, "S":0x06ac2d, "Z":0xdc003c, "T":0xa42edb, "I":0x189dc8}
var shape_border_colors = remap_hashmap(shape_colors, function(val) { return fade(val, 0.33) });

var shape_border_colors2 = remap_hashmap(shape_colors, function(val) { return fade(val, 0.25, 0) });
var shape_border_colors3 = remap_hashmap(shape_colors, function(val) { return fade(val, 0.50, 255) });

//bit flags for borders
var block_border = {"TOP":1, "RIGHT":2, "BOTTOM":4, "LEFT":8, "ALL":1|2|4|8}
var block_corners = {"TOP_LEFT":1, "TOP_RIGHT":2, "BOTTOM_LEFT":4, "BOTTOM_RIGHT":8, "ALL":1|2|4|8}

function piece(shape, colors)
{
	// populate blocks array
	this.blocks = Array.matrix(4);
	for(var x=0; x<4; x++)
	{
		for(var y=0; y<4; y++)
		{
			if(shape[x][y])
			{
				function valid(x,y) { return x>=0 && x<4 && y>=0 && y<4; }
				this.blocks[x][y] = new block({colors:colors, border:block_border["ALL"], corners:block_corners["ALL"]});
				var cur_block = this.blocks[x][y];
				
				// set bit flags for drawing borders around blocks
				if(valid(x+1,y) && shape[x+1][y])
					cur_block.border ^= block_border["RIGHT"];
				if(valid(x-1,y) && shape[x-1][y])
					cur_block.border ^= block_border["LEFT"];
				if(valid(x,y+1) && shape[x][y+1]) 
					cur_block.border ^= block_border["BOTTOM"];
				if(valid(x,y-1) && shape[x][y-1])
					cur_block.border ^= block_border["TOP"];
			}
			else
				this.blocks[x][y] = null;
		}
	}
	
	this.loop_blocks = function(callback) {
		for(var x=0; x<4; x++)
		{
			for(var y=0; y<4; y++)
			{
				if(this.blocks[x][y] == null)
					continue;
				if( callback(this.blocks[x][y], x, y) == false )
					return;
			}
		}
	}
}

function block(props)
{
	props = props || {};
	this.colors = props.colors || [0,0,0];
	this.border = props.border || 0;
	this.corners = props.corners || 0;
}

var cur_type;
var cur_rotation;
var cur_pos = {x:0, y:0}
function cur_piece()
{
	return cur_type[cur_rotation];
}
function new_rand_piece()
{
	var rand_name = shape_names[rand_int(shape_names.length)];
	while(pieces[rand_name] === cur_type)
		rand_name = shape_names[rand_int(shape_names.length)];
	cur_type = pieces[rand_name];
	cur_rotation = rand_int(cur_type.length);
	cur_pos.x = 4;
	cur_pos.y = -3;
}
function rotate()
{
	var old_rotation = cur_rotation;
	cur_rotation = (cur_rotation+1)%cur_type.length;
	if(check_valid_position() == false)
	{
		cur_rotation = old_rotation;
		return false;
	}
	return true;
}
function check_valid_position()
{
	var valid = true;
	cur_piece().loop_blocks(function(block, block_x, block_y){
		var world_x = cur_pos.x + block_x;
		var world_y = cur_pos.y + block_y;

		valid = (world_x >= 0) && (world_x < board_width) && (world_y < board_height);
		if(!valid)
			return valid;

		if(world_y<0)
			return;
		valid = game_board[world_x][world_y] == null;
		return valid;
	});
	return valid;
}
function check_touching_bottom()
{
	var touching = false;
	cur_piece().loop_blocks(function(block, block_x, block_y) {
		var world_x = cur_pos.x + block_x;
		var world_y = cur_pos.y + block_y;
		if(world_y+1 < 0)
			return;
		touching = (world_y+1 >= board_height) || (game_board[world_x][world_y+1] != null);
		if(touching)
			return false;
	});
	return touching;
}

function move_left()
{
	cur_pos.x--;
	if(check_valid_position() == false)
	{
		cur_pos.x++;
		return false;
	}
	return true;
}

function move_right()
{
	cur_pos.x++;
	if(check_valid_position() == false)
	{
		cur_pos.x--;
		return false;
	}
	return true;
}

function delete_block(x,y)
{
	var border = game_board[x][y].border;
	
	// when deleting a block, change the borders of the ones surrounding it
	// to keep the shape closed
	var has_top_border = border & block_border["TOP"];
	var has_bottom_border = border & block_border["BOTTOM"];
	if(has_bottom_border && !has_top_border)
	{
		game_board[x][y-1].border |= block_border["BOTTOM"];
	}
	else if(has_top_border && !has_bottom_border)
	{
		game_board[x][y+1].border |= block_border["TOP"];
	}
		
	game_board[x][y] = null;
}

function clear_line(y1)
{
	for(var x1=0; x1<board_width; x1++)
	{
		delete_block(x1,y1);
	}
	// move all lines above the cleared one down 1
	for(var y=y1; y>0; y--)
		for(var x=0; x<board_width; x++)
			game_board[x][y] = game_board[x][y-1];
}

function check_clearable_lines()
{
	for(var y=0; y<board_height; y++)
	{
		var clearable = true;
		for(var x=0; x<board_width; x++)
		{
			if(game_board[x][y] == null)
			{
				clearable = false;
				break;
			}
		}
		if(clearable)
			clear_line(y);
	}
}

function place_on_board(piece)
{
	var in_bounds = true;
	// place the piece on the game board
	cur_piece().loop_blocks(function(b, block_x, block_y)
	{
		var world_x = cur_pos.x + block_x;
		var world_y = cur_pos.y + block_y;
		if(world_y < 0 || game_board[world_x][world_y] != null)
			return in_bounds = false;
		game_board[world_x][world_y] = new block(b);
	});
	if(in_bounds)
	{
		check_clearable_lines();
	}
	return in_bounds;
}
