/**
 * Creates a CustomEvent without any extra data applied.
 * @param {String} event_name
 * @returns {CustomEvent}
 */
const createEmptyCustomEvent = (event_name) => {
	// Reuse `CustomEvent` string to help with minifying
	const customEvent = 'CustomEvent';
	let event;
	if (window[customEvent] && typeof window[customEvent] === 'function') {
		event = new window[customEvent](event_name);
	} else {
		// IE doesn't support `CustomEvent` constructor
		// @link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Browser_compatibility
		event = document.createEvent(customEvent);
		event['init' + customEvent](event_name, true, true);
	}

	return event;
};

export default createEmptyCustomEvent;
