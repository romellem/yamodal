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

## License

[MIT](./LICENSE)
