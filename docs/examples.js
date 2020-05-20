import yamodal from '../src/yamodal.js';
import animation from './example-templates/animation.js';
import basic from './example-templates/basic.js';
import fade from './example-templates/fade.js';
import scrollLock from './example-templates/scroll-lock.js';
import clickOutside from './example-templates/click-outside.js';
import closeOnEscape from './example-templates/close-on-esc.js';
import autoOpenOnHashParam from './example-templates/auto-open-on-hash-param.js';
import dynamicContext from './example-templates/dynamic-context.js';

// Basic example (click modal to close)
yamodal({
	template: basic,
	trigger_selector: '[data-modal-trigger="basic"]',
});

// Fade in / Fade out
// @see https://gist.github.com/paulirish/5d52fb081b3570c81e3a for an explanation of the `void modal_node.clientHeight` expressions.
yamodal({
	template: fade,
	trigger_selector: '[data-modal-trigger="fade"]',
	remove_modal_after_event_type: 'transitionend',
	afterInsertIntoDom(modal_node) {
		// Force layout calc
		void modal_node.clientHeight;
		modal_node.style.opacity = '1';
	},
	beforeRemoveFromDom(modal_node) {
		modal_node.style.opacity = '0';
	},
});

// Animate in
yamodal({
	template: animation,
	trigger_selector: '[data-modal-trigger="animation"]',
	// Technically the inner modal has the animation but this event bubbles up so this works
	remove_modal_after_event_type: 'animationend',
	beforeInsertIntoDom(modal_node) {
		let inner_modal = modal_node.querySelector('.modal');
		inner_modal.classList.add('roll-in-blurred-left');
		inner_modal.classList.remove('roll-out-blurred-left');
	},
	beforeRemoveFromDom(modal_node) {
		let inner_modal = modal_node.querySelector('.modal');
		inner_modal.classList.remove('roll-in-blurred-left');
		inner_modal.classList.add('roll-out-blurred-left');
	},
});

// Body scroll lock
yamodal({
	template: scrollLock,
	trigger_selector: '[data-modal-trigger="scroll-lock"]',
	afterInsertIntoDom() {
		document.body.style.overflow = 'hidden';
	},
	afterRemoveFromDom() {
		document.body.style.overflow = '';
	},
});

// Click outside to close modal
let click_outside_inner_node, closeModalOnClickOutside;
yamodal({
	template: clickOutside,
	trigger_selector: '[data-modal-trigger="click-outside"]',
	afterInsertIntoDom(modal_node, trigger_node, e) {
		// When opening the modal, stop it from immediately closing
		e.stopImmediatePropagation && e.stopImmediatePropagation();
	},
	onAfterSetup(modal_node, { isOpen, close }) {
		click_outside_inner_node = modal_node.querySelector('.modal');
		closeModalOnClickOutside = function (e) {
			if (!click_outside_inner_node.contains(e.target) && isOpen()) {
				close();
			}
		};
		document.addEventListener('click', closeModalOnClickOutside);
	},
	onDestroy() {
		document.removeEventListener('click', closeModalOnClickOutside);
	},
});

// Close modal on ESC press
let closeModalOnEscPress;
yamodal({
	template: closeOnEscape,
	trigger_selector: '[data-modal-trigger="close-on-esc"]',
	onAfterSetup(modal_node, { isOpen, close }) {
		closeModalOnEscPress = function (e) {
			// ESC_KEY === 27
			if (e.keyCode === 27 && isOpen()) {
				e.stopPropagation();
				close();
			}
		};
		document.addEventListener('keydown', closeModalOnEscPress);
	},
	onDestroy() {
		document.removeEventListener('keydown', closeModalOnEscPress);
	},
});

// Automatically open modal on some condition (checking a hash param)
yamodal({
	template: autoOpenOnHashParam,
	trigger_selector: '[data-modal-trigger="auto-open-on-hash-param"]',
	onAfterSetup(modal_node, { open }) {
		if (window.location.hash === '#open') {
			open();
		}
	},
	afterRemoveFromDom() {
		if (window.location.hash === '#open') {
			// Remove hash on close
			history.pushState(
				'',
				document.title,
				window.location.pathname + window.location.search
			);
		}
	},
});

// Modal with dynamic context
yamodal({
	template: dynamicContext,
	trigger_selector: '[data-modal-trigger="dynamic-context"]',
	context: () => Math.random(),
});
