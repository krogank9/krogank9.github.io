var sourceTextArea = document.getElementById("source");
var minFuncLength = document.getElementById("minFuncLength");

var libFunctionsOnly = document.getElementById("libFunctionsOnly");

var saveForm = document.getElementById("saveForm");
var saveButton = document.getElementById("saveButton");
var saveName = document.getElementById("saveName");
saveButton.onclick = function (evt) {
	save_functions_to_file(String(saveName.value));
};

var functions;
function addFunc(_name, _params) {
	if(_name.length < (minFuncLength.value||1)) return;
	// make sure not to parse private functions
	if(_name[0] == '_' || _name.indexOf("._") > -1) return;
	for(var i=0; i<_params.length; i++) {
		if(_params[i][0] == '_') return; // param starts with _ it is conventionally a private function
	}
	functions.push({name: _name, params: _params});
}

var loading;
function traverseFileTree(item, path) {
	path = path || "";
	if (item.isFile) {
		// Get file
		item.file(function(file) {
			var extension = file.name.split('.').pop().toLowerCase();
			if(extension != "js") return; //only parses javascript files
			var reader = new FileReader();
			reader.onload = function(e) { // finished reading file data.
				var tree = esprima.parse(e.target.result);
				setTimeout(recurse_tree, loading, tree);
				//print_functions();
			}
			// start reading the file data.
			loading++;
			reader.readAsText(file);
		}, function(e) { console.log(e); } );
	} else if (item.isDirectory) {
		// Get folder contents
		var dirReader = item.createReader();
		dirReader.readEntries(function(entries) {
			for (var i=0; i<entries.length; i++) {
				traverseFileTree(entries[i], path + item.name + "/");
			}
		});
	}
}

sourceTextArea.addEventListener("drop", function(event) {
	loading = 0;
	event.stopPropagation();
	event.preventDefault();
	functions = new Array();
	sourceTextArea.value = "Parsing. . .";
	var items = event.dataTransfer.items;
	for (var i=0; i<items.length; i++) {
		// webkitGetAsEntry, drag and drop folders
		var item = items[i].webkitGetAsEntry();
		if (item) {
			traverseFileTree(item);
		}
	}
}, false);

function removeDuplicateFunctions() {
	for(var i=0; i<functions.length; i++) {
		for(var j=i+1; j<functions.length; j++) {
			//remove duplicate functions with identical arguements
			if(functions[i].name == functions[j].name) {
				if(functions[i].params.length == functions[j].params.length) {
					var identicalArgs = true;
					for(var a=0; a<functions[i].params.length; a++) {
						if(functions[i].params[a] != functions[j].params[a]) {
							identicalArgs = false;
							break;
						}
					}
					if(identicalArgs) functions.splice(j--,1);
				}else { // same name but one has more arguments
					//always favor functions with greater arg count
					if(functions[i].params.length > functions[j].params.length) {
						functions.splice(j--,1);
					} else {
						functions.splice(i--,1);
						j--;
						break;
					}
				}
			}
		}
	}
}

// Geany won't display arguments for dot.tted.functions(d,_,b) :(
// work around is to break them into their parts, dot.tted and functions(d,_,b)
function removeDotsFromFunctions() {
	for(var i=0; i<functions.length; i++) {
		var name = functions[i].name;
		var index = name.lastIndexOf('.');
		// if the function is dotted and has a parameter list
		if(index > -1 && (index+1) < name.length && functions[i].params.length > 0) {
			
			//copy the parameters to a sub function, so geany can autcomplete arguements
			//addFunc(name.substring(index+1), functions[i].params);
			//functions[i].params = new Array(); // won't be needing those anymore
		}
	}
}

