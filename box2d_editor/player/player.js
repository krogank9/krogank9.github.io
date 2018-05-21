$("#player_dialog").dialog({
	autoOpen: false,
	modal: true,
	resizable: false,
	width: 'auto',
	buttons: {
		"Close": function() {
			$( this ).dialog("close");
		}
	},
	open: function() {
		current_tool.action_cancelled();
		
		//export the current world
		var json = export_world_rube(world);
		b2d_world = loadWorldFromRUBE(JSON.parse(json));
		mouse_joint_ground_body = b2d_world.CreateBody( new b2BodyDef() );
		
		player_offset.set_equal_to(convert_offset(viewport.pos));
		
		var newzoom = viewport.zoom * player_canvas.width/canvas.width;
		player_scale = meters_to_px * newzoom;
		
		debugDraw.SetDrawScale(player_scale);
		b2d_world.SetDebugDraw(debugDraw);

		world_pause = false;
		requestAnimationFrame(update_world);
	},
	close: function() {
		world_pause = true;
	}
});

// Convert viewport position on bigger window to smaller window
function convert_offset(pos) {
	var percent_x = pos.x/canvas.width;
	var percent_y = pos.y/canvas.height;
	var x = percent_x*player_canvas.width;
	var y = percent_y*player_canvas.height;
	return new vec(x,y-player_canvas.height);
}

var	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
	b2EdgeChainDef = Box2D.Collision.Shapes.b2EdgeChainDef,
	b2EdgeShape = Box2D.Collision.Shapes.b2EdgeShape,
	b2MassData = Box2D.Collision.Shapes.b2MassData,
	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
	b2Shape = Box2D.Collision.Shapes.b2Shape,
	b2CircleContact = Box2D.Dynamics.Contacts.b2CircleContact,
	b2Contact = Box2D.Dynamics.Contacts.b2Contact,
	b2ContactConstraint = Box2D.Dynamics.Contacts.b2ContactConstraint,
	b2ContactConstraintPoint = Box2D.Dynamics.Contacts.b2ContactConstraintPoint,
	b2ContactEdge = Box2D.Dynamics.Contacts.b2ContactEdge,
	b2ContactFactory = Box2D.Dynamics.Contacts.b2ContactFactory,
	b2ContactRegister = Box2D.Dynamics.Contacts.b2ContactRegister,
	b2ContactResult = Box2D.Dynamics.Contacts.b2ContactResult,
	b2ContactSolver = Box2D.Dynamics.Contacts.b2ContactSolver,
	b2EdgeAndCircleContact = Box2D.Dynamics.Contacts.b2EdgeAndCircleContact,
	b2NullContact = Box2D.Dynamics.Contacts.b2NullContact,
	b2PolyAndCircleContact = Box2D.Dynamics.Contacts.b2PolyAndCircleContact,
	b2PolyAndEdgeContact = Box2D.Dynamics.Contacts.b2PolyAndEdgeContact,
	b2PolygonContact = Box2D.Dynamics.Contacts.b2PolygonContact,
	b2PositionSolverManifold = Box2D.Dynamics.Contacts.b2PositionSolverManifold,
	b2Body = Box2D.Dynamics.b2Body,
	b2_staticBody = Box2D.Dynamics.b2Body.b2_staticBody,
	b2_kinematicBody = Box2D.Dynamics.b2Body.b2_kinematicBody,
	b2_dynamicBody = Box2D.Dynamics.b2Body.b2_dynamicBody,
	b2BodyDef = Box2D.Dynamics.b2BodyDef,
	b2ContactFilter = Box2D.Dynamics.b2ContactFilter,
	b2ContactImpulse = Box2D.Dynamics.b2ContactImpulse,
	b2ContactListener = Box2D.Dynamics.b2ContactListener,
	b2ContactManager = Box2D.Dynamics.b2ContactManager,
	b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
	b2DestructionListener = Box2D.Dynamics.b2DestructionListener,
	b2FilterData = Box2D.Dynamics.b2FilterData,
	b2Fixture = Box2D.Dynamics.b2Fixture,
	b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
	b2Island = Box2D.Dynamics.b2Island,
	b2TimeStep = Box2D.Dynamics.b2TimeStep,
	b2World = Box2D.Dynamics.b2World,
	b2Color = Box2D.Common.b2Color,
	b2internal = Box2D.Common.b2internal,
	b2Settings = Box2D.Common.b2Settings,
	b2Mat22 = Box2D.Common.Math.b2Mat22,
	b2Mat33 = Box2D.Common.Math.b2Mat33,
	b2Math = Box2D.Common.Math.b2Math,
	b2Sweep = Box2D.Common.Math.b2Sweep,
	b2Transform = Box2D.Common.Math.b2Transform,
	b2Vec2 = Box2D.Common.Math.b2Vec2,
	b2Vec3 = Box2D.Common.Math.b2Vec3,
	b2AABB = Box2D.Collision.b2AABB,
	b2Bound = Box2D.Collision.b2Bound,
	b2BoundValues = Box2D.Collision.b2BoundValues,
	b2Collision = Box2D.Collision.b2Collision,
	b2ContactID = Box2D.Collision.b2ContactID,
	b2ContactPoint = Box2D.Collision.b2ContactPoint,
	b2Distance = Box2D.Collision.b2Distance,
	b2DistanceInput = Box2D.Collision.b2DistanceInput,
	b2DistanceOutput = Box2D.Collision.b2DistanceOutput,
	b2DistanceProxy = Box2D.Collision.b2DistanceProxy,
	b2DynamicTree = Box2D.Collision.b2DynamicTree,
	b2DynamicTreeBroadPhase = Box2D.Collision.b2DynamicTreeBroadPhase,
	b2DynamicTreeNode = Box2D.Collision.b2DynamicTreeNode,
	b2DynamicTreePair = Box2D.Collision.b2DynamicTreePair,
	b2Manifold = Box2D.Collision.b2Manifold,
	b2ManifoldPoint = Box2D.Collision.b2ManifoldPoint,
	b2Point = Box2D.Collision.b2Point,
	b2RayCastInput = Box2D.Collision.b2RayCastInput,
	b2RayCastOutput = Box2D.Collision.b2RayCastOutput,
	b2Segment = Box2D.Collision.b2Segment,
	b2SeparationFunction = Box2D.Collision.b2SeparationFunction,
	b2Simplex = Box2D.Collision.b2Simplex,
	b2SimplexCache = Box2D.Collision.b2SimplexCache,
	b2SimplexVertex = Box2D.Collision.b2SimplexVertex,
	b2TimeOfImpact = Box2D.Collision.b2TimeOfImpact,
	b2TOIInput = Box2D.Collision.b2TOIInput,
	b2WorldManifold = Box2D.Collision.b2WorldManifold,
	ClipVertex = Box2D.Collision.ClipVertex,
	Features = Box2D.Collision.Features,
	IBroadPhase = Box2D.Collision.IBroadPhase,
	b2Joint = Box2D.Dynamics.Joints.b2Joint,
	b2JointDef = Box2D.Dynamics.Joints.b2JointDef,
	b2JointEdge = Box2D.Dynamics.Joints.b2JointEdge,
	b2LineJoint = Box2D.Dynamics.Joints.b2LineJoint,
	b2LineJointDef = Box2D.Dynamics.Joints.b2LineJointDef,
	b2MouseJoint = Box2D.Dynamics.Joints.b2MouseJoint,
	b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef,
	b2PrismaticJoint = Box2D.Dynamics.Joints.b2PrismaticJoint,
	b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef,
	b2PulleyJoint = Box2D.Dynamics.Joints.b2PulleyJoint,
	b2PulleyJointDef = Box2D.Dynamics.Joints.b2PulleyJointDef,
	b2RevoluteJoint = Box2D.Dynamics.Joints.b2RevoluteJoint,
	b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef,
	b2WeldJoint = Box2D.Dynamics.Joints.b2WeldJoint,
	b2WeldJointDef = Box2D.Dynamics.Joints.b2WeldJointDef,
	b2DistanceJoint = Box2D.Dynamics.Joints.b2DistanceJoint,
	b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef,
	b2FrictionJoint = Box2D.Dynamics.Joints.b2FrictionJoint,
	b2FrictionJointDef = Box2D.Dynamics.Joints.b2FrictionJointDef;

