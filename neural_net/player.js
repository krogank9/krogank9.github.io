function reset_b2d_world() {
	// reset all the joints to not moving
	for (let j = b2d_world.m_jointList; j; j = j.m_next) {
		if( j instanceof b2RevoluteJoint) {
			j.m_motorSpeed = 0;
		}
	}
	// reset all the bodies to their original positions
	for (let b = b2d_world.m_bodyList; b; b = b.m_next) {
		if(b.m_type != 2) //static
			continue;
		if(b.hasOwnProperty('start_x_pos') && b.hasOwnProperty('start_y_pos')
		&& b.hasOwnProperty('start_angle')) {
			b.SetPosition(new b2Vec2(b.start_x_pos, b.start_y_pos));
			b.SetAngle(b.start_angle);
		}
		b.SetLinearVelocity( new b2Vec2(0,0));
		b.SetAngularVelocity(0);
	}
}

var saved_world = '{"gravity":{"x":0,"y":-9.8},"allowSleep":true,"autoClearForces":true,"positionIterations":2,"velocityIterations":6,"stepsPerSecond":60,"warmStarting":true,"continuousPhysics":true,"subStepping":false,"body":[{"name":"upper_body","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":0.6498655930624528},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.4750000000000001,0.4750000000000001,0.4750000000000001,-0.4750000000000001],"y":[-0.22999999999999984,-0.22999999999999984,0.22999999999999984,0.22999999999999984]}}}],"massData-mass":0.43699999999999983,"massData-I":0.009330556944444436,"massData-center":{"x":0,"y":0}},{"name":"lower_body","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":0.16986559306245264},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.405,0.40500000000000014,0.40500000000000014,-0.405],"y":[-0.2549999999999998,-0.25499999999999984,0.25499999999999984,0.2549999999999998]}}}],"massData-mass":0.41309999999999975,"massData-I":0.00824134499999999,"massData-center":{"x":0,"y":0}},{"name":"r_bicep","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.8193833992094863,"y":0.7581363440505957},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.34500000000000003,0.34500000000000003,0.34500000000000003,-0.34500000000000003],"y":[-0.1250000000000001,-0.1250000000000001,0.1250000000000001,0.1250000000000001]}}}],"massData-mass":0.1725000000000001,"massData-I":0.0015898750000000014,"massData-center":{"x":0,"y":0}},{"name":"r_forearm","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":1.5105770750988143,"y":0.7581363440505957},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.34500000000000003,0.34500000000000003,0.34500000000000003,-0.34500000000000003],"y":[-0.1250000000000001,-0.1250000000000001,0.1250000000000001,0.1250000000000001]}}}],"massData-mass":0.1725000000000001,"massData-I":0.0015898750000000014,"massData-center":{"x":0,"y":0}},{"name":"r_hand","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":1.9982450592885388,"y":0.7581363440505957},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.1438972332015812,0.1438972332015812,0.1438972332015812,-0.1438972332015812],"y":[-0.1250000000000001,-0.12500000000000014,0.12500000000000014,0.1250000000000001]}}}],"massData-mass":0.07194861660079067,"massData-I":0.0002701327347389223,"massData-center":{"x":0,"y":0}},{"name":"r_thigh","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27986561264822274,"y":-0.48274507887430596},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.1332608695652174,0.1332608695652174,0.1332608695652174,-0.1332608695652174],"y":[-0.3973596837944664,-0.3973596837944664,0.3973596837944664,0.3973596837944664]}}}],"massData-mass":0.2118099879704417,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"r_shin","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27986561264822274,"y":-1.2726185966608672},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.1332608695652174,0.1332608695652174,0.1332608695652174,-0.1332608695652174],"y":[-0.3973596837944664,-0.3973596837944664,0.3973596837944664,0.3973596837944664]}}}],"massData-mass":0.2118099879704417,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"r_foot","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27986561264822274,"y":-1.7735039721549384},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.15506719367588942,0.15506719367588928,0.15506719367588928,-0.15506719367588942],"y":[-0.10176284584980225,-0.1017628458498023,0.1017628458498023,0.10176284584980225]}}}],"massData-mass":0.06312031570560384,"massData-I":0.00019326341302821506,"massData-center":{"x":0,"y":0}},{"name":"head","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":1.1383013793747347},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2654724409448818,0.2654724409448818,0.2654724409448818,-0.2654724409448818],"y":[-0.24435531496062968,-0.24435531496062968,0.24435531496062968,0.24435531496062968]}}}],"massData-mass":0.259478407681815,"massData-I":0.003598160796319881,"massData-center":{"x":0,"y":0}},{"name":"l_thigh","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27986561264822274,"y":-0.48274507887430596},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.1332608695652174,-0.13326086956521746,-0.13326086956521746,0.1332608695652174],"y":[0.3973596837944664,0.3973596837944664,-0.3973596837944664,-0.3973596837944664]}}}],"massData-mass":0.21180998797044173,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"l_shin","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27986561264822274,"y":-1.2726185966608672},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.1332608695652174,-0.13326086956521746,-0.13326086956521746,0.1332608695652174],"y":[0.3973596837944664,0.3973596837944664,-0.3973596837944664,-0.3973596837944664]}}}],"massData-mass":0.21180998797044173,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"l_foot","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27986561264822274,"y":-1.7735039721549384},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.15506719367588942,-0.1550671936758893,-0.1550671936758893,0.15506719367588942],"y":[0.10176284584980223,0.10176284584980226,-0.10176284584980226,-0.10176284584980223]}}}],"massData-mass":0.06312031570560384,"massData-I":0.00019326341302821503,"massData-center":{"x":0,"y":0}},{"name":"l_bicep","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.8193833992094863,"y":0.7581363440505957},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.34500000000000003,-0.34500000000000003,-0.34500000000000003,0.34500000000000003],"y":[0.12500000000000006,0.12500000000000006,-0.12500000000000006,-0.12500000000000006]}}}],"massData-mass":0.17250000000000007,"massData-I":0.0015898750000000012,"massData-center":{"x":0,"y":0}},{"name":"l_forearm","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-1.5105770750988143,"y":0.7581363440505957},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.34500000000000003,-0.34500000000000003,-0.34500000000000003,0.34500000000000003],"y":[0.12500000000000006,0.12500000000000006,-0.12500000000000006,-0.12500000000000006]}}}],"massData-mass":0.17250000000000007,"massData-I":0.0015898750000000012,"massData-center":{"x":0,"y":0}},{"name":"l_hand","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-1.9982450592885388,"y":0.7581363440505957},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.1438972332015812,-0.1438972332015812,-0.1438972332015812,0.1438972332015812],"y":[0.12500000000000014,0.12500000000000014,-0.12500000000000014,-0.12500000000000014]}}}],"massData-mass":0.07194861660079067,"massData-I":0.0002701327347389223,"massData-center":{"x":0,"y":0}},{"name":"body","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.3067500000000001,"y":-2.51005},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-11.112925940053032,11.112925940053032,11.112925940053032,-11.112925940053032],"y":[-0.26966510983506164,-0.2696651098350605,0.2696651098350605,0.26966510983506164]}}}]},{"name":"body","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-10.416162685563167,"y":1.9837828072490633},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2924073718590958,0.2924073718590958,0.2924073718590958,-0.2924073718590958],"y":[-4.720290431439692,-4.720290431439692,4.720290431439692,4.720290431439692]}}}]},{"name":"body","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":11.029575460150838,"y":1.9837828072490633},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2924073718590958,0.2924073718590958,0.2924073718590958,-0.2924073718590958],"y":[-4.720290431439692,-4.720290431439692,4.720290431439692,4.720290431439692]}}}]}],"joint":[{"name":"joint","bodyA":0,"bodyB":8,"anchorA":{"x":1.455091079116734e-17,"y":0.23763440693754723},"anchorB":{"x":1.5357155323650492e-17,"y":-0.2508013793747347},"refAngle":0,"type":"weld","collideConnected":false},{"name":"joint","bodyA":0,"bodyB":1,"anchorA":{"x":1.3003642189648112e-17,"y":-0.21236559306245284},"anchorB":{"x":1.6387880989888378e-17,"y":0.26763440693754736},"refAngle":0,"type":"weld","collideConnected":false},{"name":"joint","bodyA":3,"bodyB":4,"anchorA":{"x":0.3544229249011857,"y":-0.0006363440505956497},"anchorB":{"x":-0.1332450592885388,"y":-0.000636344050595652},"refAngle":0,"type":"weld","collideConnected":false},{"name":"joint","bodyA":6,"bodyB":7,"anchorA":{"x":0.0051343873517772755,"y":-0.3898814033391329},"anchorB":{"x":0.005134387351777284,"y":0.11100397215493829},"refAngle":0,"type":"weld","collideConnected":false},{"name":"r_hip","bodyA":1,"bodyB":5,"anchorA":{"x":0.2732370864209852,"y":-0.2580130103466497},"anchorB":{"x":-0.006628526227237532,"y":0.39459766159010884},"refAngle":1.5539997172338162,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_shoulder","bodyA":0,"bodyB":2,"anchorA":{"x":0.47612456897708033,"y":0.10705662021642327},"anchorB":{"x":-0.343258830232406,"y":-0.001214130771719674},"refAngle":-0.003537056010062193,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_knee","bodyA":5,"bodyB":6,"anchorA":{"x":-0.005731436780216214,"y":-0.3919553927633619},"anchorB":{"x":-0.005731436780216327,"y":0.39791812502319934},"refAngle":-2.3705956480674693,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"joint","bodyA":10,"bodyB":11,"anchorA":{"x":-0.0051343873517774,"y":-0.3898814033391329},"anchorB":{"x":-0.005134387351777295,"y":0.11100397215493829},"refAngle":0,"type":"weld","collideConnected":false},{"name":"l_knee","bodyA":9,"bodyB":10,"anchorA":{"x":0.005731436780216263,"y":-0.3919553927633619},"anchorB":{"x":0.005731436780216287,"y":0.3979181250231994},"refAngle":-2.3417905240158237,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_hip","bodyA":1,"bodyB":9,"anchorA":{"x":-0.27323708642098515,"y":-0.25801301034664975},"anchorB":{"x":0.006628526227237492,"y":0.39459766159010884},"refAngle":1.587592936355977,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_elbow","bodyA":2,"bodyB":3,"anchorA":{"x":0.3468426865612859,"y":-0.0004933934011633889},"anchorB":{"x":-0.3443509893280421,"y":-0.0004933934011633264},"refAngle":-2.357626467931323,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"joint","bodyA":13,"bodyB":14,"anchorA":{"x":-0.3544229249011857,"y":-0.0006363440505957604},"anchorB":{"x":0.1332450592885388,"y":-0.0006363440505956497},"refAngle":0,"type":"weld","collideConnected":false},{"name":"l_elbow","bodyA":12,"bodyB":13,"anchorA":{"x":-0.3468426865612859,"y":-0.00049339340116332},"anchorB":{"x":0.3443509893280421,"y":-0.0004933934011633888},"refAngle":-2.3547619507930877,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_shoulder","bodyA":0,"bodyB":12,"anchorA":{"x":-0.4761245689770801,"y":0.10705662021642327},"anchorB":{"x":0.3432588302324062,"y":-0.0012141307717196126},"refAngle":-3.138055597579731,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0}],"image":[]}';

