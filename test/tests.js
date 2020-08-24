import yamodal from '../dist/umd/yamodal';
import createEmptyCustomEvent from '../src/utils/custom-event';
import once from '../src/utils/once-event-listener';

import assert from 'assert';
import jsdom from 'global-jsdom';
import sinon from 'sinon';

import * as templates from './templates.js';
const DOCTYPE = `<!doctype html>`;
const HTML = (str = '') => `<html><head><meta charset="utf-8"></head><body>${str}</body></html>`;

describe('utilies', function () {
	beforeEach(function () {
		this.cleanup = jsdom();
	});

	afterEach(function () {
		this.cleanup();
	});

	describe('once event listener', function () {
		it('should call event handler only once', function () {
			const window = document.defaultView;
			let spy = sinon.spy();

			once(window, 'click', spy);

			assert.ok(spy.notCalled);

			// Trigger a click
			let first_click = document.createEvent('HTMLEvents');
			first_click.initEvent('click', true, false);
			window.dispatchEvent(first_click);

			assert.ok(spy.calledOnce);

			// Trigger a second click
			let second_click = document.createEvent('HTMLEvents');
			second_click.initEvent('click', true, false);
			window.dispatchEvent(second_click);

			assert.ok(spy.calledOnce);
		});

		it('should use remove event listener with "destroy" return function', function () {
			const window = document.defaultView;
			let spy = sinon.spy();

			let destroy = once(window, 'click', spy);

			assert.strictEqual(typeof destroy, 'function');
			assert.ok(spy.notCalled);

			destroy();

			let first_click = document.createEvent('HTMLEvents');
			first_click.initEvent('click', true, false);
			window.dispatchEvent(first_click);

			assert.ok(spy.notCalled);
		});
	});

	describe('createEmptyCustomEvent', function () {
		it('should use `CustomEvent` when supportde', function () {
			const window = document.defaultView;

			let event = createEmptyCustomEvent('test');
			assert.ok(event instanceof window.Event);
		});

		it('should use polyfill when `CustomEvent` is not available', function () {
			const window = document.defaultView;
			delete window.CustomEvent;

			let event = createEmptyCustomEvent('test');
			assert.ok(event instanceof window.Event);
		});
	});
});