var eventArr = ["onDOMActivate","onDOMAttrModified","onDOMAttributeNameChanged","onDOMCharacterDataModified","onDOMContentLoaded","onDOMElementNameChanged","onDOMFocusIn","onDOMFocusOut","onDOMNodeInserted","onDOMNodeInsertedIntoDocument","onDOMNodeRemoved","onDOMNodeRemovedFromDocument","onDOMSubtreeModified","onSVGAbort","onSVGError","onSVGLoad","onSVGResize","onSVGScroll","onSVGUnload","onSVGZoom","onabort","onafterprint","onanimationend","onanimationiteration","onanimationstart","onaudioend","onaudioprocess","onaudiostart","onbeforeprint","onbeforeunload","onbeginEvent","onblocked","onblur","onboundary","oncached","oncanplay","oncanplaythrough","onchange","onchargingchange","onchargingtimechange","onchecking","onclick","onclose","oncomplete","oncompositionend","oncompositionstart","oncompositionupdate","oncontextmenu","oncopy","oncut","ondblclick","ondevicechange","ondevicelight","ondevicemotion","ondeviceorientation","ondeviceproximity","ondischargingtimechange","ondownloading","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onemptied","onend","onendEvent","onended","onerror","onfocus","onfocusinUnimplemented","onfocusoutUnimplemented","onfullscreenchange","onfullscreenerror","ongamepadconnected","ongamepaddisconnected","ongotpointercapture","onhashchange","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onlanguagechange","onlevelchange","onload","onloadeddata","onloadedmetadata","onloadend","onloadstart","onlostpointercapture","onmark","onmessage","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseout","onmouseover","onmouseup","onnomatch","onnotificationclick","onnoupdate","onobsolete","onoffline","ononline","onopen","onorientationchange","onpagehide","onpageshow","onpaste","onpause","onplay","onplaying","onpointercancel","onpointerdown","onpointerenter","onpointerleave","onpointerlockchange","onpointerlockerror","onpointermove","onpointerout","onpointerover","onpointerup","onpopstate","onprogress","onpush","onpushsubscriptionchange","onratechange","onreadystatechange","onrepeatEvent","onreset","onresize","onresourcetimingbufferfull","onresult","onresume","onscroll","onseeked","onseeking","onselect","onselectionchange","onselectstart","onshow","onsoundend","onsoundstart","onspeechend","onspeechstart","onstalled","onstart","onstorage","onsubmit","onsuccess","onsuspend","ontimeout","ontimeupdate","ontouchcancel","ontouchend","ontouchmove","ontouchstart","ontransitionend","onunload","onupdateready","onupgradeneeded","onuserproximity","onversionchange","onvisibilitychange","onvoiceschanged","onvolumechange","onvrdisplayconnected","onvrdisplaydisconnected","onvrdisplaypresentchange","onwaiting","onwheel"];
function isEventListener(text) {
	for(var i=0; i<eventArr.length; i++) {
		if(text == eventArr[i]) return true;
	}
	return false;
}

// sometimes event listeners will be parsed as functions to autocomplete:
// canvas.onmouseover = function() { } 
// we don't want these. remove any that are found
function removeEventListeners() {
	for(var i=0; i<functions.length; i++) {
		var name = functions[i].name;
		var index = name.lastIndexOf('.');
		if(index < 0) continue;
		if( isEventListener(name.substring(index+1)) ) {
			functions.splice(i--);
		}
	}
}

function save_functions_to_file(filename) {
	if(filename.length == 0) filename = "mylib.tags";
	
	var libName = filename;
	// cut off the .js.tags extension if available
	var lastExtPos = libName.lastIndexOf('.');
	if(lastExtPos > -1) libName = libName.substring(0,libName.lastIndexOf('.'));
	lastExtPos = libName.lastIndexOf('.');
	if(lastExtPos > -1) libName = libName.substring(0,libName.lastIndexOf('.'));

	//sort functions alphabetically
	functions.sort(function(a,b){
		if(a.name < b.name) return -1;
		if(a.name > b.name) return 1;
		return 0;
	});
	
	var text = "# format=pipe\n# Library: " + libName + "\n";
	for(var i=0; i<functions.length; i++) {
		text += functions[i].name + "||(";
		for(var p=0; p<functions[i].params.length; p++) {
			if(p > 0) text += ", ";
			text += functions[i].params[p];
		}
		text += ")|\n";
	}
	var blob = new Blob([text], {type: "text/plain;charset=us-ascii"});
	saveAs(blob, libName+".js.tags");
}

