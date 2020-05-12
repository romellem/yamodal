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

### Options

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
