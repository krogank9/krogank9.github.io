// flexcell.js
// A flexible pixel perfect calculator for resizable table style layouts

function flexcell(props)
{
	copy_props(props, this);
	this.children = this.children || [];
}

function copy_props(props, obj)
{
	if(!props)
		return;
	for( var key in props )
		if( props.hasOwnProperty(key) )
			obj[key] = props[key];
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
		return result;
	}
	else if(isFunction(val))
	{
		result.is_px = true;
		result.val = parseInt( val() );
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
	return result;
}

// Recursively solves for real widths and positions based on given dimensions
flexcell.prototype.recalc = function()
{
	var self = this;
	var parent = this.parent;
	var children = this.children;
	
	if(!parent)
	{
		this.calc_width = parse_unit(this.width).val;
		this.calc_height = parse_unit(this.height).val;
	}
	
	function calc(cur)
	{
		var other = cur == "width" ? "height" : "width";
		var solved_cur = "solved_"+other;
		var solved_other = "solved_"+other;
		var calc_cur = "calc_"+cur;
		var calc_other = "calc_"+other;
		
		var expand = [];
		var no_expand = [];
		children.forEach(function(child) {
			child[calc_other] = self[calc_other];
			var parsed = parse_unit(child[cur]);
			
			if(parsed.is_ar)
				child[calc_cur] = parseInt(parsed.val * child[calc_other]);
			else if(parsed.is_percent)
				child[calc_cur] = parseInt(self[calc_cur] * parsed.val);
			else if(parsed.is_px)
				child[calc_cur] = parseInt(parsed.val);
			else
			{
				expand.push(child);
				return;
			}
			no_expand.push(child);
		});
		var space_remaining = self[calc_cur];
		no_expand.forEach(function(child) { space_remaining -= child[calc_cur] });
		for(var i=0; i<expand.length; i++)
		{
			var child = expand[i];
			var round_func = get_round_direction(space_remaining, i, expand.length);
			child[calc_cur] = round_func(space_remaining / expand.length);
		}
	}
	
	if( this.vertical )
		calc("height");
	else
		calc("width");
	
	var total_rel_x = 0;
	var total_rel_y = 0;
	// Iterate
	for(var i=0; i<children.length; i++)
	{
		var child = children[i];
		child.calc_rel_x = total_rel_x;
		child.calc_rel_y = total_rel_y;

		total_rel_x += child.calc_width;
		total_rel_y += child.calc_height;
		
		if(this.vertical)
			child.calc_rel_x = 0;
		else
			child.calc_rel_y = 0;
			
		child.calc_x = (this.calc_x||0) + child.calc_rel_x;
		child.calc_y = (this.calc_y||0) + child.calc_rel_y;

		child.parent = this;
		child.recalc();
	}
}

flexcell.prototype.addChild = function(child)
{
	this.children.push(child);
	return child;
}

flexcell.prototype.addChildren = function(children)
{
	this.children = this.children.concat(children);
	return children;
}

flexcell.prototype.createChild = function(props)
{
	var child = new flexcell(props);
	this.children.push(child);
	return child;
}

flexcell.prototype.createChildren = function(props_list)
{
	var new_children = props_list.map(function(props){
		return new flexcell(props);
	});
	this.children = this.children.concat(new_children);
	return new_children;
}

flexcell.prototype.createCenteredChild = function(width, height)
{
	if(parse_unit(width).is_ar)
	{
		this.vertical = true;
		var h_cells = this.createChildren([{},{height:height, vertical:false},{}]);
		var v_cells = h_cells[1].createChildren([{},{width:width},{}])
		return v_cells[1];
	}
	else
	{
		this.vertical = false;
		var v_cells = this.createChildren([{},{width:width, vertical:true},{}]);
		var h_cells = v_cells[1].createChildren([{},{height:height},{}])
		return h_cells[1];
	}
}

flexcell.prototype.getCell( name )
{
}

function make_flexcells(len)
{
	var arr = [];
	while(arr.length < len)
		arr.push(new flexcell())
	return arr;
}

function cells_from_blueprint( blueprint )
{
}

var game_screen_blueprint =
{
	width: "1000px",
	height: "100px",
	vertical: true,
	
	top:
	{
		height: "15%"
	},
	middle:
	{
		height: "75%";
		
		left:
		{
			vertical: true,
			
			offset: { height: "15%" },
			hold_container:
			{
				left_space: {},
				hold_bl
				right_space: {}
			}
		},
		center:
		{
			width: "0.5ar"
			
			board:
			{
				center: true,
				width: calc_board_width,
				height: "2ar"
			}
		},
		right:
		{
			vertical: true,
			
			offset: { height: "15%" },
			next_container:
			{
				left_space: {},
				next_blocks:
				{
					vertical: true,
					width: calc_box_size,
					
					next_text: { height: "0.5ar" },
					
					spacer: { height: "0.1ar" },
					
					next_block: { height: "1ar"},
					
					spacer: { height: "0.1ar" },
					
					second_block: { height: "1ar" },
					third_block: { height: "1ar" },
					fourth_block: { height: "1ar" }
				}
				right_space: {}
				
			},
			cat_tail_container: {}
		}
	},
	bottom:
	{
	}
}

var game_screen = cells_from_blueprint( game_screen_blueprint );
