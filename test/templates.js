const basic = () => `<div id="modal">Hello</div>`;
const basicWithClose = (close_btn = `<button data-modal-close="">x</button>`) =>
	`<div id="modal">Hello${close_btn}</div>`;

module.exports = {
	basic,
	basicWithClose,
};
