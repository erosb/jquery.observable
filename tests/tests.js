function debug(str) {
	console.log(str);
}

module("basic tests");

test("Testing Primitive wraps", function() {
	var data = {
			key1: 'val1',
			key2: 'val2',
			checkObject: {
				key1: 'object/key1'
		}
	};
	data = $.observable( data );
	ok($.isFunction(data), "data is function");
	ok($.isFunction(data().key1), "key1 is function");
	same(data().key1(), 'val1', "key1() returns 'val1'");
	ok($.isFunction(data().key2), "key2 is function");
	same(data().key2(), 'val2', "key2() returns 'val2'");
		
	ok($.isFunction(data().checkObject), "checkObject is function");
	ok($.isFunction(data().checkObject().key1), "checkObject().key1 is function");
	same(data().checkObject().key1(), 'object/key1', "checkObject().key1() returns 'object/key1");
		
	data().key1('changed');
	same(data().key1(), 'changed', "check data change");
	
	data().key1({
			subkey: 'subval'
	});
	ok($.isFunction(data().key1().subkey), true, "check observable packaging on setting object")
});

module("observable.remove");

test("testing basic unwraps", function() {
	var data = $.observable(42);
	same(42, $.observable.remove(data), "testing primitive unwrap")
	var rawData = {
		key1: 'va1',
		key2: {
			key2_1: 'val2_1'
		}
	};
	data = $.observable(rawData);
	same($.observable.remove(data), {
		key1: 'va1',
		key2: {
			key2_1: 'val2_1'
		}
	}, "testing object unwrap");
});

test("testing array unwraps", function() {
	var wrapped = $.observable([1, 2, 3]);
	same($.observable.remove( wrapped ), [1, 2, 3]);
	
	wrapped = $.observable({
		key1: [1, 2, 3],
		key2: 42
	});
	
	same($.observable.remove(wrapped), {
		key1: [1, 2, 3],
		key2: 42
	});
	
	wrapped = $.observable({
		key1: [1, 2, 3, {
			key: 'val'
		}],
		key2: 42
	});
	
	same($.observable.remove(wrapped), {
		key1: [1, 2, 3, {
			key: 'val'
		}],
		key2: 42
	});
});


module("event handling");

test("testing basic onChange event", function() {
	var data = {
		key1: 'val',
		key2: {
			key2_1 : 'val2_1'
		}
	}
	data = $.observable( data );
		
	var _newVal, _oldVal;
	var valSaver = function (newVal, oldVal) {
		_newVal = newVal;
		_oldVal = oldVal;
	};
	data().key1.on('change', valSaver);
	data().key1('val changed');
	same(_newVal, 'val changed', "testing onChange newVal");
	same(_oldVal, 'val', "testing onChange oldVal");
	
	data().key2().key2_1.on('change', valSaver);
	data().key2().key2_1('val2_1 changed');
	same(_newVal, 'val2_1 changed', "testing inner onChange newVal");
	same(_oldVal, 'val2_1', "testing inner onChange oldVal");
	
	data().key2.on('change', valSaver);
	data().key2('val2');
	same(_newVal, 'val2', "testing object change newVal");
	same(_oldVal, {key2_1: 'val2_1 changed'}, "testing object change oldVal");
});

test("testing multiple onChange listeners", function() {
	var data = {
		key1: 'val',
		key2: {
			key2_1 : 'val2_1'
		}
	}
	data = $.observable( data );
	
	var changeCallCount = 0;
	var incrementCallCount = function(newVal, oldVal) {
		++changeCallCount;
		same(oldVal, "val", "the old value is 'val'");
		same(newVal, "new val", "the new value is 'new val'");
	}
	data().key1.on('change', incrementCallCount);
	data().key1.on('change', incrementCallCount);
	data().key1('new val');
	same(changeCallCount, 2, "both 2 onChange listeners called");
});

test("testing on([array]) behavior", function() {
	var data = $.observable({key: 'val'});
	var callCount = 0;
	data().key.on( ['change', 'change'], function() {
		++callCount;
	})
	data().key('foo');
	same(callCount, 2, "[change, change] works");
});

test("testing if onChange avoids infinite recursion", function() {
	var data = {
		key: 'val'
	};
	data = $.observable(data);
	data().key.on('change', function(newVal, oldVal) {
		data().key(oldVal);
	});
	data().key('new val');
	ok(true, "avoided");
})

module("Array basics");

test("testing basic array events", function() {
	var data = {
		key1: 'val',
		key2: [1, 2, 3]
	};
	data = $.observable(data);
	var _newVal = null;
	data().key2.on('elemchange', function(key, newVal) {
		same(key, 1, "key param is correct in array.elemchange callback");
		_newVal = newVal;
	})

	same( data().key2(1)(), 2, "testing array item read");
	
	same( $.observable.remove( data().key2() ),  [1, 2, 3],  "testing raw array read");
	
	same( data().key2(1)(), 2, "testing array item read");
	
	data().key2(1, 'new elem');
	same(_newVal, 'new elem', "testing array.elemchange event");

	data().key2.on('change', function(newVal, oldVal){
		same(newVal, [1], "check array.change newVal param");
		same(oldVal, [1, 'new elem', 3], "check array.change oldVal param");
	});
	
	data().key2( [1] );
});


test("testing if array item objects are properly wrapped", function() {
	var data = {
		arr: 
		[1, 2, 3]
	};
	data = $.observable( data );
	same( data().arr().length, 3, "array length is correct after wrapping");
	data().arr([]);
	same( data().arr(), [], "array setter works as expected");
	
	ok($.isFunction( data().arr ), "array item object is wrapped");
	
	data().arr( ['a'] );
	same( data().arr().length, 1, "array setter works");
	same( data().arr(0)(), 'a', "primitive getter works as expected");
	
	data().arr(1, 'b');
	same( data().arr(1)(), 'b', "primitive setter works");
	
	data().arr(1, {foo: 'bar'});
	same( data().arr(1)().foo(), 'bar', "array item object wrapper returns proper value");
	
	data().arr(0, "changed");
	same( data().arr(0)(), "changed");
	
});

module("Array events & methods");

test("push", function() {
	var data = $.observable( [] );
	var _newVal = null;
	data.on('push', function(newVal) {
		_newVal = newVal;
	});
	data.push( 42 );
	same( _newVal, 42, "push event is fired" );
});
