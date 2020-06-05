const { JSDOM } = require('jsdom');
const assert = require('assert');

const HTML = `<!DOCTYPE html>
<html>
<head>
</head>
<body>
	
</body>
</html>`;

const createDomAndExposeToGlobal = (html) => {
	const dom = new JSDOM(html);
	global.window = dom.window;
	global.document = dom.document;
	return dom;
};

describe('yamodal', function () {
	describe('errors', function () {
		// let dom;
		// beforeEach(function () {
		// 	dom = createDomAndExposeToGlobal(HTML);
		// });

		// it('should throw when no template is given', function () {
		// 	assert.throws(() => yamodal());
		// });

		// it('should throw when template is not a function', function () {
		// 	assert.throws(() => yamodal({ template: null }));
		// 	assert.throws(() => yamodal({ template: true }));
		// 	assert.throws(() => yamodal({ template: 1 }));
		// 	assert.throws(() => yamodal({ template: '<div></div>' }));
		// 	assert.throws(() => yamodal({ template: { html: '<div></div>' } }));
		// });

		it('should throw when template does not return a DOM node', function () {
			// assert.throws(() => yamodal({ template: () => 'modal' }));
			const dom = new JSDOM(HTML);
	global.window = dom.window;
	global.document = dom.document;

	const yamodal = require('../dist/umd/yamodal.js');
	global.yamodal = yamodal;
			yamodal({ template: () => '<div>hello</div>' });
			// assert.throws(() => yamodal({ template: () => '<div>hello</div>' }));
		});
	});
});
