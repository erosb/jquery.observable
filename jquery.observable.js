(function($) {
	
	var getEventListeners = function( data, event ) {
		if (data.eventlisteners === undefined) {
			data.eventlisteners = {
				'change': []
			}
		}
		if ( event === undefined ) {
			return data.eventlisteners;
		} else {
			return data.eventlisteners[event];
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
					
				var rval = function() {
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
			
				rval.change = function(listener) {
					getEventListeners(this, 'change').push(listener);
					return this;
				}
				
				return rval;
			
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
