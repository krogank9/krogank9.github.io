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
					}
				}
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
	//sort functions alphabetically
	functions.sort(function(a,b){
		if(a.name < b.name) return -1;
		if(a.name > b.name) return 1;
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
		saveForm.style.display = "block";
	}
	console.log(rootNode);
	console.log(functions);
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

function recurse_node(node, namespaceArr, curFunction) {
	if(!node) return;
	switch(node.type) {
		case "FunctionDeclaration":
			//if a function is declared normally while inside a namespace, it will be invisible
			if(namespaceArr && namespaceArr.length > 0) break;
			if(libFunctionsOnly.checked) break;
			addFunc(node.id.name, parseParams(node.params));
			curFunction = node.id.name;
			break;
		case "VariableDeclaration":
			if(!namespaceArr) namespaceArr = new Array();
			namespaceArr.push({name: node.declarations[0].id.name, scope: curFunction});
			console.log("Var declared: " + node.declarations[0].id.name);
			break;
		case "AssignmentExpression":
			if(node.left.name) {
				if(!namespaceArr) namespaceArr = new Array();
				namespaceArr.push({name: node.left.name, scope: curFunction});
			}
			else if(node.left.object && node.left.property) {
				if(node.left.object.property
				   && node.left.object.property.name == "prototype") {
					// don't parse functions prototypes
					return;
				}
				var objName = node.left.object.name;
				var propName = node.left.property.name;
				if(node.left.object.type == "ThisExpression") {
					if(curFunction) { objName = curFunction; }
					else return; // this. with no parent function, invalid
				}
				if(!objName || !propName) break; // invalid name(s) in assignment expression, abort
				if(propName == "prototype" || objName == "prototype") return; // don't parse functions prototypes
				if(!namespaceArr) namespaceArr = new Array();
				namespaceArr.push({name: objName+'.'+propName, scope: curFunction});
			}
			break;
		case "FunctionExpression":
			for(var i=0; namespaceArr && i<namespaceArr.length; i++) {
				if(libFunctionsOnly.checked && namespaceArr[i].name.indexOf('.') <= 0) continue;
				//only loop through namespaces in current function(scope)
				if(namespaceArr[i].scope != curFunction) continue;
				addFunc(namespaceArr[i].name, parseParams(node.params));
				curFunction = namespaceArr[i].name;
			}
			break;
	}
	
	for(k in node) {
		if(typeof node[k] == "object" && node[k] !== null) {
			recurse_node(node[k], namespaceArr, curFunction);
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
