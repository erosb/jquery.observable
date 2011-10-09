module("basic tests");

test("Testing Primitive wraps", function() {
	var data = {
			key1: 'val1',
			key2: 'val2',
			checkObject: {
				key1: 'object/key1'
		}
	};
	$.observable( data );
	ok($.isFunction(data.key1), "key1 is function");
	same(data.key1(), 'val1', "key1() returns 'val1'");
	ok($.isFunction(data.key2), "key2 is function");
	same(data.key2(), 'val2', "key2() returns 'val2'");
		
	ok($.isFunction(data.checkObject), "checkObject is function");
	ok($.isFunction(data.checkObject().key1), "checkObject().key1 is function");
	same(data.checkObject().key1(), 'object/key1', "checkObject().key1() returns 'object/key1");
		
	data.key1('changed');
	same(data.key1(), 'changed', "check data change");
	
	data.key1({
			subkey: 'subval'
	});
	ok($.isFunction(data.key1().subkey), true, "check observable packaging on setting object")
});


module("event handling");

test("testing basic onChange event", function() {
	var data = {
		key1: 'val',
		key2: {
			key2_1 : 'val2_1'
		}
	}
	$.observable( data );
		
	var _newVal, _oldVal;
	var valSaver = function (newVal, oldVal) {
		_newVal = newVal;
		_oldVal = oldVal;
	};
	data.key1.change(valSaver);
	data.key1('val changed');
	same(_newVal, 'val changed', "testing onChange newVal");
	same(_oldVal, 'val', "testing onChange oldVal");
	
	data.key2().key2_1.change(valSaver);
	data.key2().key2_1('val2_1 changed');
	same(_newVal, 'val2_1 changed', "testing inner onChange newVal");
	same(_oldVal, 'val2_1', "testing inner onChange oldVal");
	
	data.key2.change(valSaver);
	data.key2('val2');
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
	$.observable( data );
	
	var changeCallCount = 0;
	var incrementCallCount = function(newVal, oldVal) {
		++changeCallCount;
		same(oldVal, "val", "the old value is 'val'");
		same(newVal, "new val", "the new value is 'new val'");
	}
	data.key1.change(incrementCallCount);
	data.key1.change(incrementCallCount);
	data.key1('new val');
	same(changeCallCount, 2, "both 2 onChange listeners called");
});

test("testing if onChange avoids infinite recursion", function() {
	var data = {
		key: 'val'
	};
	$.observable(data);
	
	data.key.change(function(newVal, oldVal) {
		data.key(oldVal, 'mycontext');
	}, 'mycontext');
	data.key('new val');
	ok(true, "avoided by using context");
	
	data.key.change(function(newVal, oldVal) {
		data.key(oldVal);
	});
	data.key('new val');
	ok(true, "avoided by default behavior");
})

