import once from './utils/once-event-listener';
import createEmptyCustomEvent from './utils/custom-event';
import delegate from 'delegate';

/**
 * Insert a modal into the DOM after clicking a trigger.
 * Includes various callbacks to allow for overrides and additional "modal"
 * functionality we may want, such as fade-ins/outs, close on click outside, etc.
 *
 * @param {Function} opt.template The main template function that returns a string of HTML. Called with the passed in `context`. The return value of the template should be a single HTML node.
 * @param {Any|Function} [opt.context] Optional context object to be passed into our template template. If a function is passed, it will be called with `trigger_node` and `event` as its arguments and its return value will be passed to our template.
 * @param {String|null} [opt.trigger_selector] Selector of the element(s) that when clicked, open our modal. Defaults to '[data-modal-trigger="${template.name}"]' or '[data-modal-trigger]' if template is an anonymous function. If `null` is passed, no delegated event is attached to open, meaning the modal can only be opened via the API.
 * @param {String|null} [opt.close_selector] Selector of the element(s) that when clicked, close its open modal. Defaults to '[data-modal-close]'. If the modal does not contain an element matching `[data-modal-close]` or `null` is passed as this argument then the modal itself will close when clicked.
 * @param {Function} [opt.onAppend] Optional function to append our modal to the DOM. Called with two arguments: `modal_node` and `trigger_node`. Defaults to `document.body.appendChild(modal_node)`.
 * @param {Function} [opt.beforeInsertIntoDom] Optional function that runs before inserting the modal into the DOM. Called with three arguments: `modal_node`, `trigger_node`, and `event`. If this function returns `false`, modal will _not_ be injected and we bail early.
 * @param {Function} [opt.afterInsertIntoDom] Optional function that runs after inserting the modal into the DOM. Called with three arguments: `modal_node`, `trigger_node`, and `event`.
 * @param {String} [opt.remove_modal_after_event_type] When set, the modal is not removed until this event is fired. Otherwise modal is removed immediately from DOM. Some useful event types are 'transitionend' and 'animationend'.
 * @param {Function} [opt.beforeRemoveFromDom] Optional function that runs before removing the modal from the DOM. Called with three arguments: `modal_node`, `close_node`, and `event`. If this function returns `false`, modal will _not_ be removed and we bail early.
 * @param {Function} [opt.afterRemoveFromDom] Optional function that runs after removing the modal from the DOM. Called with three arguments: `modal_node`, `close_node`, and `event`.
 * @param {Function} [opt.onAfterSetup] Optional function that runs once after all event listeners have been setup. Called with `modal_node` and an object with `isOpen`, `open`, `close`, and `destroy` methods.
 * @param {Function} [opt.onDestroy] Optional function that runs additional cleanup steps if we "destroy" our listeners. Called with `modal_node`.
 * @returns {Object} Returns an object with `modal_node` getter, `isOpen`, `destroy`, `close`, and `open` methods. `open` and `close` will be called with a dummy CustomEvent, but you can optionally pass your own.
 * @throws {Error} Throws when `template` is not a function, or if it doesn't return a DOM node.
 */
