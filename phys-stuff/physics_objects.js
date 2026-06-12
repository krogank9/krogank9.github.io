// ══════════════════════════════════════════════════════════════════════════
// Physics Objects Module
// Modular system for interactive physics objects with SVG overlays
// ══════════════════════════════════════════════════════════════════════════

/**
 * PhysicsObject - Base class for physics-enabled objects with SVG overlays
 * Handles activation, physics body creation, rendering, and reset logic
 */
class PhysicsObject {
	constructor(config) {
		this.world = config.world;
		this.ez = config.ez;
		this.viewHeight = config.viewHeight;
		
		// Display properties
		this.baseSize = config.baseSize || 40; // Base size in pixels (for screen-space objects)
		this.worldHeight = config.worldHeight || null; // Height in world units (for world-space objects)
		this.scale = 1;
		this.scaleTarget = config.scaleTarget || 1;
		this.scaleSpeed = config.scaleSpeed || 3;
		this.hovered = false;
		
		// Physics state
		this.body = null;
		this.activated = false;
		this.offScreenTime = 0;
		this.offScreenResetDelay = config.offScreenResetDelay || 3.0;
		
		// Position and rotation
		this.screenX = 0;
		this.screenY = 0;
		this.rotation = 0;
		
		// Shape type: 'circle' or 'box'
		this.shapeType = config.shapeType || 'box';
		// For boxes: aspect ratio (width/height), for circles: used to calculate radius from SVG
		this.aspectRatio = config.aspectRatio || 1;
		// For circles: the ratio of the physics circle to the SVG bounds
		this.physicsRadiusRatio = config.physicsRadiusRatio || 0.5;
		
		// Physics properties
		this.restitution = config.restitution ?? 0.3;
		this.friction = config.friction ?? 0.5;
		this.initialVelocity = config.initialVelocity || { x: 0, y: 0 };
		this.initialAngularVelocity = config.initialAngularVelocity || 0;
		
		// SVG rendering adjustments (for when SVG has padding around the content)
		this.svgScale = config.svgScale || { w: 1, h: 1 };
		this.svgOffset = config.svgOffset || { x: 0, y: 0 };
		
		// Image
		this.image = null;
		this.imageLoaded = false;

		// Packed WebGL mesh name (from svg-meshes.json); when available the
		// object draws as a vector mesh on the GL layer instead of drawImage
		this.meshName = config.meshName || null;
		
		// Callbacks
		this.getInitialPosition = config.getInitialPosition || (() => ({ x: 100, y: 100 }));
		
		// Interactivity
		this.interactive = config.interactive !== false; // Default true
		this.clickToActivate = config.clickToActivate !== false; // Default true
		this.hoverEffect = config.hoverEffect !== false; // Default true
		this.resetOnOffScreen = config.resetOnOffScreen !== false; // Default true
		
		// Initialize position
		const pos = this.getInitialPosition();
		this.screenX = pos.x;
		this.screenY = pos.y;
		
		const shouldLoadCanvasImage = !this.meshName ||
			typeof PhysRendererGL === 'undefined' ||
			!PhysRendererGL.available;

		// Load fallback image only when Canvas2D may need to render this object.
		if (shouldLoadCanvasImage && config.svgString) {
			this.loadSvgImage(config.svgString);
		} else if (shouldLoadCanvasImage && config.imageSrc) {
			this.loadImage(config.imageSrc);
		}
	}
	
	loadSvgImage(svgString) {
		this.image = new Image();
		const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
		this.image.src = 'data:image/svg+xml;base64,' + svgBase64;
		this.image.onload = () => {
			this.imageLoaded = true;
		};
	}
	
	loadImage(src) {
		this.image = new Image();
		this.image.src = src;
		this.image.onload = () => {
			this.imageLoaded = true;
		};
	}
	
	getWorldPos() {
		return this.ez.screenToWorld({ x: this.screenX, y: this.screenY });
	}
	
	isMouseOver(mouseOverCanvas, mousePos, lastMouseMoveTime) {
		if (!this.interactive || !this.hoverEffect) return false;
		if (!mouseOverCanvas || !mousePos) return false;
		if (Date.now() - lastMouseMoveTime > 500) return false;
		
		const mx = mousePos.x;
		const my = mousePos.y;
		// Use the larger of current scale or target scale for hit detection
		// This ensures clicks work on the enlarged area during hover animation
		const effectiveScale = Math.max(this.scale, this.hovered ? this.scaleTarget : this.scale);
		const sizeH = this.baseSize * effectiveScale;
		const sizeW = sizeH * this.aspectRatio;
		const halfW = sizeW / 2;
		const halfH = sizeH / 2;
		
		return mx >= this.screenX - halfW && mx <= this.screenX + halfW &&
		       my >= this.screenY - halfH && my <= this.screenY + halfH;
	}
	
