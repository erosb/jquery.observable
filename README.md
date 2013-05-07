jquery.observable
=================

This plugin converts a data structure built from javascript objects and arrays
into an observable structure with jQuery-style accessors and event listeners.

The aim of this project is to provide a tool for front-end developers
to effectively handle their data model, with the power of event handling
in the model itself, but without the need of writing tons of accessor methods.

The project is currently in proof-of-concent status.

Working with objects
--------------------

For the first example, let's create a simple data structure:

	var user = {
		name: 'Bence Eros',
		email: 'crystal@cyclonephp.com'
	};
	
Then let's make it observable:

	user = $.observable(user);
	
The $.observable call will return a function that internally manages the user object,
maintains its value, and calls the configured event listeners if the value changes. The
properties of the user object will also be wrapped. Let's see how to work with the wrapped
values.

	// if you want to read a value, then you have to call its wrapper function withot parameters
	// note that the return value of the user() call returned an object that represents
	// the original user object, but the properties are wrapped
	console.log( user().name() );
	
	// if you want to write a property, call its wrapper function with exactly 1 parameter
	user().name('Somebody Else');
	
	// you can write the whole object too, of course
	user({
		name: 'Somebody Else',
		email: 'somebody@example.com'
	});
	
	// but the new properties will also be wrapped
	console.log( user().name() );
	
Using event listeners
---------------------

Let's see why did we do all this stuff. You can add onChange event listeners to your
model properties that will be fired by the wrapper function whenever the property value
is written.

	user().name.on('change', function(newVal, oldVal) {
		// the new value (newVal) is wrapped into an observable already
		// therefore in the event handlers its possible to add further
		// event handlers if its needed
		$('#username').html(newVal()); // let's update our UI whenever the name of the user changes
	})

	user().name('Somebody Else'); //this call will fire the above function

So we have set up a new event listener. You can ask that why should you use these wrapper
functions, since we could have create the original data structure with private properties 
and a setter method for the name property.

At the very least this method has a very important
advantage: it's not necessary for the model to implement its accessor methods, and it does not have
to directly communicate with their clients. It's possible to set up an onChange listener
by the view to update itself immediately when the model changes, an other one by the
controller to do whatever specific action, and a third one by the model, which is used to
keep itself in a consistent state. A listener pool is set up for each observable model data
(including objects, primitives and arrays) and the clients of the model can add their listeners
to it. Doing it without jquery.observable is possible of course, but it needs tons of
hand-written boilerplate code.

Using arrays
------------

In the first section we have seen how to work with objects, but in the model we have some
arrays too in most cases. Let's see how to work with arrays, how they are wrapped and
how to use the wrapper functions.

Let's create a wrapped model that contains an array:

	var user = $.observable({
		name: 'Bence Eros',
		emails: ['crystal@cyclonephp.com', 'ebence88@gmail.com']
	});

	//calling the wrapper without parameters will return the complete array
	var emails = user().emails();
	
	// but the array elements are still wrapped, so you have to call the wrapper function
	// to get the property value
	console.log( emails[0]() )
	
	// calling the wrapper with 1 parameter will return the wrapper for the array element
	var myGmail = user().emails(1)();
	
	// calling the wrapper with 1 array parameter will replace the original array
	user().emails( ['crystal@cyclonephp.com', 'ebence88@gmail.com'] )
	
	// and after replacing the array, its elements are wrapped again
	var myGmail = user().emails(1)();
	
	// calling the wrapper with 2 parameters will replace an array element (and it will be wrapped too)
	user().emails(1, 'bence.eros@gmail.com');
	
Array methods
-------------
Since arrays are not simple values but collections, you can do some more operations for them
than simply replacing them with a new value. Currently only the mutator methods of the array
wrapper are implemented, but until the first stable release all the other methods will be
implemented the native Array has. Example on using the push method (using the above
introduced model object):

	// not that the push() is a method of the wrapper, so you mustn't call the wrapper function
	user().emails.push('me@example.org');
	
	// it's wrong - this is a call on the native Array.push() method, so it's not controlled
	// by the wrapper. The event listeners won't be fired, and the new item won't be wrapped.
	user().emails().push('me@example.org');
	
Other methods:

* each(callback): iterates on the array elements. Callback parameters: index, value. The value is
wrapped. If the callback returns false, then the iteration is stopped.
* size(): returns the length of the wrapped array. In this case arrayWrapper().length also works.
* pop(): same as the native Array.pop(), but the returned value is wrapped, and it fires the 'pop' event.
* reverse(): same as the native Array.reverse(), but it fires the 'reverse' event.
* shift(): same as the native Array.shift(), but it fires the 'shift' event and the returned value is wrapped.
* unshift(): same as the native Array.unshift(), but it fires the 'unshift' event, and wraps its
parameter before prepending it to the wrapped array.
* sort(): same as the native Array.sort(). The elements of the returned array are wrapped.
The method takes one optional parameter, the comparator function. The comparator should take
2 parameters, and should return less than 0 if the 1st parameter is lower than the 2nd parameter,
0 is the two parameters are equal, and greater than 0 if the 1st parameter is greater than the
2nd parameter. If the comparator function is not passed, then the sorting will be done using
a default lexicographical comparator.

Array events
------------

Arrays are not simple values but collections, therefore there are some further events
that can be observed on an array, not only the change event:

* elemchange: this will be fired when an array element is replaced. The listeners will
receive 2 parameters: the already wrapped new value, and the unwrapped, plain old value (or undefined).
* push: fired when a new element is pushed into the array. The listeners will receive 1
parameter: the already wrapped new element.
* pop: fired when the ArrayWrapper.pop() method is called. The listener parameter is the wrapped
elem to be removed.
* reverse: fired when the ArrayWrapper.reverse() method is called. The listener has no parameters.
* shift: fired when the ArrayWrapper.shift() method is called. The parameter is the (wrapped)
shifted array element.
* unshift: fired when the ArrayWrapper.unshift() method is called. The parameter is the 
already wrapped new array element.

Note: in the event listeners the 'this' will always refer to the array wrapper.

Removing the wrappers
---------------------

After wrapping up your data model and manipulating it, you can get its raw copy - 
that consists of plain objects and arrays - using the $.observable.remove() function. It's
typically useful if you want to send your model - or a part of it - using ajax for server-side
processing.

