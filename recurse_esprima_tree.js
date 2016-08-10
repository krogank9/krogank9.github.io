var sourceTextArea = document.getElementById("source");
var minFuncLength = document.getElementById("minFuncLength");

var functions;
function addFunc(_name, _params) {
	if(_name.length < (minFuncLength.value||0)) return;
	// make sure not to parse private functions
	if(_name[0] == '_' || _name.indexOf("._") > -1) return;
	functions.push({name: _name, params: _params});
}

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
				recurse_tree(tree);
				//print_functions();
			}
			// start reading the file data.
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
	event.stopPropagation();
	event.preventDefault();
	functions = new Array();
	sourceTextArea.value = "Loading";
	var items = event.dataTransfer.items;
	for (var i=0; i<items.length; i++) {
		// webkitGetAsEntry, drag and drop folders
		var item = items[i].webkitGetAsEntry();
		if (item) {
			traverseFileTree(item);
		}
	}
}, false);

function print_functions() {
	functions.sort(function(a,b){return a.name < b.name;});
	sourceTextArea.value = "";
	for(var i=0; i<functions.length; i++) {
		sourceTextArea.value += functions[i].name;
		sourceTextArea.value += "(";
		for(var p=0; p<functions[i].params.length; p++) {
			if(p > 0) sourceTextArea.value += ", ";
			sourceTextArea.value += functions[i].params[p];
		}
		sourceTextArea.value += ")\n";
	}
}

function recurse_tree(rootNode) {
	sourceTextArea.value += " .";
	if(rootNode) recurse_node(rootNode);
	else console.log("undefined node");
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

function recurse_node(node, namespaceArr) {
	switch(node.type) {
		case "FunctionDeclaration":
			//if a function is declared normally while inside a namespace, it will be invisible
			if(namespaceArr && namespaceArr.length > 0) break;
			addFunc(node.id.name, parseParams(node.params));
			break;
		case "VariableDeclaration":
			namespace = node.declarations[0].id.name;
			break;
		case "AssignmentExpression":
			if(node.left.name) {
				if(!namespaceArr) namespaceArr = new Array();
				namespaceArr.push(node.left.name);
			}
			else if(node.left.object && node.left.property) {
				if(node.left.object.property
				   && node.left.object.property.name == "prototype") {
					// don't parse any functions that are prototypes
					return;
				}else if(!namespaceArr) namespaceArr = new Array();
				namespaceArr.push(node.left.object.name + "." + node.left.property.name);
			}
			break;
		case "FunctionExpression":
			for(var i=0; namespaceArr && i<namespaceArr.length; i++) {
				addFunc(namespaceArr[i], parseParams(node.params));
			}
			break;
	}
	
	for(k in node) {
		if(typeof node[k] == "object" && node[k] !== null) {
			recurse_node(node[k], namespaceArr);
		}
	}
}

function strInStr(container, member, pos) {
	for(var i=0; i<member.length; i++) {
		if(pos+i<container.length && container[pos+i] == member[i]) continue;
		else return false;
	}
	return true;
}
