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
		} else {
			return metadata.eventlisteners[event];
		}
	}
	
	var fireOnChange = function(data, newVal, oldVal, context) {
		var listeners = getEventListeners(data, 'change');
		for ( var i = 0; i < listeners.length; ++i ) {
			var listener = listeners[i];
			// listener.isRunning is a flag/lock to avoid infinite recursions (eg. when the data is modified
			// by the listener function, then the same listener won't be called again
			if (( ! listener.isRunning) && (context === undefined || listener.context != context)) {
				listener.isRunning = true;
				listener.fn(newVal, oldVal, data);
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
						var context = (arguments.length == 1) ? undefined : arguments[1];
						var oldVal = value;
						value = arguments[ 0 ];
					
						fireOnChange( data[ prop ], value, $.observable.remove(oldVal), context);
					
						if ( $.isPlainObject( value ) ) {
							$.observable( value );
						}
					}
				};
				// object for storing the metadata of the observable plugin
				observable.__observable = new Object();
				
				observable.on = function(event, listener, context) {
					getEventListeners(this, event).push({
						context: context,
						fn: listener
					});
					return this;
				}
			
				if (observable.change === undefined) {
					observable.change = function(listener, context) {
						return this.on('change', listener, context);
					}
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