var player_canvas = document.getElementById("box2d_player");
var player_context = player_canvas.getContext('2d');

var b2d_world;

var debugDraw = new b2DebugDraw();
debugDraw.SetSprite(player_canvas.getContext("2d"));
debugDraw.SetDrawScale(1.0 * meters_to_px * viewport.zoom);
debugDraw.SetFillAlpha(0.5);
debugDraw.SetLineThickness(1.0);
debugDraw.SetFlags(b2DebugDraw.e_shapeBit /*| b2DebugDraw.e_jointBit*/);

var world_pause = true;
var player_offset = new vec(0,0);
var player_scale = 1.0;
var context_scale = 1.0;
function update_world() {
	b2d_world.Step(1 / 60, 10, 10);
	
	//black background
	player_context.fillStyle = 'rgb(0,0,0)';
	player_context.clearRect( 0, 0, player_canvas.width, player_canvas.height );
	
	player_context.save();
	player_context.scale(1,-1);
	player_context.translate(0,-player_canvas.height);
	player_context.translate(player_offset.x,-player_offset.y);
	b2d_world.DrawDebugData();
	player_context.restore();
	
	b2d_world.ClearForces();
	
	if(world_pause === true)
		return;
	else
		requestAnimationFrame(update_world);
};


var mouse_joint = null;
var mouse_joint_ground_body = null;
var mouse_pos_world = new vec(0,0);
function pixel_to_world(pos) {
	var pos = copy_vec(pos);
	
	// flip the y because in box2d 0 is at the bottom not the top like canvas
	pos.y *= -1;
	pos.y += player_canvas.height;
	
	pos.x -= player_offset.x;
	pos.y += player_offset.y;
	
	pos = pos.scale(1/player_scale);
	return pos;
}

