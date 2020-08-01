(function () {
  'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  var once = function once(element, event_type, callback) {
    // Purposefully don't use an arrow function so `this` can get binded correctly
    var callbackWithRemove = function callbackWithRemove(event) {
      element.removeEventListener(event_type, callbackWithRemove);
      callback.call(this, event);
    };

    element.addEventListener(event_type, callbackWithRemove); // Returns a 'destroy' function that when run, immediately removes the event.

    return function () {
      return element.removeEventListener(event_type, callbackWithRemove);
    };
  };

  /**
   * Creates a CustomEvent without any extra data applied.
   * @param {String} event_name
   * @returns {CustomEvent}
   */
  var createEmptyCustomEvent = function createEmptyCustomEvent(event_name) {
    // Reuse `CustomEvent` string to help with minifying
    var customEvent = 'CustomEvent';
    var event;

    if (window[customEvent] && typeof window[customEvent] === 'function') {
      event = new window[customEvent](event_name);
    } else {
      // IE doesn't support `CustomEvent` constructor
      // @link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Browser_compatibility
      event = document.createEvent(customEvent);
      event['init' + CustomEvent](event_name, true, true);
    }

    return event;
  };

  var DOCUMENT_NODE_TYPE = 9;

  /**
   * A polyfill for Element.matches()
   */
  if (typeof Element !== 'undefined' && !Element.prototype.matches) {
      var proto = Element.prototype;

      proto.matches = proto.matchesSelector ||
                      proto.mozMatchesSelector ||
                      proto.msMatchesSelector ||
                      proto.oMatchesSelector ||
                      proto.webkitMatchesSelector;
  }

  /**
   * Finds the closest parent that matches a selector.
   *
   * @param {Element} element
   * @param {String} selector
   * @return {Function}
   */
  function closest (element, selector) {
      while (element && element.nodeType !== DOCUMENT_NODE_TYPE) {
          if (typeof element.matches === 'function' &&
              element.matches(selector)) {
            return element;
          }
          element = element.parentNode;
      }
  }

  var closest_1 = closest;

  /**
   * Delegates event to a selector.
   *
   * @param {Element} element
   * @param {String} selector
   * @param {String} type
   * @param {Function} callback
   * @param {Boolean} useCapture
   * @return {Object}
   */
  function _delegate(element, selector, type, callback, useCapture) {
      var listenerFn = listener.apply(this, arguments);

      element.addEventListener(type, listenerFn, useCapture);

      return {
          destroy: function() {
              element.removeEventListener(type, listenerFn, useCapture);
          }
      }
  }

  /**
   * Delegates event to a selector.
   *
   * @param {Element|String|Array} [elements]
   * @param {String} selector
   * @param {String} type
   * @param {Function} callback
   * @param {Boolean} useCapture
   * @return {Object}
   */
  function delegate(elements, selector, type, callback, useCapture) {
      // Handle the regular Element usage
      if (typeof elements.addEventListener === 'function') {
          return _delegate.apply(null, arguments);
      }

      // Handle Element-less usage, it defaults to global delegation
      if (typeof type === 'function') {
          // Use `document` as the first parameter, then apply arguments
          // This is a short way to .unshift `arguments` without running into deoptimizations
          return _delegate.bind(null, document).apply(null, arguments);
      }

      // Handle Selector-based usage
      if (typeof elements === 'string') {
          elements = document.querySelectorAll(elements);
      }

      // Handle Array-like based usage
      return Array.prototype.map.call(elements, function (element) {
          return _delegate(element, selector, type, callback, useCapture);
      });
  }

  /**
   * Finds closest match and invokes callback.
   *
   * @param {Element} element
   * @param {String} selector
   * @param {String} type
   * @param {Function} callback
   * @return {Function}
   */
  function listener(element, selector, type, callback) {
      return function(e) {
          e.delegateTarget = closest_1(e.target, selector);

          if (e.delegateTarget) {
              callback.call(element, e);
          }
      }
  }

  var delegate_1 = delegate;

  /**
   * Insert a modal into the DOM after clicking a trigger.
   * Includes various callbacks to allow for overrides and additional "modal"
   * functionality we may want, such as fade-ins/outs, close on click outside, etc.
   *
   * @param {Function} opt.template The main template function that returns a string of HTML. Called with the passed in `context`. The return value of the template should be a single HTML node.
   * @param {Any|Function} [opt.context] Optional context object to be passed into our template template. If a function is passed, it will be called with `trigger_node` and `event` as its arguments and its return value will be passed to our template.
   * @param {String|null} [opt.trigger_selector] Selector of the element(s) that when clicked, open our modal. Defaults to '[data-modal-trigger="${template.name}"]' or '[data-modal-trigger]' if template is an anonymous function. If `null` is passed, no delegated event is attached to open, meaning the modal can only be opened via the API.
   * @param {String|null} [opt.close_selector] Selector of the element(s) that when clicked, close its open modal. Defaults to '[data-modal-close]'. If the modal does not contain an element matching `[data-modal-close]` or `null` is passed as this argument then the modal itself will close when clicked.
   * @param {Function} [opt.onAppend] Optional function to append our modal to the DOM. Called with two arguments: `modal_node` and `trigger_node`. Defaults to `document.body.appendChild(modal_node)`.
   * @param {Function} [opt.beforeInsertIntoDom] Optional function that runs before inserting the modal into the DOM. Called with three arguments: `modal_node`, `trigger_node`, and `event`. If this function returns `false`, modal will _not_ be injected and we bail early.
   * @param {Function} [opt.afterInsertIntoDom] Optional function that runs after inserting the modal into the DOM. Called with three arguments: `modal_node`, `trigger_node`, and `event`.
   * @param {String} [opt.remove_modal_after_event_type] When set, the modal is not removed until this event is fired. Otherwise modal is removed immediately from DOM. Some useful event types are 'transitionend' and 'animationend'.
   * @param {Function} [opt.beforeRemoveFromDom] Optional function that runs before removing the modal from the DOM. Called with three arguments: `modal_node`, `close_node`, and `event`. If this function returns `false`, modal will _not_ be removed and we bail early.
   * @param {Function} [opt.afterRemoveFromDom] Optional function that runs after removing the modal from the DOM. Called with three arguments: `modal_node`, `close_node`, and `event`.
   * @param {Function} [opt.onAfterSetup] Optional function that runs once after all event listeners have been setup. Called with `modal_node` and an object with `isOpen`, `open`, `close`, and `destroy` methods.
   * @param {Function} [opt.onDestroy] Optional function that runs additional cleanup steps if we "destroy" our listeners. Called with `modal_node`.
   * @returns {Object} Returns an object with `modal_node` getter, `isOpen`, `destroy`, `close`, and `open` methods. `open` and `close` will be called with a dummy CustomEvent, but you can optionally pass your own.
   * @throws {Error} Throws when `template` is not a function, or if it doesn't return a DOM node.
   */

  var initializeModalListener = function initializeModalListener() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        template = _ref.template,
        context = _ref.context,
        trigger_selector = _ref.trigger_selector,
        close_selector = _ref.close_selector,
        onAppend = _ref.onAppend,
        afterInsertIntoDom = _ref.afterInsertIntoDom,
        beforeInsertIntoDom = _ref.beforeInsertIntoDom,
        remove_modal_after_event_type = _ref.remove_modal_after_event_type,
        beforeRemoveFromDom = _ref.beforeRemoveFromDom,
        afterRemoveFromDom = _ref.afterRemoveFromDom,
        onAfterSetup = _ref.onAfterSetup,
        onDestroy = _ref.onDestroy;

    // Save a few bytes by storing these vars rather than inline strings.
    var fn = 'function';
    var click = 'click';

    if (_typeof(template) !== fn) {
      throw new Error('"template" argument is required, and needs to be a function.');
    }

    if (trigger_selector === undefined) {
      /**
       * Only use the named function if it isn't an
       * inferred name from our object.
       * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name#Inferred_function_names
       */
      if (template.name !== 'template') {
        // @todo consider other defaults
        trigger_selector = "[data-modal-trigger=\"".concat(template.name, "\"]");
      } else {
        trigger_selector = '[data-modal-trigger]';
      }
    }

    var modal_is_dynamic = _typeof(context) === fn;

    var createModalNode = function createModalNode(trigger_node, open_event) {
      var template_context = context;

      if (modal_is_dynamic) {
        template_context = context(trigger_node, open_event);
      } // Assumes our template returns a single child node
      // @todo Consider supporting multiple nodes, maybe with Document Fragments?


      var modal_html = template(template_context);
      var dummy_ele = document.createElement('div');
      dummy_ele.innerHTML = modal_html;
      var child = dummy_ele.firstElementChild;

      if (!child) {
        throw new Error('"template" must return a DOM node.');
      }

      return child;
    };
    /**
     * Only create `modal_node` if we don't have a dynamic context. Otherwise
     * this will be created when the modal is opened.
     */


    var modal_node;

    if (!modal_is_dynamic) {
      modal_node = createModalNode();
    }
    /**
     * If no `close_selector` was passed **and** we have a static modal_node, check if
     * `[data-modal-close]` matches an element within our modal. If not, then reset our
     * close selector which in turn means that the modal will be closed when itself is clicked.
     *
     * If we do have a dynamic modal, then this check is repeated in our onTriggerOpen
     * function
     */


    var default_close_selector = '[data-modal-close]';
    var no_close_selector_specified = false;

    if (close_selector === undefined) {
      no_close_selector_specified = true;

      if (modal_node && modal_node.querySelector(default_close_selector)) {
        close_selector = default_close_selector;
      }
    }

    var _isOpen = false;

    var onTriggerOpen = function onTriggerOpen(event) {
      if (_isOpen) {
        return;
      } // @todo Consider using optional chaining


      var trigger_node = event && event.delegateTarget;

      if (modal_is_dynamic) {
        modal_node = createModalNode(trigger_node, event); // Always check for the default close selector if none was specified for a dynamic modal

        if (no_close_selector_specified && modal_node.querySelector(default_close_selector)) {
          close_selector = default_close_selector;
        }
      }

      if (_typeof(beforeInsertIntoDom) === fn) {
        // If `beforeInsertIntoDom` returns `false` exactly, bail early
        var bail_check = beforeInsertIntoDom(modal_node, trigger_node, event);

        if (bail_check === false) {
          return;
        }
      }
      /**
       * If no close_selector is set (or is `null`), then add a click listener to the modal that closes itself.
       * Note that this only happens if the default `[data-modal-close]` is not found
       * within the modal itself.
       */


      if (close_selector == null) {
        once(modal_node, click, onTriggerClose);
      } // Default is to just append the child to the <body>


      if (_typeof(onAppend) === fn) {
        onAppend(modal_node, trigger_node, event);
      } else {
        document.body.appendChild(modal_node);
      }

      _isOpen = true;

      if (_typeof(afterInsertIntoDom) === fn) {
        afterInsertIntoDom(modal_node, trigger_node, event);
      }
    };

    var removeModal = function removeModal(modal_node, close_node, event) {
      modal_node.parentNode.removeChild(modal_node);
      _isOpen = false;

      if (_typeof(afterRemoveFromDom) === fn) {
        afterRemoveFromDom(modal_node, close_node, event);
      }
    };

    var onTriggerClose = function onTriggerClose(event) {
      if (!_isOpen) {
        return;
      } // @todo Consider using optional chaining


      var close_node = event && event.delegateTarget;

      if (_typeof(beforeRemoveFromDom) === fn) {
        // If `beforeRemoveFromDom` returns `false` exactly, bail early
        var bail_check = beforeRemoveFromDom(modal_node, close_node, event);

        if (bail_check === false) {
          return;
        }
      }

      if (remove_modal_after_event_type) {
        once(modal_node, remove_modal_after_event_type, function onEventBeforeRemoval() {
          removeModal(modal_node, close_node, event);
        });
      } else {
        // Default is to remove modal immediately
        removeModal(modal_node, close_node, event);
      }
    };

    var trigger_delegation = trigger_selector && delegate_1(trigger_selector, click, onTriggerOpen);
    var close_delegation;

    if (close_selector !== null) {
      close_delegation = delegate_1(no_close_selector_specified ? default_close_selector : close_selector, click, onTriggerClose);
    }

    var rtn_object = {
      // Use getter in case a dynamic context was passed
      get modal_node() {
        return modal_node;
      },

      open: function open() {
        var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : createEmptyCustomEvent('yamodal.open');
        return onTriggerOpen(event);
      },
      close: function close() {
        var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : createEmptyCustomEvent('yamodal.close');
        return onTriggerClose(event);
      },
      isOpen: function isOpen() {
        return _isOpen;
      }
    };

    var destroy = function destroy() {
      // Close the modal if it is open
      if (rtn_object.isOpen()) {
        rtn_object.close();
      } // Reset return functions so they can no longer be called


      var noop = function noop() {};

      rtn_object.destroy = noop;
      rtn_object.open = noop;
      rtn_object.close = noop;
      rtn_object.isOpen = noop; // @see https://www.npmjs.com/package/delegate#with-a-single-base-element-default-or-specified

      trigger_delegation && trigger_delegation.destroy();
      close_delegation && close_delegation.destroy();

      if (_typeof(onDestroy) === fn) {
        onDestroy(modal_node);
      }

      modal_node = undefined;
    };

    rtn_object.destroy = destroy;

    if (_typeof(onAfterSetup) === fn) {
      onAfterSetup(modal_node, rtn_object);
    }

    return rtn_object;
  };

  var template = function template() {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        I animate in! <button data-modal-close>\xD7</button>\n    </div>\n</div>";
  };

  var template$1 = function template() {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        Basic Modal\n    </div>\n</div>";
  };

  var template$2 = function template() {
    return "\n<div\n    class=\"overlay\"\n    style=\"\n        transition: opacity 0.5s;\n        opacity: 0;\n    \"\n>\n    <div class=\"modal\">\n        I fade in/out! <button data-modal-close>\xD7</button>\n    </div>\n</div>";
  };

  var template$3 = function template() {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        <div style=\"overflow: auto; max-height: 100%\">\n            <p>This modal can be scrolled, and the background page is scroll&nbsp;locked.</p>\n            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Arcu dictum varius duis at consectetur. Eget nunc scelerisque viverra mauris in aliquam sem fringilla. Vivamus at augue eget arcu dictum varius. Sed felis eget velit aliquet sagittis id. Quis commodo odio aenean sed adipiscing diam donec adipiscing. At consectetur lorem donec massa sapien faucibus et. Lacus viverra vitae congue eu. In hendrerit gravida rutrum quisque. Sagittis id consectetur purus ut faucibus pulvinar. Scelerisque purus semper eget duis at tellus at. Eu ultrices vitae auctor eu augue ut lectus arcu. Quis enim lobortis scelerisque fermentum dui faucibus in ornare quam. In hac habitasse platea dictumst quisque. Odio facilisis mauris sit amet massa vitae tortor condimentum. Sed turpis tincidunt id aliquet. A erat nam at lectus urna duis convallis convallis. Adipiscing tristique risus nec feugiat in fermentum. Pellentesque dignissim enim sit amet venenatis urna cursus.</p>\n            <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsa natus, praesentium id, earum quod nemo eligendi nulla autem beatae consequuntur quo recusandae inventore, facilis odit blanditiis deleniti delectus explicabo. Illo.</p>\n        </div>\n        <button data-modal-close>\xD7</button>\n    </div>\n</div>";
  };

  var template$4 = function template() {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        Click outside this modal to close.\n        <button data-modal-close>\xD7</button>\n    </div>\n</div>";
  };

  var template$5 = function template() {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        <span>Press <kbd>ESC</kbd> to close</span>\n        <button data-modal-close>\xD7</button>\n    </div>\n</div>";
  };

  var template$6 = function template() {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        <span>I open automatically when <a href=\"#open\">#open</a> is present in the URL on load.</span>\n        <button data-modal-close>\xD7</button>\n    </div>\n</div>";
  };

  var template$7 = function template(context) {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        <div>\n            This value was dynamically loaded via <code>context</code>:\n            <ul><li>".concat(context, "</li></ul>\n        </div>\n        <button data-modal-close>\xD7</button>\n    </div>\n</div>");
  };

  var template$8 = function template(href) {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        <div>\n            Continue to <strong>".concat(href, "</strong>?\n            <br>\n            <a href=\"").concat(href, "\">Yes</a> | <a href=\"javascript:void(0)\" data-modal-close>No</a>\n        </div>\n        <button data-modal-close>\xD7</button>\n    </div>\n</div>");
  };

  var template$9 = function template(event) {
    return "\n<div class=\"overlay\">\n    <div class=\"modal\">\n        <div>\n        This modal was opened via ".concat(event.type === 'yamodal.open' ? 'the <code>open()</code> API' : 'a click', "\n        </div>\n        <button data-modal-close>\xD7</button>\n    </div>\n</div>");
  };

  initializeModalListener({
    template: template$1,
    trigger_selector: '[data-modal-trigger="basic"]'
  }); // Fade in / Fade out
  // @see https://gist.github.com/paulirish/5d52fb081b3570c81e3a for an explanation of the `void modal_node.clientHeight` expressions.

  initializeModalListener({
    template: template$2,
    trigger_selector: '[data-modal-trigger="fade"]',
    remove_modal_after_event_type: 'transitionend',
    afterInsertIntoDom: function afterInsertIntoDom(modal_node) {
      // Force layout calc
      void modal_node.clientHeight;
      modal_node.style.opacity = '1';
    },
    beforeRemoveFromDom: function beforeRemoveFromDom(modal_node) {
      modal_node.style.opacity = '0';
    }
  }); // Animate in

  initializeModalListener({
    template: template,
    trigger_selector: '[data-modal-trigger="animation"]',
    // Technically the inner modal has the animation but this event bubbles up so this works
    remove_modal_after_event_type: 'animationend',
    beforeInsertIntoDom: function beforeInsertIntoDom(modal_node) {
      var inner_modal = modal_node.querySelector('.modal');
      inner_modal.classList.add('tilt-in-fwd-tr');
      inner_modal.classList.remove('slide-out-elliptic-top-bck');
    },
    beforeRemoveFromDom: function beforeRemoveFromDom(modal_node) {
      var inner_modal = modal_node.querySelector('.modal');
      inner_modal.classList.remove('tilt-in-fwd-tr');
      inner_modal.classList.add('slide-out-elliptic-top-bck');
    }
  }); // Body scroll lock

  initializeModalListener({
    template: template$3,
    trigger_selector: '[data-modal-trigger="scroll-lock"]',
    afterInsertIntoDom: function afterInsertIntoDom() {
      document.body.style.overflow = 'hidden';
    },
    afterRemoveFromDom: function afterRemoveFromDom() {
      document.body.style.overflow = '';
    }
  }); // Click outside to close modal

  var click_outside_inner_node, closeModalOnClickOutside;
  initializeModalListener({
    template: template$4,
    trigger_selector: '[data-modal-trigger="click-outside"]',
    afterInsertIntoDom: function afterInsertIntoDom(modal_node, trigger_node, e) {
      // When opening the modal, stop it from immediately closing
      e.stopImmediatePropagation && e.stopImmediatePropagation();
    },
    onAfterSetup: function onAfterSetup(modal_node, _ref) {
      var isOpen = _ref.isOpen,
          close = _ref.close;
      click_outside_inner_node = modal_node.querySelector('.modal');

      closeModalOnClickOutside = function closeModalOnClickOutside(e) {
        if (!click_outside_inner_node.contains(e.target) && isOpen()) {
          close();
        }
      };

      document.addEventListener('click', closeModalOnClickOutside);
    },
    onDestroy: function onDestroy() {
      document.removeEventListener('click', closeModalOnClickOutside);
    }
  }); // Close modal on ESC press

  var closeModalOnEscPress;
  initializeModalListener({
    template: template$5,
    trigger_selector: '[data-modal-trigger="close-on-esc"]',
    onAfterSetup: function onAfterSetup(modal_node, _ref2) {
      var isOpen = _ref2.isOpen,
          close = _ref2.close;

      closeModalOnEscPress = function closeModalOnEscPress(e) {
        // ESC_KEY === 27
        if (e.keyCode === 27 && isOpen()) {
          e.stopPropagation();
          close();
        }
      };

      document.addEventListener('keydown', closeModalOnEscPress);
    },
    onDestroy: function onDestroy() {
      document.removeEventListener('keydown', closeModalOnEscPress);
    }
  }); // Automatically open modal on some condition (checking a hash param)

  initializeModalListener({
    template: template$6,
    trigger_selector: '[data-modal-trigger="auto-open-on-hash-param"]',
    onAfterSetup: function onAfterSetup(modal_node, _ref3) {
      var open = _ref3.open;

      if (window.location.hash === '#open') {
        open();
      }
    },
    afterRemoveFromDom: function afterRemoveFromDom() {
      if (window.location.hash === '#open') {
        // Remove hash on close
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    }
  }); // Modal with dynamic context

  initializeModalListener({
    template: template$7,
    trigger_selector: '[data-modal-trigger="dynamic-context"]',
    context: function context() {
      return Math.random();
    }
  }); // Link with an interstitial

  initializeModalListener({
    template: template$8,
    trigger_selector: '[data-modal-trigger="interstitial"]',
    beforeInsertIntoDom: function beforeInsertIntoDom(modal_node, trigger_node, event) {
      event.preventDefault();
    },
    context: function context(trigger_node) {
      return trigger_node.href;
    }
  }); // Reading the custom `event` that is passed when `open()` is called

  var modal = initializeModalListener({
    template: template$9,
    trigger_selector: '[data-modal-trigger="dynamic-context-reading-event"]',
    context: function context(trigger_node, event) {
      return event;
    }
  });
  var number_input = document.getElementById('number-input');
  number_input.addEventListener('input', function (e) {
    var num = parseInt(e.target.value, 10);
    if (window.isNaN(num)) return;

    if (num % 5 === 0) {
      modal.open();
    }
  });

}());
