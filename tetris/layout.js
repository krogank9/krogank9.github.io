function get(id) { return document.getElementById(id) }
var game_div = get("game_div");

var board_width = 10, board_height = 20;
var board_width_px = 0, board_height_px = 0;
var spacing = 2, board_padding = 0;
var board_scale = 0;
var preview_size = 0, preview_scale = 0;
var preview_offset = 0;
var box_size = 0;

function get_center_height() { return board_height_px + board_padding; }
function get_center_width() { return board_width_px + board_padding; }

function calc_board_size()
{
	var max_height = window.innerHeight * 0.75;

	var goal_height = max_height;
	
	var total_spacing_x = (board_width - 1) * spacing;
	var total_spacing_y = (board_height - 1) * spacing;

	goal_height -= total_spacing_y;
	
	board_scale = Math.floor( goal_height / board_height );
	
	board_height_px = board_scale*board_height + total_spacing_y;
	board_width_px = board_scale*board_width + total_spacing_x;
}
function position_canvases()
{
	var board_canvas = get("board_canvas");
	board_canvas.width = board_width_px;
	board_canvas.height = board_height_px;
	
	board_canvas.style.position = "absolute";
	
	// preview canvases
	preview_size = box_size * 0.85;
	preview_size = Math.floor(preview_size / 4) * 4; // each preview needs to be exactly 4 blocks wide
	preview_scale = preview_size/4;
	
	preview_offset = (box_size - preview_size)/2;
	
	var hold_canvas = get("hold_canvas");
	var hold = get("hold");
	hold_canvas.width = hold_canvas.height = box_size;
	for(var i=1; i<=4; i++)
	{
		var next_canvas = get("next_canvas_"+i);
		next_canvas.width = next_canvas.height = box_size;
	}
	
	var board_canvas = get("board_canvas");
	var hold_canvas = get("hold_canvas");
	var next_canvas = [
		get("next_canvas_1"), get("next_canvas_2"),
		get("next_canvas_3"), get("next_canvas_4")
	];
	
	board_context = new Renderer( board_canvas );
	hold_context = new Renderer( hold_canvas );
	next_context = next_canvas.map(function(c){return new Renderer(c)});
}

function calc_box_size()
{
	var max_width = Math.round( left.offsetWidth * 0.85 );
	var max_height = Math.round( left.offsetHeight / 6 );
	box_size = max_width < max_height ? max_width : max_height;
	return box_size;
}
function set_board_border()
{
	var border_size = Math.round( calc_box_size() * 0.03 );
	get("center").style.borderRadius = border_size + "px";
	
	var side_borders = border_size;
	get("hold").style.borderRadius = side_borders + "px";
	get("next_1").style.borderRadius = side_borders + "px";
	get("next_2").style.borderRadius = side_borders + "px " + side_borders + "px 0px 0px";
	get("next_4").style.borderRadius = "0px 0px " + side_borders + "px " + side_borders + "px";
}
function maximize_text()
{
	var score_text = get("score_text");
	var next_text = get("next_text");
	var next_text_container = get("next_text_container");
	var hold_text = get("hold_text");
	var hold_text_container = get("hold_text_container");
	var bottom = get("bottom");
	var font_size = 0;
	
	score_text.style.fontSize = font_size + "px";
	while(score_text.offsetHeight < bottom.offsetHeight*0.85)
		score_text.style.fontSize = ++font_size + "px";
	score_text.style.fontSize = --font_size + "px";
	
	
	next_text.style.fontSize = font_size + "px";
	while(next_text.offsetWidth > next_text_container.offsetWidth)
		next_text.style.fontSize = --font_size + "px";
	
	document.body.style.fontSize = font_size + "px";	
	
	//center all
	score_text.style.position = "absolute";
	score_text.style.left = "0px";
	score_text.style.top = Math.round(bottom.offsetHeight/2 - score_text.offsetHeight/2) + "px";
	
	hold_text.style.position = "absolute";
	hold_text.style.left = Math.round(hold_text_container.offsetWidth/2 - hold_text.offsetWidth/2) + "px";
	hold_text.style.bottom = Math.round(hold_text_container.offsetHeight/2 - hold_text.offsetHeight/2) + "px";

	next_text.style.position = "absolute";
	next_text.style.left = Math.round(next_text_container.offsetWidth/2 - next_text.offsetWidth/2) + "px";
	next_text.style.bottom = Math.round(next_text_container.offsetHeight/2 - next_text.offsetHeight/2) + "px";
}
function position_images()
{	
	// left paw is 28% across image x
	// top paw is 48% down image y
	// have paws resting on top of game board
	var left_paw = 0.28;
	var top_paw = 0.48;
	var cat = get("cat");
	
	var left_goal = get("left").offsetWidth;
	var top_goal = get("top").offsetHeight;
	var max_width = Math.round(left_goal / left_paw);
	var max_height = Math.round(top_goal / top_paw);
	cat.style.position = "absolute";
	cat.style.left = cat.style.top = "0px";
	if(max_width < max_height)
	{
		cat.style.width = max_width + "px";
		cat.style.height = "auto";
	}
	else
	{
		cat.style.height = max_height + "px";
		cat.style.width = "auto";
	}
	cat.style.left = Math.round(left_goal - cat.offsetWidth*left_paw) + "px";
	cat.style.top = Math.round(top_goal - cat.offsetHeight*top_paw) + "px";
	
	var tail = get("tail");
	
	tail.style.position = "absolute";
	tail.style.left = -get("next_blocks").rel_x + "px";
	// scale the tail the same as the cat
	var cat_scale = cat.offsetWidth / cat.naturalWidth;
	tail.style.width = Math.round(tail.naturalWidth * cat_scale) + "px";
	tail.style.height = "auto";
}

window.onload = function(){
	// initialize the layout
	calc_board_size();
	update_flexdiv(game_div);
	update_flexdiv(get("pause_overlay"));
	
	maximize_text();
	set_board_border();
	position_images();
	
	position_canvases();
	
	game_div.style.visibility = "visible";
	
	// initialize the game
	init();
}
