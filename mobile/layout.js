var board_width = 0, board_height = 0;
var border_spacing = 0, border_thickness = 0;

function get(id) { return document.getElementById(id) }
function calc_box_size()
{
	var left = get("left");
	var max_width = Math.round( left.offsetWidth * 0.85 );
	var max_height = Math.round( left.offsetHeight / 6 );
	return max_width < max_height ? max_width : max_height;
}
function set_board_border()
{
	var width = get("center").offsetWidth;
	get("center").style.borderRadius = Math.round(width * 0.025) + "px";
	
	var side_borders = Math.round( calc_box_size() * 0.03 );
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
	
	hold_text.style.fontSize = font_size + "px";	
	score_text.style.fontSize = font_size + "px";
	
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
	update_flexdiv(get("game_screen"));
	maximize_text();
	set_board_border();
	position_images();
	get("game_screen").style.visibility = "visible";
}