	isTouchOver(touchX, touchY) {
		if (!this.interactive) return false;
		
		// Use the larger of current scale or target scale for hit detection
		const effectiveScale = Math.max(this.scale, this.hovered ? this.scaleTarget : this.scale);
		const sizeH = this.baseSize * effectiveScale;
		const sizeW = sizeH * this.aspectRatio;
		const halfW = sizeW / 2;
		const halfH = sizeH / 2;
		
		return touchX >= this.screenX - halfW && touchX <= this.screenX + halfW &&
		       touchY >= this.screenY - halfH && touchY <= this.screenY + halfH;
	}
	
	activate() {
		if (this.activated) return;
		
		// If already hovered (scaled up), start at full scale
		if (this.hovered) {
			this.scale = this.scaleTarget;
		}
		
		this.activated = true;
		
		const worldPos = this.getWorldPos();
		const canvasH = this.ez.canvas.height;
		
		// Calculate physics body size based on pixel size and view height
		const heightPx = this.baseSize * this.scaleTarget;
		const widthPx = heightPx * this.aspectRatio;
		
		if (this.shapeType === 'circle') {
			const radiusPx = heightPx * this.physicsRadiusRatio;
			const radius = (radiusPx / canvasH) * this.viewHeight;
			this.body = this.world.addCircle(worldPos.x, worldPos.y, radius, 1, false);
		} else {
			// Box
			const physWidth = (widthPx / canvasH) * this.viewHeight;
			const physHeight = (heightPx / canvasH) * this.viewHeight;
			this.body = this.world.addBox(worldPos.x, worldPos.y, physWidth, physHeight, 1, false);
		}
		
		this.body.restitution = this.restitution;
		this.body.friction = this.friction;
		this.body._renderHidden = true;
		
		this.body.velocity = new Vec2(this.initialVelocity.x, this.initialVelocity.y);
		this.body.angularVelocity = this.initialAngularVelocity;
	}
	
	isOffScreen() {
		if (!this.body) return false;
		
		const pos = this.body.position;
		const camScaleX = Math.abs(this.ez.camera.matrix.col1.x);
		const camScaleY = Math.abs(this.ez.camera.matrix.col2.y);
		const camPosX = this.ez.camera.matrix.col4.x;
		const camPosY = this.ez.camera.matrix.col4.y;
		const halfW = this.ez.canvas.width * 0.5 * camScaleX;
		const halfH = this.ez.canvas.height * 0.5 * camScaleY;
		
		const margin = 2;
		const left = camPosX - halfW - margin;
		const right = camPosX + halfW + margin;
		const bottom = camPosY - halfH - margin;
		const top = camPosY + halfH + margin;
		
		return pos.x < left || pos.x > right || pos.y < bottom || pos.y > top;
	}
	
	reset() {
		// Remove physics body from world
		if (this.body) {
			const idx = this.world.objects.indexOf(this.body);
			if (idx !== -1) {
				this.world.objects.splice(idx, 1);
			}
			this.body = null;
		}
		
		// Reset state
		this.activated = false;
		this.scale = 1;
		this.hovered = false;
		this.offScreenTime = 0;
		this.rotation = 0;
		
		// Reset to initial screen position
		const pos = this.getInitialPosition();
		this.screenX = pos.x;
		this.screenY = pos.y;
	}
	
	update(dt, mouseOverCanvas, mousePos, lastMouseMoveTime) {
		// Handle hover effect when not activated
		if (!this.activated) {
			if (this.hoverEffect) {
				this.hovered = this.isMouseOver(mouseOverCanvas, mousePos, lastMouseMoveTime);
				
				// Animate scale for hover effect
				const targetScale = this.hovered ? this.scaleTarget : 1;
				if (this.scale < targetScale) {
					this.scale = Math.min(this.scale + this.scaleSpeed * dt, targetScale);
				} else if (this.scale > targetScale) {
					this.scale = Math.max(this.scale - this.scaleSpeed * dt, targetScale);
				}
			}
			return;
		}
		
		if (!this.body) return;
		
		// Check if off-screen (only reset if resetOnOffScreen is enabled)
		if (this.resetOnOffScreen && this.isOffScreen()) {
			this.offScreenTime += dt;
			if (this.offScreenTime >= this.offScreenResetDelay) {
				this.reset();
				return;
			}
		} else {
			this.offScreenTime = 0;
		}
		
		// Animate scale towards target
		if (this.scale < this.scaleTarget) {
			this.scale = Math.min(this.scale + this.scaleSpeed * dt, this.scaleTarget);
		}
		
		// Update screen position from physics body
		const screenPos = this.ez.worldToScreen2D(this.body.position.x, this.body.position.y);
		this.screenX = screenPos.x;
		this.screenY = screenPos.y;
		this.rotation = this.body.rotation;
	}
	
