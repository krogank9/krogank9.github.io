canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
shapes = [];

// base

function vec2(x,y) {
	return {x:x||0, y:y||0}
}

function makeBox(x,y,w,h) {
	return [ vec2(x,y), vec2(x+w,y), vec2(x+w,y+h), vec2(x,y+h) ];
}

function roundTo(num, pos) {
	var t = Math.pow(10, pos);
	return Math.round(num*t)/t;
}

function drawShape(shape) {
	ctx.beginPath();
	ctx.moveTo(shape[0].x, shape[0].y);
	for(var i=1; i<shape.length; i++)
		ctx.lineTo(shape[i].x, shape[i].y);	
	ctx.closePath();
	ctx.fill();
}
function drawShapes() {
	for(var i=0; i<shapes.length; i++) {
		for(var j=0; j<shapes.length; j++) {
			if(i == j) continue;
			if(findSeparatingAxis(shapes[i], shapes[j])) {
				ctx.fillStyle = "red";
				break;
			}
			else
				ctx.fillStyle = "black";
		}
		drawShape(shapes[i]);
	}
}

// SAT

function getPerpAxis(v1, v2) {
	var dx = v2.x - v1.x;
	var dy = v2.y - v1.y;
	if(dy == 0)
		return dx>0?999:-999;
	else
		return -dx/dy;
}

function getPerpAxes(shape) {
	var axes = [];
	for(var i=0; i<shape.length; i++)
		axes.push( getPerpAxis(shape[i], shape[ (i+1)%shape.length ]) );
	return axes;
}

function rotateVec(vec, rad) {
	var cos = Math.cos(rad);
	var sin = Math.sin(rad);
	return vec2(
		vec.x*cos + vec.y*-sin,
		vec.y*cos + vec.x*sin
	);
}
function rotateVecA(vec, ang) {
	return rotateVec(vec, ang * Math.PI/180);
}

function rotateShape(shape, rad) {
	var nShape = [];
	for(var i=0; i<shape.length; i++)
		nShape.push( rotateVec( shape[i], rad ) );
	return nShape;
}

function rotateShapeA(shape, ang) {
	return rotateShape(shape, ang * Math.PI/180);
}

function checkSeparateX(shapeA, shapeB) {
	var minA = shapeA[0].x;
	var maxA = shapeA[0].x;
	var minB = shapeB[0].x;
	var maxB = shapeB[0].x;
	for(var i=0; i<shapeA.length; i++) {
		var x = shapeA[i].x;
		minA = Math.min(x, minA);
		maxA = Math.max(x, maxA);
	}
	for(var i=0; i<shapeB.length; i++) {
		var x = shapeB[i].x;
		minB = Math.min(x, minB);
		maxB = Math.max(x, maxB);
	}
	return maxA < minB || minA > maxB;
}

function findSeparatingAxis(shapeA, shapeB) {
	var testAxes = getPerpAxes(shapeA).concat(getPerpAxes(shapeB));
	var testAngles = testAxes.map((s) => Math.atan(s));
	
	for(var i=0; i<testAngles.length; i++) {
		var shapeAR = rotateShape( shapeA, -testAngles[i] );
		var shapeBR = rotateShape( shapeB, -testAngles[i] );
		if( checkSeparateX( shapeAR, shapeBR ) )
			return false;
	}
	return true;
}

// loop

function step() {
	window.requestAnimationFrame(step);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawShapes();
}
window.requestAnimationFrame(step);

shapes.push( rotateShapeA( makeBox(40,10,100,100), 10 ));
shapes.push(makeBox(120,120,100,100));

shapes.push( rotateShapeA( makeBox(200,210,100,100), 6.2 ) );
shapes.push( rotateShapeA( makeBox(250,150,100,100), -6.2 ) );

shapes.push( rotateShapeA( makeBox(25,250,100,100), 0 ) );

shapes.push(makeBox(310,310,100,100));
shapes.push( rotateShapeA(makeBox(450,80,40,40), 25));
