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

//var saved_world = '{"gravity":{"x":0,"y":-9.8},"allowSleep":true,"autoClearForces":true,"positionIterations":2,"velocityIterations":6,"stepsPerSecond":60,"warmStarting":true,"continuousPhysics":true,"subStepping":false,"body":[{"name":"upper_body","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":2.5439292641901954},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.4503487286850001,0.4503487286850001,0.4503487286850001,-0.4503487286850001],"y":[-0.2299999999999998,-0.22999999999999984,0.22999999999999984,0.2299999999999998]}}}],"massData-mass":0.4143208303901997,"massData-I":0.00832126507365077,"massData-center":{"x":0,"y":0}},{"name":"lower_body","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":2.063929264190195},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.405,0.40500000000000014,0.40500000000000014,-0.405],"y":[-0.2549999999999998,-0.25499999999999984,0.25499999999999984,0.2549999999999998]}}}],"massData-mass":0.41309999999999975,"massData-I":0.00824134499999999,"massData-center":{"x":0,"y":0}},{"name":"r_bicep","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.7322914736482892,"y":2.6457579751783378},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2820611962640049,0.2820611962640049,0.2820611962640049,-0.2820611962640049],"y":[-0.12500000000000006,-0.12500000000000008,0.12500000000000008,0.12500000000000006]}}}],"massData-mass":0.14103059813200253,"massData-I":0.0009906108182904444,"massData-center":{"x":0,"y":0}},{"name":"r_forearm","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":1.2973897782032422,"y":2.6457579751783378},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2820611962640049,0.2820611962640049,0.2820611962640049,-0.2820611962640049],"y":[-0.12500000000000006,-0.12500000000000008,0.12500000000000008,0.12500000000000006]}}}],"massData-mass":0.14103059813200253,"massData-I":0.0009906108182904444,"massData-center":{"x":0,"y":0}},{"name":"r_hand","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":1.6960918506676177,"y":2.6457579751783378},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.11764587169831446,0.11764587169831443,0.11764587169831443,-0.11764587169831446],"y":[-0.12500000000000014,-0.12500000000000014,0.12500000000000014,0.12500000000000014]}}}],"massData-mass":0.05882293584915729,"massData-I":0.00018675188477446685,"massData-center":{"x":0,"y":0}},{"name":"r_thigh","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27986561264822274,"y":1.4113185922534361},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.1332608695652174,0.1332608695652174,0.1332608695652174,-0.1332608695652174],"y":[-0.3973596837944664,-0.3973596837944664,0.3973596837944664,0.3973596837944664]}}}],"massData-mass":0.2118099879704417,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"r_shin","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27986561264822274,"y":0.6214450744668749},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.1332608695652174,0.1332608695652174,0.1332608695652174,-0.1332608695652174],"y":[-0.3973596837944664,-0.3973596837944664,0.3973596837944664,0.3973596837944664]}}}],"massData-mass":0.2118099879704417,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"r_foot","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27986561264822274,"y":0.12055969897280383},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.15506719367588942,0.15506719367588928,0.15506719367588928,-0.15506719367588942],"y":[-0.10176284584980225,-0.1017628458498023,0.1017628458498023,0.10176284584980225]}}}],"massData-mass":0.06312031570560384,"massData-I":0.00019326341302821506,"massData-center":{"x":0,"y":0}},{"name":"head","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":3.0323650505024773},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2654724409448818,0.2654724409448818,0.2654724409448818,-0.2654724409448818],"y":[-0.24435531496062968,-0.24435531496062968,0.24435531496062968,0.24435531496062968]}}}],"massData-mass":0.259478407681815,"massData-I":0.003598160796319881,"massData-center":{"x":0,"y":0}},{"name":"l_thigh","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27986561264822274,"y":1.4113185922534361},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.1332608695652174,-0.13326086956521746,-0.13326086956521746,0.1332608695652174],"y":[0.3973596837944664,0.3973596837944664,-0.3973596837944664,-0.3973596837944664]}}}],"massData-mass":0.21180998797044173,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"l_shin","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27986561264822274,"y":0.6214450744668749},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.1332608695652174,-0.13326086956521746,-0.13326086956521746,0.1332608695652174],"y":[0.3973596837944664,0.3973596837944664,-0.3973596837944664,-0.3973596837944664]}}}],"massData-mass":0.21180998797044173,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"l_foot","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27986561264822274,"y":0.12055969897280383},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.15506719367588942,-0.1550671936758893,-0.1550671936758893,0.15506719367588942],"y":[0.10176284584980223,0.10176284584980226,-0.10176284584980226,-0.10176284584980223]}}}],"massData-mass":0.06312031570560384,"massData-I":0.00019326341302821503,"massData-center":{"x":0,"y":0}},{"name":"ground","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":-0.26836501996570805},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-9.346047211600007,9.346047211600007,9.346047211600007,-9.346047211600007],"y":[-0.2679486012500001,-0.2679486012500001,0.2679486012500001,0.2679486012500001]}}}]},{"name":"r_wall","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":9.034056434659755,"y":3.1479455990406233},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2981506957884962,0.29815069578849507,0.29815069578849507,-0.2981506957884962],"y":[-3.593500491345549,-3.5935004913455493,3.5935004913455493,3.593500491345549]}}}]},{"name":"l_wall","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-8.974675299020436,"y":3.091024180204573},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2981506957884962,0.29815069578849507,0.29815069578849507,-0.2981506957884962],"y":[-3.593500491345549,-3.5935004913455493,3.5935004913455493,3.593500491345549]}}}]},{"name":"l_bicep","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.7322914736482895,"y":2.6457579751783378},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.2820611962640049,-0.2820611962640049,-0.2820611962640049,0.2820611962640049],"y":[0.12500000000000006,0.12500000000000006,-0.12500000000000006,-0.12500000000000006]}}}],"massData-mass":0.14103059813200253,"massData-I":0.0009906108182904444,"massData-center":{"x":0,"y":0}},{"name":"l_forearm","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-1.2973897782032426,"y":2.6457579751783378},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.2820611962640049,-0.2820611962640049,-0.2820611962640049,0.2820611962640049],"y":[0.12500000000000006,0.12500000000000006,-0.12500000000000006,-0.12500000000000006]}}}],"massData-mass":0.14103059813200253,"massData-I":0.0009906108182904444,"massData-center":{"x":0,"y":0}},{"name":"l_hand","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-1.6960918506676181,"y":2.6457579751783378},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.11764587169831446,-0.11764587169831446,-0.11764587169831446,0.11764587169831446],"y":[0.12500000000000014,0.12500000000000014,-0.12500000000000014,-0.12500000000000014]}}}],"massData-mass":0.05882293584915729,"massData-I":0.00018675188477446688,"massData-center":{"x":0,"y":0}}],"joint":[{"name":"neck","bodyA":0,"bodyB":8,"anchorA":{"x":1.4550910791167334e-17,"y":0.23763440693754712},"anchorB":{"x":1.53571553236505e-17,"y":-0.2508013793747348},"refAngle":0,"type":"weld","collideConnected":false},{"name":"waist","bodyA":0,"bodyB":1,"anchorA":{"x":1.3860894949051259e-17,"y":-0.22636559306245285},"anchorB":{"x":1.5530628230485242e-17,"y":0.2536344069375476},"refAngle":0,"type":"weld","collideConnected":false},{"name":"r_wrist","bodyA":3,"bodyB":4,"anchorA":{"x":0.28158939773442304,"y":-0.0006363440505952055},"anchorB":{"x":-0.11711267472995246,"y":-0.0006363440505951927},"refAngle":0,"type":"weld","collideConnected":false},{"name":"r_ankle","bodyA":6,"bodyB":7,"anchorA":{"x":0.005134387351777273,"y":-0.3898814033391327},"anchorB":{"x":0.0051343873517772885,"y":0.1110039721549384},"refAngle":0,"type":"weld","collideConnected":false},{"name":"r_hip","bodyA":1,"bodyB":5,"anchorA":{"x":0.2732370864209852,"y":-0.25801301034664986},"anchorB":{"x":-0.0066285262272375335,"y":0.39459766159010895},"refAngle":1.5539997172338162,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_shoulder","bodyA":0,"bodyB":2,"anchorA":{"x":0.4511245689770802,"y":0.10705662021642313},"anchorB":{"x":-0.2811669046712089,"y":0.0052279092282808545},"refAngle":0.01859147288573682,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_knee","bodyA":5,"bodyB":6,"anchorA":{"x":-0.005731436780216211,"y":-0.39195539276336167},"anchorB":{"x":-0.005731436780216329,"y":0.3979181250231995},"refAngle":-2.3705956480674693,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_ankle","bodyA":10,"bodyB":11,"anchorA":{"x":-0.005134387351777398,"y":-0.3898814033391327},"anchorB":{"x":-0.0051343873517773,"y":0.1110039721549384},"refAngle":0,"type":"weld","collideConnected":false},{"name":"l_knee","bodyA":9,"bodyB":10,"anchorA":{"x":0.005731436780216259,"y":-0.39195539276336167},"anchorB":{"x":0.005731436780216289,"y":0.39791812502319956},"refAngle":-2.3417905240158237,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_hip","bodyA":1,"bodyB":9,"anchorA":{"x":-0.27323708642098526,"y":-0.25801301034664986},"anchorB":{"x":0.0066285262272374945,"y":0.39459766159010895},"refAngle":1.587592936355977,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_elbow","bodyA":2,"bodyB":3,"anchorA":{"x":0.28356771909245715,"y":-0.0004933934011632779},"anchorB":{"x":-0.2815305854624959,"y":-0.0004933934011632319},"refAngle":-2.357946185157913,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_wrist","bodyA":16,"bodyB":17,"anchorA":{"x":-0.28158939773442304,"y":-0.0006363440505952844},"anchorB":{"x":0.11711267472995246,"y":-0.0006363440505952056},"refAngle":0,"type":"weld","collideConnected":false},{"name":"l_shoulder","bodyA":0,"bodyB":15,"anchorA":{"x":-0.45112456897708064,"y":0.10705662021642307},"anchorB":{"x":0.28116690467120886,"y":0.005227909228280759},"refAngle":3.123001180704056,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_elbow","bodyA":15,"bodyB":16,"anchorA":{"x":-0.28356771909245726,"y":-0.0004933934011633255},"anchorB":{"x":0.2815305854624959,"y":-0.0004933934011632779},"refAngle":-2.354442233566498,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0}],"image":[]}';


