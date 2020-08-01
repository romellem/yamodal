const template = (event) => `
<div class="overlay">
    <div class="modal">
        <div>
        This modal was opened via ${
            event.type === 'yamodal.open' ? 'the <code>open()</code> API' : 'a click'
        }
        </div>
        <button data-modal-close>×</button>
    </div>
</div>`;
export default template;
