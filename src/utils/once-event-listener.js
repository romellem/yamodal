const once = (element, event_type, callback) => {
	// Purposefuly don't use an arrow function so `this` can get binded correctly
	const callbackWithRemove = function(event) {
		element.removeEventListener(event_type, callbackWithRemove);
		callback.call(this, event);
	};
	element.addEventListener(event_type, callbackWithRemove);

	// Returns a 'destroy' function that when run, immediately removes the event.
	return () => element.removeEventListener(event_type, callbackWithRemove);
};

export default once;
