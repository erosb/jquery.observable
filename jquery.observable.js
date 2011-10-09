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
	
	var fireOnChange = function(data, newVal, oldVal) {
		var listeners = getEventListeners(data, 'change');
		for ( var i = 0; i < listeners.length; ++i ) {
			listeners[i](newVal, oldVal, data);
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
					
						fireOnChange( data[ prop ], value, $.observable.remove(oldVal) );
					
						if ( $.isPlainObject( value ) ) {
							$.observable( value );
						}
					}
				};
				// object for storing the metadata of the observable plugin
				observable.__observable = new Object();
				
				observable.on = function(event, listener) {
					getEventListeners(this, event).push(listener);
					return this;
				}
			
				if (observable.change === undefined) {
					observable.change = function(listener) {
						return this.on('change', listener);
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
