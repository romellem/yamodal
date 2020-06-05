const yamodal = require('../dist/umd/yamodal');
const assert = require('assert');
const jsdom = require('global-jsdom');
const { JSDOM } = require('jsdom');

const templates = require('./templates.js');
const DOCTYPE = `<!doctype html>`;
const HTML = (str = '') =>
	`<html><head><meta charset="utf-8"></head><body>${str}</body></html>`;

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
		before(function() {
			this.button_html = `<button id="button" data-modal-trigger="${templates.basic.name}">x</button>`;
		});

		after(function() {
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

			assert.strictEqual(global.document.documentElement.outerHTML, HTML(`${this.button_html}${template_result}`));
		});
	});
});
