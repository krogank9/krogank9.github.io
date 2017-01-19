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

function LayeredAudio(file_name, num_layers)
{
	this.num_layers = num_layers || 10;
	
	this.audio_arr = [];
	while(this.audio_arr.length < this.num_layers)
	{
		var snd = new Audio();
		snd.src = file_name;
		this.audio_arr.push( snd );
	}
	
	this.cur_sound = 0;
	
	var self = this;
	this.play = function()
	{	
		var snd = self.audio_arr[ self.cur_sound ];
		snd.play();
		self.cur_sound = (self.cur_sound+1) % self.num_layers;
	}
}
var shift_sound = new LayeredAudio("res/shift.wav");

function fade(col,percent,opt_to)
{
	var to = opt_to || 0;
	var i = 1.0-percent;
	return col.map(function(x){ return x*i + to*percent; });
}

function init_pieces()
{
	var shape_blueprints = {
		"O":[
			"    "+
			" XX "+
			" XX "+
			"    "
		],
		"L":[
			"  X "+
			"XOX "+
			"    "+
			"    ",
			
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
			"    "
		],
		"J":[			
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
			
			" X  "+
			" O  "+
			"XX  "+
			"    "
		],
		"S":[
			"    "+
			" OX "+
			"XX  "+
			"    ",
			
			"X   "+
			"XO  "+
			" X  "+
			"    ",
			
			" XX "+
			"XO  "+
			"    "+
			"    ",
			
			" X  "+
			" XO "+
			"  X "+
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
			
			"XO  "+
			" XX "+
			"    "+
			"    ",
			
			" X  "+
			"OX  "+
			"X   "+
			"    "
		],
		"T":[
			" X  "+
			"XOX "+
			"    "+
			"    ",

			" X  "+
			" OX "+
			" X  "+
			"    ",
			
			"    "+
			"XOX "+
			" X  "+
			"    ",
			
			" X  "+
			"XO  "+
			" X  "+
			"    "
		],
		"I":[
			"    "+
			"    "+
			"XOXX"+
			"    ",

			" X  "+
			" X  "+
			" O  "+
			" X  ",
			
			"    "+
			"XOXX"+
			"    "+
			"    ",

			"  X "+
			"  X "+
			"  O "+
			"  X "
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
}

function reset()
{
	game_board = Array.matrix(10, 20, null);
	level = 0, score = 0;
	update_score();
	drop_fast = false;
	
	cur_pieces = [];
	next_pieces = [];
	held_piece = null;
	can_hold = true;
	while(cur_pieces.length < 5)
		cur_pieces.push(get_next_piece());
	
	reset_pos();
	total_lines_cleared = 0;
	
	last_tick = get_time();
	draw_all();
}

var shapes, pieces;

var shape_names = ["O", "L", "J", "S", "Z", "T", "I"];
var shape_colors = {"O":[1, 0.81, 0.24], "L":[1, 0.42, 0], "J":[0.19, 0.19, 0.82], "S":[0.19, 0.19, 0.82], "Z":[0.86, 0, 0.24], "T":[0.64, 0.18, 0.86], "I":[0.09, 0.62, 0.78], "GHOST":[0.2,0.2,0.2]}
var shape_border_colors = remap_hashmap(shape_colors, function(val) { return fade(val, 0.33) });

var shape_border_colors2 = remap_hashmap(shape_colors, function(val) { return fade(val, 0.25, 0) });
var shape_border_colors3 = remap_hashmap(shape_colors, function(val) { return fade(val, 0.50, 1) });

var ghost_colors = [shape_colors["GHOST"], shape_border_colors["GHOST"], shape_border_colors2["GHOST"], shape_border_colors3["GHOST"]];

//bit flags for borders
var block_border = {"TOP":1, "RIGHT":2, "BOTTOM":4, "LEFT":8, "ALL":1|2|4|8}
var block_corners = {"TOP_LEFT":1, "TOP_RIGHT":2, "BOTTOM_LEFT":4, "BOTTOM_RIGHT":8, "ALL":1|2|4|8}

function piece(shape, colors, name)
{
	this.top_left = {x:3,y:3}
	this.bottom_right = {x:0,y:0}
	// populate blocks array
	this.blocks = Array.matrix(4,4);
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

var cur_pos = {x:0, y:0}
// current dropped piece and 3 previewable pieces
var cur_pieces = [];
var next_pieces = [];
var held_piece = null;
var can_hold = true;

// generate a random permutation of the 7 tetris pieces
function generate_permutation()
{
	var perm = [];
	function in_perm(name1) { return perm.some(function(name2){return name1==name2}); }
	var len = shape_names.length;
	while(perm.length < len)
	{
		var choose = rand_int(len);
		// choose a random shape from remaining unchosen shapes
		while( in_perm( shape_names[choose] ) )
			choose = (choose + 1) % len;
		perm.push(shape_names[choose]);
	}
	return perm.map(function(name){
		var type = pieces[name];
		return {type:type, rotation:0};
	});
}

function get_next_piece()
{
	if(next_pieces.length == 0)
		next_pieces = generate_permutation();
	return next_pieces.pop();
}
function cur_piece(i)
{
	return cur_pieces[i||0].type[cur_pieces[i||0].rotation];
}
function reset_pos()
{
	var cur = cur_piece();
	var piece_width =  cur.bottom_right.x - cur.top_left.x + 1;
	if(piece_width != 3)
		cur_pos.x = 3
	else
		cur_pos.x = 4
	cur_pos.y = cur.bottom_right.y * -1 - 1;
}

function cycle_next_piece()
{
	cur_pieces.shift();
	cur_pieces.push(get_next_piece());
	reset_pos();
	can_hold = true;
}
function swap_held_piece()
{
	if(!can_hold)
		return false;
		
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
	
	reset_pos();
	can_hold = false;

	draw_all();
	
	return true;
}
function try_kick_piece()
{
	// try to bump the piece 1 block in a direction to make position valid
	var kick_coords = [
		[1,0], [-1,0],
		[1,1], [-1,1],
		[0,1]
	];
	
	// I is longer than other pieces so also try 2 in each direction
	var I_kick_coords = [
		[1,0], [-1,0],
		[1,1], [-1,1],
		[0,1],
		
		[2,0], [-2,0],
		[2,1], [-2,1],
		[2,2], [-2,2],
		[0,2]
	];
	
	var is_I = cur_pieces[0].type === pieces["I"];
	var coords = is_I ? I_kick_coords : kick_coords;
	
	for(var i=0; i<coords.length; i++)
	{
		var coord = coords[i];
		
		cur_pos.x += coord[0];
		cur_pos.y += coord[1];
		
		if(check_valid_position())
			return true;
		
		cur_pos.x -= coord[0];
		cur_pos.y -= coord[1];
	}

	return false;
}
function rotate()
{
	var cur = cur_pieces[0];
	var old_rotation = cur.rotation;
	cur.rotation = (cur.rotation+1)%cur.type.length;

	if(check_valid_position() == false && try_kick_piece() == false)
	{
		cur.rotation = old_rotation;
		return false;
	}
	
	draw_board();

	return true;
}
function drop()
{
	while(check_touching_bottom() == false)
		cur_pos.y++;
	tick();
}
function check_valid_position()
{
	var valid = true;
	cur_piece().loop_blocks(function(block, block_x, block_y){
		var world_x = cur_pos.x + block_x;
		var world_y = cur_pos.y + block_y;

		// check if block is within board boundaries
		valid = (world_x >= 0) && (world_x < board_width) && (world_y < board_height);
		if(!valid)
			return false;

		// check if block overlaps with another block on the board
		valid = world_y < 0 || !game_board[world_x][world_y];
		if(!valid)
			return false;
	});
	return valid;
}
function check_touching_bottom()
{
	cur_pos.y++;
	var touching = ( check_valid_position() == false );
	cur_pos.y--;
	
	return touching;
}

function move_piece(x)
{
	cur_pos.x += x;
	if(check_valid_position() == false)
	{
		cur_pos.x -= x;
		return false;
	}
	draw_board();
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

function clear_line(y)
{
	for(var x=0; x<board_width; x++)
	{
		delete_block(x,y);
	}
	// move all lines above the cleared one down 1
	for(var y1=y; y1>=0; y1--)
	{
		for(var x=0; x<board_width; x++)
		{
			game_board[x][y1] = game_board[x][y1-1]  || null;
		}
	}
}

var total_lines_cleared = 0;
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
	
	total_lines_cleared += lines_cleared;
	if(lines_cleared == 4)
		level++;
	
	update_score();
}

function place_on_board(piece)
{
	var valid_pos = true;
	// place the piece on the game board
	cur_piece().loop_blocks(function(b, block_x, block_y)
	{
		var world_x = cur_pos.x + block_x;
		var world_y = cur_pos.y + block_y;
		if(world_y < 0)
		{
			valid_pos = false;
			return false;
		}
		game_board[world_x][world_y] = new block(b);
	});
	if(valid_pos)
	{
		check_clearable_lines();
	}
	return valid_pos;
}
