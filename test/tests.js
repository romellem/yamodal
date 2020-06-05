const yamodal = require('../dist/umd/yamodal');
const assert = require('assert');
const jsdom = require('global-jsdom');

describe('yamodal', function () {
	beforeEach(function () {
		this.cleanup = jsdom();
	});

	afterEach(function () {
		this.cleanup();
	});

	describe('errors', function () {
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
});
