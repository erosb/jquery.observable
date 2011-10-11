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

test("Testing avoiding multiple wraps", function() {
	var doubleObserved = $.observable( $.observable(1) );
	same( doubleObserved(), 1, "no double wrap");
})

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
	var _newVal = null, _oldVal = null;
	data().key2.on('elemchange', function(key, newVal, oldVal) {
		same(key, 1, "key param is correct in array.elemchange callback");
		_newVal = newVal();
		_oldVal = oldVal;
	})

	same( data().key2(1)(), 2, "testing array item read");
	
	same( $.observable.remove( data().key2() ),  [1, 2, 3],  "testing raw array read");
	
	same( data().key2(1)(), 2, "testing array item read");
	
	data().key2(1, 'new elem');
	same(_newVal, 'new elem', "testing array.elemchange newVal");
	same(_oldVal, 2, "testing array.elemchange oldVal");

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

test("each()", function() {
	var arr = $.observable( ['a', 'b', 'c'] );
	
	ok( $.isFunction(arr(0)), "testing initial array item wraps");
	var readArr = [];
	arr.each( function(idx, elem) {
		readArr[idx] = elem();
	});
	same(readArr, ['a', 'b', 'c'], "testing wrappedArray.each()");
	var _callCount = 0;
	arr.each( function() {
		_callCount++;
		return false;
	});
	same(_callCount, 1, "return false; works");
})

test("push()", function() {
	var data = $.observable( [] );
	var _newVal = null;
	data.on('push', function(newVal) {
		_newVal = newVal();
	});
	data.push( 42 );
	same( _newVal, 42, "push event is fired" );
});

test("size()", function() {
	var data = $.observable( ['a', 'b', 'c'] );
	same( data.size(), 3, "size() works" );
	
	data.push('d');
	same( data.size(), 4, "size() works after push()" );
});

test("pop()", function() {
	var data = $.observable( ['a', 'b', 'c'] );
	var _poppedElem = null;
	var _newSize = null;
	data.on('pop', function(elem) {
		_poppedElem = elem();
		_newSize = this.size();
	});
	same(data.pop()(), 'c', "pop() method works")
	same(_poppedElem, 'c', "pop event fired")
	same(_newSize, 2, "size() works after pop()")
});

test("reverse()", function() {
	var arr = ['a', 'b', 'c'];
	var data = $.observable( arr );
	
	var _called = false;
	data.on("reverse", function() {
		_called = true;
		same($.observable.remove(this), ['c', 'b', 'a'] );
	});
	
	data.reverse();
	ok(_called, "event handler called");
	same($.observable.remove(data), ['c', 'b', 'a'])
});

test("shift()", function() {
	var data = $.observable( ['a', 'b', 'c'] );
	var _called = false;
	data.on("shift", function(shiftedVal) {
		_called = true;
		same(shiftedVal(), 'a', "event handler correct arg");
	});
	var first = data.shift()();
	same(first, 'a', 'shift gave proper return value');
	same($.observable.remove( data ), ['b', 'c'], "remaining array is correct");
	ok(_called, "event handler called");
});


test("sort()", function() {
	var data = $.observable( ['a', 'c', 'b'] );
	var _called = false;
	data.sort();
	
	var _called = false;
	data.sort(function(x, y) {
		ok( ! $.isFunction(x), "1st arg unwrapped");
		ok( ! $.isFunction(y), "2nd arg unwrapped");
		_called = true;
		return x > y;
	});
	ok(_called, "comparator called");
	
})

test("unshift()", function() {
	var data = $.observable( ['b', 'c'] );
	var _called = false;
	data.on("unshift", function(elem) {
		_called = true;
		same(elem(), 'a', "event handler correct arg");
	});
	data.unshift('a');
	ok(_called, "event handler called");
	same( $.observable.remove( data ), ['a', 'b', 'c'] );
});
