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
	var max_height = window.innerHeight * 0.70;

	var goal_height = max_height;
	
	var total_spacing_x = (board_width - 1) * spacing;
	var total_spacing_y = (board_height - 1) * spacing;

	goal_height -= total_spacing_y;
	
	board_scale = Math.floor( goal_height / board_height );
	
	board_height_px = board_scale*board_height + total_spacing_y;
	board_width_px = board_scale*board_width + total_spacing_x;
}
function calc_top_height()
{
	calc_board_size();
	return (window.innerHeight - board_height_px)/2;
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
function maximize_text()
{
	var score_text = get("score_text");
	var next_text = get("next_text");
	var next_text_container = get("next_text_container");
	var hold_text = get("hold_text");
	var hold_text_container = get("hold_text_container");
	var bottom = get("bottom");
	var font_size = 0;
	
	document.body.style.fontSize = font_size + "px";
	
	while(score_text.offsetHeight < bottom.offsetHeight*0.85)
		document.body.style.fontSize = ++font_size + "px";
	document.body.style.fontSize = --font_size + "px";

	while(next_text.offsetWidth > next_text_container.offsetWidth)
		document.body.style.fontSize = --font_size + "px";
	
	document.body.style.fontSize = font_size + "px";	
}
function center_text()
{
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
	var top_goal = get("top").offsetHeight + get("touch_area_spacer").offsetHeight;

	cat.style.width = board_width_px + "px";
	cat.style.height = "auto";

	cat.style.position = "absolute";
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

var first_run = true;
function resize_bot()
{
	var height = Math.round( get("score_text").offsetHeight * 1.3 );
	get("bottom").className = "flexdiv_end " + "height=" + height + "px";
	height = touch_area.offsetHeight - board_height_px - height;
	get("touch_area_spacer").className = "height="+ height +"px";
}
function init_layout()
{
	calc_board_size();
	update_flexdiv(game_div);
	update_flexdiv(get("pause_overlay"));
	update_flexdiv(get("highscore_overlay"));
	
	maximize_text();
	
	if(first_run == true)
	{
		first_run = false;
		resize_bot();
		update_flexdiv(game_div);
	}
	
	center_text();
	position_canvases();
	position_images();
	
	game_div.style.visibility = "visible";
}

window.onresize = init_layout;
