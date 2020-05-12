import yamodal from '../src/yamodal.js';
import basic from './templates/basic.js';
import fade from './templates/fade.js';
import clickOutside from './templates/click-outside.js';
import closeOnEscape from './templates/close-on-esc.js';
import autoOpenOnHashParam from './templates/auto-open-on-hash-param.js';
import dynamicContext from './templates/dynamic-context.js';

// Basic example
yamodal({
	template: basic,
	trigger_selector: '[data-modal-trigger="basic"]',
});

yamodal({
	template: fade,
	trigger_selector: '[data-modal-trigger="fade"]',
	removeModalAfterTransition: true,
	afterInsertIntoDom(modal_node) {
		// Force layout calc
		void modal_node.clientHeight;
		modal_node.style.opacity = '1';
	},
	beforeRemoveFromDom(modal_node) {
		modal_node.style.opacity = '0';
		// Force layout calc
		void modal_node.clientHeight;
	},
});

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

yamodal({
	template: dynamicContext,
	trigger_selector: '[data-modal-trigger="dynamic-context"]',
	context: () => Math.random(),
});


