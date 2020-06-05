const template = (href) => `
<div class="overlay">
    <div class="modal">
        <div>
            Continue to <strong>${href}</strong>?
            <br>
            <a href="${href}">Yes</a> | <a href="javascript:void(0)" data-modal-close>No</a>
        </div>
        <button data-modal-close>×</button>
    </div>
</div>`;
export default template;
