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

function mobilecheck()
{
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
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
			" X  "
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

	reset();
}

function reset()
{
	cur_pieces = [];
	next_pieces = [];
	held_piece = null;
	can_hold = true;
	while(cur_pieces.length < 5)
		cur_pieces.push(get_next_piece());
	
	reset_pos();
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
	
	return true;
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
			return true;

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
	var valid_pos = true;
	// place the piece on the game board
	cur_piece().loop_blocks(function(b, block_x, block_y)
	{
		var world_x = cur_pos.x + block_x;
		var world_y = cur_pos.y + block_y;
		if(world_y < 0 || game_board[world_x][world_y] != null)
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
