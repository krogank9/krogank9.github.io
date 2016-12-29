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
		graphics.beginFill(top);
		for(var x1=0;x1<thickness;x1++)
			for(var y1=0;y1<thickness;y1++)
				if(x1>y1)
					graphics.drawRect(x+x1,y+y1,1,1);
		graphics.endFill();
		graphics.beginFill(bottom);
		for(var x1=0;x1<thickness;x1++)
			for(var y1=0;y1<thickness;y1++)
				if(x1<=y1)
					graphics.drawRect(x+x1,y+y1,1,1);
		graphics.endFill();
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

function draw_block(block,x,y,scale)
{	
	//some code to deal with the 1px spacing between blocks
	var mask = block.border;
	var right = mask & block_border["RIGHT"];
	var left = mask & block_border["LEFT"];
	var top = mask & block_border["TOP"];
	var bottom = mask & block_border["BOTTOM"];

	//border thickness
	var thickness = 4//10;
	
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
