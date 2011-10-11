(function($) {
	
	var getEventListeners = function( data, event ) {
		var metadata = data.__observable;
		if (metadata.eventlisteners === undefined) {
			metadata.eventlisteners = {
				'change': []
			}
		}
		if ( event === undefined ) {
			return metadata.eventlisteners;
		}
		if ( metadata.eventlisteners[event] === undefined ) {
			metadata.eventlisteners[event] = [];
		}
		return metadata.eventlisteners[event];
	}
	
	var fireEvent = function(data, event, params) {
		var listeners = getEventListeners(data, event);
		for ( var i = 0; i < listeners.length; ++i ) {
			var listener = listeners[i];
			// listener.isRunning is a flag/lock to avoid infinite recursions (eg. when the data is modified
			// by the listener function, then the same listener won't be called again
			if ( ! listener.isRunning ) {
				listener.isRunning = true;
				listener.fn.apply(data, params);
				listener.isRunning = false;
			}
		}
	}
	
	
	// this function will be the on() method of all wrappers
	var listenerAdder = function(event, listener) {
		if ( $.isArray( event ) ) {
			for ( var i = 0; i < event.length; ++i ) {
				this.on( event[ i ], listener );
			}
			return;
		}
		getEventListeners(this, event).push({
			fn: listener
		});
		return this;
	};
		
	var createObservableObject = function(value) {
		if ( $.isPlainObject(value) ) {
			for ( var i in value ) {
				value[ i ] = $.observable( value[ i ] );
			}
		}
		
		var observable = function() {
			if (arguments.length === 0) { // getter
				return value;
			} else { // setter
				var oldVal = $.observable.remove(observable);
				value = arguments[ 0 ];
			
				fireEvent( observable, 'change'
					, [value, oldVal] );
			
				if ( $.isPlainObject( value ) ) {
					for (var i in value) {
						value[ i ] = $.observable( value[ i ] );
					}
				}
			}
		};
		
		observable.__observable = new Object();
		
		observable.on = listenerAdder;
		
		return observable;
	}
	
	var observableArrayItems = function(arr) {
		for (var i = 0; i < arr.length; ++i) {
			arr[ i ] = $.observable(arr[ i ]);
		}
		return arr;
	}
	
	var createObservableArray = function(arr) {
		
		var observable = function() {
			switch (arguments.length) {
				case 0:
					return arr;
				case 1:
					var arg = arguments[0];
					if ( $.isArray( arg ) ) {
						arr = observableArrayItems( arg );
					} else {
						return arr[ arg ];
					}
					break;
				case 2:
					var oldVal = $.observable.remove( arr[ arguments[0] ] ), newVal;
					arr[ arguments[0] ] = newVal = $.observable( arguments[1] );
					fireEvent(observable, 'elemchange', [arguments[0], newVal, oldVal]);
					break;
				default:
					throw "must be called with 1 or 2 arguments, not " + arguments.length;
			}
		};
		
		arr = observableArrayItems( arr );
		
		observable.__observable = new Object();
		
		observable.on = listenerAdder;
		
		observable.push = function(newItem) {
			newItem = $.observable(newItem);
			arr.push( newItem );
			fireEvent( this, 'push', [newItem] );
		}
		
		observable.each = function( callback ) {
			for ( var i = 0; i < arr.length; ++i ) {
				callback.call( null, i, arr[i] );
			}
		}
		
		observable.size = function() {
			return arr.length;
		}
		
		observable.pop = function() {
			var rval = arr.pop();
			fireEvent( this, 'pop', [rval] );
			return rval;
		}
		
		observable.reverse = function() {
			var rval = arr.reverse();
			fireEvent( this, 'reverse', [] );
			return rval;
		};
		
		observable.shift = function() {
			var rval = arr.shift();
			fireEvent( this, 'shift', [rval] );
			return rval;
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
	}
	
	$.observable.remove = function(data) {
		if ( ! $.isFunction(data)) {
			if ( $.isArray(data) ) {
				var rval = new Array();
				for ( var i = 0; i < data.length; ++i ) {
					rval[ i ] = $.observable.remove( data[ i ] );
				}
			}
			return rval;
		}
		var rawData = data(); // getting the raw object
		
		if ( $.isArray(rawData) ) {
			var rval = new Array();
			for(var i = 0; i < rawData.length; ++i ) {
				rval[ i ] = $.observable.remove( rawData[ i ] );
			}
			return rval;
		} else if ($.isPlainObject( rawData ) ) {
			rval = new Object();
			for ( var prop in rawData ) {
				rval[ prop ] = $.observable.remove( rawData[ prop ] );
			}
			return rval;
		}
		return rawData;
	}
	
})(jQuery);
