/*
 *
 * PropertyUpdater.js
 * Object that constantly updates a property.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/core/PropertyUpdater.js",
		_PropertyUpdater = {};
	
	/*===================================================
    
    public
    
    =====================================================*/
	
	main.asset_register( assetPath, { 
		data: _PropertyUpdater/*,
		requirements: [
			"assets/modules/core/PropertyUpdater.js"
		],
		callbacksOnReqs: init_internal,
		wait: true*/
	});
	
	/*===================================================
    
    internal init
    
    =====================================================*/
	
	//function init_internal ( o ) {
		console.log('internal property updater', _PropertyUpdater);
		
		_PropertyUpdater.Instance = PropertyUpdater;
		
		_PropertyUpdater.Instance.prototype.start = start;
		_PropertyUpdater.Instance.prototype.stop = stop;
		_PropertyUpdater.Instance.prototype.add = add;
		_PropertyUpdater.Instance.prototype.remove = remove;
		_PropertyUpdater.Instance.prototype.detach = detach;
		_PropertyUpdater.Instance.prototype.update = update;
		_PropertyUpdater.Instance.prototype.step = step;
		_PropertyUpdater.Instance.prototype.integrate = integrate;
		_PropertyUpdater.Instance.prototype.apply = apply;
		
		Object.defineProperty( _PropertyUpdater.Instance.prototype, 'parent', { 
			get : function () { return this._parent; },
			set : function ( parent ) {
				
				this._parent = parent;
				
				// parent will handle update
				if ( this._parent instanceof _PropertyUpdater.Instance ) {
					
					dojo.unsubscribe( this.eventHandles[ 'Game.update' ] );
					
				}
				// handle own update
				else if ( this.updating === true ) {
					
					this.eventHandles[ 'Game.update' ] = dojo.subscribe( 'Game.update', this, this.update );
					
				}
				
			}
			
		} );
		
	//}
	
	/*===================================================
    
    updater
    
    =====================================================*/
	
	function PropertyUpdater ( parameters ) {
		
		// handle parameters
		
		parameters = parameters || {};
		
		this.object = parameters.object;
		
		this.updating = false;
		
		this.eventHandles = {};
		
		this.children = [];
		
	}
	
	/*===================================================
    
    properties
    
    =====================================================*/
	
	function start () {
		
		// set updating
		
		if ( this.updating !== true ) {
			
			this.updating = true;
			
			// event
			
			if ( this.parent instanceof _PropertyUpdater.Instance !== true ) {
				
				this.eventHandles[ 'Game.update' ] = dojo.subscribe( 'Game.update', this, this.update );
				
			}
			
		}
		
	}
	
	function stop () {
		
		this.updating = false;
		
		// event
		
		dojo.unsubscribe( this.eventHandles[ 'Game.update' ] );
		
		// detach
		
		this.detach();
		
	}
	
	function add ( updaters ) {
		
		var i, l,
			updater,
			children = this.children,
			needStart;
		
		// add
		
		updaters = main.ensure_array( updaters );
		
		for ( i = 0, l = updaters.length; i < l; i++ ) {
			
			updater = updaters[ i ];
			
			// children
			
			if ( children.indexOf( updater ) === -1 ) {
				
				children.push( updater );
				
				if ( updater.updating === true ) {
					
					needStart = true;
					
				}
				
			}
			
			// set parent
			
			updater.parent = this;
			
		}
		
		// updating
		
		if ( needStart === true && children.length > 0 ) {
			
			this.start();
			
		}
		
	}
	
	function remove ( updaters ) {
		
		var i, l,
			index,
			updater,
			children = this.children;
		
		// remove
		
		if ( typeof updaters !== 'undefined' ) {
			
			updaters = main.ensure_array( updaters );
			
			for ( i = 0, l = updaters.length; i < l; i++ ) {
				
				updater = updaters[ i ];
				
				index = children.indexOf( updater );
				
				if ( index !== -1 ) {
					
					children.splice( index, 1 );
					
				}
				
				// set parent
				
				updater.parent = undefined;
				
			}
			
			// stop if no children
			
			if ( children.length === 0 ) {
				
				this.stop();
				
			}
			
		}
		// clear all
		else {
			
			this.remove( children );
			
		}
		
	}
	
	function detach () {
		
		if ( this.parent instanceof _PropertyUpdater.Instance ) {
			
			this.parent.remove( this );
			
		}
		
	}
	
	function update () {
		
		var i, l,
			children = this.children,
			child;
		
		// step self
		
		this.step();
		
		// children
		
		for ( i = 0, l = children.length; i < l; i++ ) {
			
			child = children[ i ];
			
			// update
			
			child.update.call( child );
			
			// integrate child
			
			this.integrate( child );
			
		}
		
		// apply
		
		this.apply();
		
	}
	
	function step () {
		
	}
	
	function integrate () {
		
	}
	
	function apply () {
		
	}
	
} (KAIOPUA) );