//var saved_world = '{"gravity":{"x":0,"y":-9.8},"allowSleep":true,"autoClearForces":true,"positionIterations":2,"velocityIterations":6,"stepsPerSecond":60,"warmStarting":true,"continuousPhysics":true,"subStepping":false,"body":[{"name":"upper_body","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-3.828355257328126e-18,"y":2.5324895911206813},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.4503487286850001,0.4503487286850001,0.4503487286850001,-0.4503487286850001],"y":[-0.2299999999999998,-0.22999999999999984,0.22999999999999984,0.2299999999999998]}}}],"massData-mass":0.4143208303901997,"massData-I":0.00832126507365077,"massData-center":{"x":0,"y":0}},{"name":"lower_body","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-3.828355257328126e-18,"y":2.0524895911206817},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.405,0.40500000000000014,0.40500000000000014,-0.405],"y":[-0.2549999999999998,-0.25499999999999984,0.25499999999999984,0.2549999999999998]}}}],"massData-mass":0.41309999999999975,"massData-I":0.00824134499999999,"massData-center":{"x":0,"y":0}},{"name":"r_bicep","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.7322914736482892,"y":2.6343183021088246},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2820611962640049,0.2820611962640049,0.2820611962640049,-0.2820611962640049],"y":[-0.12500000000000006,-0.12500000000000008,0.12500000000000008,0.12500000000000006]}}}],"massData-mass":0.14103059813200253,"massData-I":0.0009906108182904444,"massData-center":{"x":0,"y":0}},{"name":"r_forearm","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":1.2973897782032422,"y":2.6343183021088246},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2820611962640049,0.2820611962640049,0.2820611962640049,-0.2820611962640049],"y":[-0.12500000000000006,-0.12500000000000008,0.12500000000000008,0.12500000000000006]}}}],"massData-mass":0.14103059813200253,"massData-I":0.0009906108182904444,"massData-center":{"x":0,"y":0}},{"name":"r_hand","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":1.6960918506676177,"y":2.6343183021088246},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.11764587169831446,0.11764587169831443,0.11764587169831443,-0.11764587169831446],"y":[-0.12500000000000014,-0.12500000000000014,0.12500000000000014,0.12500000000000014]}}}],"massData-mass":0.05882293584915729,"massData-I":0.00018675188477446685,"massData-center":{"x":0,"y":0}},{"name":"r_thigh","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27202127729735964,"y":1.399878919183923},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.1332608695652174,0.1332608695652174,0.1332608695652174,-0.1332608695652174],"y":[-0.3973596837944664,-0.3973596837944664,0.3973596837944664,0.3973596837944664]}}}],"massData-mass":0.2118099879704417,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"r_shin","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27202127729735964,"y":0.6100054013973617},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.1332608695652174,0.1332608695652174,0.1332608695652174,-0.1332608695652174],"y":[-0.3973596837944664,-0.3973596837944664,0.3973596837944664,0.3973596837944664]}}}],"massData-mass":0.2118099879704417,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"r_foot","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.27202127729735964,"y":0.10912002590329051},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.15506719367588942,0.15506719367588928,0.15506719367588928,-0.15506719367588942],"y":[-0.10176284584980225,-0.1017628458498023,0.1017628458498023,0.10176284584980225]}}}],"massData-mass":0.06312031570560384,"massData-I":0.00019326341302821506,"massData-center":{"x":0,"y":0}},{"name":"head","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-3.828355257328126e-18,"y":3.020925377432963},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2654724409448818,0.2654724409448818,0.2654724409448818,-0.2654724409448818],"y":[-0.24435531496062968,-0.24435531496062968,0.24435531496062968,0.24435531496062968]}}}],"massData-mass":0.259478407681815,"massData-I":0.003598160796319881,"massData-center":{"x":0,"y":0}},{"name":"l_bicep","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.7322914736482895,"y":2.6343183021088246},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.2820611962640049,-0.2820611962640049,-0.2820611962640049,0.2820611962640049],"y":[0.12500000000000006,0.12500000000000006,-0.12500000000000006,-0.12500000000000006]}}}],"massData-mass":0.14103059813200253,"massData-I":0.0009906108182904444,"massData-center":{"x":0,"y":0}},{"name":"l_forearm","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-1.2973897782032426,"y":2.6343183021088246},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.2820611962640049,-0.2820611962640049,-0.2820611962640049,0.2820611962640049],"y":[0.12500000000000006,0.12500000000000006,-0.12500000000000006,-0.12500000000000006]}}}],"massData-mass":0.14103059813200253,"massData-I":0.0009906108182904444,"massData-center":{"x":0,"y":0}},{"name":"l_hand","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-1.6960918506676181,"y":2.6343183021088246},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.11764587169831446,-0.11764587169831446,-0.11764587169831446,0.11764587169831446],"y":[0.12500000000000014,0.12500000000000014,-0.12500000000000014,-0.12500000000000014]}}}],"massData-mass":0.05882293584915729,"massData-I":0.00018675188477446688,"massData-center":{"x":0,"y":0}},{"name":"l_thigh","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27202127729735964,"y":1.399878919183923},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.1332608695652174,-0.13326086956521746,-0.13326086956521746,0.1332608695652174],"y":[0.3973596837944664,0.3973596837944664,-0.3973596837944664,-0.3973596837944664]}}}],"massData-mass":0.21180998797044173,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"l_shin","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27202127729735964,"y":0.6100054013973617},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.1332608695652174,-0.13326086956521746,-0.13326086956521746,0.1332608695652174],"y":[0.3973596837944664,0.3973596837944664,-0.3973596837944664,-0.3973596837944664]}}}],"massData-mass":0.21180998797044173,"massData-I":0.0024848853096302577,"massData-center":{"x":0,"y":0}},{"name":"l_foot","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.27202127729735964,"y":0.10912002590329051},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.15506719367588942,-0.1550671936758893,-0.1550671936758893,0.15506719367588942],"y":[0.10176284584980223,0.10176284584980226,-0.10176284584980226,-0.10176284584980223]}}}],"massData-mass":0.06312031570560384,"massData-I":0.00019326341302821503,"massData-center":{"x":0,"y":0}},{"name":"ground","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":-0.163923229287617},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-9.054365866840095,9.054365866840095,9.054365866840095,-9.054365866840095],"y":[-0.15692141883605026,-0.15692141883605026,0.15692141883605026,0.15692141883605026]}}}]},{"name":"body","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":8.83038214241568,"y":3.9954517160886476},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.22439762893555137,0.22439762893555137,0.22439762893555137,-0.22439762893555137],"y":[-4.004634608696001,-4.004634608696001,4.004634608696001,4.004634608696001]}}}]},{"name":"body","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-8.83038214241568,"y":3.9954517160886476},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.22439762893555137,0.22439762893555137,0.22439762893555137,-0.22439762893555137],"y":[-4.004634608696001,-4.004634608696001,4.004634608696001,4.004634608696001]}}}]}],"joint":[{"name":"neck","bodyA":0,"bodyB":8,"anchorA":{"x":1.455091079116736e-17,"y":0.23763440693754756},"anchorB":{"x":1.535715532365047e-17,"y":-0.25080137937473435},"refAngle":0,"type":"weld","collideConnected":false},{"name":"waist","bodyA":0,"bodyB":1,"anchorA":{"x":1.3860894949051205e-17,"y":-0.22636559306245196},"anchorB":{"x":1.5530628230485242e-17,"y":0.2536344069375476},"refAngle":0,"type":"weld","collideConnected":false},{"name":"r_wrist","bodyA":3,"bodyB":4,"anchorA":{"x":0.28158939773442304,"y":-0.0006363440505960938},"anchorB":{"x":-0.11711267472995246,"y":-0.0006363440505960769},"refAngle":0,"type":"weld","collideConnected":false},{"name":"r_hip","bodyA":1,"bodyB":5,"anchorA":{"x":0.27202127729735964,"y":-0.25801301034665},"anchorB":{"x":2.416213816086786e-17,"y":0.3945976615901088},"refAngle":1.5707963267948966,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_shoulder","bodyA":0,"bodyB":2,"anchorA":{"x":0.45112456897708025,"y":0.10705662021642404},"anchorB":{"x":-0.2811669046712089,"y":0.0052279092282808545},"refAngle":0.01859147288573682,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_knee","bodyA":5,"bodyB":6,"anchorA":{"x":2.4000345857809738e-17,"y":-0.3919553927633619},"anchorB":{"x":2.4365457906618868e-17,"y":0.39791812502319934},"refAngle":-2.3561930860416465,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_elbow","bodyA":2,"bodyB":3,"anchorA":{"x":0.28356771909245715,"y":-0.0004933934011637221},"anchorB":{"x":-0.2815305854624959,"y":-0.0004933934011637321},"refAngle":-2.357946185157915,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_wrist","bodyA":10,"bodyB":11,"anchorA":{"x":-0.28158939773442304,"y":-0.0006363440505960347},"anchorB":{"x":0.11711267472995246,"y":-0.0006363440505960937},"refAngle":0,"type":"weld","collideConnected":false},{"name":"l_shoulder","bodyA":0,"bodyB":9,"anchorA":{"x":-0.4511245689770806,"y":0.10705662021642412},"anchorB":{"x":0.28116690467120886,"y":0.005227909228280759},"refAngle":3.123001180704056,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_elbow","bodyA":9,"bodyB":10,"anchorA":{"x":-0.28356771909245726,"y":-0.0004933934011635774},"anchorB":{"x":0.2815305854624959,"y":-0.0004933934011637221},"refAngle":-2.3544422335664956,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_ankle","bodyA":6,"bodyB":7,"anchorA":{"x":2.4318290530040076e-17,"y":-0.3971478233066288},"anchorB":{"x":6.3520930618866424e-18,"y":0.1037375521874424},"refAngle":-1.162298917047041,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":2.3561936477019256,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_knee","bodyA":12,"bodyB":13,"anchorA":{"x":2.4000345857809738e-17,"y":-0.3919553927633619},"anchorB":{"x":2.4365457906618868e-17,"y":0.39791812502319934},"refAngle":-2.3561930860416465,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":4.712387295403851,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_ankle","bodyA":13,"bodyB":14,"anchorA":{"x":2.4318290530040076e-17,"y":-0.3971478233066288},"anchorB":{"x":6.3520930618866424e-18,"y":0.1037375521874424},"refAngle":-1.193893607334325,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":2.3561936477019256,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_hip","bodyA":1,"bodyB":12,"anchorA":{"x":-0.2720212772973596,"y":-0.25801301034665003},"anchorB":{"x":2.416213816086786e-17,"y":0.3945976615901088},"refAngle":1.5707963267948966,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0}],"image":[]}';
var saved_world = '{"gravity":{"x":0,"y":-9.8},"allowSleep":true,"autoClearForces":true,"positionIterations":2,"velocityIterations":6,"stepsPerSecond":60,"warmStarting":true,"continuousPhysics":true,"subStepping":false,"body":[{"name":"lower_body","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":0.9459620549098084},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.211417286408356,0.2114172864083561,0.2114172864083561,-0.211417286408356],"y":[-0.13708629865618638,-0.1370862986561864,0.1370862986561864,0.13708629865618638]}}}],"massData-mass":0.11592965306262558,"massData-I":0.0006509786784161739,"massData-center":{"x":0,"y":0}},{"name":"head","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":1.550963304234494},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.1275821605752717,0.12758216057527172,0.12758216057527172,-0.1275821605752717],"y":[-0.1325379605709921,-0.13253796057099212,0.13253796057099212,0.1325379605709921]}}}],"massData-mass":0.06763791747154937,"massData-I":0.000249500999212215,"massData-center":{"x":0,"y":0}},{"name":"r_thigh","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.12583008431528586,"y":0.5360689993320993},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.08692898522828169,0.08692898522828169,0.08692898522828169,-0.08692898522828169],"y":[-0.27210237103849116,-0.2721023710384913,0.2721023710384913,0.27210237103849116]}}}],"massData-mass":0.09461433197034168,"massData-I":0.0005083399181713138,"massData-center":{"x":0,"y":0}},{"name":"r_shin","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.12583008431528586,"y":-0.009755902788362816},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.08692898522828169,0.08692898522828169,0.08692898522828169,-0.08692898522828169],"y":[-0.27210237103849116,-0.2721023710384913,0.2721023710384913,0.27210237103849116]}}}],"massData-mass":0.09461433197034168,"massData-I":0.0005083399181713138,"massData-center":{"x":0,"y":0}},{"name":"r_foot","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.12583008431528586,"y":-0.3521887215508963},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.09717418705875773,0.09717418705875772,0.09717418705875772,-0.09717418705875773],"y":[-0.07039170033387052,-0.07039170033387053,0.07039170033387053,0.07039170033387052]}}}],"massData-mass":0.02736102502251021,"massData-I":0.000036949235752877975,"massData-center":{"x":0,"y":0}},{"name":"upper_body","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":1.2421408663095264},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.23417569393499968,0.23417569393499973,0.23417569393499973,-0.23417569393499968],"y":[-0.1598314149386547,-0.1598314149386547,0.1598314149386547,0.1598314149386547]}}}],"massData-mass":0.14971453002348936,"massData-I":0.001093552349551356,"massData-center":{"x":0,"y":0}},{"name":"r_bicep","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.4422306778358413,"y":1.3309216232116778},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2088624084707828,0.2088624084707828,0.2088624084707828,-0.2088624084707828],"y":[-0.07101321888006606,-0.07101321888006606,0.07101321888006606,0.07101321888006606]}}}],"massData-mass":0.05932796771421382,"massData-I":0.0001936469396190141,"massData-center":{"x":0,"y":0}},{"name":"r_forearm","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0.8590387868808469,"y":1.3309216232116778},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.2088624084707828,0.2088624084707828,0.2088624084707828,-0.2088624084707828],"y":[-0.07101321888006606,-0.07101321888006606,0.07101321888006606,0.07101321888006606]}}}],"massData-mass":0.05932796771421382,"massData-I":0.0001936469396190141,"massData-center":{"x":0,"y":0}},{"name":"r_hand","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":1.176802939859877,"y":1.3309216232116778},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.10860845240480704,0.10860845240480706,0.10860845240480706,-0.10860845240480704],"y":[-0.0668359707106504,-0.06683597071065038,0.06683597071065038,0.0668359707106504]}}}],"massData-mass":0.029035805375427003,"massData-I":0.000040645186399797386,"massData-center":{"x":0,"y":0}},{"name":"l_bicep","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.44223067783584136,"y":1.3309216232116778},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.2088624084707828,-0.2088624084707828,-0.2088624084707828,0.2088624084707828],"y":[0.07101321888006604,0.07101321888006605,-0.07101321888006605,-0.07101321888006604]}}}],"massData-mass":0.05932796771421382,"massData-I":0.00019364693961901406,"massData-center":{"x":0,"y":0}},{"name":"l_forearm","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.8590387868808469,"y":1.3309216232116778},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.2088624084707828,-0.2088624084707828,-0.2088624084707828,0.2088624084707828],"y":[0.07101321888006604,0.07101321888006605,-0.07101321888006605,-0.07101321888006604]}}}],"massData-mass":0.05932796771421382,"massData-I":0.00019364693961901406,"massData-center":{"x":0,"y":0}},{"name":"l_hand","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-1.176802939859877,"y":1.3309216232116778},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":2,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.10860845240480704,-0.10860845240480704,-0.10860845240480704,0.10860845240480704],"y":[0.0668359707106504,0.0668359707106504,-0.0668359707106504,-0.0668359707106504]}}}],"massData-mass":0.029035805375427007,"massData-I":0.0000406451863997974,"massData-center":{"x":0,"y":0}},{"name":"l_thigh","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.1258300843152858,"y":0.5360689993320993},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.0869289852282817,-0.08692898522828171,-0.08692898522828171,0.0869289852282817],"y":[0.2721023710384911,0.2721023710384913,-0.2721023710384913,-0.2721023710384911]}}}],"massData-mass":0.09461433197034173,"massData-I":0.0005083399181713142,"massData-center":{"x":0,"y":0}},{"name":"l_shin","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.1258300843152858,"y":-0.009755902788362802},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.0869289852282817,-0.08692898522828171,-0.08692898522828171,0.0869289852282817],"y":[0.2721023710384911,0.2721023710384913,-0.2721023710384913,-0.2721023710384911]}}}],"massData-mass":0.09461433197034173,"massData-I":0.0005083399181713142,"massData-center":{"x":0,"y":0}},{"name":"l_foot","type":2,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-0.1258300843152858,"y":-0.3521887215508963},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":4,"filter-maskBits":65529,"filter-groupIndex":0,"polygon":{"vertices":{"x":[0.09717418705875772,-0.09717418705875773,-0.09717418705875773,0.09717418705875772],"y":[0.07039170033387053,0.07039170033387052,-0.07039170033387052,-0.07039170033387053]}}}],"massData-mass":0.02736102502251021,"massData-I":0.000036949235752877975,"massData-center":{"x":0,"y":0}},{"name":"ground","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":0,"y":-0.9276982489916739},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-4.929456140960423,4.929456140960423,4.929456140960423,-4.929456140960423],"y":[-0.19194342495775057,-0.19194342495775088,0.19194342495775088,0.19194342495775057]}}}]},{"name":"body","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":4.761985958130906,"y":1.148780621005814},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.18321872382330814,0.18321872382330753,0.18321872382330753,-0.18321872382330814],"y":[-1.884535445039737,-1.8845354450397371,1.8845354450397371,1.884535445039737]}}}]},{"name":"body","type":0,"angle":0,"angularVelocity":0,"awake":true,"linearVelocity":{"x":0,"y":0},"position":{"x":-4.761985958130906,"y":1.148780621005814},"fixture":[{"name":"fixture","density":1,"friction":0.3,"filter-categoryBits":1,"filter-maskBits":65535,"filter-groupIndex":0,"polygon":{"vertices":{"x":[-0.18321872382330814,0.18321872382330753,0.18321872382330753,-0.18321872382330814],"y":[-1.884535445039737,-1.8845354450397371,1.8845354450397371,1.884535445039737]}}}]}],"joint":[{"name":"r_shoulder","bodyA":5,"bodyB":6,"anchorA":{"x":0.23351770241232908,"y":0.08608514957334767},"anchorB":{"x":-0.2087129754235122,"y":-0.002695607328803793},"refAngle":-0.012914661660331792,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":0,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_elbow","bodyA":6,"bodyB":7,"anchorA":{"x":0.20947670841648774,"y":0.0003993256161973769},"anchorB":{"x":-0.20733140062851785,"y":0.00039932561619749067},"refAngle":-1.5688697417671396,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":3.1415915302692343,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_wrist","bodyA":7,"bodyB":8,"anchorA":{"x":0.212748751747468,"y":-0.0024770983787110183},"anchorB":{"x":-0.10501540123156204,"y":-0.0024770983787110036},"refAngle":0,"type":"weld","collideConnected":false},{"name":"neck","bodyA":1,"bodyB":5,"anchorA":{"x":8.694747293100523e-18,"y":-0.14199599915917216},"anchorB":{"x":1.0215173212384162e-17,"y":0.1668264387657954},"refAngle":0,"type":"weld","collideConnected":false},{"name":"waist","bodyA":0,"bodyB":5,"anchorA":{"x":8.495242451458308e-18,"y":0.13873783783819182},"anchorB":{"x":9.6404792163383e-18,"y":-0.1574409735615261},"refAngle":0,"type":"weld","collideConnected":false},{"name":"r_hip","bodyA":0,"bodyB":2,"anchorA":{"x":0.12680596337277483,"y":-0.1398274559731981},"anchorB":{"x":0.0009758790574889732,"y":0.27006559960451104},"refAngle":-4.708773260530019,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":0,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_ankle","bodyA":3,"bodyB":4,"anchorA":{"x":0.004470023451060371,"y":-0.27629762890978377},"anchorB":{"x":0.004470023451060347,"y":0.06613518985274974},"refAngle":-1.5033086617648745,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":3.1415915302692343,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"r_knee","bodyA":2,"bodyB":3,"anchorA":{"x":0.002326434641060362,"y":-0.2755073844802455},"anchorB":{"x":0.002326434641060323,"y":0.2703175176402166},"refAngle":-3.132984877426104,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_elbow","bodyA":9,"bodyB":10,"anchorA":{"x":-0.20947670841648766,"y":0.00039932561619737743},"anchorB":{"x":0.20733140062851785,"y":0.00039932561619737683},"refAngle":-1.5727206651815362,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":3.1415915302692343,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_wrist","bodyA":10,"bodyB":11,"anchorA":{"x":-0.212748751747468,"y":-0.0024770983787110053},"anchorB":{"x":0.10501540123156204,"y":-0.002477098378711018},"refAngle":0,"type":"weld","collideConnected":false},{"name":"l_shoulder","bodyA":5,"bodyB":9,"anchorA":{"x":-0.23351770241232916,"y":0.08608514957334765},"anchorB":{"x":0.2087129754235122,"y":-0.0026956073288038063},"refAngle":-3.1286779919294614,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":0,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_ankle","bodyA":13,"bodyB":14,"anchorA":{"x":-0.004470023451060399,"y":-0.27629762890978377},"anchorB":{"x":-0.004470023451060353,"y":0.06613518985274974},"refAngle":-1.6382817451838012,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":3.1415915302692343,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_knee","bodyA":12,"bodyB":13,"anchorA":{"x":-0.0023264346410603897,"y":-0.2755073844802455},"anchorB":{"x":-0.0023264346410602895,"y":0.2703175176402166},"refAngle":-3.150197059791806,"type":"revolute","collideConnected":false,"enableLimit":true,"lowerLimit":0,"upperLimit":6.283183060538469,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0},{"name":"l_hip","bodyA":0,"bodyB":12,"anchorA":{"x":-0.1268059633727748,"y":-0.13982745597319812},"anchorB":{"x":-0.0009758790574890601,"y":0.27006559960451104},"refAngle":-4.716000206957125,"type":"revolute","collideConnected":false,"enableLimit":false,"lowerLimit":0,"upperLimit":0,"enableMotor":false,"maxMotorTorque":0,"motorSpeed":0}],"image":[]}';

