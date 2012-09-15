/*
 *
 * UIQueue.js
 * UI queue for displaying elements.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/ui/UIQueue.js",
		_UIQueue = {},
		containers = [],
		elements = [],
		queues = [],
		items = [],
		itemCount = 0;
	
    /*===================================================
    
    public properties
    
    =====================================================*/
	
	init_internal();
	
	main.asset_register( assetPath, { 
		data: _UIQueue/*,
		requirements: "assets/modules/ui/UIElement.js",
		callbacksOnReqs: init_internal,
		wait: true*/
	} );
	
	/*===================================================
    
    internal init
    
    =====================================================*/
	
	function init_internal () {
		console.log('internal UIQueue', _UIQueue);
		
		// public properties
		
		_UIQueue.add = add ;
		_UIQueue.remove = remove;
		_UIQueue.step = step;
		_UIQueue.clear = clear;
		
		// init default queue
		
		containers.push( 'nocontainer' );
		queues.push( new Queue() );
		
	}
	
	/*===================================================
    
    queue
    
    =====================================================*/
	
	function Queue () {
		
		this.priority = [];
		
	}
	
	/*===================================================
    
    add
    
    =====================================================*/
	
	function add ( parameters ) {
		
		var element = parameters.element || parameters,
			$element = $( element ),
			item,
			container,
			priority,
			index;
		
		if ( $element.length > 0 ) {
			
			item = element === parameters ? {} : $.extend( {}, parameters );
			item.id = itemCount++;
			item.element = element;
			item.$element = $element;
			
			container = item.container;
			priority = item.priority;
			
			// init queue for container if needed
			
			item.$container = $( container );
			
			if ( item.$container.length > 0 ) {
				
				index = main.index_of_value( containers, container );
				
				if ( index === -1 ) {
					
					containers.push( container );
					index = containers.length - 1;
					queues[ index ] = new Queue();
					
				}
				
			}
			// no container, use default queue
			else {
				
				index = 0;
				
			}
			
			item.queue = queues[ index ];
			
			// store by priority
			// priority can stack
			// general can only have 1 at a time
			
			if ( priority === true ) {
				
				item.queue.priority.push( item );
				
			}
			else {
				
				item.queue.general = item;
				
			}
			
			// store and step
			
			elements.push( element );
			items.push( item );
			console.log( 'UIQueue: ADD, queues', queues, ' containers', containers, 'items', items, ' elements', elements );
			step( item.queue );
			
		}
		
	}
	
	/*===================================================
    
    remove
    
    =====================================================*/
	
	function remove ( parameters ) {
		
		var element ,
			item,
			priority,
			queue,
			container,
			index = -1,
			active;
		
		if ( typeof parameters !== 'undefined' ) {
			
			// find element
			
			element = parameters.element || parameters;
			item = parameters.item || parameters;
			
			if ( typeof element !== 'undefined' ) {
				
				index = main.index_of_value( elements, element );
				
			}
			
			// try item
			
			if ( index === -1 && typeof item !== 'undefined' ) {
				
				index = main.index_of_value( items, item );
				
			}
			
			if ( index !== -1 ) {
				
				item = items[ index ];
				element = item.element;
				container = item.container;
				priority = item.priority;
				queue = item.queue;
				active = queue.active;
				
				// clear from storage
				
				elements.splice( index, 1 );
				items.splice( index, 1 );
				
				// remove queues and container
				
				if ( priority === true ) {
					
					index = main.index_of_value( queue.priority, item );
					
					if ( index !== -1 ) {
						
						queue.priority.splice( index, 1 );
						
					}
					
				}
				else if ( queue.general === item ) {
					
					queue.general = undefined;
					
				}
				
				// if active, and next element is not the same as item element, deactivate
				
				if ( item === active && typeof item.deactivate === 'function' && ( queue.priority.length === 0 || !items_identical( item, queue.priority[ 0 ] ) ) && !items_identical( item, queue.general ) ) {
					console.log( 'UIQueue: deactivate item ' );
					item.deactivate();
					
				}
				
				// if last in queue
				
				if ( queue.priority.length === 0 && typeof queue.general === 'undefined' ) {
				
					index = main.index_of_value( queues, queue );
					
					if ( index !== -1 ) {
						
						queues.splice( index, 1 );
						
					}
					
					if ( typeof container !== 'undefined' ) {
						
						index = main.index_of_value( containers, container );
						
						if ( index !== -1 ) {
							
							containers.splice( index, 1 );
							
						}
						
					}
					
					if ( typeof item.last === 'function' ) {
						console.log( 'UIQueue: last' );
						item.last();
						
					}
					
				}
				console.log( 'UIQueue: REMOVE, queues', queues, ' containers', containers, 'items', items, ' elements', elements );
			}
			
		}
	
	}
	
	/*===================================================
    
    step
    
    =====================================================*/
	
	function step ( parameters ) {
		
		var queue = find_queue( parameters ),
			$container,
			isFirst,
			active,
			activeLast;
		
		if ( queue instanceof Queue ) {
			
			activeLast = queue.active;
			isFirst = typeof activeLast === 'undefined';
			
			// step queue
			
			if ( isFirst || ( parameters.force === true || activeLast.priority !== true ) ) {
				
				remove( activeLast );
				
				// if items remain in queue
				
				if ( queue.priority.length > 0 ) {
					
					active = queue.active = queue.priority[ 0 ];
					
				}
				else if ( typeof queue.general !== 'undefined'  ) {
					
					active = queue.active = queue.general;
					
				}
				console.log( 'UIQueue: active', active, typeof active !== 'undefined' );
				if ( typeof active !== 'undefined' ) {
					
					// if active is first
					
					if ( isFirst && typeof active.first === 'function' ) {
						console.log( 'UIQueue: first' );
						active.first();
						
					}
					
					// ensure container is visible
					
					$container = active.$container;
					
					if ( $container.length > 0 && $container.is( ':visible' ) !== true ) {
						
						main.dom_fade( {
							element: $container,
							opacity: 1
						} );
						
					}
					
					if ( typeof active.activate === 'function' && !items_identical( active, activeLast ) ) {
						console.log( 'UIQueue: activate' );
						active.activate();
						
					}
					console.log( 'UIQueue: STEP, queues', queues, ' containers', containers, 'items', items, ' elements', elements );
					
				}
				else {
					console.log( 'UIQueue: STEP none remain!' );
				}
				
			}
			else {
				console.log( 'UIQueue: STEP blocked by priority' );
			}
		}
		
	}
	
	/*===================================================
    
    clear
    
    =====================================================*/
	
	function clear ( parameters ) {
		
		var i, l,
			queue = find_queue( parameters );
		
		if ( queue instanceof Queue ) {
			
			// general, then priority, then active
			
			if ( typeof queue.general !== 'undefined' && queue.general !== queue.active ) {
				
				remove( queue.general );
				
			}
			
			for ( i = 0, l = queue.priority.length; i < l; i++ ) {
				
				if ( queue.priority[ i ] !== queue.active ) {
					
					remove( queue.priority[ i ] );
					
				}
				
			}
			
			if ( typeof queue.active !== 'undefined' ) {
				
				remove( queue.active );
				
			}
			
		}
		
	}
	
	/*===================================================
    
    utility
    
    =====================================================*/
	
	function items_identical ( itemA, itemB ) {
		
		return typeof itemA !== 'undefined' && typeof itemB !== 'undefined' && itemA.element === itemB.element && itemA.activate === itemB.activate && itemA.deactivate === itemB.deactivate;
		
	}
	
	function find_queue ( parameters ) {
		
		parameters = parameters || {};
		
		var queue = parameters.queue || parameters,
			element = parameters.element || parameters,
			item = parameters.item || parameters,
			container = parameters.container || parameters,
			index = -1;
		
		// find queue
		
		if ( queue instanceof Queue !== true ) {
			
			// try element
			
			if ( typeof element !== 'undefined' ) {
				
				index = main.index_of_value( elements, element );
				
			}
			
			// try item
			
			if ( index === -1 && typeof item !== 'undefined' ) {
				
				index = main.index_of_value( items, item );
				
			}
			
			if ( index !== -1 ) {
				
				queue = items[ index ].queue;
				
			}
			
			// try container
			
			if ( index === -1 && typeof container !== 'undefined' ) {
				
				index = main.index_of_value( containers, container );
				
				if ( index !== -1 ) {
					
					queue = queues[ index ];
					
				}
				
			}
			
		}
		
		return queue;
		
	}
	
} (KAIOPUA) );