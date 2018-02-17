canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
sat_world = new phys_world();

//walls
sat_world.makeBox({w:1000, h:100, x: 250, y: -50, mass: 0});
sat_world.makeBox({w:1000, h:100, x: 250, y: 550, mass: 0});

sat_world.makeBox({w:100, h:1000, x: -50, y: 250, mass: 0});
sat_world.makeBox({w:100, h:1000, x: 550, y: 250, mass: 0});

//ceiling
var ceiling = sat_world.makeBox({w:300, h:50, x: 250, y: 25, mass: 0});

//chains
var ch1 = sat_world.makeBox({w:50, h:50, x: 250, y: 75, rotDeg: 45, xVel: 500, yVel: 0});

sat_world.makeJointConstraint(ceiling, ch1, vec2(0,0), vec2(-25,-25));

// Render loop

var hoveredEnt = null;
var grabbedEnt = null;
var grabbedOffset = vec2(0,0);

function drawAll() {
	var ents = sat_world.ents;
	hoveredEnt = null;
	if(grabbedEnt != null) {
		grabbedEnt.vel.set(0,0);
		grabbedEnt.rotVel = 0;
	}
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
	//drawArrow(vec2(0,0), vec2(100,100));
	sat_world.step();
}
window.requestAnimationFrame(step);

var lastTime = 0;
var releaseVel = vec2(0,0);
var mousePos = vec2(0,0);
canvas.onmousemove = function(event) {
	var elapsed = Math.min(Date.now() - lastTime, 10);
	var speed = 1000/elapsed;
	
	var newX = event.clientX - canvas.offsetLeft;
	var newY = event.clientY - canvas.offsetTop;
	var deltaX = mousePos.x - newX;
	var deltaY = mousePos.y - newY;
	releaseVel.set(deltaX*speed, deltaY*speed);
	mousePos.set(newX, newY);
	if(grabbedEnt != null) {
		var curOffset = mousePos.sub(grabbedEnt.pos);
		var diff = curOffset.sub(grabbedOffset);
		grabbedEnt.pos.setAdd(diff);
	}
	lastTime = Date.now();
}

canvas.onmousedown = function(event) {
	grabbedEnt = hoveredEnt;
	if(grabbedEnt != null) {
		grabbedOffset = mousePos.sub(hoveredEnt.pos);
	}
}

canvas.onmouseup = function(event) {
	if(grabbedEnt != null && Date.now() - lastTime < 30) {
		grabbedEnt.vel.set(releaseVel.scale(-1));
	}
	grabbedEnt = null;
}
canvas.onmouseout = function() { grabbedEnt = null }


// utility functions:

function drawArrow(startVec, endVec) {
	ctx.moveTo(startVec.x, startVec.y);
	ctx.lineTo(endVec.x, endVec.y);
	var revVec = startVec.sub(endVec).normal();
	var side1 = endVec.add( revVec.rotateDeg(45).scale(10) );
	var side2 = endVec.add( revVec.rotateDeg(-45).scale(10) );
	ctx.lineTo(side1.x, side1.y);
	ctx.moveTo(endVec.x, endVec.y);
	ctx.lineTo(side2.x, side2.y);
	ctx.stroke();
}