	draw() {
		let sizeH, sizeW;
		
		if (this.worldHeight !== null) {
			// World-space object: convert world units to screen pixels
			// Use the camera scale to determine pixels per world unit
			const camScaleY = Math.abs(this.ez.camera.matrix.col2.y);
			const pixelsPerWorldUnit = 1 / camScaleY;
			sizeH = this.worldHeight * this.scale * pixelsPerWorldUnit;
			sizeW = sizeH * this.aspectRatio;
		} else {
			// Screen-space object: use pixel size directly
			sizeH = this.baseSize * this.scale;
			sizeW = sizeH * this.aspectRatio;
		}
		
		// SVG dimensions need to be scaled up if SVG has padding around content
		const svgDrawW = sizeW * this.svgScale.w;
		const svgDrawH = sizeH * this.svgScale.h;
		
		// Off-screen culling: skip drawing if object is outside canvas bounds
		// Use the larger dimension (accounting for rotation) as a conservative radius
		const cullRadius = Math.max(svgDrawW, svgDrawH) * 0.75;
		const canvasW = this.ez.canvas.width;
		const canvasH = this.ez.canvas.height;
		
		if (this.screenX + cullRadius < 0 || this.screenX - cullRadius > canvasW ||
		    this.screenY + cullRadius < 0 || this.screenY - cullRadius > canvasH) {
			return; // Object is off-screen, skip drawing
		}
		
		// Offset to center the visible content on the physics body
		const offsetX = this.svgOffset.x * svgDrawW;
		const offsetY = this.svgOffset.y * svgDrawH;

		// Prefer the WebGL vector mesh (sharp at any scale); falls back to
		// Canvas2D drawImage when GL or the mesh data is unavailable
		if (this.meshName && typeof PhysRendererGL !== 'undefined' &&
			PhysRendererGL.available && PhysRendererGL.hasMesh(this.meshName)) {
			PhysRendererGL.drawMesh(this.meshName, this.screenX, this.screenY,
				this.rotation, svgDrawW, svgDrawH, offsetX, offsetY);
			return;
		}

		if (!this.imageLoaded) return;

		const ctx = this.ez.ctx;
		ctx.save();
		ctx.translate(this.screenX, this.screenY);
		// Negate rotation because screen Y is down, world Y is up
		ctx.rotate(-this.rotation);
		ctx.drawImage(
			this.image,
			-svgDrawW / 2 + offsetX,
			-svgDrawH / 2 + offsetY,
			svgDrawW,
			svgDrawH
		);
		ctx.restore();
	}

	usesCanvas2DRender() {
		return !(this.meshName && typeof PhysRendererGL !== 'undefined' &&
			PhysRendererGL.available && PhysRendererGL.hasMesh(this.meshName));
	}
	
	// Get the physics body for preservation during simulation reset
	getBody() {
		return this.body;
	}
	
	// Re-attach a preserved body after simulation reset
	restoreBody(body) {
		if (body) {
			this.world.objects.push(body);
			this.body = body;
		}
	}
}


/**
 * PhysicsObjectsManager - Manages all physics objects in the scene
 */
class PhysicsObjectsManager {
	constructor(world, ez, viewHeight) {
		this.world = world;
		this.ez = ez;
		this.viewHeight = viewHeight;
		this.objects = [];
		
		// Mouse tracking state
		this.mouseOverCanvas = false;
		this.lastMouseMoveTime = 0;
		
		// Setup mouse tracking
		this.ez.canvas.addEventListener('mouseenter', () => { this.mouseOverCanvas = true; });
		this.ez.canvas.addEventListener('mouseleave', () => { this.mouseOverCanvas = false; });
		this.ez.canvas.addEventListener('mousemove', () => { this.lastMouseMoveTime = Date.now(); });
		
		// Setup click handling
		this.ez.canvas.addEventListener('click', (e) => this.handleClick(e));
		this.ez.canvas.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
		
		// Resize handling
		window.addEventListener('resize', () => this.handleResize());
	}
	
	add(config) {
		const obj = new PhysicsObject({
			world: this.world,
			ez: this.ez,
			viewHeight: this.viewHeight,
			...config
		});
		this.objects.push(obj);
		return obj;
	}
	
