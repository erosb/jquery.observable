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
	
	var createObservableArray = function(arr, cnt) {
		var observable = function() {
			switch (arguments.length) {
				case 1:
					return arr[arguments[0]];
					break;
				case 2:
					arr[arguments[0]] = arguments[1];
					fireEvent(cnt, 'elemchange', [arguments[0], arguments[1]]);
					break;
				default:
					throw "must be called with 1 or 2 arguments, not " + arguments.length;
			}
		};
		observable.__observable = new Object();
		observable.arr = arr;
		observable.on = cnt.on;
		return observable;
	};
		
	
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
	
	$.observable = function(data) {
		for ( var prop in data ) {
				
			var value = data[ prop ];
				
			data[ prop ] = (function(value, prop) {
				
				// binding recursively
				if ( $.isPlainObject( value ) ) {
					$.observable( value );
				}
					
				var observable = function() {
					if (arguments.length === 0) { // getter
						return value;
					} else { // setter
						var oldVal = value;
						value = arguments[ 0 ];
					
						fireEvent( data[ prop ], 'change'
							, [value, $.observable.remove(oldVal)] );
					
						if ( $.isPlainObject( value ) ) {
							$.observable( value );
						}
					}
				};
				// object for storing the metadata of the observable plugin
				observable.__observable = new Object();
				
				observable.on = function(event, listener) {
					getEventListeners(this, event).push({
						fn: listener
					});
					return this;
				}
			
				if (observable.change === undefined) {
					observable.change = function(listener) {
						return this.on('change', listener);
					}
				}
				
				if ( $.isArray(value) ) {
					value = createObservableArray( value, observable );
				}
								
				return observable;
			
			})(value, prop);
			
		}
		return data;
	}
	
	$.observable.remove = function(data) {
		for ( var prop in data ) {
			if ( $.isFunction(data[ prop ]) ) {
				data[ prop ] = data[ prop ]();
			}
		}
		return data;
	}
	
})(jQuery);