function load_b2d_world() {
	b2d_world = loadWorldFromRUBE(JSON.parse(saved_world));
	mouse_joint_ground_body = b2d_world.CreateBody( new b2BodyDef() );
	
	player_offset.set_equal_to(new vec(290,-110));

	player_scale = 100;
	
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
	var max_scale = 1000.0;

	if(evt.deltaY > 0)
		player_scale /= 1.1;
	else if(evt.deltaY < 0)
		player_scale *= 1.1;
		
	if(player_scale < min_scale)
		player_scale = min_scale;
	else if(player_scale > max_scale)
		player_scale = max_scale;
	
	debugDraw.SetDrawScale(player_scale);
	
	pre_middle = world_to_pixel(pre_middle);
	var post_middle = new vec(player_canvas.width/2, player_canvas.height/2);
	var change = post_middle.subtract(pre_middle);
	player_offset = player_offset.add(change);
}

var player_paused = false;
var player_speed = 1;
//iter through alphabet to get keycodes
var key = {};
var char, count;
for(char="A", count=0; count<=26; count++) {
	key[char] = 65+count;
	char = String.fromCharCode(char.charCodeAt(0) + 1);
}
var DELETE_KEYCODE = 46;
var SPACE_KEYCODE = 32;
window.onkeydown = function(evt) {
	
	switch(evt.keyCode) {
		case SPACE_KEYCODE:
			player_paused = !player_paused;
			break;
		case key.B:
			player_speed = player_speed == 1 ? 0.2 : 1;
	}
}
