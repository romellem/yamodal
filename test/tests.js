import yamodal from '../dist/umd/yamodal';
import assert from 'assert';
import jsdom from 'global-jsdom';
import sinon from 'sinon';

import * as templates from './templates.js';
const DOCTYPE = `<!doctype html>`;
const HTML = (str = '') => `<html><head><meta charset="utf-8"></head><body>${str}</body></html>`;

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
			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(`${button_html}`)
			);
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
			for (let close_selector of [undefined, null]) {
				const open_html = `<button id="open">x</button>`;
				this.cleanup = jsdom(DOCTYPE + HTML(open_html));
				let template_result = templates.basic();
				yamodal({
					template: () => template_result,
					trigger_selector: '#open',
					close_selector,
				});
				let open = document.getElementById('open');
				open.click();

				assert.strictEqual(
					global.document.documentElement.outerHTML,
					HTML(`${open_html}${template_result}`)
				);

				let modal = document.getElementById('modal');
				modal.click();

				assert.strictEqual(global.document.documentElement.outerHTML, HTML(`${open_html}`));

				// It's OK that this runs twice
				this.cleanup();
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

		it('should call `beforeInsertIntoDom` with exactly three arguments', function () {
			const spiedBeforeInsertIntoDom = sinon.spy(function beforeInsertIntoDom(modal_node, trigger_node, event) {
				// Do nothing
			});
			yamodal({
				template: templates.basic,
				beforeInsertIntoDom: spiedBeforeInsertIntoDom,
			});

			let button = document.getElementById('button');
			button.click();

			const window = document.defaultView;
			let [modal_node, trigger_node, event, ...others] = spiedBeforeInsertIntoDom.getCall(0).args;

			assert.ok(spiedBeforeInsertIntoDom.calledOnce);
			assert.ok(modal_node instanceof window.HTMLElement);
			assert.ok(trigger_node instanceof window.HTMLElement);
			assert.ok(event instanceof window.Event);
			assert.strictEqual(others.length, 0);
		});

		it('should not open the modal if `beforeInsertIntoDom` returns false', function () {
			const spiedBeforeInsertIntoDom = sinon.spy(function beforeInsertIntoDom(modal_node, trigger_node, event) {
				return false;
			});
			let modal = yamodal({
				template: templates.basic,
				beforeInsertIntoDom: spiedBeforeInsertIntoDom,
			});

			let button = document.getElementById('button');
			button.click();

			assert.strictEqual(modal.isOpen(), false);
			assert.strictEqual(
				global.document.documentElement.outerHTML,
				HTML(this.button_html)
			);
		});
	});
});