describe('yamodal', function () {
	describe('errors', function () {
		beforeEach(function () {
			this.cleanup = jsdom();
		});

		afterEach(function () {
			this.cleanup();
		});

		it('should throw when no template is given', function () {
			assert.throws(() => yamodal());
		});

		it('should throw when template is not a function', function () {
			assert.throws(() => yamodal({ template: null }));
			assert.throws(() => yamodal({ template: true }));
			assert.throws(() => yamodal({ template: 1 }));
			assert.throws(() => yamodal({ template: '<div></div>' }));
			assert.throws(() => yamodal({ template: { html: '<div></div>' } }));
		});

		it('should throw when template does not return a DOM node', function () {
			assert.throws(() => yamodal({ template: () => 'modal' }));
		});
	});

	describe('basic functionality', function () {
		before(function () {
			this.button_html = `<button id="button" data-modal-trigger="${templates.basic.name}">x</button>`;
		});

		after(function () {
			this.button_html = undefined;
		});

		beforeEach(function () {
			this.cleanup = jsdom(DOCTYPE + HTML(this.button_html));
		});

		afterEach(function () {
			this.cleanup();
		});

		it('should execute when a template is passed', function () {
			assert.doesNotThrow(() => yamodal({ template: templates.basic }));
		});

		it('should not insert the modal without a trigger being clicked', function () {
			let document_html = global.document.documentElement.outerHTML;
			yamodal({ template: templates.basic });
			assert.strictEqual(global.document.documentElement.outerHTML, document_html);
		});

		/**
		 * This test is also kind of testing other things (default trigger_selector values),
		 * but I'll have specific tests for that later.
		 */
		it('should insert the modal when the trigger is clicked', function () {
			let template_result = templates.basic();
			yamodal({ template: templates.basic });
			let button = document.getElementById('button');
			button.click();

			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${this.button_html}${template_result}`)
			);
		});

		it('should trim whitespace on templates', function () {
			// Add whitespace before and after
			let template_result = ` ${templates.basic()} `;
			yamodal({
				template: function basic() {
					return template_result;
				},
			});
			let button = document.getElementById('button');
			button.click();

			assert.notStrictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${this.button_html}${template_result}`)
			);

			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${this.button_html}${template_result.trim()}`)
			);
		});
	});

	describe('trigger selector', function () {
		afterEach(function () {
			this.cleanup();
		});

		it('should allow for specific trigger_selectors', function () {
			const button_html = `<button id="button">x</button>`;
			this.cleanup = jsdom(DOCTYPE + HTML(button_html));
			let template_result = templates.basic();
			yamodal({
				template: templates.basic,
				trigger_selector: '#button',
			});
			let button = document.getElementById('button');
			button.click();

			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${button_html}${template_result}`)
			);
		});

		it('should use defaults when anonymous templates are used', function () {
			const button_html = `<button data-modal-trigger="">x</button>`;
			this.cleanup = jsdom(DOCTYPE + HTML(button_html));
			let template_result = templates.basic();
			yamodal({
				template: () => template_result,
			});
			let button = document.querySelector('[data-modal-trigger]');
			button.click();

			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${button_html}${template_result}`)
			);
		});

		it('should not use the default selector when `null` is passed', function () {
			const button_html = `<button data-modal-trigger="">x</button>`;
			this.cleanup = jsdom(DOCTYPE + HTML(button_html));
			let template_result = templates.basic();
			let modal = yamodal({
				template: () => template_result,
				trigger_selector: null,
			});
			let button = document.querySelector('[data-modal-trigger]');
			button.click();

			// It shouldn't open
			assert.strictEqual(global.document.documentElement.outerHTML, HTML(`${button_html}`));
		});

		it('should use the function name for the trigger selector when defined', function () {
			const button_should_not_trigger = `<button id="wrong" data-modal-trigger="">x</button>`;
			const button_should_trigger = `<button data-modal-trigger="${templates.basic.name}">x</button>`;
			const button_html = button_should_not_trigger + button_should_trigger;

			this.cleanup = jsdom(DOCTYPE + HTML(button_html));
			let template_result = templates.basic();
			yamodal({
				template: templates.basic,
			});
			let wrong_button = document.querySelector('#wrong');
			wrong_button.click();

			// Should not trigger modal just yet
			assert.strictEqual(global.document.documentElement.outerHTML, HTML(`${button_html}`));

			let right_button = document.querySelector(
				`[data-modal-trigger="${templates.basic.name}"]`
			);
			right_button.click();

			// Now modal should be injected
			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${button_html}${template_result}`)
			);
		});
	});

	describe('close selector', function () {
		afterEach(function () {
			this.cleanup();
		});

		it('should allow for specific close_selectors', function () {
			const open_html = `<button id="open">x</button>`;
			const close_html = `<button id="close">x</button>`;
			this.cleanup = jsdom(DOCTYPE + HTML(open_html));
			let template_result = templates.basicWithClose(close_html);
			yamodal({
				template: () => template_result,
				trigger_selector: '#open',
				close_selector: '#close',
			});
			let open = document.getElementById('open');
			open.click();

			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${open_html}${template_result}`)
			);

			let close = document.getElementById('close');
			close.click();

			assert.strictEqual(global.document.documentElement.outerHTML, HTML(`${open_html}`));
		});

		it('should use defaults when no close_selector is passed', function () {
			const open_html = `<button id="open">x</button>`;
			const close_html = `<button id="fake">x</button><button data-modal-close="" id="real">x</button>`;
			this.cleanup = jsdom(DOCTYPE + HTML(open_html));
			let template_result = templates.basicWithClose(close_html);
			yamodal({
				template: () => template_result,
				trigger_selector: '#open',
			});
			let open = document.getElementById('open');
			open.click();

			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${open_html}${template_result}`)
			);

			let fake_close = document.getElementById('fake');
			fake_close.click();

			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${open_html}${template_result}`)
			);

			let real_close = document.querySelector('[data-modal-close]');
			real_close.click();

			assert.strictEqual(global.document.documentElement.outerHTML, HTML(`${open_html}`));
		});

		it('should use the modal itself when modal does not contain default close selector or is set to `null`', function () {
			// Also text this with static and dynamic contexts
			for (let context of [undefined, () => {}]) {
				for (let close_selector of [undefined, null]) {
					const open_html = `<button id="open">x</button>`;
					this.cleanup = jsdom(DOCTYPE + HTML(open_html));
					let template_result = templates.basic();
					yamodal({
						template: () => template_result,
						trigger_selector: '#open',
						close_selector,
						context,
					});
					let open = document.getElementById('open');
					open.click();

					assert.strictEqual(
						global.document.documentElement.outerHTML,
						HTML(`${open_html}${template_result}`)
					);

					let modal = document.getElementById('modal');
					modal.click();

					assert.strictEqual(
						global.document.documentElement.outerHTML,
						HTML(`${open_html}`)
					);

					// It's OK that this runs twice
					this.cleanup();
				}
			}
		});
	});

	describe('onAppend callback', function () {
		before(function () {
			this.button_html = `<button id="button" data-modal-trigger="${templates.basic.name}">x</button>`;
		});

		after(function () {
			this.button_html = undefined;
		});

		beforeEach(function () {
			this.spiedOnAppend = sinon.spy(function onAppend(modal_node, trigger_node, event) {
				document.body.insertBefore(modal_node, document.body.firstChild);
			});
			this.cleanup = jsdom(DOCTYPE + HTML(this.button_html));
		});

		afterEach(function () {
			sinon.restore();
			this.cleanup();
		});

		it('should call `onAppend` with exactly three arguments', function () {
			yamodal({
				template: templates.basic,
				onAppend: this.spiedOnAppend,
			});

			let button = document.getElementById('button');
			button.click();

			const window = document.defaultView;
			let [modal_node, trigger_node, event, ...others] = this.spiedOnAppend.getCall(0).args;

			assert.ok(this.spiedOnAppend.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(trigger_node instanceof window.HTMLElement);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});
	});

	describe('beforeInsertIntoDom callback', function () {
		before(function () {
			this.button_html = `<button id="button" data-modal-trigger="${templates.basic.name}">x</button>`;
		});

		after(function () {
			this.button_html = undefined;
		});

		beforeEach(function () {
			this.cleanup = jsdom(DOCTYPE + HTML(this.button_html));
		});

		afterEach(function () {
			sinon.restore();
			this.cleanup();
		});

		it('should call `beforeInsertIntoDom` with exactly three arguments when the close button is clicked', function () {
			const spiedBeforeInsertIntoDom = sinon.spy(function beforeInsertIntoDom(
				modal_node,
				trigger_node,
				event
			) {
				// Do nothing
			});
			yamodal({
				template: templates.basic,
				beforeInsertIntoDom: spiedBeforeInsertIntoDom,
			});

			let button = document.getElementById('button');
			button.click();

			const window = document.defaultView;
			let [modal_node, trigger_node, event, ...others] = spiedBeforeInsertIntoDom.getCall(
				0
			).args;

			assert.ok(spiedBeforeInsertIntoDom.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(trigger_node instanceof window.HTMLElement);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});

		it('should call `beforeInsertIntoDom` with an undefined `trigger_node` when opened via the `open()` api', function () {
			const spiedBeforeInsertIntoDom = sinon.spy(function beforeInsertIntoDom(
				modal_node,
				trigger_node,
				event
			) {
				// Do nothing
			});
			let modal = yamodal({
				template: templates.basic,
				beforeInsertIntoDom: spiedBeforeInsertIntoDom,
			});

			modal.open();

			const window = document.defaultView;
			let [modal_node, trigger_node, event, ...others] = spiedBeforeInsertIntoDom.getCall(
				0
			).args;

			assert.ok(spiedBeforeInsertIntoDom.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(trigger_node === undefined);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});

		it('should not open the modal if `beforeInsertIntoDom` returns false', function () {
			const spiedBeforeInsertIntoDom = sinon.spy(function beforeInsertIntoDom(
				modal_node,
				trigger_node,
				event
			) {
				return false;
			});
			let modal = yamodal({
				template: templates.basic,
				beforeInsertIntoDom: spiedBeforeInsertIntoDom,
			});

			let button = document.getElementById('button');
			button.click();

			assert.strictEqual(modal.isOpen(), false);
			assert.strictEqual(global.document.documentElement.outerHTML, HTML(this.button_html));
		});

		it('should still open the modal if `beforeInsertIntoDom` returns a falsy value different from `false`', function () {
			// Not including `false` (obviously) and BigInt `0n`
			const falsy_values = [0, null, undefined, NaN, ''];
			for (let falsy_value of falsy_values) {
				this.cleanup = jsdom(DOCTYPE + HTML(this.button_html));
				const spiedBeforeInsertIntoDom = sinon.spy(function beforeInsertIntoDom(
					modal_node,
					trigger_node,
					event
				) {
					return falsy_value;
				});
				let template_result = templates.basic();
				let modal = yamodal({
					template: templates.basic,
					beforeInsertIntoDom: spiedBeforeInsertIntoDom,
				});

				assert.strictEqual(modal.isOpen(), false);
				let button = document.getElementById('button');
				button.click();

				// Still opens
				assert.strictEqual(modal.isOpen(), true);
				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${this.button_html}${template_result}`)
				);

				this.cleanup();
				sinon.restore();
			}
		});
	});

	describe('afterInsertIntoDom callback', function () {
		before(function () {
			this.button_html = `<button id="button" data-modal-trigger="${templates.basic.name}">x</button>`;
		});

		after(function () {
			this.button_html = undefined;
		});

		beforeEach(function () {
			this.spiedAfterInsertIntoDom = sinon.spy(function afterInsertIntoDom(
				modal_node,
				trigger_node,
				event
			) {
				// Do nothing
			});
			this.cleanup = jsdom(DOCTYPE + HTML(this.button_html));
		});

		afterEach(function () {
			sinon.restore();
			this.cleanup();
		});

		it('should call `afterInsertIntoDom` with exactly three arguments', function () {
			yamodal({
				template: templates.basic,
				afterInsertIntoDom: this.spiedAfterInsertIntoDom,
			});

			let button = document.getElementById('button');
			button.click();

			const window = document.defaultView;
			let [modal_node, trigger_node, event, ...others] = this.spiedAfterInsertIntoDom.getCall(
				0
			).args;

			assert.ok(this.spiedAfterInsertIntoDom.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(trigger_node instanceof window.HTMLElement);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});
	});

	describe('remove_modal_after_event_type event type', function () {
		beforeEach(function () {
			this.cleanup = jsdom(DOCTYPE + HTML());
		});

		afterEach(function () {
			this.cleanup();
		});

		it('should keep an open modal in the DOM until `remove_modal_after_event_type` has fired', function () {
			let template_result = templates.basic();
			let modal = yamodal({
				template: templates.basic,
				remove_modal_after_event_type: 'transitionend',
			});

			modal.open();

			assert.strictEqual(modal.isOpen(), true);
			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${template_result}`)
			);

			modal.close();

			// Still open
			assert.strictEqual(modal.isOpen(), true);
			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${template_result}`)
			);

			// Trigger a 'transitionend'
			let transitionend = document.createEvent('HTMLEvents');
			transitionend.initEvent('transitionend', true, false);
			modal.modal_node.dispatchEvent(transitionend);

			// Now closed
			assert.strictEqual(modal.isOpen(), false);
			assert.strictEqual(global.document.documentElement.outerHTML, HTML());
		});
	});

	describe('beforeRemoveFromDom callback', function () {
		beforeEach(function () {
			this.cleanup = jsdom(DOCTYPE + HTML());
		});

		afterEach(function () {
			sinon.restore();
			this.cleanup();
		});

		it('should call `beforeRemoveFromDom` with exactly three arguments when the close button is clicked', function () {
			const spiedBeforeRemoveFromDom = sinon.spy(function beforeRemoveFromDom(
				modal_node,
				trigger_node,
				event
			) {
				// Do nothing
			});

			let modal = yamodal({
				template: templates.basicWithClose,
				beforeRemoveFromDom: spiedBeforeRemoveFromDom,
			});

			modal.open();

			assert.ok(spiedBeforeRemoveFromDom.notCalled);

			let button = document.getElementById('close');
			button.click();

			const window = document.defaultView;
			let [modal_node, close_node, event, ...others] = spiedBeforeRemoveFromDom.getCall(
				0
			).args;

			assert.ok(spiedBeforeRemoveFromDom.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(close_node instanceof window.HTMLElement);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});

		it('should call `beforeRemoveFromDom` with an undefined `close_node` when closed via the `close()` api', function () {
			const spiedBeforeRemoveFromDom = sinon.spy(function beforeRemoveFromDom(
				modal_node,
				trigger_node,
				event
			) {
				// Do nothing
			});

			let modal = yamodal({
				template: templates.basicWithClose,
				beforeRemoveFromDom: spiedBeforeRemoveFromDom,
			});

			modal.open();
			modal.close();

			const window = document.defaultView;

			let [modal_node, close_node, event, ...others] = spiedBeforeRemoveFromDom.getCall(
				0
			).args;

			assert.ok(spiedBeforeRemoveFromDom.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(close_node === undefined);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});

		it('should not close the modal if `beforeRemoveFromDom` returns false', function () {
			const spiedBeforeRemoveFromDom = sinon.spy(function beforeRemoveFromDom(
				modal_node,
				trigger_node,
				event
			) {
				return false;
			});
			let template_result = templates.basic();
			let modal = yamodal({
				template: templates.basic,
				beforeRemoveFromDom: spiedBeforeRemoveFromDom,
			});

			modal.open();

			assert.ok(spiedBeforeRemoveFromDom.notCalled);

			modal.close();

			assert.ok(spiedBeforeRemoveFromDom.calledOnce);
			assert.strictEqual(modal.isOpen(), true);
			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${template_result}`)
			);
		});

		it('should still close the modal if `beforeRemoveFromDom` returns a falsy value different from `false`', function () {
			// Not including `false` (obviously) and BigInt `0n`
			const falsy_values = [0, null, undefined, NaN, ''];
			for (let falsy_value of falsy_values) {
				this.cleanup = jsdom(DOCTYPE + HTML(this.button_html));
				const spiedBeforeRemoveFromDom = sinon.spy(function beforeRemoveFromDom(
					modal_node,
					trigger_node,
					event
				) {
					return falsy_value;
				});
				let template_result = templates.basic();
				let modal = yamodal({
					template: templates.basic,
					beforeRemoveFromDom: spiedBeforeRemoveFromDom,
				});

				modal.open();
				assert.strictEqual(modal.isOpen(), true);

				modal.close();

				assert.ok(spiedBeforeRemoveFromDom.calledOnce);
				assert.strictEqual(modal.isOpen(), false);
				assert.strictEqual(global.document.documentElement.outerHTML, HTML());

				this.cleanup();
				sinon.restore();
			}
		});
	});

	describe('afterRemoveFromDom callback', function () {
		beforeEach(function () {
			this.spiedAfterRemoveFromDom = sinon.spy(function afterRemoveFromDom(
				modal_node,
				trigger_node,
				event
			) {
				// Do nothing
			});
			this.cleanup = jsdom(DOCTYPE + HTML());
		});

		afterEach(function () {
			sinon.restore();
			this.cleanup();
		});

		it('should call `afterRemoveFromDom` with exactly three arguments when the close button is clicked', function () {
			let modal = yamodal({
				template: templates.basicWithClose,
				afterRemoveFromDom: this.spiedAfterRemoveFromDom,
			});

			modal.open();

			let button = document.getElementById('close');
			button.click();

			const window = document.defaultView;
			let [modal_node, close_node, event, ...others] = this.spiedAfterRemoveFromDom.getCall(
				0
			).args;

			assert.ok(this.spiedAfterRemoveFromDom.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(close_node instanceof window.HTMLElement);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});

		it('should call `beforeRemoveFromDom` with an undefined `close_node` when closed via the `close()` api', function () {
			let modal = yamodal({
				template: templates.basicWithClose,
				afterRemoveFromDom: this.spiedAfterRemoveFromDom,
			});

			modal.open();
			modal.close();

			const window = document.defaultView;

			let [modal_node, close_node, event, ...others] = this.spiedAfterRemoveFromDom.getCall(
				0
			).args;

			assert.ok(this.spiedAfterRemoveFromDom.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(close_node === undefined);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});
	});

	describe('onAfterSetup callback', function () {
		beforeEach(function () {
			this.spiedOnAfterSetup = sinon.spy(function onAfterSetup(modal_node, api) {
				// Do nothing
			});
			this.cleanup = jsdom(DOCTYPE + HTML());
		});

		afterEach(function () {
			sinon.restore();
			this.cleanup();
		});

		it('should call `onAfterSetup` with exactly two arguments', function () {
			let modal = yamodal({
				template: templates.basic,
				onAfterSetup: this.spiedOnAfterSetup,
			});

			assert.ok(this.spiedOnAfterSetup.calledOnce);
			const window = document.defaultView;
			let [modal_node, api, ...others] = this.spiedOnAfterSetup.getCall(0).args;

			assert.ok(modal_node instanceof window.HTMLElement);

			// The `api` is the same as the return object
			assert.strictEqual(modal, api);
			assert.strictEqual(others.length, 0);
		});
	});

	describe('onDestroy callback', function () {
		beforeEach(function () {
			this.spiedOnDestroy = sinon.spy(function onDestroy(modal_node) {
				// Do nothing
			});
			this.cleanup = jsdom(DOCTYPE + HTML());
		});

		afterEach(function () {
			sinon.restore();
			this.cleanup();
		});

		it('should call `onDestroy` when destroying instance', function () {
			let modal = yamodal({
				template: templates.basic,
				onDestroy: this.spiedOnDestroy,
			});

			// Save the modal_node to compare it in our spy later
			let modal_node = modal.modal_node;

			assert.ok(this.spiedOnDestroy.notCalled);
			modal.destroy();

			assert.ok(this.spiedOnDestroy.calledOnceWithExactly(modal_node));
		});
	});

	describe('API', function () {
		describe('return object', function () {
			beforeEach(function () {
				this.cleanup = jsdom(DOCTYPE + HTML());
			});

			afterEach(function () {
				this.cleanup();
			});

			it('should return an object with all API elements', function () {
				let modal = yamodal({
					template: templates.basic,
					beforeInsertIntoDom: this.spiedBeforeInsertIntoDom,
				});

				let api_keys = Object.keys(modal);
				let modal_node_descriptor = Object.getOwnPropertyDescriptor(modal, 'modal_node');

				assert.strictEqual(api_keys.length, 5);
				assert.ok(api_keys.includes('modal_node'));
				assert.ok(api_keys.includes('open'));
				assert.ok(api_keys.includes('close'));
				assert.ok(api_keys.includes('isOpen'));
				assert.ok(api_keys.includes('destroy'));

				const window = document.defaultView;
				assert.ok(modal.modal_node instanceof window.HTMLElement);
				assert.strictEqual(typeof modal_node_descriptor.get, 'function');
				assert.strictEqual(typeof modal.open, 'function');
				assert.strictEqual(typeof modal.close, 'function');
				assert.strictEqual(typeof modal.isOpen, 'function');
				assert.strictEqual(typeof modal.destroy, 'function');
			});
		});

		describe('modal_node API', function () {
			beforeEach(function () {
				this.cleanup = jsdom(DOCTYPE + HTML());
			});

			afterEach(function () {
				this.cleanup();
			});

			it('should have `modal_node` getter', function () {
				let template_result = templates.basic();
				let modal = yamodal({
					template: templates.basic,
					beforeInsertIntoDom: this.spiedBeforeInsertIntoDom,
				});

				assert.strictEqual(modal.modal_node.outerHTML, template_result);
			});
		});

		describe('open API', function () {
			beforeEach(function () {
				this.spiedBeforeInsertIntoDom = sinon.spy(function beforeInsertIntoDom(
					modal_node,
					trigger_node,
					event
				) {
					// Do nothing
				});
				this.cleanup = jsdom(DOCTYPE + HTML());
			});

			afterEach(function () {
				sinon.restore();
				this.cleanup();
			});

			it('should open the modal when `open()` is called', function () {
				let template_result = templates.basic();
				let modal = yamodal({
					template: templates.basic,
					beforeInsertIntoDom: this.spiedBeforeInsertIntoDom,
				});

				assert.strictEqual(global.document.documentElement.outerHTML, HTML());

				modal.open();
				assert.ok(this.spiedBeforeInsertIntoDom.calledOnce);

				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(template_result)
				);
			});

			it('should open the modal only once when `open()` is called multiple times', function () {
				let modal = yamodal({
					template: templates.basic,
					beforeInsertIntoDom: this.spiedBeforeInsertIntoDom,
				});

				modal.open();
				assert.ok(this.spiedBeforeInsertIntoDom.calledOnce);

				modal.open();
				assert.ok(this.spiedBeforeInsertIntoDom.calledOnce);
			});

			it('should use a default event when `open()` is called', function () {
				let modal = yamodal({
					template: templates.basic,
					beforeInsertIntoDom: this.spiedBeforeInsertIntoDom,
				});

				modal.open();
				let [, , event] = this.spiedBeforeInsertIntoDom.getCall(0).args;

				assert.strictEqual(event.type, 'open.yamodal');
			});

			it('should allow a custom event to be passed into the `open()` method', function () {
				let modal = yamodal({
					template: templates.basic,
					beforeInsertIntoDom: this.spiedBeforeInsertIntoDom,
				});

				let custom_event = createEmptyCustomEvent('placeholder');
				modal.open(custom_event);
				let [, , event] = this.spiedBeforeInsertIntoDom.getCall(0).args;

				assert.strictEqual(custom_event, event);
			});
		});

		describe('close API', function () {
			beforeEach(function () {
				this.spiedBeforeRemoveFromDom = sinon.spy(function beforeRemoveFromDom(
					modal_node,
					trigger_node,
					event
				) {
					// Do nothing
				});
				this.cleanup = jsdom(DOCTYPE + HTML());
			});

			afterEach(function () {
				sinon.restore();
				this.cleanup();
			});

			it('should do nothing when `close()` is called on a closed modal', function () {
				let modal = yamodal({
					template: templates.basic,
					beforeRemoveFromDom: this.spiedBeforeRemoveFromDom,
				});

				modal.close();
				assert.ok(this.spiedBeforeRemoveFromDom.notCalled);
			});

			it('should close an open modal when `close()` is called', function () {
				let template_result = templates.basic();
				let modal = yamodal({
					template: templates.basic,
					beforeRemoveFromDom: this.spiedBeforeRemoveFromDom,
				});

				modal.open();
				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(template_result)
				);

				assert.ok(this.spiedBeforeRemoveFromDom.notCalled);

				modal.close();
				assert.ok(this.spiedBeforeRemoveFromDom.calledOnce);

				assert.strictEqual(global.document.documentElement.outerHTML, HTML());
			});

			it('should close the modal only once when `close()` is called multiple times', function () {
				let modal = yamodal({
					template: templates.basic,
					beforeRemoveFromDom: this.spiedBeforeRemoveFromDom,
				});

				modal.open();
				assert.ok(this.spiedBeforeRemoveFromDom.notCalled);

				modal.close();
				assert.ok(this.spiedBeforeRemoveFromDom.calledOnce);

				modal.close();
				assert.ok(this.spiedBeforeRemoveFromDom.calledOnce);
			});

			it('should use a default event when `close()` is called', function () {
				let modal = yamodal({
					template: templates.basic,
					beforeRemoveFromDom: this.spiedBeforeRemoveFromDom,
				});

				modal.open();
				modal.close();
				let [, , event] = this.spiedBeforeRemoveFromDom.getCall(0).args;

				assert.strictEqual(event.type, 'close.yamodal');
			});

			it('should allow a custom event to be passed into the `close()` method', function () {
				let modal = yamodal({
					template: templates.basic,
					beforeRemoveFromDom: this.spiedBeforeRemoveFromDom,
				});

				let custom_event = createEmptyCustomEvent('placeholder');
				modal.open();
				modal.close(custom_event);
				let [, , event] = this.spiedBeforeRemoveFromDom.getCall(0).args;

				assert.strictEqual(custom_event, event);
			});
		});

		describe('isOpen API', function () {
			beforeEach(function () {
				this.cleanup = jsdom(DOCTYPE + HTML());
			});

			afterEach(function () {
				this.cleanup();
			});

			it('should return the state of the modal when `isOpen()` is called', function () {
				let template_result = templates.basic();
				let modal = yamodal({ template: templates.basic });

				assert.strictEqual(global.document.documentElement.outerHTML, HTML());
				assert.strictEqual(modal.isOpen(), false);

				modal.open();

				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(template_result)
				);
				assert.strictEqual(modal.isOpen(), true);

				modal.close();

				assert.strictEqual(global.document.documentElement.outerHTML, HTML());
				assert.strictEqual(modal.isOpen(), false);
			});
		});

		describe('destroy API', function () {
			before(function () {
				this.open_html = `<button id="open">open</button>`;
				this.close_html = `<button id="close">close</button>`;
			});

			after(function () {
				this.open_html = undefined;
				this.close_html = undefined;
			});

			beforeEach(function () {
				this.cleanup = jsdom(DOCTYPE + HTML(`${this.open_html}${this.close_html}`));
			});

			afterEach(function () {
				this.cleanup();
			});

			it('should remove our click handlers when `destroy()` is called', function () {
				let template_result = templates.basic();
				const spiedBeforeInsertIntoDom = sinon.spy(function beforeInsertIntoDom(
					modal_node,
					trigger_node,
					event
				) {
					// Do nothing
				});
				const spiedBeforeRemoveFromDom = sinon.spy(function beforeRemoveFromDom(
					modal_node,
					trigger_node,
					event
				) {
					// Do nothing
				});
				let modal = yamodal({
					template: templates.basic,
					trigger_selector: '#open',
					close_selector: '#close',
					beforeInsertIntoDom: spiedBeforeInsertIntoDom,
					beforeRemoveFromDom: spiedBeforeRemoveFromDom,
				});

				let open_button = document.getElementById('open');
				let close_button = document.getElementById('close');

				open_button.click();

				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${this.open_html}${this.close_html}${template_result}`)
				);
				assert.ok(spiedBeforeInsertIntoDom.calledOnce);
				assert.ok(spiedBeforeRemoveFromDom.notCalled);

				close_button.click();

				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${this.open_html}${this.close_html}`)
				);
				assert.ok(spiedBeforeInsertIntoDom.calledOnce);
				assert.ok(spiedBeforeRemoveFromDom.calledOnce);

				modal.destroy();

				open_button.click();

				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${this.open_html}${this.close_html}`)
				);
				assert.ok(spiedBeforeInsertIntoDom.calledOnce);
				assert.ok(spiedBeforeRemoveFromDom.calledOnce);

				close_button.click();

				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${this.open_html}${this.close_html}`)
				);
				assert.ok(spiedBeforeInsertIntoDom.calledOnce);
				assert.ok(spiedBeforeRemoveFromDom.calledOnce);

				sinon.restore();
			});

			it('should close an open modal when `destroy()` is called', function () {
				let template_result = templates.basic();
				let modal = yamodal({
					template: templates.basic,
				});

				modal.open();

				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${this.open_html}${this.close_html}${template_result}`)
				);

				modal.destroy();

				// Need to test the HTML because `destroy` also "no-ops" our `isOpen()` method
				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${this.open_html}${this.close_html}`)
				);
			});

			it('should sets API methods to the same "no ops" when `destroy()` is called', function () {
				let modal = yamodal({
					template: templates.basic,
				});

				modal.destroy();

				assert.strictEqual(modal.open, modal.isOpen);
				assert.strictEqual(modal.open, modal.close);
				assert.strictEqual(modal.open, modal.destroy);
				assert.strictEqual(modal.close, modal.isOpen);
				assert.strictEqual(modal.close, modal.destroy);
				assert.strictEqual(modal.destroy, modal.isOpen);

				assert.doesNotThrow(() => modal.open());
				assert.doesNotThrow(() => modal.close());
				assert.doesNotThrow(() => modal.isOpen());
				assert.doesNotThrow(() => modal.destroy());

				assert.strictEqual(modal.open(), undefined);
				assert.strictEqual(modal.close(), undefined);
				assert.strictEqual(modal.isOpen(), undefined);
				assert.strictEqual(modal.destroy(), undefined);

				// `modal_node` isn't no-op'd, but its return value is set to undefined
				assert.strictEqual(modal.modal_node, undefined);
			});
		});
	});

	describe('context', function () {
		describe('static context', function () {
			beforeEach(function () {
				this.cleanup = jsdom(DOCTYPE + HTML());
			});

			afterEach(function () {
				this.cleanup();
			});

			it(`should allow static context passed in to the same template`, function () {
				let hello = templates.basicWithContext('hello');
				let world = templates.basicWithContext('world');
				let modal_hello = yamodal({
					template: templates.basicWithContext,
					context: 'hello',
				});
				let modal_world = yamodal({
					template: templates.basicWithContext,
					context: 'world',
				});

				assert.strictEqual(global.document.documentElement.outerHTML, HTML());

				modal_hello.open();
				assert.strictEqual(global.document.documentElement.outerHTML, HTML(`${hello}`));

				modal_world.open();
				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${hello}${world}`)
				);

				modal_hello.close();
				assert.strictEqual(global.document.documentElement.outerHTML, HTML(`${world}`));

				modal_world.close();
				assert.strictEqual(global.document.documentElement.outerHTML, HTML());
			});
		});

		describe('dynamic context', function () {
			beforeEach(function () {
				let random_context_return = String(Math.random());
				this.random_context_return = random_context_return;
				this.spiedContext = sinon.spy(function context(trigger_node, event) {
					return random_context_return;
				});
				this.cleanup = jsdom(DOCTYPE + HTML());
			});

			afterEach(function () {
				this.random_context_return = undefined;
				sinon.restore();
				this.cleanup();
			});

			it('should not immediately create a modal_node when a dynamic context is passed', function () {
				let modal = yamodal({
					template: templates.basic,
					context: this.spiedContext,
				});

				assert.strictEqual(modal.modal_node, undefined);
				assert.ok(this.spiedContext.notCalled);
			});

			it(`should pass context's return value to template`, function () {
				let spiedTemplate = sinon.spy(templates.basicWithContext);
				let modal = yamodal({
					template: spiedTemplate,
					context: this.spiedContext,
				});

				modal.open();
				assert.ok(this.spiedContext.calledOnce);
				assert.ok(spiedTemplate.calledOnceWith(this.random_context_return));
				spiedTemplate.calledAfter(this.spiedContext);

				modal.close();
				assert.ok(this.spiedContext.calledOnce);
				assert.ok(spiedTemplate.calledOnceWith(this.random_context_return));
			});

			it(`should create different modal_node Elements when dynamic context is used`, function () {
				let modal = yamodal({
					template: templates.basicWithContext,
					context: this.spiedContext,
				});

				modal.open();
				let modal_node_first = modal.modal_node;

				modal.close();

				modal.open();
				let modal_node_second = modal.modal_node;

				assert.strictEqual(modal_node_first.outerHTML, modal_node_second.outerHTML);
				assert.notStrictEqual(modal_node_first, modal_node_second);
			});

			it(`should attach close listener to modal if dynamic context makes the modal not have the default close selector`, function () {
				let include_close_button;
				let spiedContext = sinon.spy(function contextClosure() {
					if (include_close_button) {
						// `templates.basicWithClose` has a default close button when called with an undefined context
						return undefined;
					} else {
						return '';
					}
				});

				const window = document.defaultView;
				let modal = yamodal({
					template: templates.basicWithClose,
					context: spiedContext,
				});

				include_close_button = true;
				modal.open();
				assert.strictEqual(modal.isOpen(), true);
				assert.ok(spiedContext.calledOnce);

				// Use default_close_selector
				let close_button = modal.modal_node.querySelector('[data-modal-close]');
				assert.ok(close_button instanceof window.HTMLElement);
				close_button.click();
				assert.strictEqual(modal.isOpen(), false);

				include_close_button = false;
				modal.open();
				assert.strictEqual(modal.isOpen(), true);
				assert.ok(spiedContext.calledTwice);

				let close_button_doesnt_exist = modal.modal_node.querySelector(
					'[data-modal-close]'
				);
				assert.ok(close_button_doesnt_exist === null);
				modal.modal_node.click();
				assert.strictEqual(modal.isOpen(), false);
			});
		});
	});
});