function world_to_pixel(pos) {
	var pos = copy_vec(pos);
	
	pos = pos.scale(player_scale);
	
	pos.x += player_offset.x;
	pos.y -= player_offset.y;
	
	pos.y *= -1;
	pos.y += player_canvas.height;

	return pos;
}

var MouseDownQueryCallback = function() {
	this.m_fixture = null;
	this.m_point = new b2Vec2();
}
MouseDownQueryCallback.prototype.ReportFixture = function(fixture) {
	if(fixture.GetBody().GetType() == 2) { //dynamic bodies only
		if ( fixture.TestPoint(this.m_point) ) {
			this.m_fixture = fixture;
			return false;
		}
	}
	return true;
};
var mouseDownQueryCallback = new MouseDownQueryCallback();

function create_mouse_joint() {
	if( mouse_joint !== null )
		return;
		
	// Make a small box.
	var aabb = new b2AABB();
	var d = 0.001;            
	aabb.lowerBound.Set(mouse_pos_world.x - d, mouse_pos_world.y - d);
	aabb.upperBound.Set(mouse_pos_world.x + d, mouse_pos_world.y + d);

	// Query the world for overlapping shapes.
	mouseDownQueryCallback.m_fixture = null;
	mouseDownQueryCallback.m_point.Set(mouse_pos_world.x, mouse_pos_world.y);
	b2d_world.QueryAABB(mouseDownQueryCallback, aabb);
	if (mouseDownQueryCallback.m_fixture)
	{
		var body = mouseDownQueryCallback.m_fixture.GetBody();
		
		var md = new b2MouseJointDef();
		md.bodyA = mouse_joint_ground_body;
		md.bodyB = body;
		md.target.Set(mouse_pos_world.x, mouse_pos_world.y);
		md.maxForce = 1000 * body.GetMass();
		md.collideConnected = true;

		mouse_joint = b2d_world.CreateJoint(md);
		body.SetAwake(true);
	}
}
function destroy_mouse_joint() {
	if( mouse_joint === null )
		return;
		
	b2d_world.DestroyJoint(mouse_joint);
	mouse_joint = null;
}

player_canvas.cur_mouse_pos = new vec(0,0);
player_canvas.l_mb = false;
player_canvas.r_mb = false;
player_canvas.onmousedown = function(evt) {
	var rect = player_canvas.getBoundingClientRect(), root = document.documentElement;
    var x = evt.clientX - rect.left - root.scrollLeft;
    var y = evt.clientY - rect.top - root.scrollTop;
    this.cur_mouse_pos = new vec(x,y);
    
	if(evt.button == 2) {
		this.r_mb = true;
	} else if(evt.button ==0) {
		this.l_mb = true;
		create_mouse_joint();
	}
}
player_canvas.onmouseup = function(evt) {
	var rect = player_canvas.getBoundingClientRect(), root = document.documentElement;
    var x = evt.clientX - rect.left - root.scrollLeft;
    var y = evt.clientY - rect.top - root.scrollTop;
    this.cur_mouse_pos = new vec(x,y);
    
	if(evt.button == 2) {
		this.r_mb = false;
		this.style.cursor = "default";
	} else if(evt.button ==0) {
		this.l_mb = false;
		destroy_mouse_joint();
	}
}
player_canvas.onmouseout = function(evt) { destroy_mouse_joint(); this.r_mb = false; this.style.cursor = "default"; }
player_canvas.blur = function(evt) { destroy_mouse_joint(); this.r_mb = false; this.style.cursor = "default"; }
player_canvas.onmousemove = function(evt) {
	var rect = player_canvas.getBoundingClientRect(), root = document.documentElement;
    var x = evt.clientX - rect.left - root.scrollLeft;
    var y = evt.clientY - rect.top - root.scrollTop;
    
    var pos = new vec(x,y);
    var pos_change = pos.subtract(this.cur_mouse_pos);
    
	mouse_pos_world = pixel_to_world(pos);
	
	if ( mouse_joint != null ) {
		mouse_joint.SetTarget( new b2Vec2(mouse_pos_world.x, mouse_pos_world.y) );
	}
	
	if( this.r_mb ) {
		player_offset = player_offset.add(pos_change);
		this.style.cursor = "move";
	}
	
	this.cur_mouse_pos = pos;
}
player_canvas.oncontextmenu = function() { return false }
player_canvas.ondragstart = function() { return false }
player_canvas.onwheel = function(evt) {
	var pre_middle = new vec(player_canvas.width/2, player_canvas.height/2);
	pre_middle = pixel_to_world(pre_middle);
	
	var min_scale = 5.0;

	if(evt.deltaY > 0)
		player_scale /= 1.1;
	else if(evt.deltaY < 0)
		player_scale *= 1.1;
		
	if(player_scale < min_scale)
		player_scale = min_scale;
	
	debugDraw.SetDrawScale(player_scale);
	
	pre_middle = world_to_pixel(pre_middle);
	var post_middle = new vec(player_canvas.width/2, player_canvas.height/2);
	var change = post_middle.subtract(pre_middle);
	player_offset = player_offset.add(change);
}
