canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
sat_world = new world();

// Create some boxes and a triangle

sat_world.createEnt({ poly: poly.makeBox(200,100), x: 200, y: 190, rotDeg: -45, rotVelDeg: 20 });

sat_world.createEnt({ poly: poly.makeBox(200,100), x: 200, y: 350, rotVelDeg: -20 });

sat_world.createEnt({ poly: poly.makeBox(75,75), x: 400, y: 264 });

sat_world.createEnt({ poly: poly.makeTriangle(100,100), x: 400, y: 180, rotDeg: 180, rotVelDeg: -10 });

// Render loop

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

function step() {
	window.requestAnimationFrame(step);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawAll();
	sat_world.step();
}
window.requestAnimationFrame(step);
