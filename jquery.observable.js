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
		
		observable.on = function(event, listener) {
			if ( $.isArray( event ) ) {
				for ( var i = 0; i < event.length; ++i ) {
					observable.on( event[ i ], listener );
				}
				return;
			}
			getEventListeners(this, event).push({
				fn: listener
			});
			return this;
		}
		
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
					arr[ arguments[0] ] = $.observable( arguments[1] );
					fireEvent(observable, 'elemchange', [arguments[0], arguments[1]]);
					break;
				default:
					throw "must be called with 1 or 2 arguments, not " + arguments.length;
			}
		};
		
		arr = observableArrayItems( arr );
		
		observable.__observable = new Object();
		
		observable.push = function(newItem) {
			arr.push( $.observable(newItem) );
			fireEvent( observable, 'push', [newItem] );
		}
		
		return observable;
	};
		
	
	$.observable = function(data) {
		if ( $.isArray(data) ) {
			return createObservableArray( data );
		}
		return createObservableObject( data );
	}
	
	$.observable.remove = function(data) {
		if ( ! $.isFunction(data)) {
			if ( $.isArray(data) ) {
				for ( var i = 0; i < data.length; ++i ) {
					data[ i ] = $.observable.remove( data[ i ] );
				}
			}
			return data;
		}
		var rawData = data(); // getting the raw object
		
		if ( $.isFunction(rawData) ) {
			var rval = new Array();
			var arr = rawData(); // getting the raw array
			for(var i = 0; i < arr.length; ++i ) {
				rval[ i ] = $.observable.remove( arr[ i ] );
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
