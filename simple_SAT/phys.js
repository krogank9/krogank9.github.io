canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
sat_world = world();

function drawAll() {
	var ents = sat_world.ents;
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

sat_world.createEnt( ent({ poly: poly.makeBox(200,100), x: 200, y: 190, rotDeg: -45, rotVelDeg: 20 }) );

sat_world.createEnt( ent({ poly: poly.makeBox(200,100), x: 200, y: 350, rotVelDeg: -20 }) );

sat_world.createEnt( ent({ poly: poly.makeBox(75,75), x: 400, y: 264 }) );

var tri = [
	[0, 50], // tip
	[50,-50], // bot right corner
	[-50,-50], // bot left corner
]
sat_world.createEnt( ent({ poly: tri, x: 400, y: 180, rotVelDeg: -10 }) );

// Render loop

function step() {
	window.requestAnimationFrame(step);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawAll();
	sat_world.step();
}
window.requestAnimationFrame(step);
