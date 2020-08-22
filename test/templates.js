export const basic = () => `<div id="modal">Hello</div>`;
export const basicWithClose = (close_btn = `<button data-modal-close="">x</button>`) =>
	`<div id="modal">Hello${close_btn}</div>`;
