canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
ents = [];

// Base

function drawEnts() {
	for(var i=0; i<ents.length; i++) {
		for(var j=0; j<ents.length; j++) {
			if(i == j)
				continue;
			else if( ents[i].isOverlapping(ents[j]) ) {
				ctx.fillStyle = "red";
				break;
			}
			else
				ctx.fillStyle = "black";
		}
		ents[i].draw(ctx);
	}
}

// Create some boxes

ents.push( ent({ poly: poly.makeBox(200,100), x: 200, y: 190, rotDeg: -45 }) );

ents.push( ent({ poly: poly.makeBox(200,100), x: 200, y: 350 }) );

ents.push( ent({ poly: poly.makeBox(75,75), x: 400, y: 264 }) );

var tri = [
	[0, 50], // tip
	[50,-50], // bot right corner
	[-50,-50], // bot left corner
]
ents.push( ent({ poly: tri, x: 400, y: 200 }) );

// Render loop

function step() {
	window.requestAnimationFrame(step);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawEnts();
	ents[0].addRotDeg(0.25);
	ents[1].addRotDeg(-0.25);
	ents[3].addRotDeg(-0.1);
}
window.requestAnimationFrame(step);