function recurse_tree(rootNode) {
	sourceTextArea.value += " .";
	recurse_node(rootNode);
	console.log(rootNode);
	loading--;
	if(loading == 0) {
		removeEventListeners();
		removeDotsFromFunctions();
		removeDuplicateFunctions();
		console.log(new Array("parsed functions:", functions));
		sourceTextArea.value = "Finished parsing. Type below to test autocompletion.";
		saveForm.style.display = "block";
	}
}

function parseParams(paramsNode) {
	var params = new Array();
	for(p in paramsNode) {
		if(paramsNode[p].name) {
			params.push(paramsNode[p].name);
		}
	}
	return params;
}

// recurse_node(): recurse through a node in an esprima tree
// node: current node in esprima tree
// assignmentChain: current variables being assigned to..
//                  handles things like var f = function(){}
//                  or var f = b = c = function(){}
// curFunction: saves the current function whose scope we're in
//              used for handling "this." in functions
function recurse_node(node, assignmentChain, curFunction) {
	if(!assignmentChain) assignmentChain = new Array();
	var startLength = assignmentChain.length;
	var startCurFunction = curFunction;
	if(!node) return;
	switch(node.type) {
		// normal variable declaration: function abc(a,b,c) {}
		case "FunctionDeclaration":
			//if a function is declared normally while inside another function, it will be invisible
			if(curFunction && curFunction.length > 0) return;
			if(libFunctionsOnly.checked) break;
			addFunc(node.id.name, parseParams(node.params));
			curFunction = node.id.name;
			break;
		// variable declaration, var x = ; could be equal to a function, save the vars name
		case "VariableDeclaration":
			if(!node.declarations[0].id.name) break;
			assignmentChain.push(node.declarations[0].id.name);
			break;
		// assignment expression, could be equal to a function, save the name
		case "AssignmentExpression":
			if(node.left.name) {
				assignmentChain.push(node.left.name);
			}
			else if(node.left.object && node.left.property) {
				var objName = node.left.object.name;
				var propName = node.left.property.name;
				// replace this. with the function we're in
				if(node.left.object.type == "ThisExpression") {
					if(curFunction) { objName = curFunction; }
					else return; // ThisExpression with no parent function is invalid
				}
				if(propName == "prototype" || objName == "prototype") break; // don't parse prototypes
				if(!objName || !propName) break; // invalid name(s) in assignment expression, abort
				assignmentChain.push(objName+'.'+propName);
			}
			break;
		// FunctionExpression: when a function which is not declared normally, e.g. var func = function(){}
		case "FunctionExpression":
			for(var i=0; i<assignmentChain.length; i++) {
				if(libFunctionsOnly.checked && assignmentChain[i].indexOf('.') <= 0) continue;
				// register the function to all the names currently being assigned to
				addFunc(assignmentChain[i], parseParams(node.params));
				curFunction = assignmentChain[i];
			}
			break;
		// ObjectExpression: special case. {key: value} pass key names to values thru assignmentChain
		case "ObjectExpression":
			if(!node.properties) break;
			var prop = node.properties;
			for( k in prop ) {
				if(typeof prop[k] != "object" || prop[k] === null) continue;
				if(prop[k].key && prop[k].key.name && prop[k].value) {
					recurse_node(prop[k].value, new Array(prop[k].key.name), curFunction);
				}
			}
			while(assignmentChain.length > startLength) assignmentChain.pop();
			curFunction = startCurFunction;
			return;
	}
	
	for(k in node) {
		if(typeof node[k] == "object" && node[k] !== null) {
			recurse_node(node[k], assignmentChain, curFunction);
		}
	}
	
	// exit out of any assignment chains entered inside this node
	while(assignmentChain.length > startLength) assignmentChain.pop();
	curFunction = startCurFunction;
}

function strInStr(container, member, pos) {
	for(var i=0; i<member.length; i++) {
		if(pos+i<container.length && container[pos+i] == member[i]) continue;
		else return false;
	}
	return true;
}
