# (Yet Another) Modal

[![npm version](https://badge.fury.io/js/%40designory%2Fyamodal.svg)](https://badge.fury.io/js/%40designory%2Fyamodal)

**YaModal** is _yet another_ modal library written in vanilla javascript.
It aims to provide basic functionality for _injecting_ an element into the DOM
when a _trigger_ is clicked, and _removing_ that same node when a relevant
_close_ element is also clicked.

To accommodate more common features of modals (fade ins / fade outs, click outside
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

let yamodal_instance = yamodal({
    // Options here...
});
```

#### When using the UMD bundle directly in the browser:

```html
<script src="https://unpkg.com/@designory/yamodal/dist/umd/yamodal.min.js"></script>
<script>
var yamodal_instance = window.yamodal({
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
    // This is the only required option. If it is not a function, an error is thrown.
    // Additionally, if this function doesn't return a valid DOM node string, an error is thrown.
    template: (context) => '<div>My Modal</div>',

    // Optional context to be passed into our template function.
    // If a function is passed, it will be called with `trigger_node` and `event`
    // as its arguments and its return value will be passed to our template.
    // Function contexts get executed each time before the modal is inserted, allowing for dynamic modal content.
    context,

    // Selector of the element(s) that when clicked, open our modal.
    // A value of `null` means no 'click' event will be attached to open the modal.
    // Defaults to '[data-modal-trigger="${template.name}"]' or '[data-modal-trigger]' if template is an anonymous function.
    trigger_selector,

    // Selector of the element(s) that when clicked, close its open modal.
    // A value of `null` means the modal will close when itself it clicked.
    // Defaults to '[data-modal-close]'.
    close_selector,

    // Optional function to append our modal to the DOM.
    // Called with three arguments: `modal_node`, `trigger_node`and the opening `event`.
    // Defaults to `document.body.appendChild(modal_node)`.
    onAppend(modal_node, trigger_node, event){ ... },

    // Optional function that runs before inserting the modal into the DOM.
    // If this returns `false`, will prevent the modal from being injected into the DOM.
    // Called with three arguments: `modal_node`, `trigger_node`, and the opening `event`.
    beforeInsertIntoDom(modal_node, trigger_node, event){ ... },

    // Optional function that runs after inserting the modal into the DOM.
    // Called with three arguments: `modal_node`, `trigger_node`, and the opening `event`.
    afterInsertIntoDom(modal_node, trigger_node, event){ ... },

    // When set, the modal is not removed until that event is fired.
    // Otherwise modal is removed immediately from DOM.
    // Some useful event types are 'transitionend' and 'animationend'.
    remove_modal_after_event_type,

    // Optional function that runs before removing the modal from the DOM.
    // If this returns `false`, will prevent the modal from being removed from the DOM.
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

_Type:_ `Function`

The only **required** option. It must be a function that returns an HTML string
that contains a _single_ DOM node. If more than one node is returned, only
the first node is selected as the `modal_node`.

```js
yamodal({
    template: () => `<div>Hello world!</div>`,
});
```

You can use whatever templating library you want here as well. As long as the
function returns an HTML string that contains a single DOM node, it'll work!

##### Handlebars Template

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.6/handlebars.min.js"></script>
<script>
    var template = Handlebars.compile("<div>Handlebars <b>{{doesWhat}}</b></div>");
    yamodal({
        template: template,
        context: { doesWhat: "rocks!" },
    });
</script>
```

##### React (ReactDOMServer) Template

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/16.13.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.13.1/umd/react-dom-server.browser.production.min.js"></script>
<script>
    // const Modal = (props) => <div>Hello {props.name} <button data-modal-close>×</button></div>;
    // renderToString(<Modal name="world!" />);
    var Modal = function Modal(props) {
        return React.createElement(
            "div",
            null, 
            "Hello ", 
            props.name, 
            " ", 
            React.createElement(
                "button",
                { "data-modal-close": true },
                "×"
            )
        );
    };
    var template = function(context) {
        return ReactDOMServer.renderToString(
            React.createElement(Modal, context)
        );
    };
    yamodal({
        template: template,
        context: { name: "world!" },
    });
});
</script>
```

#### Option `context`

_Type:_ _`Any`_ or `Function`

Any value that is passed to the `template` function. If `context` is itself
a function, it will be called with `trigger_node` and `event` arguments.
The return value of this call is passed to our template. Additionally, when a
`context()` function is used, we recreate our `modal_node` just prior to opening
(it is executed before the `beforeInsertIntoDom` callback).

> Note: If a function is passed in for `context` then we don't create the modal
> immediately. We only create it when it is opened. So, if you grab the `modal_node`
> property from `yamodal()`s return object, it will be `undefined`.
>
> Also note if your `context` function relies on the `trigger_node` or `event`
> arguments, these values will set as `undefined` and a placeholder `CustomEvent`
> (respectively) when opening the modal with the programmatic
> [`open()`](#return-openevent) method.

```js
yamodal({
    template: (context) => `<div>This won't change between modal opens: ${context}</div>`,
    context: Math.random(),
});
```

```js
yamodal({
    template: (context) => `<div>This <em>will</em> change between modal opens: ${context}</div>`,
    context: () => Math.random(),
});
```

```js
// <a href="http://example.com" data-modal-trigger>3rd party link</a>
yamodal({
    template: url => `<div>Continue? <a href="${url}">Link</a></div>`,
    beforeInsertIntoDom(modal, trigger, event){
        event.preventDefault();
    },
    context(trigger_node) {
        return trigger_node.href;
    },
});
```

```js
yamodal({
    template: event => `<div>This was opened via ${event.type === 'open.yamodal' ? 'the open() API' : 'a click'}</div>`,
    context(trigger_node, event) {
        return event;
    },
});
```

#### Option `trigger_selector`

_Type:_ `String` or `null`

The selector of the element(s) that will open the modal when clicked.

If no option is passed, we fall back to two defaults:

1. When a non-anonymous function is passed as the `template`, the
[name](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name)
attribute of that `template` is used in the selector `[data-modal-trigger="${template.name}"]`.

```js
// A modal opens when `<button data-modal-trigger="my_modal">` is clicked!
yamodal({
    template: function my_modal() { return `<div>...</div>` },
});
```

2. When an anonymous function _is_ passed as the `template`, we use `[data-modal-trigger]` as the
fallback. Note that this should only be used if you have a **single** modal on the page. Otherwise
the triggers will open up multiple modals which is probably not your intended result.

> Note our function will always have an [inferred name](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name#Inferred_function_names)
> of `"template"` when using an anonymous function, so technically this library
> checks for a `function.name` of `"template"` and assumes an anonymous
> function was passed if it finds that.
>
> If you do want to use a function named `template`, just set the
> `trigger_selector` directly rather than using a calculated default.

```js
// Careful! Both modals will opens when a `<button data-modal-trigger>` is clicked!
yamodal({
    template: () => `<div>1</div>`,
});
yamodal({
    template: () => `<div>2</div>`,
});
```

If `null` is passed, no delegated 'click' event is attached to open the modal.
Instead, the modal can only be opened via its [`open()`](#return-openevent) API
method.

```js
yamodal({
    template: () => `<div>I show on page load!</div>`,
    onAfterSetup(modal_node, { open }) {
        open();
    },
});
```

```js
let modal = yamodal({
    template: () => `<div>I was opened via my 'open()' API!</div>`,
});

if (someConditional) {
    modal.open();
}
```

#### Option `close_selector`

_Type:_ `String` or `null`

The selector of the element(s) that will close the currently opened modal when clicked.
Note that these elements do _not_ have to be children elements of the modal. They can
exist anywhere on the document.

If no option is passed, the modal node checks for a child that matches the selector
`[data-modal-close]`. If no element is found or `close_selector` is `null`, then the
modal itself has the close handler attached to it.

```js
yamodal({
    template: () => `<div>Click <button class="close">me</button> to close the modal.</div>`,
    close_selector: '.close',
});
```

```js
yamodal({
    template: () => `<div>Click <button data-modal-close>me</button> to close the modal.</div>`,
});
```

```js
yamodal({
    template: () => `<div>Click anywhere to close this modal.</div>`,
});
```

#### Option `onAppend(modal_node, trigger_node, event)`

_Type:_ `Function`

By default, this library will append the modal node at the end of the body element via
`document.body.appendChild(modal_node)`. The `onAppend` function let's you configure
this in case you want to inject the modal in some other location.

```js
yamodal({
    onAppend(modal_node) {
        // Prepend the modal in `<body>`
        document.body.insertBefore(modal_node, document.body.firstChild);
    }
})
```

Gets called with `modal_node`, `trigger_node`, and the delegated click `event` as arguments.

#### Option `beforeInsertIntoDom(modal_node, trigger_node, event)`

_Type:_ `Function`

Optional callback that runs before the modal is inserted into the DOM. Additionally,
provides an opportunity to _bail early_ and prevent the modal from opening.

If `beforeInsertIntoDom` returns `false`, our trigger handler exits early before
injecting the modal into the DOM.

```js
// <a href="#" data-modal-trigger disabled>I am a disabled trigger!</a>
yamodal({
    beforeInsertIntoDom(modal_node, trigger_node) {
        if (trigger_node.hasAttribute('disabled')) {
            // Prevent the modal from opening if the trigger is disabled!
            return false;
        }
    }
})
```

Gets called with `modal_node`, `trigger_node`, and the delegated click `event` as arguments.

#### Option `afterInsertIntoDom(modal_node, trigger_node, event)`

_Type:_ `Function`

Optional callback that runs after the modal is inserted into the DOM.

```js
yamodal({
    template: () => `<div style="transition: opacity 1s; opacity: 0;">...</div>`,
    afterInsertIntoDom(modal_node) {
        // Force layout calc (see https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
        void modal_node.clientHeight;
        modal_node.style.opacity = '1';
    }
})
```

Gets called with `modal_node`, `trigger_node`, and the delegated click `event` as arguments.

#### Option `remove_modal_after_event_type`

_Type:_ `String`

When a string is passed to this option, the modal will listen for this event to be emitted
from the modal node before it is removed from the DOM. Otherwise, the modal node is removed
from the DOM immediately.

This is useful (read: needed) if we want to perform some CSS transition (like a fade out)
on the modal before it is removed.

Some typical event types you might pass in here are `'transitionend'` and `'animationend'`.

#### Option `beforeRemoveFromDom(modal_node, close_node, event)`

_Type:_ `Function`

Optional callback that runs before the modal is removed from the DOM. Additionally,
provides an opportunity to _bail early_ and prevent the modal from closing.

If `beforeRemoveFromDom` returns `false`, our close handler exits early before
removing the modal from the DOM.

> Note: If you use this to fade out your modal, you'll want to pass
> in a event in `remove_modal_after_event_type` (e.g., `'transitionend'`).
> Otherwise, your modal will be removed from the DOM before its transition
> is finished!

```js
yamodal({
    template: () => `<div style="transition: opacity 1s;">...</div>`,
    remove_modal_after_event_type: 'transitionend',
    beforeRemoveFromDom(modal_node) {
        modal_node.style.opacity = '0';
        // Force layout calc (see https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
        void modal_node.clientHeight;
    },
});
```

Gets called with `modal_node`, `close_node`, and the delegated click `event` as arguments.

#### Option `afterRemoveFromDom(modal_node, close_node, event)`

_Type:_ `Function`

Optional callback that runs after the modal is removed from the DOM.

```js
yamodal({
    // Scroll-lock the page when the modal is opened
    afterInsertIntoDom() {
        document.body.style.overflow = 'hidden';
    },
    
    // Undo the scroll-lock when the modal is closed
    afterRemoveFromDom() {
        document.body.style.overflow = '';
    },
})
```

#### Option `onAfterSetup(modal_node, { isOpen, open, close, destroy })`

_Type:_ `Function`

A convenience function that runs after all events listeners are initialized.
Exposes `isOpen()`, `open()`, `close()`, and `destroy()` methods.

```js
// Automatically open modal if a hash param '#open' is present
yamodal({
    onAfterSetup(modal_node, methods) {
        if (window.location.hash === '#open') {
            methods.open();
        }
    },
})
```

Note that this is just offered as a convenience. Often times, identical functionality
can be achieved by using the _return_ object from the `yamodal` call.

```js
// This gives the same functionality as the above `onAfterSetup` option
let my_modal = yamodal({ ... });
if (window.location.hash === '#open') {
    my_modal.open();
}
```

Called with two arguments, `modal_node` and an object that contains `isOpen()`,
`open()`, `close()`, and `destroy()` methods. See the below section on
[return values](#return-value) for more information on these methods.

#### Option `onDestroy(modal_node)`

_Type:_ `Function`

The `yamodal()` function returns an object with a [`destroy()`](#return-destroy)
method to remove the event listeners we had previously set.

If `onDestroy` is also set, that is called at the end of running `destroy()`.

```js
// Close modal on ESC press
let closeModalOnEscPress;
yamodal({
    template: closeOnEscape,
    trigger_selector: '[data-modal-trigger="close-on-esc"]',
    onAfterSetup(modal_node, { isOpen, close }) {
        closeModalOnEscPress = function (e) {
            // ESC_KEY === 27
            if (e.keyCode === 27 && isOpen()) {
                e.stopPropagation();
                close();
            }
        };
        document.addEventListener('keydown', closeModalOnEscPress);
    },

    // Clean up the 'keydown' listener if this modal is destroyed
    onDestroy() {
        document.removeEventListener('keydown', closeModalOnEscPress);
    },
});
```

Gets called with `modal_node` as its only argument.

### Return Value

Running `yamodal()` returns an object with several attributes for later use. They
include:

#### Return `modal_node`

_Type:_ `Element`

This is the DOM node that was created by running your `template`.

> Note, technically this is a [getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)
> function since our modal could be recreated if we pass in a context function.

#### Return `isOpen()`

_Type:_ `Function`

When `isOpen()` is run, it returns `true` if the current modal is open, `false` if otherwise.

#### Return `open(event = new CustomEvent('open.yamodal'))`

_Type:_ `Function`

When `open()` is run it triggers the same handler that runs when a trigger is clicked.
This means that any `beforeInsertIntoDom`, `onAppend`, or `afterInsertIntoDom`
functions will also run.

Since usually the modal is opened by a click event, programmatic openings have a
"placeholder" event passed in. This event will have a type of `'open.yamodal'`.
Optionally, you can send your own custom event to the open handler.

```js
// Automatically open our modal after a 1 second delay
var my_modal = yamodal({ ... });
setTimeout(() => my_modal.open(), 1000);
```

#### Return `close(event = new CustomEvent('close.yamodal'))`

_Type:_ `Function`

When `close()` is run it triggers the same handler that runs when a close element is clicked.
This means that any `beforeRemoveFromDom`, or `afterRemoveFromDom` functions will also run.

Since the modal is usually closed by a click event, programmatic closings have a
"placeholder" event passed in. This event will have a type of `'close.yamodal'`.
Optionally, you can send your own custom event to the close handler.

#### Return `destroy()`

_Type:_ `Function`

When `destroy()` is run it closes the modal (if it is opened) and removes the
open and close event listeners and unsets our modal node. Also calls `onDestroy()`
if that was set on initialization.

```js
// <button data-modal-trigger>Open Modal</button> <button data-modal-destroy>Destroy Modal</button>
var my_modal = yamodal({ ... });
var destroy_button = document.querySelector('[data-modal-destroy]');
destroy_button.addEventListener('click', function() {
    my_modal.destroy();
});
```

### Examples

See [examples.js](./examples/examples.js) (published at
[designory.github.io/yamodal/](https://designory.github.io/yamodal/) as well)
for a list of common "advanced" modal uses, such as:

- Fade in / out.
- Animate in / out.
- Scroll lock background.
- Close on click outside.
- Close on `ESC` key press.
- Dynamic modal (from context).
- Auto open based on some condition (hash parameter in URL).
- Interstitial before navigating to a link.

## Browser Support

Should work on IE 10, and all modern browsers.

## License

[MIT](./LICENSE)
