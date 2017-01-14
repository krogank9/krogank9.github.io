// flexcell.js
// A flexible pixel perfect calculator for resizable div layouts

function get_prop(elem, prop_name)
{
	return getComputedStyle(elem,null).getPropertyValue(prop_name);
}

// Determine whether to round up or down so as to reach the desired goal.
// Ex. If there are 3 elements but the goal is to reach 100,
// they will each be 33.33... Math.round()ing them gives a total of 99.
// This function will return Math.floor for 2 and Math.ceil for 1, returning 33 + 33 + 34 = 100.
function get_round_direction(goal, cur, len)
{
	// it should always be equal number of ceils and floors,
	// unless the len is not an even number, in which case there
	// should be one greater floor or ceil.
	var more_floors = (goal/len % 1) < 0.5;
	var offset = more_floors? 1:0;
	return (cur+offset)%2 ? Math.floor : Math.ceil;
}

// A unit for a width/height value can take various forms:
// 1. Pixels, in the form of a true integer: 50 or a string "50" or with suffix "50px"
// 2. Percent, integer or float in string "50.5%" "50%"
// 3. Aspect ratio, (width:height) to the other dimension "0.5ar"
// 4. A callback function to calculate a size in pixels at runtime
function parse_unit(val)
{
	function isFunction(obj) { return !!(obj && obj.constructor && obj.call && obj.apply); }
	function isString(value) {return typeof value === 'string';}
	var result = {is_px: false, is_ar: false, is_percent: false, val: null}

	if(!val && isNaN(parseInt(val)))
	{
		result.is_expand = true;
		return result;
	}
	else if( isString(val) && val.slice(-2) == "()" )
	{
		result.is_px = true;
		var fn_name = val.slice(0,-2);
		result.val = parseInt( window[fn_name]() );
	}
	else if(isString(val) && val.slice(-2) == "ar" )
	{
		result.is_ar = true;
		result.val = parseFloat(val);
	}
	else if(isString(val) && val.slice(-1) == "%" )
	{
		result.is_percent = true;
		result.val = parseFloat(val) / 100;
	}
	else if( isNaN( parseInt(val) ) == false )
	{
		result.is_px = true;
		result.val = parseInt(val);
	}
	result.is_expand = !result.is_px && !result.is_ar && !result.is_percent;
	return result;
}

////////////////////////////////////////////////////////////////////////
// root div class is flexdiv_root, to end iterating flexdiv_end

function set_flexdiv_props(elem)
{
	var classes = Array.prototype.slice.call(elem.classList);
	classes.forEach(function(c){
		if(c=="vertical")
			elem.vertical = true;
		else if(c=="center")
			elem.center = true;
		else if(c=="center_horizontal")
			elem.center_horizontal = true;
		else if(c=="center_vertical")
			elem.center_vertical = true;
		else if(c.indexOf("=") > -1)
		{
			var key = c.split("=")[0];
			var val = c.split("=")[1];
			elem[key] = val;
		}
	});
}

function calc_size(parsed, child_other_size, parent_cur_size, direction_other)
{
	if(direction_other && parsed.is_expand)
		return parent_cur_size;
	
	if(parsed.is_ar)
		return parseInt(parsed.val * child_other_size);
	else if(parsed.is_percent)
		return parseInt(parent_cur_size * parsed.val);
	else if(parsed.is_px)
		return parseInt(parsed.val);
	else
		return 0;
}

