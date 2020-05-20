import once from './utils/once-event-listener';
import delegate from 'delegate';

/**
 * Insert a modal into the DOM after clicking a trigger.
 * Includes various callbacks to allow for overrides and additional "modal"
 * functionality we may want, such as fade-ins/outs.
 *
 * @param {String|Function} opt.template The main template function that returns a string of HTML. Called with the passed in `context`. The return value of the template should be a single HTML node.
 * @param {Object|Function} [opt.context] Optional context object to be passed into our template template. If a function is passed, it should return a plain object to be used as the context.
 * @param {String} [opt.trigger_selector] Selector of the element(s) that when clicked, open our modal. Defaults to '[data-modal-trigger="${template.name}"]' or '[data-modal-trigger]' if template is an anonymous function.
 * @param {String} [opt.close_selector] Selector of the element(s) that when clicked, close its open modal. Defaults to '[data-modal-close]'.
 * @param {Function} [opt.onAppend] Optional function to append our modal to the DOM. Called with two arguments: `modal_node` and `trigger_node`. Defaults to `document.body.appendChild(modal_node)`.
 * @param {Function} [opt.beforeInsertIntoDom] Optional function that runs before inserting the modal into the DOM. Called with two arguments: `modal_node` and `trigger_node`.
 * @param {Function} [opt.afterInsertIntoDom] Optional function that runs before inserting the modal into the DOM. Called with two arguments: `modal_node` and `trigger_node`. For instance, you can use this to fade in a modal.
 * @param {Boolean} [opt.removeModalAfterTransition] When false, element is removed immediates from DOM. Otherwise, element is removed after a 'transitionend' event has fired on the `modal_node`. Defaults to false.
 * @param {Function} [opt.beforeRemoveFromDom] Optional function that runs before removing the modal from the DOM. Called with two arguments: `modal_node` and `close_node`.
 * @param {Function} [opt.afterRemoveFromDom] Optional function that runs after removing the modal from the DOM. Called with two arguments: `modal_node` and `close_node`.
 * @param {Function} [opt.onAfterSetup] Optional function that runs once after all event listeners have been setup. Called with `modal_node` and an object with `open`, `close`, and `destroy` methods.
 * @param {Function} [opt.onDestroy] Optional function that runs additional cleanup steps if we "destroy" our listeners. Called with `modal_node`.
 * @returns {Object} Returns an object with `modal_node` element, `isOpen` getter, and `destroy`, `close`, & `open` methods. `open` and `close` will be called with a dummy event arg with a null `delegateTarget`, but you can optionally pass in a custom event.
 * @throws {Error} Throws when `template` is not a function, or if it doesn't return a DOM node.
 */
const initializeModalListener = ({
	template,
	context,
	trigger_selector,
	close_selector = '[data-modal-close]',
	onAppend,
	afterInsertIntoDom,
	beforeInsertIntoDom,
	removeModalAfterTransition,
	beforeRemoveFromDom,
	afterRemoveFromDom,
	onAfterSetup,
	onDestroy,
} = {}) => {
	// Save a few bytes by storing 'function' in a var, refer to this in our `typeof` calls.
	const fn = 'function';

	if (typeof template !== fn) {
		throw new Error('"template" argument is required, and needs to be a function.');
	}

	if (trigger_selector === undefined) {
		if (template.name) {
			// Not sure if this is the best default...
			// @todo consider other defaults
			trigger_selector = `[data-modal-trigger="${template.name}"]`;
		} else {
			trigger_selector = '[data-modal-trigger]';
		}
	}

	const createModalNode = () => {
		let template_context = context;
		if (typeof context === fn) {
			template_context = context();
		}

		// Assumes our template returns a single child node
		// @todo Consider supporting multiple nodes, maybe with Document Fragments?
		let modal_html = template(template_context);
		let dummy_ele = document.createElement('div');
		dummy_ele.innerHTML = modal_html;
		return dummy_ele.firstElementChild;
	};

	let modal_node = createModalNode();

	if (!modal_node) {
		throw new Error('"template" must return a DOM node.');
	}

	let isOpen = false;

	const onTriggerOpen = function onTriggerOpen(event) {
		if (isOpen) {
			return;
		}

		let trigger_node = event.delegateTarget;

		if (typeof context === fn) {
			modal_node = createModalNode();
		}

		if (typeof beforeInsertIntoDom === fn) {
			// If `beforeInsertIntoDom` returns `false` exactly, bail early
			let bail_check = beforeInsertIntoDom(modal_node, trigger_node, event);
			if (bail_check === false) {
				return;
			}
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

	const onTriggerClose = function onTriggerClose(event) {
		if (!isOpen) {
			return;
		}

		let close_node = event.delegateTarget;
		if (typeof beforeRemoveFromDom === fn) {
			// If `beforeRemoveFromDom` returns `false` exactly, bail early
			let bail_check = beforeRemoveFromDom(modal_node, close_node, event);
			if (bail_check === false) {
				return;
			}
		}

		if (removeModalAfterTransition) {
			once(modal_node, 'transitionend', function onTransitionEnd() {
				modal_node.parentNode.removeChild(modal_node);

				isOpen = false;

				if (typeof afterRemoveFromDom === fn) {
					afterRemoveFromDom(modal_node, close_node, event);
				}
			});
		} else {
			// Default is to remove modal immediately
			modal_node.parentNode.removeChild(modal_node);

			isOpen = false;

			if (typeof afterRemoveFromDom === fn) {
				afterRemoveFromDom(modal_node, close_node, event);
			}
		}
	};

	const trigger_delegation = delegate(trigger_selector, 'click', onTriggerOpen);
	let close_delegation = delegate(close_selector, 'click', onTriggerClose);

	const rtn_object = {
		// Use getter in case a dynamic context was passed
		get modal_node() {
			return modal_node;
		},
		open(e = { delegateTarget: null }) {
			return onTriggerOpen(e);
		},
		close(e = { delegateTarget: null }) {
			return onTriggerClose(e);
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
		// prettier-ignore
		const noop = () => console.log(`yamodal instance was destroyed, returned methods can no longer be called.`);
		rtn_object.destroy = noop;
		rtn_object.open = noop;
		rtn_object.close = noop;
		rtn_object.isOpen = noop;

		// @see https://www.npmjs.com/package/delegate#with-a-single-base-element-default-or-specified
		trigger_delegation.destroy();
		close_delegation.destroy();

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
