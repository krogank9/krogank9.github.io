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
		"O":[
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
		"J":[
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
		"O":generate_shapes(shape_blueprints["O"]),
		"L":generate_shapes(shape_blueprints["L"]),
		"J":generate_shapes(shape_blueprints["J"]),
		"S":generate_shapes(shape_blueprints["S"]),
		"Z":generate_shapes(shape_blueprints["Z"]),
		"T":generate_shapes(shape_blueprints["T"]),
		"I":generate_shapes(shape_blueprints["I"])
	}
	function generate_pieces(name)
	{
		return shapes[name].map(function(shape){
			var colors = [shape_colors[name], shape_border_colors[name],shape_border_colors2[name],shape_border_colors3[name]];
			return new piece(shape, colors, name);
		});
	}
	pieces = {
		"O":generate_pieces("O"),
		"L":generate_pieces("L"),
		"J":generate_pieces("J"),
		"S":generate_pieces("S"),
		"Z":generate_pieces("Z"),
		"T":generate_pieces("T"),
		"I":generate_pieces("I")
	}
	// turn off drawing corners for the O
	pieces["O"][0].loop_blocks(function(block,x,y){
		block.corners = 0;
	});
	while(cur_pieces.length < 4)
		cur_pieces.push(get_next_piece());
}
var shapes, pieces;

var shape_names = ["O", "L", "J", "S", "Z", "T", "I"];
var shape_colors = {"O":0xffcf3c, "L":0xff6b00, "J":0x3131d0, "S":0x06ac2d, "Z":0xdc003c, "T":0xa42edb, "I":0x189dc8, "GHOST":0x333333}
var shape_border_colors = remap_hashmap(shape_colors, function(val) { return fade(val, 0.33) });

var shape_border_colors2 = remap_hashmap(shape_colors, function(val) { return fade(val, 0.25, 0) });
var shape_border_colors3 = remap_hashmap(shape_colors, function(val) { return fade(val, 0.50, 255) });

var ghost_colors = [shape_colors["GHOST"], shape_border_colors["GHOST"], shape_border_colors2["GHOST"], shape_border_colors3["GHOST"]];

//bit flags for borders
var block_border = {"TOP":1, "RIGHT":2, "BOTTOM":4, "LEFT":8, "ALL":1|2|4|8}
var block_corners = {"TOP_LEFT":1, "TOP_RIGHT":2, "BOTTOM_LEFT":4, "BOTTOM_RIGHT":8, "ALL":1|2|4|8}

function piece(shape, colors, name)
{
	this.top_left = {x:3,y:3}
	this.bottom_right = {x:0,y:0}
	// populate blocks array
	this.blocks = Array.matrix(4);
	for(var x=0; x<4; x++)
	{
		for(var y=0; y<4; y++)
		{
			if(shape[x][y])
			{
				function valid(x,y) { return x>=0 && x<4 && y>=0 && y<4; }
				this.blocks[x][y] = new block({colors:colors, border:block_border["ALL"], corners:block_corners["ALL"], piece:name});
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
					
				// set the top left and bottom right blocks for drawing a centered preview of piece
				if(x < this.top_left.x)
					this.top_left.x = x;
				if(y < this.top_left.y)
					this.top_left.y = y;
				if(x > this.bottom_right.x)
					this.bottom_right.x = x;
				if(y > this.bottom_right.y)
					this.bottom_right.y = y;
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
				if( callback(this.blocks[x][y], x, y) === false )
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
	this.piece = props.piece || "";
	this.corners = props.corners || 0;
}

var cur_pos = {x:4, y:-3}
// current dropped piece and 3 previewable pieces
var cur_pieces = [];
var next_pieces = [];
var held_piece = null;

// generate a random permutation of the 7 tetris pieces
function generate_permutation()
{
	var perm = [];
	function in_perm(name1) { return perm.some(function(name2){return name1==name2}); }
	while(perm.length < shape_names.length)
	{
		var choose = rand_int(shape_names.length);
		// choose a random shape from remaining unchosen shapes
		while( in_perm( shape_names[choose] ) )
			choose = (choose + 1) % shape_names.length;
		perm.push(shape_names[choose]);
	}
	return perm.map(function(name){
		var type = pieces[name];
		var rotation = rand_int(type.length);
		return {type:type, rotation:rotation};
	});
}
function get_next_piece()
{
	return next_pieces.pop() || (next_pieces = generate_permutation()).pop();
}
function cur_piece(i)
{
	return cur_pieces[i||0].type[cur_pieces[i||0].rotation];
}
// get the next piece and 
function cycle_next_piece()
{
	cur_pieces.shift();
	cur_pieces.push(get_next_piece());
	cur_pos.x = 4;
	cur_pos.y = cur_piece().bottom_right.y * -1;
}
function swap_held_piece()
{
	if(held_piece == null)
	{
		held_piece = cur_pieces[0];
		cycle_next_piece();
	}
	else
	{
		var tmp = held_piece;
		held_piece = cur_pieces[0];
		cur_pieces[0] = tmp;
	}
}
function rotate()
{
	var cur = cur_pieces[0];
	var old_rotation = cur.rotation;
	cur.rotation = (cur.rotation+1)%cur.type.length;
	if(check_valid_position() == false)
	{
		cur.rotation = old_rotation;
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
	var lines_cleared = 0;
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
		{
			clear_line(y);
			lines_cleared++;
		}
	}
	var points_awarded = {0:0, 1:40, 2:100, 3:300, 4:1200};
	score += points_awarded[lines_cleared] * (level+1);
	update_score();
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
