/*
Physics.js
Physics module, handles physics in game using JigLibJS.
*/
var KAIOPUA = (function (main) {
    
    var shared = main.shared = main.shared || {},
        game = main.game = main.game || {},
		core = game.core = game.core || {},
		physics = core.physics = core.physics || {},
		system,
		linksBaseName = 'vis_to_phys_link_',
		linksCount = 0,
		linksNames = [],
		linksMap = {},
		time,
		timeLast,
		convertMatrix4,
		convertVector3;
	
	/*===================================================
    
    public properties
    
    =====================================================*/
	
	physics.init = init;
	physics.add = add;
	physics.remove = remove;
	physics.start = start;
	physics.stop = stop;
	physics.update = update;
	physics.set_gravity = set_gravity;
	
	/*===================================================
    
    external init
    
    =====================================================*/
	
	function init () {
		
		init_system();
		
	}
	
	function init_system() {
		
		// system
		
		system = jiglib.PhysicsSystem.getInstance();
		system.setCollisionSystem(true); // grid seems better than brute
		system.setSolverType("ACCUMULATED"); // accumulated seems better than fast or normal
		set_gravity( 0, -9.8, 0 );
		
		// conversion objects
		
		convertMatrix4 = new THREE.Matrix4();
		convertVector3 = new THREE.Vector3();
		
		// signals
		
		shared.signals.paused.add( stop );
		shared.signals.resumed.add( start );
		
	}
	
	/*===================================================
    
    add / remove
    
    =====================================================*/
	
	function add ( mesh, parameters ) {
		
		var geometry = mesh.geometry,
			bboxScale,
			bbox,
			bodyType,
			rigidBody,
			movable,
			width,
			height,
			depth,
			radius,
			mass,
			restitution,
			friction,
			position,
			rotation,
			velocity,
			name;
		
		// handle parameters
		
		parameters = parameters || {};
		
		scale = parameters.scale || 1;
		
		bodyType = parameters.bodyType || 'box';
		
		movable = parameters.movable || true;
		
		restitution = parameters.restitution || 0.25;
		
		friction = parameters.friction || 0.25;
		
		position = init_jig_vec( parameters.position );
		
		rotation = init_jig_vec( parameters.rotation, true );
		
		velocity = init_jig_vec( parameters.velocity );
		
		name = parameters.name || linksBaseName + linksCount;
		
		// model bounding box
		
		if ( !geometry.boundingBox || geometry.boundingBox.hasOwnProperty('length') === false ) {
			
			geometry.computeBoundingBox();
			
		}
		
		bbox = geometry.boundingBox;
		
		width = (bbox.x[1] - bbox.x[0]) * scale;
		height = (bbox.y[1] - bbox.y[0]) * scale;
		depth = (bbox.z[1] - bbox.z[0]) * scale;
		
		mass = parameters.mass || width * height * depth;
		
		// create physics object
		
		if ( bodyType === 'trimesh' ) {
			
		}
		else if ( bodyType === 'capsule' ) {
			
			rigidBody = new jiglib.JCapsule( null, Math.max( width, depth ), height );
			
			rotation.x += 90;
			
		}
		else if ( bodyType === 'sphere' ) {
			
			radius = Math.max( width, Math.max( height, depth ) ) * 0.5;
			
			rigidBody = new jiglib.JSphere( null, radius );
			
		}
		else if ( bodyType === 'plane' ) {
			
			rigidBody = new jiglib.JPlane( null, parameters.up || new jiglib.Vector3D( 0, 0, 1, 0 ) );
			
		}
		// default box
		else {
			
			rigidBody = new jiglib.JBox( null, width, height, depth );
			
		}
		
		// properties
		
		rigidBody.set_movable( movable );
		
		rigidBody.set_mass( mass );
		
		rigidBody.set_restitution( restitution );
			
		rigidBody.set_friction( friction );
		
		if ( parameters.hasOwnProperty( 'rotVelocityDamping' ) ) {
			
			rigidBody.set_rotVelocityDamping( parameters.rotVelocityDamping );
			
		}
		
		if ( parameters.hasOwnProperty( 'linVelocityDamping' ) ) {
			
			rigidBody.set_linVelocityDamping( parameters.linVelocityDamping );
			
		}
		
		// add to system
		
		system.addBody( rigidBody );
		
		// initial state
		
		rigidBody.moveTo( position );
		
		rigidBody.set_rotationX( rotation.x );
		rigidBody.set_rotationY( rotation.y );
		rigidBody.set_rotationZ( rotation.z );
		
		// add to links
		
		linksCount += 1;
		
		linksNames.push( name );
		
		linksMap[ name ] = { mesh: mesh, rigidBody: rigidBody };
		
		return name;
		
	}
	
	function remove ( name ) {
		
		var linkIndex, linkInfo;
		
		linkIndex = linksNames.indexOf( name );
		
		if ( linkIndex !== -1 ) {
			
			linksNames.splice( linkIndex, 1 );
			
			linkInfo = linksMap[ name ];
			
			system.removeBody( linkInfo.rigidBody );
		
			delete linksMap[ name ];
			
		}
		
	}
	
	/*===================================================
    
    libraries translation
    
    =====================================================*/
	
	function init_jig_vec ( vsource, isRotation, normalize ) {
		var vjig;
		
		if ( typeof vsource !== 'undefined' ) {
			
			if ( isRotation === true ) {
				
				vjig = three_rot_to_jig_rot( vsource );
				
			}
			else {
				
				vjig = three_vec_to_jig_vec3( vsource );
				
			}
			
		}
		else {
			vjig = new jiglib.Vector3D( 0, 0, 0 );
		}
		
		// normalize
		
		if ( normalize === true ) {
			
			vjig.normalize();
			
		}
		
		return vjig;
	}
	
	function three_vec_to_jig_vec3 ( vthree ) {
		
		return new jiglib.Vector3D( vthree.x, vthree.y, vthree.z, 0 );
		
	}
	
	function three_rot_to_jig_rot ( vthree ) {
		var vtemp = convertVector3;
		
		if ( vthree.hasOwnProperty('w') ) {
			
			return three_quat_to_jig_vec3( vthree );
			
		}
		else {
			
			vtemp.copy( vthree );
			
			vtemp.multiplyScalar( 180 / Math.PI );
			
			return three_vec_to_jig_vec3( vtemp );
			
		}
		
	}
	
	function three_quat_to_jig_vec3 ( qthree ) {
		var mtemp = convertMatrix4,
			vtemp = convertVector3;
		
		// translate rotation into matrix
		mtemp.identity();
		mtemp.setRotationFromQuaternion( qthree );
		
		// translate rotation into vector
		vtemp.setPositionFromMatrix( mtemp );
		vtemp.setRotationFromMatrix( mtemp );
		
		return three_rot_to_jig_rot( vtemp );
	}
	
	/*===================================================
    
    physics functions
    
    =====================================================*/
	
	function set_gravity ( x, y, z ) {
		gravity = new jiglib.Vector3D( x, y, z, 0 );
		system.setGravity( gravity );
	}
	
	/*===================================================
    
    custom functions
    
    =====================================================*/
	
	function start () {
		
		time = timeLast = new Date().getTime();
		
		shared.signals.update.add( update );
		
	}
	
	function stop () {
		
		shared.signals.update.remove( update );
		
	}
	
	function update () {
		
		var i, l,
			timeDelta,
			timeStep,
			link,
			mesh,
			rigidBody,
			pbState,
			pbPos,
			pbOri,
			mtemp = convertMatrix4;
		
		// handle time
		
		timeLast = time;
		
		time = new Date().getTime();
		
		timeDelta = time - timeLast;
		
		timeStep = timeDelta / 1000;
		
		// integrate system
		
		system.integrate( timeStep );
		
		// update links
		
		for ( i = 0, l = linksNames.length; i < l; i += 1 ) {
			
			link = linksMap[ linksNames[ i ] ];
			
			rigidBody = link.rigidBody;
			
			mesh = link.mesh;
			
			pbState = rigidBody.get_currentState();
			
			pbPos = pbState.position;
			
			pbOri = pbState.orientation.get_rawData();
			
			mtemp.set( pbOri[0], pbOri[1], pbOri[2], pbOri[3], pbOri[4], pbOri[5], pbOri[6], pbOri[7], pbOri[8], pbOri[9], pbOri[10], pbOri[11], pbOri[12], pbOri[13], pbOri[14], pbOri[15] );
			
			mesh.position.copy( pbPos );
			
			if ( mesh.useQuaternion === true ) {
				
				mesh.quaternion.setFromRotationMatrix( mtemp );
				
			}
			else {
				
				mesh.rotation.setRotationFromMatrix( mtemp );
				
			}
			
		}
		
	}
	
	return main;
	
}(KAIOPUA || {}));