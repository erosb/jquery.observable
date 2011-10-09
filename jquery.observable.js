(function($) {
	
	$.observable = function(data) {
		for ( var prop in data ) {
				
			var value = data[ prop ];
				
			data[ prop ] = (function(value, prop) {
					
				// binding recursively
			if ( $.isPlainObject( value ) ) {
				$.observable( value );
			}
					
			return function() {
				if (arguments.length === 0) { // getter
					return value;
				} else { // setter
					var oldVal = value;
					value = arguments[ 0 ];
					
					if ( $.isFunction( data[ prop ].onChange ) ) {
						data[ prop ].onChange( value, $.observable.remove(oldVal) );
					}
					if ( $.isPlainObject( value ) ) {
						$.observable( value );
					}
				}
			};
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