function load_b2d_world() {
	b2d_world = loadWorldFromRUBE(JSON.parse(saved_world));
	mouse_joint_ground_body = b2d_world.CreateBody( new b2BodyDef() );
	
	for (let j = b2d_world.m_jointList; j; j = j.m_next) {
		if( j instanceof b2RevoluteJoint) {
			j.m_enableMotor = true;
			j.m_maxMotorTorque = 8;
			//j.m_motorSpeed = -8;
		}
	}
	
	// save the bodies starting positions and rotations
	for (let b = b2d_world.m_bodyList; b; b = b.m_next) {
		b.start_x_pos = b.GetPosition().x;
		b.start_y_pos = b.GetPosition().y;
		b.start_angle = b.GetAngle();
	}
	
	player_offset.set_equal_to(new vec(290,-110));

	player_scale = 50;
	
	debugDraw.SetDrawScale(player_scale);
	b2d_world.SetDebugDraw(debugDraw);

	//requestAnimationFrame(update_world);
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
debugDraw.SetDrawScale(1.0);
debugDraw.SetFillAlpha(0.5);
debugDraw.SetLineThickness(1.0);
debugDraw.SetFlags(b2DebugDraw.e_shapeBit /*| b2DebugDraw.e_jointBit*/);

var draw_world = true;

var player_offset = new vec(0,0);
var player_scale = 1.0;
var context_scale = 1.0;


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
