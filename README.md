# (Yet Another) Modal

**YaModal** is _yet another_ modal library written in vanilla javascript.
It aims to provide basic functionality for _injecting_ an element into the DOM
when a _trigger_ is clicked, and _removing_ that same node when a relevant
_close_ element is also clicked.

To accomodate more common features of modals (fade ins / fade outs, click outside
to close, etc.), a variety of callback functions are exposed that execute before
and after DOM injection / removal.

Event listeners are delegated via the excellent
[delegate](https://www.npmjs.com/package/delegate) library.

## Install

```
yarn add @designory/yamodal
# or npm install @designory/yamodal
```

### Usage

#### When using a bundler like webpack, rollup, parcel, browserify, etc.:

```js
import yamodal from '@designory/yamodal';

let yamodalInstance = yamodal({
    // Options here...
});
```

#### When using the UMD bundle directly in the browser:

```html
<script src="https://unpkg.com/@designory/yamodal@0.1.0/dist/umd/yamodal.min.js"></script>
<script>
var yamodalInstance = window.yamodal({
    // Options here...
});
</script>
```

### Options

```js
yamodal({
    // @required
    // The main template function that returns a string of HTML to be injected.
    // Called with the passed in `context`.
    // The return value of the template should be a single HTML node.
    template: (context) => '<div>My Modal</div>',

    // Optional context to be passed into our template function.
    // If a function is passed, it will be executed and its return value will be passed to our template.
    context,

    // Selector of the element(s) that when clicked, open our modal.
    // Defaults to '[data-modal-trigger="${template.name}"]' or '[data-modal-trigger]' if template is an anonymous function.
    trigger_selector,

    // Selector of the element(s) that when clicked, close its open modal.
    // Defaults to '[data-modal-close]'.
    close_selector

    // Optional function to append our modal to the DOM.
    // Called with three arguments: `modal_node`, `trigger_node`and the opening `event`.
    // Defaults to `document.body.appendChild(modal_node)`.
    onAppend(modal_node, trigger_node, event){ ... },

    // Optional function that runs before inserting the modal into the DOM.
    // Called with three arguments: `modal_node`, `trigger_node`, and the opening `event`.
    beforeInsertIntoDom(modal_node, trigger_node, event){ ... },

    // Optional function that runs before inserting the modal into the DOM.
    // Called with three arguments: `modal_node`, `trigger_node`, and the opening `event`.
    afterInsertIntoDom(modal_node, trigger_node, event){ ... },

    // When false, element is immediately removed from the DOM on close.
    // Otherwise, element is removed after a 'transitionend' event has fired on the `modal_node`.
    // Defaults to false.
    removeModalAfterTransition,

    // Optional function that runs before removing the modal from the DOM.
    // Called with three arguments: `modal_node`, `close_node`, and the closing `event`.
    beforeRemoveFromDom(modal_node, close_node, event){ ... },

    // Optional function that runs after removing the modal from the DOM.
    // Called with three arguments: `modal_node`, `close_node`, and the closing `event`.
    afterRemoveFromDom(modal_node, close_node, event){ ... },

    // Optional function that runs once after all event listeners have been setup.
    // Called with `modal_node` and an object with `isOpen`, `open`, `close`, and `destroy` methods.
    onAfterSetup(modal_node, { isOpen, open, close, destroy }){ ... },

    // Optional function that runs additional cleanup steps if we "destroy" our listeners
    // Called with `modal_node`.
    onDestroy(modal_node){ ... },
});
```

#### Option `template`
#### Option `context`
#### Option `trigger_selector`
#### Option `close_selector`
#### Option `onAppend(modal_node, trigger_node, event)`
#### Option `beforeInsertIntoDom(modal_node, trigger_node, event)`
#### Option `afterInsertIntoDom(modal_node, trigger_node, event)`
#### Option `removeModalAfterTransition`
#### Option `beforeRemoveFromDom(modal_node, close_node, event)`
#### Option `afterRemoveFromDom(modal_node, close_node, event)`
#### Option `onAfterSetup(modal_node, { isOpen, open, close, destroy })`
#### Option `onDestroy(modal_node)`

### Return Value

#### Return `modal_node`
#### Return `isOpen()`
#### Return `open(event = { delegateTarget: null })`
#### Return `close(event = { delegateTarget: null })`
#### Return `destroy()`

## License

[MIT](./LICENSE)
