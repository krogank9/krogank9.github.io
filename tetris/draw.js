var board_canvas = get("board_canvas");
var hold_canvas = get("hold_canvas");
var next_canvas = [
	get("next_canvas_1"), get("next_canvas_2"),
	get("next_canvas_3"), get("next_canvas_4")
];

var board_context = board_canvas.getContext("2d");
var hold_context = hold_canvas.getContext("2d");
var next_context = next_canvas.map(function(c){return c.getContext("2d")});

var border_thickness = 4/26; //ratio to block size that looks good

function draw_all()
{
	draw_hold();
	draw_next();
	draw_board();
}

function draw_hold()
{
	var held = held_piece && held_piece.type[held_piece.rotation];
	draw_preview(hold_context, held);
}

function draw_next()
{
	for(var i=1; i<cur_pieces.length; i++)
		draw_preview(next_context[i-1], cur_piece(i));
}

function draw_preview(context, piece)
{
	context.clearRect(0,0,box_size,box_size);
	
	if(!piece)
		return;
		
	var start_x = preview_offset;
	var start_y = preview_offset;
	
	// calculate where the midpoint of the piece will be for centering
	var mid_x = (piece.top_left.x + piece.bottom_right.x)/2 + 0.5;
	var mid_y = (piece.top_left.y + piece.bottom_right.y)/2 + 0.5;
	mid_x *= spacing + preview_scale;
	mid_y *= spacing + preview_scale;
	
	mid_x -= spacing/2;
	mid_y -= spacing/2;

	start_x += preview_size/2 - mid_x;
	start_y += preview_size/2 - mid_y;
	piece.loop_blocks(function(block, x, y){
		var px_x = start_x + x*(spacing+preview_scale);
		var px_y = start_y + y*(spacing+preview_scale);
		draw_block(context, block, Math.round(px_x), Math.round(px_y), preview_scale);
	});
}

function draw_board()
{
	board_context.clearRect(0,0,board_width_px,board_height_px);
	
	// draw every block on the gameboard
	for(var x=0; x<board_width; x++)
	{
		for(var y=0; y<board_height; y++)
		{
			var px_x = x*(spacing+board_scale);
			var px_y = y*(spacing+board_scale);
			if(game_board[x][y] != null)
				draw_block(board_context,game_board[x][y],px_x,px_y,board_scale);
		}
	}

	// draw the current piece and the ghost of where it will land
	var tmp = cur_pos.y;
	while(check_touching_bottom() == false)
		cur_pos.y++;
	var ghost_y = cur_pos.y;
	cur_pos.y = tmp;
	
	cur_piece().loop_blocks(function(block, x, y){
		var world_x = cur_pos.x + x;
		var world_y = cur_pos.y + y;
		
		var px_x = world_x*(spacing+board_scale);
		var px_y = world_y*(spacing+board_scale);

		var ghost_world_y = ghost_y + y;
		var ghost_px_y = ghost_world_y*(spacing+board_scale);

		if(ghost_world_y >= 0)
			draw_block(board_context, block, px_x, ghost_px_y,board_scale,ghost_colors);
		if(world_y >= 0)
			draw_block(board_context, block, px_x, px_y,board_scale);
	});
}

function draw_border(context,x,y,width,height,thickness,border_mask,corner_mask,top_color,bottom_color,is_O)
{
	function dr(x,y,width,height,col){ context.fillStyle = col; context.fillRect(x,y,width,height); context.fill(); }
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
		
	function draw_slant(x,y,top_color,bottom_color) {
		dr(x,y,thickness,thickness,top_color);
		context.fillStyle = bottom_color;
		for(var x1=0;x1<thickness;x1++)
			for(var y1=0;y1<thickness;y1++)
				if(x1<=y1)
					context.fillRect(x+x1,y+y1,1,1);
		context.fill();
	}
	// draw the slanted edges for 3d effect
	if(left&&top)
		draw_slant(x,y,top_color,bottom_color);
	if(right&&bottom)
		draw_slant(x+width-thickness,y+height-thickness,top_color,bottom_color);

	if(!is_O && !(left|top))
		draw_slant(x,y,bottom_color,top_color);
	if(!is_O && !(right|bottom))
		draw_slant(x+width-thickness,y+height-thickness,bottom_color,top_color);
}

function draw_block(context,block,x,y,scale,colors)
{
	//some code to deal with the 1px spacing between blocks
	var mask = block.border;
	var right = mask & block_border["RIGHT"];
	var left = mask & block_border["LEFT"];
	var top = mask & block_border["TOP"];
	var bottom = mask & block_border["BOTTOM"];

	var thickness = Math.round(border_thickness*scale);
	
	colors = colors || block.colors;
	var color = colors[0];
	var border_color = colors[1];
	var bottom_edge_color = colors[2];
	var top_edge_color = colors[3];

	function dr(x,y,width,height,col){ context.fillStyle = col; context.fillRect(x,y,width,height); context.fill(); }
	var is_O = (block.piece == "O");
	// fill in the spots between the spacing
	if(!right)
	{
		//grid
		dr(x+scale,y,spacing,scale,color);

		// connect corners and borders, O (square) is a special case
		if(!is_O || (top|right) )
			dr(x+scale,y,spacing,thickness,top_edge_color);//top right
		if(!is_O || (bottom|right) )
			dr(x+scale,y+scale-thickness,spacing,thickness,bottom_edge_color);//bottom right
	}
	if(!bottom)
	{
		//grid
		dr(x,y+scale,scale,spacing,color);

		// connect corners and borders, O is a special case
		if(!is_O || (bottom|left) )
			dr(x,y+scale,thickness,spacing,bottom_edge_color);//bottom left
		if(!is_O || (bottom|right) )
			dr(x+scale-thickness,y+scale,thickness,spacing,top_edge_color);//bottom right
	}
	if(is_O && !bottom && !right)
	{
		dr(x+scale,y+scale,spacing,spacing,color);
	}
	
	// draw the block
	dr(x,y,scale,scale,color);
	// draw the border
	draw_border(context,x,y,scale,scale,thickness,block.border,block.corners,top_edge_color,bottom_edge_color,is_O);
}
