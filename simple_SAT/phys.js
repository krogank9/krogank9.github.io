canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
sat_world = new world();

// Create some boxes and a triangle

sat_world.makeBox({ w:100, h:100, x: 110, y: -50, xVel: 0 });

sat_world.makeTriangle({b: 50, h: 100, x: 300, y: 100, rotDeg: 45});

sat_world.makeBox({ w:100, h:100, x: 230, y: 264, xVel: 0 });

sat_world.makeBox({ w:100, h:130, x: 430, y: 264-15, xVel: 0});

//walls
sat_world.makeBox({ w:1000, h:100, x: 310, y: 500, xVel: 0, mass: 0 });
sat_world.makeBox({ w:100, h:1000, x: -50, y: 250, xVel: 0, mass: 0 });
sat_world.makeBox({ w:100, h:1000, x: 550, y: 250, xVel: 0, mass: 0 });

// Render loop

function drawAll() {
	var ents = sat_world.ents;
	for(var i=0; i<ents.length; i++) {
		for(var j=0; j<ents.length && false; j++) {
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
