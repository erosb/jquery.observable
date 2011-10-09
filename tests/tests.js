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
