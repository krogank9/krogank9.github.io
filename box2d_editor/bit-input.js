var bit_checkbox_label_css = "margin: 1px; background-color: #dddddd; padding:3px; font-family: sans; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none;";
var bit_checkbox_count = 0;
function create_bit_checkbox() {
	var checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.style.cssText = "display: none;";
	checkbox.id = "bit_checkbox_"+(bit_checkbox_count++);
	
	var label = document.createElement("label");
	label.htmlFor = checkbox.id;
	label.style.cssText = bit_checkbox_label_css;
	label.innerHTML = "0";
	
	checkbox.onchange = function() {
		label.innerHTML = checkbox.checked ? "1" : "0";
	}
	
	return {checkbox:checkbox, label:label};
}

var colors = ["#F78181","#F79F81","#F7BE81","#F5DA81","#F3F781",
			  "#D8F781","#BEF781","#9FF781","#81F781","#81F79F",
			  "#81F7BE","#81F7D8","#81F7F3","#81DAF5","#81BEF7",
			  "#819FF7","#8181F7"];
			  
var bit_inputs = document.getElementsByClassName("bit-input");
for(let i=0, bit_input=bit_inputs[0]; i<bit_inputs.length; bit_input=bit_inputs[++i]) {
	
	// get binary->decimal value based on endianness
	bit_input.get_decimal = function() {
		var big_endian = this._endianness == "big";
		var incr = big_endian? -1:1;

		var cumulative = 0;
		var i = big_endian? this.size-1:0;
		var power = 0;
		for(; i<this.size && i >= 0; i+=incr, power++) {
			var bit_is_on = (this._checkboxes[i].checked == true);
			if(bit_is_on)
				cumulative += Math.pow(2, power);
		}
		
		return cumulative;
	}
	//set decimal->binary value based on endianness
	bit_input.set_decimal = function(num) {
		num = Math.floor( Math.abs(num) );
		var big_endian = this._endianness == "big";
		var incr = big_endian? -1:1;
		
		var i = big_endian? this.size-1:0;
		for(; i<this.size && i >= 0; i+=incr) {
			var remainder = num % 2;
			num = Math.floor(num/2);
			this._checkboxes[i].checked = (remainder === 1);
			this._checkboxes[i].onchange();
		}
	}
	
	bit_input.get_bits = function() {
		var bits = [];
		for(let i=0; i<this.size; i++)
			bits.push( this._checkboxes[i] );
		return bits;
	}
	
	bit_input.size = parseInt(bit_input.getAttribute('size'));
	if( isNaN(bit_input.size) )
		bit_input.size = 4;

	bit_input._endianness = bit_input.getAttribute('endianness') || "big";
	bit_input.setAttribute('endianness', bit_input._endianness);
	var rainbow = bit_input.getAttribute('rainbow') == "true";
	
	bit_input._checkboxes = [];
	bit_input._labels = [];
	for(let i=0; i<bit_input.size; i++) {
		var bit = create_bit_checkbox();
		if( rainbow )
			bit.label.style.backgroundColor = rainbow ? colors[i%colors.length] : "#dddddd";
		bit_input.appendChild(bit.checkbox);
		bit_input.appendChild(bit.label);
		bit_input._checkboxes.push(bit.checkbox);
		bit_input._labels.push(bit.label);
	}
}