function solve_size(child, parent)
{
	child.calc_width = 0;
	child.calc_height = 0;
	child.expand = false;
	
	var width_parsed = parse_unit(child.width);
	var height_parsed = parse_unit(child.height);
	
	// for unspecified sizes, expand later
	if(parent.vertical && height_parsed.is_expand)
	{
		child.calc_width = parent.calc_width;
		child.expand = true;
		return;
	}
	else if(!parent.vertical && width_parsed.is_expand)
	{
		child.calc_height = parent.calc_height;
		child.expand = true;
		return;
	}
	
	// if the width is aspect ratio based, need to calculate height first, vice versa
	if(width_parsed.is_ar)
	{
		//do height first
		child.calc_height = calc_size(height_parsed, child.calc_width, parent.calc_height, !parent.vertical);
		child.calc_width = calc_size(width_parsed, child.calc_height, parent.calc_width, parent.vertical);
	}
	else
	{
		//do width first
		child.calc_width = calc_size(width_parsed, child.calc_height, parent.calc_width, parent.vertical);
		child.calc_height = calc_size(height_parsed, child.calc_width, parent.calc_height, !parent.vertical);
	}
}

function update_flexdiv(div)
{
	var classes = Array.prototype.slice.call(div.classList);
	if(classes.some(function(c){return c=="flexdiv_root"}))
	{
		set_flexdiv_props(div);
		div.calc_width = div.offsetWidth;
		div.calc_height = div.offsetHeight;
		
		var left = parseInt(get_prop(div, "border-left-width"));
		div.calc_width -= left;
		var right = parseInt(get_prop(div, "border-right-width"));
		div.calc_width -= right;
		var top = parseInt(get_prop(div, "border-top-width"));
		div.calc_height -= top;
		var bottom = parseInt(get_prop(div, "border-bottom-width"));
		div.calc_height -= bottom;
	}
	else if(classes.some(function(c){return c=="flexdiv_end"}))
		return;
	
	var children = Array.prototype.slice.call(div.children);
	children = children.filter(function(elem) {return elem.nodeName == "DIV"});

	var expand_divs = [];
	var space_remaining = div.vertical ? div.calc_height : div.calc_width;
	children.forEach(function(child){
		set_flexdiv_props(child);
		
		solve_size(child, div);
		
		if(div.vertical)
			space_remaining -= child.calc_height;
		else
			space_remaining -= child.calc_width;
			
		if(child.expand)
			expand_divs.push(child);
	});
	expand_divs.forEach(function(child){
		for(var i=0; i<expand_divs.length; i++)
		{
			var child = expand_divs[i];
			var round_func = get_round_direction(space_remaining, i, expand_divs.length);
			if(div.vertical)
				child.calc_height = round_func(space_remaining / expand_divs.length);
			else
				child.calc_width = round_func(space_remaining / expand_divs.length);
		}
	});
	
	var rel_x = 0, rel_y = 0;
	// get positions
	children.forEach(function(child){
		if(child.center || child.center_horizontal || child.center_vertical)
		{
			var center_x = Math.round(div.calc_width/2 - child.calc_width/2);
			var center_y = Math.round(div.calc_height/2 - child.calc_height/2);
			if(child.center_horizontal || child.center)
				child.rel_x = center_x;
			if(child.center_vertical || child.center)
				child.rel_y = center_y;
			return;
		}
		
		child.rel_x = rel_x;
		child.rel_y = rel_y;
		
		if(div.vertical)
			rel_y += child.calc_height;
		else
			rel_x += child.calc_width;
	});
	
	// account for borders
	children.forEach(function(child) {
		var left = parseInt(get_prop(child, "border-left-width"));
		child.rel_x += left;
		child.calc_width -= left*2;
		var right = parseInt(get_prop(child, "border-right-width"));
		child.calc_width -= right;
		var top = parseInt(get_prop(child, "border-top-width"));
		child.rel_y += top;
		child.calc_height -= top*2;
		var bottom = parseInt(get_prop(child, "border-bottom-width"));
		child.calc_height -= bottom;
	});
	
	// set styles and iterate
	children.forEach(function(child) {
		child.style.position = "absolute";
		child.style.left = child.rel_x + "px";
		child.style.top = child.rel_y + "px";
		child.style.width = child.calc_width + "px";
		child.style.height = child.calc_height + "px";
		update_flexdiv(child);
	});
}
