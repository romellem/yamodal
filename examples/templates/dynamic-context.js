const template = (context) => `
<div class="overlay">
    <div class="modal">
        <div>
            This value was dynamically loaded via <code>context</code>:
            <ul><li>${context}</li></ul>
        </div>
        <button data-modal-close>×</button>
    </div>
</div>`;
export default template;
