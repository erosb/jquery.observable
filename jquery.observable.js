(function($) {
	"use strict";
	
	var getEventListeners = function( data, event ) {
		var metadata = data.__observable;
		if (metadata.eventlisteners === undefined) {
			metadata.eventlisteners = {
				'change': []
			};
		}
		if ( event === undefined ) {
			return metadata.eventlisteners;
		}
		if ( metadata.eventlisteners[event] === undefined ) {
			metadata.eventlisteners[event] = [];
		}
		return metadata.eventlisteners[event];
	};
	
	var fireEvent = function(data, event, params) {
		var listeners = getEventListeners(data, event);
		// listeners.length can change during the iteration, since
		// the event handlers can add new event handlers for the fired event.
		// we don't want to run the event handlers which have been added after
		// the event occured (ie. which has been added after the iteration has been started)
		// therefore we save the current number of listeners to a local variable
		// before starting the iteration
		var listenerCount = listeners.length;
		for ( var i = 0; i < listenerCount; ++i ) {
			var listener = listeners[i];
			if (listener === undefined)
				continue;
			// listener.isRunning is a flag/lock to avoid infinite recursions (eg. when the data is modified
			// by the listener function, then the same listener won't be called again
			if ( ! listener.isRunning ) {
				listener.isRunning = true;
				listener.fn.apply(data, params);
				listener.isRunning = false;
			}
		}
	};
	
	
	// this function will be the on() method of all wrappers
	var listenerAdder = function(event, listener) {
		if ( $.isArray( event ) ) {
			var rval = [];
			for ( var i = 0; i < event.length; ++i ) {
				rval.push( this.on( event[ i ], listener ) );
			}
			return rval;
		}
		var listeners = getEventListeners(this, event);
		var rval = listeners.length;
		listeners.push({
			fn: listener
		});
		return rval;
	};
	
	var listenerRemover = function(event, listenerID) {
		var listeners = getEventListeners(this, event);
		if (listeners[listenerID] !== undefined) {
			listeners[listenerID] = undefined;
		}
	};
	
	var listenerCount = function(event) {
		var eventListeners = getEventListeners(this, event);
		var rval = 0;
		for (var i = 0; i < eventListeners.length; ++i) {
			if ( eventListeners[i] ){
				++rval;
			}
		}
		return rval;
	}
		
	var createObservableObject = function(value) {
		if ( $.isPlainObject(value) ) {
			for ( var i in value ) {
				if (value.hasOwnProperty( i )) {
					value[ i ] = $.observable( value[ i ] );
				}
			}
		}
		
		var observable = function observableObject() {
			if (arguments.length === 0) { // getter
				return value;
			} else { // setter
				var oldVal = $.observable.remove(observable);
				value = arguments[ 0 ];
			
                var isObservable = ($.isFunction( value )
                      && value.__observable !== undefined );
			
                if (isObservable) {
                      value = value();
                }

				if ( $.isPlainObject( value ) ) {
					for (var i in value) {
						if (value.hasOwnProperty( i )) {
							value[ i ] = $.observable( value[ i ] );
						}
					}
				}
				fireEvent( observable, 'change', [observable, oldVal] );
			}
		};
		
		observable.__observable = {};
		
		observable.on = listenerAdder;
		
		observable.off = listenerRemover;
		
		observable.listenerCount = listenerCount;
		
		return observable;
	};
	
	var observableArrayItems = function(arr) {
		for (var i = 0; i < arr.length; ++i) {
			arr[ i ] = $.observable(arr[ i ]);
		}
		return arr;
	};
	
	var createObservableArray = function(arr) {
		
		var observable = function() {
			var oldVal, newVal;
			switch (arguments.length) {
				case 0:
					return arr;
				case 1:
					var arg = arguments[0];
					if ( $.isArray( arg ) ) {
						oldVal = $.observable.remove(arr);
						arr = observableArrayItems( arg );
						fireEvent(observable, 'change', [arr, oldVal ]);
					} else {
						return arr[ arg ];
					}
					break;
				case 2:
					oldVal = $.observable.remove( arr[ arguments[0] ] );
					arr[ arguments[0] ] = newVal = $.observable( arguments[1] );
					fireEvent(observable, 'elemchange', [arguments[0], newVal, oldVal]);
					break;
				default:
					throw "must be called with 1 or 2 arguments, not " + arguments.length;
			}
		};
		
		arr = observableArrayItems( arr );
		
		observable.__observable = {};
		
		observable.on = listenerAdder;
		
		observable.push = function(newItem) {
			newItem = $.observable(newItem);
			arr.push( newItem );
			fireEvent( this, 'push', [newItem] );
		};
		
		observable.forEach = function( callback ) {
			for ( var i = 0; i < arr.length; ++i ) {
				if ( callback.call( null, i, arr[i] ) === false ) {
					break;
				}
			}
		};
		
		observable.size = function() {
			return arr.length;
		};
		
		observable.pop = function() {
			var rval = arr.pop();
			fireEvent( this, 'pop', [rval] );
			return rval;
		};
		
		observable.reverse = function() {
			arr.reverse();
			fireEvent( this, 'reverse', [] );
		};
		
		observable.shift = function() {
			var rval = arr.shift();
			fireEvent( this, 'shift', [rval] );
			return rval;
		};
		observable.sort = function( callback ) {
			if ( callback ) {
				if ( ! $.isFunction( callback )) {
					throw "ArrayWrapper.sort() can only accept function parameter";
				}
			} else {
				callback = function(a, b) { // a default callback with lexicographical ordering.
					a = a.toString();
					b = b.toString();
					if (a === b) {
						return 0;
					} else if (a < b) {
						return -1;
					}
					return 1;
				};
			}
			var comparator = function(a, b) {
				return callback($.observable.remove( a ), 
					$.observable.remove( b )); // unwrapping the items before passing them to the callback
			};
			
			return arr.sort(comparator);
		};
		observable.unshift = function(elem) {
			elem = $.observable( elem );
			arr.unshift( elem );
			fireEvent(this, 'unshift', [elem] );
		};
		
		
		return observable;
	};
		
	
	$.observable = function(data) {
		if ( $.isArray(data) ) {
			return createObservableArray( data );
		}
		if ( $.isFunction(data) && data.__observable ) {
			return data;
		}
		return createObservableObject( data );
	};
	
	$.observable.remove = function(data) {
		var rval = [], i;
		if ( ! $.isFunction(data)) {
			if ( $.isArray(data) ) {
				for ( i = 0; i < data.length; ++i ) {
					rval[ i ] = $.observable.remove( data[ i ] );
				}
			}
			return rval;
		}
		var rawData = data(); // getting the raw object
		
		if ( $.isArray(rawData) ) {
			for( i = 0; i < rawData.length; ++i ) {
				rval[ i ] = $.observable.remove( rawData[ i ] );
			}
			return rval;
		} else if ($.isPlainObject( rawData ) ) {
			rval = {};
			for ( var prop in rawData ) {
				if (rawData.hasOwnProperty(prop)) {
					rval[ prop ] = $.observable.remove( rawData[ prop ] );
				}
			}
			return rval;
		}
		return rawData;
	};
	
})(jQuery);