	handleClick(e) {
		// Check each object for click (in reverse order for proper z-ordering)
		for (let i = this.objects.length - 1; i >= 0; i--) {
			const obj = this.objects[i];
			if (!obj.activated && obj.clickToActivate && 
			    obj.isMouseOver(this.mouseOverCanvas, this.ez.mousePos, this.lastMouseMoveTime)) {
				obj.activate();
				return; // Only activate one object per click
			}
		}
	}
	
	handleTouch(e) {
		if (e.touches.length !== 1) return;
		
		const touch = e.touches[0];
		const rect = this.ez.canvas.getBoundingClientRect();
		const scaleX = this.ez.canvas.width / rect.width;
		const scaleY = this.ez.canvas.height / rect.height;
		const touchX = (touch.clientX - rect.left) * scaleX;
		const touchY = (touch.clientY - rect.top) * scaleY;
		
		// Check each object for touch (in reverse order)
		for (let i = this.objects.length - 1; i >= 0; i--) {
			const obj = this.objects[i];
			if (!obj.activated && obj.clickToActivate && obj.isTouchOver(touchX, touchY)) {
				obj.activate();
				e.preventDefault();
				return;
			}
		}
	}
	
	handleResize() {
		// Update positions for non-activated objects
		for (const obj of this.objects) {
			if (!obj.activated) {
				const pos = obj.getInitialPosition();
				obj.screenX = pos.x;
				obj.screenY = pos.y;
			}
		}
	}
	
	update(dt) {
		// Check if any object is hovered for cursor styling
		let anyHovered = false;
		
		for (const obj of this.objects) {
			obj.update(dt, this.mouseOverCanvas, this.ez.mousePos, this.lastMouseMoveTime);
			if (obj.hovered && !obj.activated) {
				anyHovered = true;
			}
		}
		
		// Update cursor style
		if (anyHovered) {
			this.ez.canvas.style.cursor = 'pointer';
		} else if (this.ez.canvas.style.cursor === 'pointer') {
			this.ez.canvas.style.cursor = '';
		}
	}
	
	draw() {
		for (const obj of this.objects) {
			obj.draw();
		}
	}

	needsCanvas2DRender() {
		for (const obj of this.objects) {
			if (obj.usesCanvas2DRender()) return true;
		}
		return false;
	}
	
	// Get all active physics bodies (for preservation during simulation reset)
	getActiveBodies() {
		const bodies = [];
		for (const obj of this.objects) {
			if (obj.body) {
				bodies.push({ obj, body: obj.body });
			}
		}
		return bodies;
	}
	
	// Restore preserved bodies after simulation reset
	restoreBodies(savedBodies) {
		for (const { obj, body } of savedBodies) {
			obj.restoreBody(body);
		}
	}
	
	// Reset all objects
	resetAll() {
		for (const obj of this.objects) {
			obj.reset();
		}
	}
}


// ══════════════════════════════════════════════════════════════════════════
// Predefined Object Configurations
// ══════════════════════════════════════════════════════════════════════════

const MOBILE_BREAKPOINT = 640;

/**
 * Creates the logo physics object configuration
 */