const initializeModalListener = ({
	template,
	context,
	trigger_selector,
	close_selector,
	onAppend,
	afterInsertIntoDom,
	beforeInsertIntoDom,
	remove_modal_after_event_type,
	beforeRemoveFromDom,
	afterRemoveFromDom,
	onAfterSetup,
	onDestroy,
} = {}) => {
	// Save a few bytes by storing these vars rather than inline strings.
	const fn = 'function';
	const click = 'click';

	if (typeof template !== fn) {
		throw new Error('"template" argument is required, and needs to be a function.');
	}

	if (trigger_selector === undefined) {
		/**
		 * Only use the named function if it isn't an
		 * inferred name from our object.
		 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name#Inferred_function_names
		 */
		if (template.name !== 'template') {
			// @todo consider other defaults
			trigger_selector = `[data-modal-trigger="${template.name}"]`;
		} else {
			trigger_selector = '[data-modal-trigger]';
		}
	}

	const modal_is_dynamic = typeof context === fn;

	const createModalNode = (trigger_node, open_event) => {
		let template_context = context;
		if (modal_is_dynamic) {
			template_context = context(trigger_node, open_event);
		}

		// Assumes our template returns a single child node
		// @todo Consider supporting multiple nodes, maybe with Document Fragments?
		let modal_html = template(template_context);
		let dummy_ele = document.createElement('div');
		dummy_ele.innerHTML = modal_html;

		let child = dummy_ele.firstElementChild;
		if (!child) {
			throw new Error('"template" must return a DOM node.');
		}

		return child;
	};

	/**
	 * Only create `modal_node` if we don't have a dynamic context. Otherwise
	 * this will be created when the modal is opened.
	 */
	let modal_node;
	if (!modal_is_dynamic) {
		modal_node = createModalNode();
	}

	/**
	 * If no `close_selector` was passed **and** we have a static modal_node, check if
	 * `[data-modal-close]` matches an element within our modal. If not, then reset our
	 * close selector which in turn means that the modal will be closed when itself is clicked.
	 *
	 * If we do have a dynamic modal, then this check is repeated in our onTriggerOpen
	 * function
	 */
	const default_close_selector = '[data-modal-close]';
	let no_close_selector_specified = false;
	if (close_selector === undefined) {
		no_close_selector_specified = true;
		if (modal_node && modal_node.querySelector(default_close_selector)) {
			close_selector = default_close_selector;
		}
	}

	let isOpen = false;

	const onTriggerOpen = function onTriggerOpen(event) {
		if (isOpen) {
			return;
		}

		// @todo Consider using optional chaining
		let trigger_node = event && event.delegateTarget;

		if (modal_is_dynamic) {
			modal_node = createModalNode(trigger_node, event);

			// Always check for the default close selector if none was specified for a dynamic modal
			if (no_close_selector_specified) {
				if (modal_node.querySelector(default_close_selector)) {
					close_selector = default_close_selector;
				} else {
					close_selector = undefined;
				}
			}
		}

		if (typeof beforeInsertIntoDom === fn) {
			// If `beforeInsertIntoDom` returns `false` exactly, bail early
			let bail_check = beforeInsertIntoDom(modal_node, trigger_node, event);
			if (bail_check === false) {
				return;
			}
		}

		/**
		 * If no close_selector is set (or is `null`), then add a click listener to the modal that closes itself.
		 * Note that this only happens if the default `[data-modal-close]` is not found
		 * within the modal itself.
		 */
		if (close_selector == null) {
			once(modal_node, click, onTriggerClose);
		}

		// Default is to just append the child to the <body>
		if (typeof onAppend === fn) {
			onAppend(modal_node, trigger_node, event);
		} else {
			document.body.appendChild(modal_node);
		}

		isOpen = true;

		if (typeof afterInsertIntoDom === fn) {
			afterInsertIntoDom(modal_node, trigger_node, event);
		}
	};

	const removeModal = (modal_node, close_node, event) => {
		modal_node.parentNode.removeChild(modal_node);

		isOpen = false;

		if (typeof afterRemoveFromDom === fn) {
			afterRemoveFromDom(modal_node, close_node, event);
		}
	};

	const onTriggerClose = function onTriggerClose(event) {
		if (!isOpen) {
			return;
		}

		// @todo Consider using optional chaining
		let close_node = event && event.delegateTarget;
		if (typeof beforeRemoveFromDom === fn) {
			// If `beforeRemoveFromDom` returns `false` exactly, bail early
			let bail_check = beforeRemoveFromDom(modal_node, close_node, event);
			if (bail_check === false) {
				return;
			}
		}

		if (remove_modal_after_event_type) {
			once(modal_node, remove_modal_after_event_type, function onEventBeforeRemoval() {
				removeModal(modal_node, close_node, event);
			});
		} else {
			// Default is to remove modal immediately
			removeModal(modal_node, close_node, event);
		}
	};

	const trigger_delegation = trigger_selector && delegate(trigger_selector, click, onTriggerOpen);
	let close_delegation;
	if (close_selector !== null) {
		close_delegation = delegate(
			no_close_selector_specified ? default_close_selector : close_selector,
			click,
			onTriggerClose
		);
	}

	const rtn_object = {
		// Use getter in case a dynamic context was passed
		get modal_node() {
			return modal_node;
		},
		open(event = createEmptyCustomEvent('open.yamodal')) {
			return onTriggerOpen(event);
		},
		close(event = createEmptyCustomEvent('close.yamodal')) {
			return onTriggerClose(event);
		},
		isOpen() {
			return isOpen;
		},
	};

	const destroy = function destroy() {
		// Close the modal if it is open
		if (rtn_object.isOpen()) {
			rtn_object.close();
		}

		// Reset return functions so they can no longer be called
		const noop = () => {};
		rtn_object.destroy = noop;
		rtn_object.open = noop;
		rtn_object.close = noop;
		rtn_object.isOpen = noop;

		// @see https://www.npmjs.com/package/delegate#with-a-single-base-element-default-or-specified
		trigger_delegation && trigger_delegation.destroy();
		close_delegation && close_delegation.destroy();

		if (typeof onDestroy === fn) {
			onDestroy(modal_node);
		}

		modal_node = undefined;
	};

	rtn_object.destroy = destroy;

	if (typeof onAfterSetup === fn) {
		onAfterSetup(modal_node, rtn_object);
	}

	return rtn_object;
};

export default initializeModalListener;
