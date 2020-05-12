const template = () => `
<div
    class="overlay"
    style="
        transition: opacity 0.5s;
        opacity: 0;
    "
>
    <div class="modal">
        I fade in/out! <button data-modal-close>×</button>
    </div>
</div>`;
export default template;
