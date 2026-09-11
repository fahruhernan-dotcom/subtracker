// Anti-crash & Extension Error Supression Script for Next.js Dev Mode
// Intercepts third-party Chrome extension errors (such as eppiocemhmnlbhjplcgkofciiegomcon M_ID error)
// before Next.js error-overlay or forward-logs captures them.

(function() {
  if (typeof window === 'undefined') return;

  function isExtensionError(str) {
    if (!str || typeof str !== 'string') return false;
    return (
      str.indexOf('chrome-extension://') !== -1 ||
      str.indexOf('moz-extension://') !== -1 ||
      str.indexOf('eppiocemhmnlbhjplcgkofciiegomcon') !== -1 ||
      str.indexOf('M_ID') !== -1 ||
      str.indexOf('executors/200.js') !== -1 ||
      str.indexOf('bis_skin_checked') !== -1
    );
  }

  function getErrorString(target) {
    if (!target) return '';
    if (typeof target === 'string') return target;
    var res = '';
    try {
      if (target.message) res += target.message + ' ';
      if (target.stack) res += target.stack + ' ';
      if (target.filename) res += target.filename + ' ';
      if (target.name) res += target.name + ' ';
      if (target.reason) res += getErrorString(target.reason) + ' ';
      if (target.error) res += getErrorString(target.error) + ' ';
    } catch(e) {}
    return res;
  }

  function handleCaptureEvent(event) {
    try {
      var str = getErrorString(event);
      if (isExtensionError(str)) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        if (event.stopPropagation) event.stopPropagation();
        return true;
      }
    } catch (e) {}
    return false;
  }

  // 1. Capture-phase listeners on window & document (Runs BEFORE Next.js bubble listeners)
  try {
    window.addEventListener('unhandledrejection', handleCaptureEvent, true);
    window.addEventListener('error', handleCaptureEvent, true);
    document.addEventListener('unhandledrejection', handleCaptureEvent, true);
    document.addEventListener('error', handleCaptureEvent, true);
  } catch(e) {}

  // 2. Wrap EventTarget.prototype.addEventListener so any listener attached later by Next.js ignores extension errors
  try {
    if (window.EventTarget && window.EventTarget.prototype) {
      var origEventTargetAdd = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if ((type === 'unhandledrejection' || type === 'error') && typeof listener === 'function') {
          var wrapped = function(event) {
            if (handleCaptureEvent(event)) return;
            return listener.apply(this, arguments);
          };
          return origEventTargetAdd.call(this, type, wrapped, options);
        }
        return origEventTargetAdd.apply(this, arguments);
      };
    }
  } catch(e) {}

  // 3. Wrap window.addEventListener
  try {
    var origWindowAdd = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if ((type === 'unhandledrejection' || type === 'error') && typeof listener === 'function') {
        var wrapped = function(event) {
          if (handleCaptureEvent(event)) return;
          return listener.apply(this, arguments);
        };
        return origWindowAdd.call(this, type, wrapped, options);
      }
      return origWindowAdd.apply(this, arguments);
    };
  } catch(e) {}

  // 4. Intercept window.onunhandledrejection & window.onerror
  try {
    var _origOnUnhandled = null;
    Object.defineProperty(window, 'onunhandledrejection', {
      configurable: true,
      enumerable: true,
      get: function() { return _origOnUnhandled; },
      set: function(fn) {
        if (typeof fn === 'function') {
          _origOnUnhandled = function(e) {
            if (handleCaptureEvent(e)) return true;
            return fn.apply(this, arguments);
          };
        } else {
          _origOnUnhandled = fn;
        }
      }
    });
  } catch(e) {}

  try {
    var _origOnError = null;
    Object.defineProperty(window, 'onerror', {
      configurable: true,
      enumerable: true,
      get: function() { return _origOnError; },
      set: function(fn) {
        if (typeof fn === 'function') {
          _origOnError = function(msg, url, line, col, error) {
            var str = (msg || '') + ' ' + (url || '') + ' ' + (error && error.stack ? error.stack : '') + ' ' + (error && error.message ? error.message : '');
            if (isExtensionError(str)) return true;
            return fn.apply(this, arguments);
          };
        } else {
          _origOnError = fn;
        }
      }
    });
  } catch(e) {}

  // 5. Intercept console.error to prevent forwarding extension errors to terminal
  try {
    var origConsoleError = console.error;
    console.error = function() {
      var str = '';
      for (var i = 0; i < arguments.length; i++) {
        str += getErrorString(arguments[i]) + ' ';
      }
      if (isExtensionError(str)) return;
      return origConsoleError.apply(console, arguments);
    };
  } catch(e) {}

  // 6. Intercept Element.prototype.attachShadow to immediately kill nextjs-portal if it renders extension error
  try {
    var origAttachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function() {
      var shadowRoot = origAttachShadow.apply(this, arguments);
      var host = this;
      if (host.tagName && host.tagName.toLowerCase() === 'nextjs-portal') {
        var shadowObs = new MutationObserver(function() {
          var text = (shadowRoot.textContent || '') + ' ' + (shadowRoot.innerHTML || '');
          if (isExtensionError(text)) {
            host.remove();
            var overlays = document.querySelectorAll('[data-nextjs-dialog-overlay], [data-nextjs-toast]');
            for (var k = 0; k < overlays.length; k++) overlays[k].remove();
          }
        });
        shadowObs.observe(shadowRoot, { childList: true, subtree: true, characterData: true });
      }
      return shadowRoot;
    };
  } catch(e) {}

  // 7. Periodic & MutationObserver purge for existing or newly spawned nextjs-portal
  function purgeOverlay() {
    try {
      var portals = document.querySelectorAll('nextjs-portal');
      for (var i = 0; i < portals.length; i++) {
        var p = portals[i];
        var text = (p.textContent || '') + ' ' + (p.innerHTML || '');
        if (p.shadowRoot) {
          text += ' ' + (p.shadowRoot.textContent || '') + ' ' + (p.shadowRoot.innerHTML || '');
        }
        if (isExtensionError(text)) {
          p.remove();
          var overlays = document.querySelectorAll('[data-nextjs-dialog-overlay], [data-nextjs-toast]');
          for (var k = 0; k < overlays.length; k++) overlays[k].remove();
        }
      }
    } catch(e) {}
  }

  // 8. Strip bis_skin_checked attribute added by extensions
  function cleanBisSkin(node) {
    try {
      if (node && node.nodeType === 1) {
        if (node.hasAttribute('bis_skin_checked')) node.removeAttribute('bis_skin_checked');
        var list = node.querySelectorAll ? node.querySelectorAll('[bis_skin_checked]') : [];
        for (var i = 0; i < list.length; i++) list[i].removeAttribute('bis_skin_checked');
      }
    } catch(e) {}
  }

  if (document.documentElement) {
    cleanBisSkin(document.documentElement);
  }

  if (window.MutationObserver) {
    var domObs = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
          m.target.removeAttribute('bis_skin_checked');
        } else if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j++) {
            cleanBisSkin(m.addedNodes[j]);
          }
        }
      }
      purgeOverlay();
    });
    domObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['bis_skin_checked'],
      childList: true,
      subtree: true
    });
  }

  setInterval(purgeOverlay, 150);
})();
