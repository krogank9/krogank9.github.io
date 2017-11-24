canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
sat_world = new world();

// Create some boxes and a triangle

//sat_world.makeBox({ w:100, h:100, x: 240, y: 50, xVel: 0 });

//sat_world.makeTriangle({b: 50, h: 100, x: 300, y: 100, rotDeg: 45});

sat_world.makeBox({ w:100, h:100, x: 200, y: 400, xVel: 0, yVel: -100, rotDeg: 40 });

sat_world.makeBox({ w:150, h:70, x: 150, y: 150, xVel: 0, rotVelDeg: 45});

//walls

sat_world.makeBox({w:1000, h:100, x: 250, y: -50, mass: 0});
sat_world.makeBox({w:1000, h:100, x: 250, y: 550, mass: 0});

sat_world.makeBox({w:100, h:1000, x: -50, y: 250, mass: 0});
sat_world.makeBox({w:100, h:1000, x: 550, y: 250, mass: 0});

// Render loop

var hoveredEnt = null;
var grabbedEnt = null;
var grabbedOffset = vec2(0,0);

function drawAll() {
	var ents = sat_world.ents;
	hoveredEnt = null;
	if(grabbedEnt != null)
		grabbedEnt.vel.set(0,0);
	for(var i=0; i<ents.length; i++) {
		var poly = ents[i].getPoly();
		if(poly.contains(mousePos)) {
			hoveredEnt = ents[i];
			ctx.strokeStyle = "red";
		}
		else
			ctx.strokeStyle = "black";
			
		for(var j=i+1; j<ents.length && false; j++) {
			var cInfo = ents[i].getCollisionInfo(ents[j]);
			if(!cInfo.separate) {
				var pt = cInfo.contact;
				ctx.fillStyle = "blue";
				ctx.fillRect(pt.x - 5, pt.y - 5, 10, 10);
			}
		}
		poly.draw(ctx);
	}
}

function step() {
	window.requestAnimationFrame(step);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawAll();
	sat_world.step();
}
window.requestAnimationFrame(step);


var mousePos = vec2();
canvas.onmousemove = function(event) {
	mousePos.set(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
	if(grabbedEnt != null) {
		var curOffset = mousePos.sub(grabbedEnt.pos);
		var diff = curOffset.sub(grabbedOffset);
		grabbedEnt.pos.setAdd(diff);
	}
}

canvas.onmousedown = function(event) {
	grabbedEnt = hoveredEnt;
	if(grabbedEnt != null) {
		grabbedOffset = mousePos.sub(hoveredEnt.pos);
	}
}

canvas.onmouseup = function(event) { grabbedEnt = null; }
canvas.onmouseout = function() { grabbedEnt = null }