function createLogoConfig() {
	const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="44 0 90 90" width="90" height="90">
		<defs><style>.cls-1{fill:none;stroke:#1a1a1a;stroke-miterlimit:10;stroke-width:4px;}</style></defs>
		<circle class="cls-1" cx="88.59" cy="45" r="39.43"/>
		<path class="cls-1" d="M87.53,67.89H79.14C72.85,67.9,68,66.25,64.78,63c-2.92-3-4.32-7-4.17-12V26.87h7V51.15c-.1,3.09.6,5.35,2.15,6.91,2.48,2.5,6.9,2.92,10.17,2.84h7.61"/>
		<line class="cls-1" x1="88.28" y1="45.34" x2="112.44" y2="24.24"/>
		<line class="cls-1" x1="112.44" y1="65.76" x2="88.28" y2="44.66"/>
		<line class="cls-1" x1="88.28" y1="5.25" x2="88.28" y2="84.11"/>
	</svg>`;
	
	return {
		svgString: svgString,
		meshName: 'logo',
		baseSize: 40,
		scaleTarget: 1.5,
		scaleSpeed: 3,
		shapeType: 'circle',
		aspectRatio: 1,
		physicsRadiusRatio: 39.43 / 90, // Circle radius relative to viewBox
		restitution: 0.3,
		friction: 0.5,
		initialVelocity: { x: 3, y: 0 },
		initialAngularVelocity: -5,
		getInitialPosition: () => {
			const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
			if (isMobile) {
				return { x: 24 + 20, y: 24 + 20 };
			} else {
				return { x: 32 + 20, y: 36 };
			}
		}
	};
}

/**
 * Creates configuration for a cardboard box
 * @param {number} sizeMultiplier - Size multiplier (1 = base size)
 * @param {function} getInitialPosition - Function returning initial {x, y} position
 */
function createCardboardBoxConfig(sizeMultiplier, getInitialPosition) {
	// SVG viewBox is 586x336
	// But the actual box content is offset by translate(17, 17) and the box itself 
	// starts at ~16,9 within that group, so total offset is ~33,26
	// The visible box is approximately 520x284 within the 586x336 viewBox
	
	// We want the physics to match the visible box, not the full SVG
	const svgWidth = 586;
	const svgHeight = 336;
	const boxWidth = 520;  // Approximate visible box width
	const boxHeight = 284; // Approximate visible box height
	
	// Aspect ratio of the VISIBLE box (not the SVG viewBox)
	const aspectRatio = boxWidth / boxHeight;
	
	// How much the SVG is larger than the visible box (for scaling the render)
	const svgToBoxScaleW = svgWidth / boxWidth;
	const svgToBoxScaleH = svgHeight / boxHeight;
	
	// Offset of box center within SVG (in normalized 0-1 coordinates)
	// Box starts at ~33 from left, so center is at 33 + 260 = 293 out of 586
	// Box starts at ~26 from top, so center is at 26 + 142 = 168 out of 336
	const boxCenterX = (33 + boxWidth / 2) / svgWidth;  // ~0.5 (roughly centered)
	const boxCenterY = (26 + boxHeight / 2) / svgHeight; // ~0.5 (roughly centered)
	
	return {
		imageSrc: '../images/cardboard%20box.svg',
		meshName: 'cardboard-box',
		baseSize: 100 * sizeMultiplier, // Base height in pixels (bigger!)
		scaleTarget: 1,
		scaleSpeed: 3,
		shapeType: 'box',
		aspectRatio: aspectRatio,
		// Store SVG scaling info for proper rendering
		svgScale: { w: svgToBoxScaleW, h: svgToBoxScaleH },
		svgOffset: { x: (0.5 - boxCenterX), y: (0.5 - boxCenterY) }, // Offset to center
		restitution: 0.2,
		friction: 0.6,
		initialVelocity: { x: 0, y: 0 },
		initialAngularVelocity: 0,
		hoverEffect: false, // Boxes don't have hover effect
		clickToActivate: false, // Boxes are already activated
		interactive: false,
		resetOnOffScreen: false, // Don't respawn when kicked off screen
		getInitialPosition: getInitialPosition
	};
}

/**
 * Creates a stack of 3 cardboard boxes on the right side of the screen
 * @param {PhysicsObjectsManager} manager - The physics objects manager
 * @param {number} viewHeight - The view height in world units
 */
function createStackedBoxes(manager, viewHeight) {
	const GROUND_Y = -3;
	
	// Box sizes in WORLD UNITS (consistent across all screen sizes)
	// These are heights - the ragdoll is roughly 4-5 world units tall
	const baseBoxWorldHeight = 1.8; // Base box height in world units
	const boxSizes = [1.0, 0.85, 0.7]; // bottom, middle, top (multipliers)
	
	// Aspect ratio of visible box content (520x284)
	const aspectRatio = 520 / 284;
	
	const boxes = [];
	
	for (let i = 0; i < 3; i++) {
		const sizeMultiplier = boxSizes[i];
		const worldHeight = baseBoxWorldHeight * sizeMultiplier;
		
		// Create configuration for this box
		const config = createCardboardBoxConfig(sizeMultiplier, () => {
			return { x: 0, y: 0 };
		});
		
		// Add to manager and set world height
		const box = manager.add(config);
		box.worldHeight = worldHeight; // Use world units for consistent sizing
		boxes.push({ box, sizeMultiplier, worldHeight });
	}
	
	// Now activate all boxes and position them
	const activateStackedBoxes = () => {
		const canvasW = manager.ez.canvas.width;
		const canvasH = manager.ez.canvas.height;
		
		// Position on the right side of the screen, in world coordinates
		const rightEdgeWorld = manager.ez.screenToWorld({ x: canvasW, y: canvasH / 2 });
		
		// Calculate a fixed X position based on the largest (bottom) box
		const largestWorldHeight = baseBoxWorldHeight * boxSizes[0];
		const largestWorldWidth = largestWorldHeight * aspectRatio;
		const fixedX = rightEdgeWorld.x - largestWorldWidth * 0.55 - 0.5;
		
		// Stack boxes from ground up
		let currentY = GROUND_Y;
		
		for (let i = 0; i < boxes.length; i++) {
			const { box, worldHeight } = boxes[i];
			
			// Physics dimensions in world units
			const physHeight = worldHeight;
			const physWidth = physHeight * aspectRatio;
			
			// All boxes use the same X position (centered on the stack)
			const boxX = fixedX;
			
			// Y position: stack from ground up
			const boxY = currentY + physHeight / 2;
			currentY += physHeight + 0.02; // Small gap between boxes
			
			// Create physics body directly (low density for light cardboard feel)
			box.body = box.world.addBox(boxX, boxY, physWidth, physHeight, 0.15, false);
			box.body.restitution = box.restitution;
			box.body.friction = box.friction;
			box.body._renderHidden = true;
			box.activated = true;
			box.scale = box.scaleTarget;
			
			// Update screen position from physics
			const screenPos = box.ez.worldToScreen2D(box.body.position.x, box.body.position.y);
			box.screenX = screenPos.x;
			box.screenY = screenPos.y;
		}
	};
	
	// Activate immediately if canvas is ready, otherwise wait a frame
	if (manager.ez.canvas.width > 0 && manager.ez.canvas.height > 0) {
		activateStackedBoxes();
	} else {
		requestAnimationFrame(activateStackedBoxes);
	}
	
	return boxes.map(b => b.box);
}

/**
 * Creates a computer screen physics object with composite collision shapes
 * SVG viewBox: 30x16
 * Shapes: screen (main rectangle), stand pole, stand base
 */
function createComputerScreenConfig() {
	// SVG dimensions
	const svgWidth = 30;
	const svgHeight = 16;
	
	// Choose center of mass - roughly center of main screen (the heaviest part)
	// Screen frame center: x=15, y=6.6 (this will be our 0,0)
	const comX = 15;
	const comY = 6.6;
	
	// Define shapes relative to center of mass (in SVG units)
	// Screen frame: x=7.359, y=2.04, w=15.283, h=9.133
	const screenRect = {
		x: 7.359 - comX,
		y: 2.04 - comY,
		w: 15.283,
		h: 9.133
	};
	
	// Stand pole: x=13.387, y=10.885, w=3.226, h=2.67
	const poleRect = {
		x: 13.387 - comX,
		y: 10.885 - comY,
		w: 3.226,
		h: 2.67
	};
	
	// Stand base: x=11.453, y=13.365, w=7.094, h=0.544
	const baseRect = {
		x: 11.453 - comX,
		y: 13.365 - comY,
		w: 7.094,
		h: 0.544
	};
	
	// SVG offset to align COM with render center
	// SVG center is at (svgWidth/2, svgHeight/2), COM is at (comX, comY)
	// Offset needed (in normalized coords): (0.5 - comX/svgWidth, 0.5 - comY/svgHeight)
	const svgOffsetX = 0.5 - comX / svgWidth;
	const svgOffsetY = 0.5 - comY / svgHeight;
	
	return {
		imageSrc: '../images/computer%20screen.svg',
		meshName: 'computer-screen',
		svgWidth: svgWidth,
		svgHeight: svgHeight,
		comOffset: { x: comX, y: comY },
		collisionShapes: [screenRect, poleRect, baseRect],
		aspectRatio: svgWidth / svgHeight,
		svgScale: { w: 1, h: 1 },
		svgOffset: { x: svgOffsetX, y: svgOffsetY },
		restitution: 0.2,
		friction: 0.5,
		hoverEffect: false,
		clickToActivate: false,
		interactive: false,
		resetOnOffScreen: false
	};
}

/**
 * Creates a computer table physics object with composite collision shapes
 * SVG viewBox: 30x24 (with transform translate(0, -9.93))
 * Shapes: front tabletop, back tabletop, left leg, right leg
 */
function createComputerTableConfig() {
	// SVG dimensions
	const svgWidth = 30;
	const svgHeight = 24;
	const yOffset = -9.93; // Transform offset
	
	// Rects in SVG local coords (before transform)
	// We need to apply the transform to get visual positions
	// Visual y = rect y + yOffset (since transform is negative, visual y = rect y - 9.93)
	
	// Front tabletop: x=1.504, y=13.901, w=26.993, h=0.948
	// Visual: y = 13.901 - 9.93 = 3.971
	const frontTop = {
		x: 1.504,
		y: 13.901 + yOffset,
		w: 26.993,
		h: 0.948
	};
	
	// Back tabletop: x=4.192, y=14.868, w=21.616, h=0.87
	// Visual: y = 14.868 - 9.93 = 4.938
	const backTop = {
		x: 4.192,
		y: 14.868 + yOffset,
		w: 21.616,
		h: 0.87
	};
	
	// Left leg: x=3.053, y=14.873, w=1.19, h=16.087
	// Visual: y = 14.873 - 9.93 = 4.943
	const leftLeg = {
		x: 3.053,
		y: 14.873 + yOffset,
		w: 1.19,
		h: 16.087
	};
	
	// Right leg: x=25.793, y=14.873, w=1.19, h=16.087
	const rightLeg = {
		x: 25.793,
		y: 14.873 + yOffset,
		w: 1.19,
		h: 16.087
	};
	
	// Center of mass - roughly center of table horizontally, weighted toward top vertically
	const comX = 15;
	const comY = 8; // Somewhere between tabletop and middle of legs
	
	// Adjust all rects relative to COM
	const shapes = [frontTop, backTop, leftLeg, rightLeg].map(r => ({
		x: r.x - comX,
		y: r.y - comY,
		w: r.w,
		h: r.h
	}));
	
	// SVG offset to align COM with render center
	const svgOffsetX = 0.5 - comX / svgWidth;
	const svgOffsetY = 0.5 - comY / svgHeight;
	
	return {
		imageSrc: '../images/computer%20table.svg',
		meshName: 'computer-table',
		svgWidth: svgWidth,
		svgHeight: svgHeight,
		comOffset: { x: comX, y: comY },
		collisionShapes: shapes,
		aspectRatio: svgWidth / svgHeight,
		svgScale: { w: 1, h: 1 },
		svgOffset: { x: svgOffsetX, y: svgOffsetY },
		restitution: 0.1,
		friction: 0.7,
		hoverEffect: false,
		clickToActivate: false,
		interactive: false,
		resetOnOffScreen: false
	};
}

/**
 * Creates a composite physics object from rectangular collision shapes
 * @param {PhysWorld} world - The physics world
 * @param {number} x - World X position
 * @param {number} y - World Y position
 * @param {Array} shapeRects - Array of {x, y, w, h} in local coords relative to COM
 * @param {number} scale - Scale factor from SVG units to world units
 * @param {number} density - Physics density
 */
function createCompositeBody(world, x, y, shapeRects, scale, density) {
	// Convert shape rects to ConvexPolygonShape vertices
	// Note: SVG Y is down, physics Y is up, so we need to flip Y
	const shapes = shapeRects.map(rect => {
		const hw = rect.w * scale / 2;
		const hh = rect.h * scale / 2;
		const cx = rect.x * scale + hw;
		const cy = -(rect.y * scale + hh); // Flip Y
		
		// Create box vertices (CCW order for physics)
		return new ConvexPolygonShape([
			new Vec2(cx - hw, cy - hh),
			new Vec2(cx + hw, cy - hh),
			new Vec2(cx + hw, cy + hh),
			new Vec2(cx - hw, cy + hh)
		]);
	});
	
	// Calculate total mass and approximate moment of inertia
	let totalMass = 0;
	let totalMoI = 0;
	
	for (const rect of shapeRects) {
		const w = rect.w * scale;
		const h = rect.h * scale;
		const area = w * h;
		const mass = density * area;
		totalMass += mass;
		
		// MoI of rectangle about its center + parallel axis theorem
		const cx = rect.x * scale + w / 2;
		const cy = -(rect.y * scale + h / 2);
		const moiLocal = (mass * (w * w + h * h)) / 12;
		const distSq = cx * cx + cy * cy;
		totalMoI += moiLocal + mass * distSq;
	}
	
	const body = new PhysObject(x, y, shapes, false, totalMass, totalMoI);
	world.objects.push(body);
	return body;
}

/**
 * Creates the computer desk setup (table with screen on top) on the left side
 * @param {PhysicsObjectsManager} manager - The physics objects manager
 * @param {number} viewHeight - The view height in world units
 */
function createComputerDesk(manager, viewHeight) {
	const GROUND_Y = -3;
	
	// World unit sizes for the objects
	const tableWorldHeight = 4.5; // Table height in world units
	const screenWorldHeight = 2.2; // Screen height in world units
	
	// Get table config
	const tableConfig = createComputerTableConfig();
	const tableScale = tableWorldHeight / tableConfig.svgHeight;
	const tableWorldWidth = tableConfig.svgWidth * tableScale;
	
	// Get screen config
	const screenConfig = createComputerScreenConfig();
	const screenScale = screenWorldHeight / screenConfig.svgHeight;
	const screenWorldWidth = screenConfig.svgWidth * screenScale;
	
	// Create table PhysicsObject for rendering
	const tableObj = manager.add({
		...tableConfig,
		worldHeight: tableWorldHeight,
		baseSize: 100 // Fallback, won't be used since worldHeight is set
	});
	
	// Create screen PhysicsObject for rendering
	const screenObj = manager.add({
		...screenConfig,
		worldHeight: screenWorldHeight,
		baseSize: 100
	});
	
	const activateDesk = () => {
		const canvasW = manager.ez.canvas.width;
		const canvasH = manager.ez.canvas.height;
		
		// Calculate where the ragdoll spawns (same logic as getSpawnX in ragdoll code)
		// Ragdoll spawns off the left edge, capped at -8 on wide screens
		const aspect = canvasW / canvasH;
		const viewW = viewHeight * aspect;
		const offScreenX = -(viewW * 0.5) - 1;
		const ragdollSpawnX = Math.max(offScreenX, -8);
		
		// Table position - right edge must be LEFT of ragdoll spawn
		// Ragdoll is about 1.5 units wide, add buffer for safety
		const buffer = 2.95;
		const tableRightEdgeX = ragdollSpawnX - buffer;
		const tableX = tableRightEdgeX - tableWorldWidth / 2;
		
		// Table Y - COM offset from bottom of table
		// Table legs go from y=4.943 to y=21.03 in SVG (height 16.087)
		// COM is at y=8 in SVG coords
		// So COM is (8 - 4.943) = 3.057 SVG units from top of legs
		// In world units: 3.057 * tableScale from top
		// Top of legs is at GROUND_Y + legHeight
		const tableLegHeightSvg = 16.087;
		const tableLegHeight = tableLegHeightSvg * tableScale;
		const tableComOffsetFromTop = (tableConfig.comOffset.y - 4.943) * tableScale;
		const tableY = GROUND_Y + tableLegHeight - tableComOffsetFromTop;
		
		// Create composite physics body for table
		tableObj.body = createCompositeBody(
			manager.world,
			tableX,
			tableY,
			tableConfig.collisionShapes,
			tableScale,
			0.8 // Heavier - it's a table
		);
		tableObj.body.restitution = tableObj.restitution;
		tableObj.body.friction = tableObj.friction;
		tableObj.body._renderHidden = true;
		tableObj.activated = true;
		tableObj.scale = tableObj.scaleTarget;
		tableObj.worldHeight = tableWorldHeight;
		
		// Screen position - on top of the table
		// Table front top is at y=3.971 in visual SVG coords, COM at y=8
		// So front top is at (8 - 3.971) * tableScale above COM = 4.029 * tableScale
		const tableTopOffsetFromCom = (tableConfig.comOffset.y - 3.971) * tableScale;
		const tableTopY = tableY + tableTopOffsetFromCom;
		
		// Screen COM is at y=6.6 in its SVG, base is at y=13.909 (bottom of base rect)
		// So screen COM is (13.909 - 6.6) * screenScale above the bottom
		const screenBottomToComSvg = 13.909 - screenConfig.comOffset.y;
		const screenBottomToCom = screenBottomToComSvg * screenScale;
		const screenY = tableTopY + screenBottomToCom + 0.05; // Small gap
		const screenX = tableX; // Centered on table
		
		// Create composite physics body for screen
		screenObj.body = createCompositeBody(
			manager.world,
			screenX,
			screenY,
			screenConfig.collisionShapes,
			screenScale,
			0.3 // Lighter than table
		);
		screenObj.body.restitution = screenObj.restitution;
		screenObj.body.friction = screenObj.friction;
		screenObj.body._renderHidden = true;
		screenObj.activated = true;
		screenObj.scale = screenObj.scaleTarget;
		screenObj.worldHeight = screenWorldHeight;
		
		// Update screen positions
		const tableScreenPos = manager.ez.worldToScreen2D(tableObj.body.position.x, tableObj.body.position.y);
		tableObj.screenX = tableScreenPos.x;
		tableObj.screenY = tableScreenPos.y;
		
		const screenScreenPos = manager.ez.worldToScreen2D(screenObj.body.position.x, screenObj.body.position.y);
		screenObj.screenX = screenScreenPos.x;
		screenObj.screenY = screenScreenPos.y;
	};
	
	// Activate when ready
	if (manager.ez.canvas.width > 0 && manager.ez.canvas.height > 0) {
		activateDesk();
	} else {
		requestAnimationFrame(activateDesk);
	}
	
	return [tableObj, screenObj];
}
