var sourceTextArea = document.getElementById("source");
var minFuncLength = document.getElementById("minFuncLength");

var saveDiv = document.getElementById("saveDiv");
var saveButton = document.getElementById("saveButton");
var saveName = document.getElementById("saveName");
saveButton.onclick = function (evt) {
	save_functions_to_file(String(saveName.value));
};

var functions;
function addFunc(_name, _params) {
	if(_name.length < (minFuncLength.value||0)) return;
	// make sure not to parse private functions
	if(_name[0] == '_' || _name.indexOf("._") > -1) return;
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
				setTimeout(recurse_tree, 1*loading, tree);
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
			//remove duplicate functions which are empty
			if(functions[i].name == functions[j].name
			   && functions[i].params.length == 0
			   && functions[j].params.length == 0) {
				functions.splice(j--,1);
			}
		}
	}
}

function save_functions_to_file(filename) {
	if(filename.length == 0) filename = "mylib.tags";
	var libraryName = filename;
	if(filename.indexOf('.') > -1) {
		libraryName = filename.substring(0,filename.lastIndexOf('.'));
	} else filename += ".tags";
	
	removeDuplicateFunctions();
	functions.sort(function(a,b){
		if(a.name < b.name) return 1;
		if(a.name > b.name) return -1;
		return 0;
	});
	
	var text = "# format=pipe\n# Library: " + libraryName + "\n";
	for(var i=0; i<functions.length; i++) {
		text += functions[i].name;
		text += "||(";
		for(var p=0; p<functions[i].params.length; p++) {
			if(p > 0) text += ", ";
			text += functions[i].params[p];
		}
		text += ")|\n";
	}
	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
	saveAs(blob, filename);
}

function recurse_tree(rootNode) {
	sourceTextArea.value += " .";
	if(rootNode) recurse_node(rootNode);
	loading--;
	if(loading == 0) {
		sourceTextArea.value = "Finished parsing. Type below to test autocompletion.";
		saveDiv.style.display = "block";
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

function recurse_node(node, namespaceArr) {
	if(!node) return;
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
				}else if(node.left.object.name && node.left.property.name) {
					if(!namespaceArr) namespaceArr = new Array();
					namespaceArr.push(node.left.object.name + "." + node.left.property.name);
				}
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
