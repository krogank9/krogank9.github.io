var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.lineWidth = 4;

var rad2deg = 180 / Math.PI;

function vec(x, y) {
	return { x:x, y:y };
}

function ang2vec(ang, len) {
	var hyp = len;
	var opp = Math.sin( ang / rad2deg ) * hyp;
	var adj = Math.cos( ang / rad2deg ) * hyp;
	return vec(adj, opp);
}

function bone(parent, len, ang, x, y, mass) {
	var bone = {
		x: x||0, y: y||0,
		len: Math.abs(len||0),
		ang: (ang||0)%360,
		parent: parent||null, children: [],
		mass: mass||10
	};
	if( bone.parent != null )
		bone.parent.children.push( bone );
	return bone;
}

function drawBones(root, _x, _y, _ang) {
	// get current bones position
	_x = _x||0; _y = _y||0; _ang = _ang||0;
	_x += root.x;
	_y += root.y;
	
	// get current bone's endvec
	_ang += root.ang;
	var offset = ang2vec(_ang, root.len);
	var newX = _x + offset.x;
	var newY = _y + offset.y;

	ctx.beginPath();
	ctx.moveTo(_x, _y);
	ctx.lineTo(newX, newY);
	ctx.stroke();

	for(var i=0; i < root.children.length; i++)
		drawBones(root.children[i], newX, newY, _ang);
}

function calculateAngularImpulse(force, offsetFromOrigin) {
	return 0;
}

function applyImpulse(bone, impulse, origin, delta) {
	var angular = 0;
	if( origin.x != bone.x || origin.y != bone.y ) {
		var offset = vec(origin.x - bone.x, origin.y - bone.y);
		angular = calculateAngularImpulse(impulse, offset);
	}
	bone.x += impulse.x*delta;
	bone.y += impulse.y*delta;
	bone.ang += angular*delta;
}

function makeStickman() {
	var root = bone ( null, 0, -90 );
	var torso = bone ( root, 100, 0 );

	var lUpperArm = bone ( torso, 25, 90 );
	var lForeArm = bone ( lUpperArm, 25, 10 );
	
	var rUpperArm = bone ( torso, 25, -90 );
	var rForeArm = bone ( rUpperArm, 25, -10 );
	
	var lThigh = bone ( root, 60, 180 + 10 );
	var lShin = bone ( lThigh, 60, -2 );
	
	var rThigh = bone ( root, 60, 180 - 10 );
	var rShin = bone ( rThigh, 60, 2 );
	
	var head = bone ( torso, 36, 0 );
	return root;
}

var stickman = makeStickman();
stickman.x = 100;
stickman.y = 200;

function makeTest() {
	var root = bone( null, 100, 50, 200, 200 );
	return root;
}
var test = makeTest();

var lastUpdate = Date.now();
function mainLoop() {
	var now = Date.now();
	var delta = now - lastUpdate;
	delta /= 1000;
	
	applyImpulse(test, vec(0, 50), vec(test.x, test.y), delta);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawBones( test );
	
	lastUpdate = now;
}

var ONE_FRAME_TIME = 1000/60;
setInterval(mainLoop, ONE_FRAME_TIME);
