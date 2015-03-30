/*1427738938,,JIT Construction: v1666213,en_US*/

/**
 * Copyright Facebook Inc.
 *
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */
try {window.FB || (function(window) {
var self = window, document = window.document;
var undefined = void 0;
var setTimeout = window.setTimeout, setInterval = window.setInterval,clearTimeout = window.clearTimeout,clearInterval = window.clearInterval;var __DEV__ = 1;
function emptyFunction() {};
var __transform_includes = {"typechecks":true};
var __annotator, __bodyWrapper;
var __w, __t;
/** Path: html/js/downstream/polyfill/GenericFunctionVisitor.js */
/**
 * @generated SignedSource<<54f61a8ae0dc5043a9ec173c072501d4>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @provides GenericFunctionVisitor
 * @polyfill
 *
 * This file contains the functions used for the generic JS function
 * transform. Please add your functionality to these functions if you
 * want to wrap or annotate functions.
 *
 * Please see the DEX https://fburl.com/80903169 for more information.
 */

/*globals __annotator:true, __bodyWrapper:true*/
(function () {
  // These are functions used by the type check to create a function signature.
  var createMeta = function(type, signature) {
    if (!type && !signature) {
      return null;
    }

    var meta = {};
    if (typeof type !== 'undefined') {
      meta.type = type;
    }

    if (typeof signature !== 'undefined') {
      meta.signature = signature;
    }

    return meta;
  };


  var getMeta = function(name, params) {
    return createMeta(
      name && /^[A-Z]/.test(name) ? name : (void 0),
      params && ((params.params && params.params.length) || params.returns)
        ? 'function('
          + (params.params ? params.params.map(function(param) {
              return (/\?/).test(param)
                ? '?' + param.replace('?', '')
                : param;
          }).join(',') : '')
          + ')'
          + (params.returns ? ':' + params.returns : '')
        : (void 0)
    );
  };

  var annotator = function(fn, funcMeta, params) {
    if (typeof __transform_includes === 'undefined') {
      return fn;
    }

    if ('sourcemeta' in __transform_includes) {
      fn.__SMmeta = funcMeta;
    }

    if ('typechecks' in __transform_includes) {
      var meta = getMeta(funcMeta ? funcMeta.name : (void 0), params);
      if (meta) {
        __w(fn, meta);
      }
    }
    return fn;
  };

  var bodyWrapper = function(scope, args, fn, params) {
    if (typeof __transform_includes === 'undefined') {
      return fn.apply(scope, args);
    }

    var typecheck = 'typechecks' in __transform_includes;
    if (typecheck && params && params.params) {
      __t.apply(scope, params.params);
    }

    var result = fn.apply(scope, args);

    if (typecheck && params && params.returns) {
      __t([result, params.returns]);
    }

    return result;
  };

  // Export to global.
  __annotator = annotator;
  __bodyWrapper = bodyWrapper;
})();

/* YVhm2thwejM */
/** Path: html/js/downstream/polyfill/TypeChecker.js */
/**
 * @generated SignedSource<<7c9e21cf60f869a2b06f00a97ed74157>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * This is a very basic typechecker that does primitives as well as boxed
 * versions of the primitives.
 *
 * @provides TypeChecker
 * @nostacktrace
 * @polyfill
 */

/*globals __t:true, __w:true*/
(function() {
  var handler;
  var currentType = [];
  var toStringFunc = Object.prototype.toString;
  var paused = false; // pause when there's a type check error in current tick
  var disabled = false; // Can be disabled by individual pages

  // Metadata of current value being inspected.
  var nextValue;

  /**
   * Mapping from types to interfaces that they implement.
   */
  var typeInterfaceMap = {
    'HTMLElement': {'DOMEventTarget': true, 'DOMNode': true},
    'DOMElement': {'DOMEventTarget': true, 'DOMNode': true},
    'DOMDocument': {'DOMEventTarget': true, 'DOMNode': true},
    'DocumentFragment': {
      'DOMElement': true,
      'DOMEventTarget': true,
      'DOMNode': true
    },
    'DOMWindow': {'DOMEventTarget': true},
    'DOMTextNode': {'DOMNode': true},
    'Comment': {'DOMNode': true},
    'file': {'blob': true},
    'worker': {'DOMEventTarget': true},
    // We need to support typing on both the native and polyfilled type.
    'Set': {'set': true},
    'Map': {'map': true}
  };

  /**
   * Get object name from toString call.
   *   > stringType(anchor) // "HTMLAnchorElement"
   *   > stringType([1, 2]) // "Array"
   */
  function stringType(value) {
    return toStringFunc.call(value).slice(8, -1);
  }

  function getTagName(string) {
    if (string === 'A') {
      return 'Anchor';
    }
    if (string === 'IMG') {
      return 'Image';
    }
    return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
  }

  /**
   * Check the given value is a DOM node of desired type.
   */
  function isDOMNode(type, value, nodeType) {
    if (type === 'function') {
      // Firefox returns typeof 'function' for HTMLObjectElement, but we can
      // allow this because we know the object is not callable.
      if (typeof value.call !== 'undefined') {
        return false;
      }
    } else if (type !== 'object') {
      return false;
    }

    return typeof value.nodeName === 'string' && value.nodeType === nodeType;
  }

  /**
   * Do iteration across all types we recognize and return the type data.
   */
  function getObjectType(type, value, node, checkNextNode) {
    nextValue = null;

    // Defer calling toString on the value until we need it.
    var toStringType = stringType(value);
    if (value === null) {
      type = 'null';
    } else if (toStringType === 'Function') {
      if (value.__TCmeta) {
        // Allow functions with signatures to match `function`.
        type = node === 'function' ? 'function' : value.__TCmeta.signature;
      } else {
        // Allow functions without signatures to match any signature.
        type = node.indexOf('function') === 0 ? node : 'function';
      }
    } else if (type === 'object' || type === 'function') {
      var constructor = value.constructor;
      if (constructor && constructor.__TCmeta) {
        // The value is a custom type
        // Let custom types also match 'object'
        if (node === 'object') {
          type = 'object';
        } else {
          type = constructor.__TCmeta.type;
          while (constructor && constructor.__TCmeta) {
            if (constructor.__TCmeta.type == node) {
              type = node;
              break;
            }
            constructor = constructor.__TCmeta.superClass;
          }
        }
      } else if (typeof value.nodeType === 'number'
              && typeof value.nodeName === 'string') {
        // HTMLObjectElements has a typeof function in FF, but is not callable.
        // Do not use instanceof Element etc. as e.g. MooTools shadow this
        switch (value.nodeType) {
          case 1:
            if (node === 'HTMLElement') {
              // If testing against the base type, return this
              type = 'HTMLElement';
            } else {
              type = 'HTML' + getTagName(value.nodeName) + 'Element';
              typeInterfaceMap[type] = typeInterfaceMap['HTMLElement'];
            }
            break;
          case 3: type = 'DOMTextNode'; break;
          case 8: type = 'Comment'; break;
          case 9: type = 'DOMDocument'; break;
          case 11: type = 'DocumentFragment'; break;
        }
      } else if (value == value.window && value == value.self) {
        type = 'DOMWindow';
      } else if (toStringType == 'XMLHttpRequest'
                 || 'setRequestHeader' in value) {
        // XMLHttpRequest stringType is "Object" on IE7/8 so we duck-type it
        type = 'XMLHttpRequest';
      } else {
        // else, check if it is actually an array
        switch (toStringType) {
          case 'Error':
            // let Error match inherited objects
            type = node === 'Error'
              ? 'Error'
              : value.name;
            break;
          case 'Array':
            if (checkNextNode && value.length) {
              nextValue = value[0];
            }
            type = toStringType.toLowerCase();
            break;
          case 'Object':
            if (checkNextNode) {
              for (var key in value) {
                if (value.hasOwnProperty(key)) {
                  nextValue = value[key];
                  break;
                }
              }
            }
            type = toStringType.toLowerCase();
            break;
          case 'RegExp':
          case 'Date':
          case 'Blob':
          case 'File':
          case 'FileList':
          case 'Worker':
          case 'Map':
          case 'Set':
          // typed arrays
          case 'Uint8Array':
          case 'Int8Array':
          case 'Uint16Array':
          case 'Int16Array':
          case 'Uint32Array':
          case 'Int32Array':
          case 'Float32Array':
          case 'Float64Array':
            type = toStringType.toLowerCase();
            break;
        }
      }
    }
    return type;
  }

  /**
   * A recursive descent analyzer which takes a value and a typehint, validating
   * whether or not the value matches the typehint.
   * The function will call it self as long as both the value and the typehint
   * yields a nested component. This means that we will never recurse deeper
   * than needed, and also that we automatically get support for
   *   > equals([], 'array<string>') // true
   *   > equals(['string'], 'array') // true
   */
  function equals(value, node) {
    // http://jsperf.com/charat-vs-substr-vs-substring-vs-regex-vs-indexing-for-
    // shows that using indexing is slightly faster, but unfortunately indexing
    // is not supported by IE6/7
    var nullable = node.charAt(0) === '?';

    // Short circuit `null` and `undefined` if we allow them.
    if (value == null) {
      currentType.push(typeof value === 'undefined' ? 'undefined' : 'null');
      return nullable;
    } else if (nullable) {
      node = node.substring(1);
    }

    var type = typeof value;

    switch (type) {
      case 'boolean':
      case 'number':
      case 'string':
        // Primitive types will never have subtypes, etc. so we don't need to
        // to do any extra checks.
        currentType.push(type);
        return node === type;
    }

    // Instead of doing a full check for type of value, short circuit common
    // signatures and do special case checks for them. The tests are not
    // exhaustive, but should avoid false positives.
    var simpleMatch = false;
    switch (node) {
      case 'function':
        // Don't match for HTMLObjectElement.
        simpleMatch = type === 'function' && typeof value.call === 'function';
        break;
      case 'object':
        // Don't match on Array, HTMLObjectElement, etc.
        simpleMatch = type === 'object' && stringType(value) === 'Object';
        break;
      case 'array':
        simpleMatch = type === 'object' && stringType(value) === 'Array';
        break;
      case 'promise':
        simpleMatch = type === 'object' && typeof value.then === 'function';
        break;
      case 'HTMLElement':
        simpleMatch = isDOMNode(type, value, 1);
        break;
      case 'DOMTextNode':
        simpleMatch = isDOMNode(type, value, 3);
        break;
    }

    if (simpleMatch) {
      currentType.push(node);
      return true;
    }

    // Strip subtype from end of signature.
    var indexOfFirstAngle = node.indexOf('<');
    var nextNode;
    // Do not treat function expressions as generics
    if (indexOfFirstAngle !== -1 && node.indexOf('function') !== 0) {
      nextNode = node.substring(indexOfFirstAngle + 1, node.lastIndexOf('>'));
      node = node.substring(0, indexOfFirstAngle);
    }

    // Get actual type data.
    type = getObjectType(type, value, node, !!nextNode);

    // Check whether type has an interface that is what we're looking for.
    // Use truthiness check as per http://jsperf.com/hasownproperty-vs-in-vs-undefined/35
    var interfaces;
    if (type !== node && (interfaces = typeInterfaceMap[type])) {
      if (interfaces[node]) {
        type = node;
      }
    }

    // Check whether we got the right type (and subtype).
    currentType.push(type);

    if (nextNode && nextValue) {
      return node === type && equals(nextValue, nextNode);
    }

    return node === type;
  }


  /**
   * Given a value and a typehint (can be a union type), this will return
   * whether or not the passed in value matches the typehint.
   */
  function matches(value, node) {
    if (node.indexOf('|') === -1) {
      currentType.length = 0;
      return equals(value, node);
    } else {
      var nodes = node.split('|');
      for (var i = 0; i < nodes.length; i++) {
        currentType.length = 0;
        if (equals(value, nodes[i])) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * This function will loop over all arguments, where each argment is expected
   * to be in the form of `[variable, 'typehint', 'variablename']`.
   * For each argument, it will check whether the type of the variable matches
   * that of the typehint.
   * If any of the variables are found not to match a TypeError is thrown, else,
   * the first variable is returned.
   */
  function check(/*check1, check2, ..*/) {
    if (!paused && !disabled) {
      var args = arguments;
      var ii = args.length;
      while (ii--) {
        var value = args[ii][0];
        var expected = args[ii][1];
        var name = args[ii][2] || 'return value';

        if (!matches(value, expected)) {
          var actual = currentType.shift();
          while (currentType.length) {
            actual += '<' + currentType.shift() + '>';
          }

          var isReturn = !!args[ii][2];
          var stackBoundary;
          try {
            stackBoundary = isReturn ? arguments.callee.caller : check;
          } catch (e) {
            // If the caller is a strict function, we might be prevented from
            // accessing the .caller property, so let's go with next best
          }

          var message =
            'Type Mismatch for ' + name + ': expected `' + expected + '`, '
            + 'actual `' + actual + '` (' + toStringFunc.call(value) + ').';

          // If we don't know what class the object has but the caller expects
          // us to (uppercase chars indicate custom class) then it's likely
          // they forgot to add @typechecks to the defining module.
          if (actual === 'object' &&
              expected.match(/^[A-Z]/) &&
              !value.__TCmeta) {
            message +=
              ' Check the constructor\'s module is marked as typechecked -' +
              ' see http://fburl.com/typechecks for more information.';
          }

          var error = new TypeError(message);

          if (Error.captureStackTrace) {
            Error.captureStackTrace(error, stackBoundary || check);
          } else {
            // Pop to the frame calling the checked function, or to the
            // checked function
            error.framesToPop = isReturn ? 2 : 1;
          }

          if (typeof handler == 'function') {
            handler(error);
            // Avoid double-reporting on transitive violations
            paused = true;
            // Reset on the next available tick
            setTimeout(function()  {return paused = false;}, 0);
          } else if (handler === 'throw') {
            throw error;
          }
        }
      }
    }

    // Always return the first value checked
    return arguments[0][0];
  }

  /**
   * Allows you to set a handler that should handle errors. If such a handler is
   * set, no errors are thrown (the handler can choose to throw).
   */
  check.setHandler = function(fn) {
    handler = fn;
  };

  check.disable = function() {
    disabled = true;
  };

  /**
   * Annotates a function with a meta object
   */
  function annotate(fn, meta) {
    meta.superClass = fn.__superConstructor__;
    fn.__TCmeta = meta;
    return fn;
  }

  // export to global
  __t = check;
  __w = annotate;
})();
/*/TC*/

/* FOPCDcNrcUE */
/** Path: html/js/downstream/require/require-lite.js */
/**
 * @generated SignedSource<<ea19c112b290e539c1a3a062502c6e7d>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * This is a lightweigh implementation of require and __d which is used by the
 * JavaScript SDK.
 * This implementation requires that all modules are defined in order by how
 * they depend on each other, so that it is guaranteed that no module will
 * require a module that has not got all of its dependencies satisfied.
 * This means that it is generally only usable in cases where all resources are
 * resolved and packaged together.
 *
 * @providesInline commonjs-require-lite
 * @typechecks
 */

var require, __d;
(function (global) {
  var map = {}, resolved = {};
  var defaultDeps =
    ['global', 'require', 'requireDynamic', 'requireLazy', 'module', 'exports'];

  require = function(/*string*/ id, /*?boolean*/ soft) {
    if (resolved.hasOwnProperty(id)) {
      return resolved[id];
    }
    if (!map.hasOwnProperty(id)) {
      if (soft) {
        return null;
      }
      throw new Error('Module ' + id + ' has not been defined');
    }
    var module = map[id],
        deps = module.deps,
        length = module.factory.length,
        dep,
        args = [];

    for (var i = 0; i < length; i++) {
      switch(deps[i]) {
        case 'module'        : dep = module; break;
        case 'exports'       : dep = module.exports; break;
        case 'global'        : dep = global; break;
        case 'require'       : dep = require; break;
        case 'requireDynamic': dep = require; break;
        case 'requireLazy'   : dep = null; break;
        default              : dep = require.call(null, deps[i]);
      }
      args.push(dep);
    }
    module.factory.apply(global, args);
    resolved[id] = module.exports;
    return module.exports;
  };

  // Stub for module compilation timing mechanism in require.js.
  // Calls are inserted by scripts/static_resources/js/transforms/module.js.
  require.__markCompiled = function() {};

  __d = function(/*string*/ id, /*array<string>*/ deps, factory,
      /*?number*/ _special) {
    if (typeof factory == 'function') {
        map[id] = {
          factory: factory,
          deps: defaultDeps.concat(deps),
          exports: {}
        };

        // 3 signifies that this should be executed immediately
        if (_special === 3) {
          require.call(null, id);
        }
    } else {
      resolved[id] = factory;
    }
  };
})(this);

/* fM6DOcyzBVt */
/** Path: html/js/sdk/ES5ArrayPrototype.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES5ArrayPrototype
 */
__d("ES5ArrayPrototype",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var ES5ArrayPrototype = {};

/**
* http://es5.github.com/#x15.4.4.19
*/
ES5ArrayPrototype.map = __annotator(function(func, context) {
  if (typeof func != 'function') {
    throw new TypeError();
  }

  var ii;
  var len = this.length;
  var r   = new Array(len);
  for (ii = 0; ii < len; ++ii) {
    if (ii in this) {
      r[ii] = func.call(context, this[ii], ii, this);
    }
  }

  return r;
}, {"module":"ES5ArrayPrototype","line":12,"column":24});

/**
* http://es5.github.com/#x15.4.4.18
*/
ES5ArrayPrototype.forEach = __annotator(function(func, context) {
  ES5ArrayPrototype.map.call(this, func, context);
}, {"module":"ES5ArrayPrototype","line":32,"column":28});

/**
* http://es5.github.com/#x15.4.4.20
*/
ES5ArrayPrototype.filter = __annotator(function(func, context) {
  if (typeof func != 'function') {
    throw new TypeError();
  }

  var ii, val, len = this.length, r = [];
  for (ii = 0; ii < len; ++ii) {
    if (ii in this) {
      // Specified, to prevent mutations in the original array.
      val = this[ii];
      if (func.call(context, val, ii, this)) {
        r.push(val);
      }
    }
  }

  return r;
}, {"module":"ES5ArrayPrototype","line":39,"column":27});

/**
* http://es5.github.com/#x15.4.4.16
*/
ES5ArrayPrototype.every = __annotator(function(func, context) {
  if (typeof func != 'function') {
    throw new TypeError();
  }
  var t = new Object(this);
  var len = t.length;
  for (var ii = 0; ii < len; ii++) {
    if (ii in t) {
      if (!func.call(context, t[ii], ii, t)) {
        return false;
      }
    }
  }
  return true;
}, {"module":"ES5ArrayPrototype","line":61,"column":26});

/**
* http://es5.github.com/#x15.4.4.17
*/
ES5ArrayPrototype.some = __annotator(function(func, context) {
  if (typeof func != 'function') {
    throw new TypeError();
  }
  var t = new Object(this);
  var len = t.length;
  for (var ii = 0; ii < len; ii++) {
    if (ii in t) {
      if (func.call(context, t[ii], ii, t)) {
        return true;
      }
    }
  }
  return false;
}, {"module":"ES5ArrayPrototype","line":80,"column":25});

/**
* http://es5.github.com/#x15.4.4.14
*/
ES5ArrayPrototype.indexOf = __annotator(function(val, index) {
  var len = this.length;
  index |= 0;

  if (index < 0) {
    index += len;
  }

  for (; index < len; index++) {
    if (index in this && this[index] === val) {
      return index;
    }
  }
  return -1;
}, {"module":"ES5ArrayPrototype","line":99,"column":28});

module.exports = ES5ArrayPrototype;

/* RMW-eICsrwT */
}, {"module":"ES5ArrayPrototype","line":6,"column":27}),null);
/** Path: html/js/sdk/ES5FunctionPrototype.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES5FunctionPrototype
 */
__d("ES5FunctionPrototype",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var ES5FunctionPrototype = {};

/**
 * A simulated implementation of Function.prototype.bind that is mostly ES5-
 * compliant. The [[Call]], [[Construct]], and [[HasInstance]] internal
 * properties differ, which means that the simulated implementation produces
 * different stack traces and behaves differently when used as a constructor.
 *
 * http://es5.github.com/#x15.3.4.5
 */
ES5FunctionPrototype.bind = __annotator(function(context /* args... */) {
  if (typeof this != 'function') {
    throw new TypeError('Bind must be called on a function');
  }
  var target = this;
  var appliedArguments = Array.prototype.slice.call(arguments, 1);
  function bound() {
    return target.apply(
      context,
      appliedArguments.concat(Array.prototype.slice.call(arguments)));
  }__annotator(bound, {"module":"ES5FunctionPrototype","line":23,"column":2,"name":"bound"});
  bound.displayName = 'bound:' + (target.displayName || target.name || '(?)');
  bound.toString = __annotator(function toString() {
    return 'bound: ' + target;
  }, {"module":"ES5FunctionPrototype","line":29,"column":19,"name":"toString"});
  return bound;
}, {"module":"ES5FunctionPrototype","line":17,"column":28});

module.exports = ES5FunctionPrototype;

/* 2DXueXgYBiA */
}, {"module":"ES5FunctionPrototype","line":6,"column":30}),null);
/** Path: html/js/sdk/ES5StringPrototype.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES5StringPrototype
 */
__d("ES5StringPrototype",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var ES5StringPrototype = {};

/**
 * Trims white space on either side of this string.
 *
 * http://es5.github.com/#x15.5.4.20
 */
ES5StringPrototype.trim = __annotator(function() {
  if (this == null) {
    throw new TypeError('String.prototype.trim called on null or undefined');
  }
  return String.prototype.replace.call(this, /^\s+|\s+$/g, '');
}, {"module":"ES5StringPrototype","line":14,"column":26});

ES5StringPrototype.startsWith = __annotator(function(search) {
  var string = String(this);
  if (this == null) {
    throw new TypeError(
        'String.prototype.startsWith called on null or undefined');
  }
  var pos = arguments.length > 1 ? Number(arguments[1]) : 0;
  if (isNaN(pos)) {
    pos = 0;
  }
  var start = Math.min(Math.max(pos, 0), string.length);
  return string.indexOf(String(search), pos) == start;
}, {"module":"ES5StringPrototype","line":21,"column":32});

ES5StringPrototype.endsWith = __annotator(function(search) {
  var string = String(this);
  if (this == null) {
    throw new TypeError(
        'String.prototype.endsWith called on null or undefined');
  }
  var stringLength = string.length;
  var searchString = String(search);
  var pos = arguments.length > 1 ? Number(arguments[1]) : stringLength;
  if (isNaN(pos)) {
    pos = 0;
  }
  var end = Math.min(Math.max(pos, 0), stringLength);
  var start = end - searchString.length;
  if (start < 0) {
    return false;
  }
  return string.lastIndexOf(searchString, start) == start;
}, {"module":"ES5StringPrototype","line":35,"column":30});

ES5StringPrototype.contains = __annotator(function(search) {
  if (this == null) {
    throw new TypeError(
        'String.prototype.contains called on null or undefined');
  }
  var string = String(this);
  var pos = arguments.length > 1 ? Number(arguments[1]) : 0;
  if (isNaN(pos)) {
    pos = 0;
  }
  return string.indexOf(String(search), pos) != -1;
}, {"module":"ES5StringPrototype","line":55,"column":30});

ES5StringPrototype.repeat = __annotator(function(count) {
  if (this == null) {
    throw new TypeError(
        'String.prototype.repeat called on null or undefined');
  }
  var string = String(this);
  var n = count ? Number(count) : 0;
  if (isNaN(n)) {
    n = 0;
  }
  if (n < 0 || n === Infinity) {
    throw RangeError();
  }
  if (n === 1) {
    return string;
  }
  if (n === 0) {
    return '';
  }
  var result = '';
  while (n) {
    if (n & 1) {
      result += string;
    }
    if ((n >>= 1)) {
      string += string;
    }
  }
  return result;
}, {"module":"ES5StringPrototype","line":68,"column":28});

module.exports = ES5StringPrototype;

/* LnybSBK3IdP */
}, {"module":"ES5StringPrototype","line":6,"column":28}),null);
/** Path: html/js/sdk/ES5Array.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES5Array
 */
__d("ES5Array",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var ES5Array = {};

ES5Array.isArray = __annotator(function(object) {
  return Object.prototype.toString.call(object) == '[object Array]';
}, {"module":"ES5Array","line":9,"column":19});

module.exports = ES5Array;

/* fqy5viPd9Si */
}, {"module":"ES5Array","line":6,"column":18}),null);
/** Path: html/js/ie8DontEnum.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ie8DontEnum
 */
__d("ie8DontEnum",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
// JScript in IE8 and below mistakenly skips over built-in properties.
// https://developer.mozilla.org/en/ECMAScript_DontEnum_attribute
var dontEnumProperties = [
  'toString',
  'toLocaleString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'prototypeIsEnumerable',
  'constructor'
];

var hasOwnProperty = ({}).hasOwnProperty;

/**
 * This function is NOP by default, and only in IE8
 * does actual fixing of {DontEnum} props.
 */
var ie8DontEnum = __annotator(function() {}, {"module":"ie8DontEnum","line":25,"column":18});

if (({toString: true}).propertyIsEnumerable('toString')) {
  ie8DontEnum = __annotator(function(object, onProp) {
    for (var i = 0; i < dontEnumProperties.length; i++) {
      var property = dontEnumProperties[i];
      if (hasOwnProperty.call(object, property)) {
        onProp(property);
      }
    }
  }, {"module":"ie8DontEnum","line":28,"column":16});
}

module.exports = ie8DontEnum;

/* AqbU7BP0XtX */
}, {"module":"ie8DontEnum","line":6,"column":21}),null);
/** Path: html/js/sdk/ES5Object.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES5Object
 */
__d("ES5Object",["ie8DontEnum"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ie8DontEnum) {require.__markCompiled && require.__markCompiled();
   
var hasOwnProperty = ({}).hasOwnProperty;

var ES5Object = {};

// Temporary constructor used in ES5Object.create
// to set needed prototype.
function F() {}__annotator(F, {"module":"ES5Object","line":14,"column":0,"name":"F"});

/**
 * Creates a new object with the specified prototype object.
 *
 * http://es5.github.com/#x15.2.3.5
 */
ES5Object.create = __annotator(function(proto) {
  if (__DEV__) {
    if (arguments.length > 1) {
      throw new Error(
        'Object.create implementation supports only the first parameter');
    }
  }
  var type = typeof proto;
  if (type != 'object' && type != 'function') {
    throw new TypeError('Object prototype may only be a Object or null');
  }
  F.prototype = proto;
  return new F();
}, {"module":"ES5Object","line":21,"column":19});

/**
 * Returns an array of the given object's own enumerable properties.
 *
 * http://es5.github.com/#x15.2.3.14
 */
ES5Object.keys = __annotator(function(object) {
  var type = typeof object;
  if (type != 'object' && type != 'function' || object === null) {
    throw new TypeError('Object.keys called on non-object');
  }

  var keys = [];
  for (var key in object) {
    if (hasOwnProperty.call(object, key)) {
      keys.push(key);
    }
  }

  // Fix {DontEnum} IE8 bug.
  ie8DontEnum(object, __annotator(function(prop)  {return keys.push(prop);}, {"module":"ES5Object","line":55,"column":22}));

  return keys;
}, {"module":"ES5Object","line":41,"column":17});

module.exports = ES5Object;

/* KOaon63wAcQ */
}, {"module":"ES5Object","line":6,"column":32}),null);
/** Path: html/js/sdk/ES5Date.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES5Date
 */
__d("ES5Date",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var ES5Date = {};
ES5Date.now = __annotator(function() {
  return new Date().getTime();
}, {"module":"ES5Date","line":8,"column":14});

module.exports = ES5Date;

/* eeaxbZNTDfe */
}, {"module":"ES5Date","line":6,"column":17}),null);
/** Path: html/js/third_party/json3/json3.js */
/**
 * @providesModule JSON3
 * @preserve-header
 *
 *! JSON v3.2.3 | http://bestiejs.github.com/json3 | Copyright 2012, Kit Cambridge | http://kit.mit-license.org
 */__d("JSON3",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
;(__annotator(function () {
  // Convenience aliases.
  var getClass = {}.toString, isProperty, forEach, undef;
  var JSON3 = module.exports = {};
  // A JSON source string used to test the native `stringify` and `parse`
  // implementations.
  var serialized = '{"A":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';

  // Feature tests to determine whether the native `JSON.stringify` and `parse`
  // implementations are spec-compliant. Based on work by Ken Snyder.
  var stringifySupported, Escapes, toPaddedString, quote, serialize;
  var parseSupported, fromCharCode, Unescapes, abort, lex, get, walk, update, Index, Source;

  // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
  var value = new Date(-3509827334573292), floor, Months, getDay;

  try {
    // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
    // results for certain dates in Opera >= 10.53.
    value = value.getUTCFullYear() == -109252 && value.getUTCMonth() === 0 && value.getUTCDate() == 1 &&
      // Safari < 2.0.2 stores the internal millisecond time value correctly,
      // but clips the values returned by the date methods to the range of
      // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
      value.getUTCHours() == 10 && value.getUTCMinutes() == 37 && value.getUTCSeconds() == 6 && value.getUTCMilliseconds() == 708;
  } catch (exception) {}

  // Define additional utility methods if the `Date` methods are buggy.
  if (!value) {
    floor = Math.floor;
    // A mapping between the months of the year and the number of days between
    // January 1st and the first of the respective month.
    Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    // Internal: Calculates the number of days between the Unix epoch and the
    // first day of the given month.
    getDay = __annotator(function (year, month) {
      return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
    }, {"module":"JSON3","line":41,"column":13});
  }

  if (typeof JSON == "object" && JSON) {
    // Delegate to the native `stringify` and `parse` implementations in
    // asynchronous module loaders and CommonJS environments.
    JSON3.stringify = JSON.stringify;
    JSON3.parse = JSON.parse;
  }

  // Test `JSON.stringify`.
  if ((stringifySupported = typeof JSON3.stringify == "function" && !getDay)) {
    // A test function object with a custom `toJSON` method.
    (value = __annotator(function () {
      return 1;
    }, {"module":"JSON3","line":56,"column":13})).toJSON = value;
    try {
      stringifySupported =
        // Firefox 3.1b1 and b2 serialize string, number, and boolean
        // primitives as object literals.
        JSON3.stringify(0) === "0" &&
        // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
        // literals.
        JSON3.stringify(new Number()) === "0" &&
        JSON3.stringify(new String()) == '""' &&
        // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
        // does not define a canonical JSON representation (this applies to
        // objects with `toJSON` properties as well, *unless* they are nested
        // within an object or array).
        JSON3.stringify(getClass) === undef &&
        // IE 8 serializes `undefined` as `"undefined"`. Safari 5.1.2 and FF
        // 3.1b3 pass this test.
        JSON3.stringify(undef) === undef &&
        // Safari 5.1.2 and FF 3.1b3 throw `Error`s and `TypeError`s,
        // respectively, if the value is omitted entirely.
        JSON3.stringify() === undef &&
        // FF 3.1b1, 2 throw an error if the given value is not a number,
        // string, array, object, Boolean, or `null` literal. This applies to
        // objects with custom `toJSON` methods as well, unless they are nested
        // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
        // methods entirely.
        JSON3.stringify(value) === "1" &&
        JSON3.stringify([value]) == "[1]" &&
        // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
        // `"[null]"`.
        JSON3.stringify([undef]) == "[null]" &&
        // YUI 3.0.0b1 fails to serialize `null` literals.
        JSON3.stringify(null) == "null" &&
        // FF 3.1b1, 2 halts serialization if an array contains a function:
        // `[1, true, getClass, 1]` serializes as "[1,true,],". These versions
        // of Firefox also allow trailing commas in JSON objects and arrays.
        // FF 3.1b3 elides non-JSON values from objects and arrays, unless they
        // define custom `toJSON` methods.
        JSON3.stringify([undef, getClass, null]) == "[null,null,null]" &&
        // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
        // where character escape codes are expected (e.g., `\b` => `\u0008`).
        JSON3.stringify({ "result": [value, true, false, null, "\0\b\n\f\r\t"] }) == serialized &&
        // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
        JSON3.stringify(null, value) === "1" &&
        JSON3.stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
        // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
        // serialize extended years.
        JSON3.stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
        // The milliseconds are optional in ES 5, but required in 5.1.
        JSON3.stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
        // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
        // four-digit years instead of six-digit years. Credits: @Yaffle.
        JSON3.stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
        // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
        // values less than 1000. Credits: @Yaffle.
        JSON3.stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
    } catch (exception) {
      stringifySupported = false;
    }
  }

  // Test `JSON.parse`.
  if (typeof JSON3.parse == "function") {
    try {
      // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
      // Conforming implementations should also coerce the initial argument to
      // a string prior to parsing.
      if (JSON3.parse("0") === 0 && !JSON3.parse(false)) {
        // Simple parsing test.
        value = JSON3.parse(serialized);
        if ((parseSupported = value.A.length == 5 && value.A[0] == 1)) {
          try {
            // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
            parseSupported = !JSON3.parse('"\t"');
          } catch (exception) {}
          if (parseSupported) {
            try {
              // FF 4.0 and 4.0.1 allow leading `+` signs, and leading and
              // trailing decimal points. FF 4.0, 4.0.1, and IE 9 also allow
              // certain octal literals.
              parseSupported = JSON3.parse("01") != 1;
            } catch (exception) {}
          }
        }
      }
    } catch (exception) {
      parseSupported = false;
    }
  }

  // Clean up the variables used for the feature tests.
  value = serialized = null;

  if (!stringifySupported || !parseSupported) {
    // Internal: Determines if a property is a direct property of the given
    // object. Delegates to the native `Object#hasOwnProperty` method.
    if (!(isProperty = {}.hasOwnProperty)) {
      isProperty = __annotator(function (property) {
        var members = {}, constructor;
        if ((members.__proto__ = null, members.__proto__ = {
          // The *proto* property cannot be set multiple times in recent
          // versions of Firefox and SeaMonkey.
          "toString": 1
        }, members).toString != getClass) {
          // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
          // supports the mutable *proto* property.
          isProperty = __annotator(function (property) {
            // Capture and break the object's prototype chain (see section 8.6.2
            // of the ES 5.1 spec). The parenthesized expression prevents an
            // unsafe transformation by the Closure Compiler.
            var original = this.__proto__, result = property in (this.__proto__ = null, this);
            // Restore the original prototype chain.
            this.__proto__ = original;
            return result;
          }, {"module":"JSON3","line":164,"column":23});
        } else {
          // Capture a reference to the top-level `Object` constructor.
          constructor = members.constructor;
          // Use the `constructor` property to simulate `Object#hasOwnProperty` in
          // other environments.
          isProperty = __annotator(function (property) {
            var parent = (this.constructor || constructor).prototype;
            return property in this && !(property in parent && this[property] === parent[property]);
          }, {"module":"JSON3","line":178,"column":23});
        }
        members = null;
        return isProperty.call(this, property);
      }, {"module":"JSON3","line":155,"column":19});
    }

    // Internal: Normalizes the `for...in` iteration algorithm across
    // environments. Each enumerated key is yielded to a `callback` function.
    forEach = __annotator(function (object, callback) {
      var size = 0, Properties, members, property, forEach;

      // Tests for bugs in the current environment's `for...in` algorithm. The
      // `valueOf` property inherits the non-enumerable flag from
      // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
      (Properties = __annotator(function () {
        this.valueOf = 0;
      }, {"module":"JSON3","line":196,"column":20})).prototype.valueOf = 0;

      // Iterate over a new instance of the `Properties` class.
      members = new Properties();
      for (property in members) {
        // Ignore all properties inherited from `Object.prototype`.
        if (isProperty.call(members, property)) {
          size++;
        }
      }
      Properties = members = null;

      // Normalize the iteration algorithm.
      if (!size) {
        // A list of non-enumerable properties inherited from `Object.prototype`.
        members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
        // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
        // properties.
        forEach = __annotator(function (object, callback) {
          var isFunction = getClass.call(object) == "[object Function]", property, length;
          for (property in object) {
            // Gecko <= 1.0 enumerates the `prototype` property of functions under
            // certain conditions; IE does not.
            if (!(isFunction && property == "prototype") && isProperty.call(object, property)) {
              callback(property);
            }
          }
          // Manually invoke the callback for each non-enumerable property.
          for (length = members.length; property = members[--length]; isProperty.call(object, property) && callback(property));
        }, {"module":"JSON3","line":216,"column":18});
      } else if (size == 2) {
        // Safari <= 2.0.4 enumerates shadowed properties twice.
        forEach = __annotator(function (object, callback) {
          // Create a set of iterated properties.
          var members = {}, isFunction = getClass.call(object) == "[object Function]", property;
          for (property in object) {
            // Store each property name to prevent double enumeration. The
            // `prototype` property of functions is not enumerated due to cross-
            // environment inconsistencies.
            if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
              callback(property);
            }
          }
        }, {"module":"JSON3","line":230,"column":18});
      } else {
        // No bugs detected; use the standard `for...in` algorithm.
        forEach = __annotator(function (object, callback) {
          var isFunction = getClass.call(object) == "[object Function]", property, isConstructor;
          for (property in object) {
            if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
              callback(property);
            }
          }
          // Manually invoke the callback for the `constructor` property due to
          // cross-environment inconsistencies.
          if (isConstructor || isProperty.call(object, (property = "constructor"))) {
            callback(property);
          }
        }, {"module":"JSON3","line":244,"column":18});
      }
      return forEach(object, callback);
    }, {"module":"JSON3","line":190,"column":14});

    // Public: Serializes a JavaScript `value` as a JSON string. The optional
    // `filter` argument may specify either a function that alters how object and
    // array members are serialized, or an array of strings and numbers that
    // indicates which properties should be serialized. The optional `width`
    // argument may be either a string or number that specifies the indentation
    // level of the output.
    if (!stringifySupported) {
      // Internal: A map of control characters and their escaped equivalents.
      Escapes = {
        "\\": "\\\\",
        '"': '\\"',
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t"
      };

      // Internal: Converts `value` into a zero-padded string such that its
      // length is at least equal to `width`. The `width` must be <= 6.
      toPaddedString = __annotator(function (width, value) {
        // The `|| 0` expression is necessary to work around a bug in
        // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
        return ("000000" + (value || 0)).slice(-width);
      }, {"module":"JSON3","line":281,"column":23});

      // Internal: Double-quotes a string `value`, replacing all ASCII control
      // characters (characters with code unit values between 0 and 31) with
      // their escaped equivalents. This is an implementation of the
      // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
      quote = __annotator(function (value) {
        var result = '"', index = 0, symbol;
        for (; symbol = value.charAt(index); index++) {
          // Escape the reverse solidus, double quote, backspace, form feed, line
          // feed, carriage return, and tab characters.
          result += '\\"\b\f\n\r\t'.indexOf(symbol) > -1 ? Escapes[symbol] :
            // If the character is a control character, append its Unicode escape
            // sequence; otherwise, append the character as-is.
            symbol < " " ? "\\u00" + toPaddedString(2, symbol.charCodeAt(0).toString(16)) : symbol;
        }
        return result + '"';
      }, {"module":"JSON3","line":291,"column":14});

      // Internal: Recursively serializes an object. Implements the
      // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
      serialize = __annotator(function (property, object, callback, properties, whitespace, indentation, stack) {
        var value = object[property], className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, any;
        if (typeof value == "object" && value) {
          className = getClass.call(value);
          if (className == "[object Date]" && !isProperty.call(value, "toJSON")) {
            if (value > -1 / 0 && value < 1 / 0) {
              // Dates are serialized according to the `Date#toJSON` method
              // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
              // for the ISO 8601 date time string format.
              if (getDay) {
                // Manually compute the year, month, date, hours, minutes,
                // seconds, and milliseconds if the `getUTC*` methods are
                // buggy. Adapted from @Yaffle's `date-shim` project.
                date = floor(value / 864e5);
                for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                date = 1 + date - getDay(year, month);
                // The `time` value specifies the time within the day (see ES
                // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                // to compute `A modulo B`, as the `%` operator does not
                // correspond to the `modulo` operation for negative numbers.
                time = (value % 864e5 + 864e5) % 864e5;
                // The hours, minutes, seconds, and milliseconds are obtained by
                // decomposing the time within the day. See section 15.9.1.10.
                hours = floor(time / 36e5) % 24;
                minutes = floor(time / 6e4) % 60;
                seconds = floor(time / 1e3) % 60;
                milliseconds = time % 1e3;
              } else {
                year = value.getUTCFullYear();
                month = value.getUTCMonth();
                date = value.getUTCDate();
                hours = value.getUTCHours();
                minutes = value.getUTCMinutes();
                seconds = value.getUTCSeconds();
                milliseconds = value.getUTCMilliseconds();
              }
              // Serialize extended years correctly.
              value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                // Months, dates, hours, minutes, and seconds should have two
                // digits; milliseconds should have three.
                "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                // Milliseconds are optional in ES 5.0, but required in 5.1.
                "." + toPaddedString(3, milliseconds) + "Z";
            } else {
              value = null;
            }
          } else if (typeof value.toJSON == "function" && ((className != "[object Number]" && className != "[object String]" && className != "[object Array]") || isProperty.call(value, "toJSON"))) {
            // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
            // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
            // ignores all `toJSON` methods on these objects unless they are
            // defined directly on an instance.
            value = value.toJSON(property);
          }
        }
        if (callback) {
          // If a replacement function was provided, call it to obtain the value
          // for serialization.
          value = callback.call(object, property, value);
        }
        if (value === null) {
          return "null";
        }
        className = getClass.call(value);
        if (className == "[object Boolean]") {
          // Booleans are represented literally.
          return "" + value;
        } else if (className == "[object Number]") {
          // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
          // `"null"`.
          return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
        } else if (className == "[object String]") {
          // Strings are double-quoted and escaped.
          return quote(value);
        }
        // Recursively serialize objects and arrays.
        if (typeof value == "object") {
          // Check for cyclic structures. This is a linear search; performance
          // is inversely proportional to the number of unique nested objects.
          for (length = stack.length; length--;) {
            if (stack[length] === value) {
              // Cyclic structures cannot be serialized by `JSON.stringify`.
              throw TypeError();
            }
          }
          // Add the object to the stack of traversed objects.
          stack.push(value);
          results = [];
          // Save the current indentation level and indent one additional level.
          prefix = indentation;
          indentation += whitespace;
          if (className == "[object Array]") {
            // Recursively serialize array elements.
            for (index = 0, length = value.length; index < length; any || (any = true), index++) {
              element = serialize(index, value, callback, properties, whitespace, indentation, stack);
              results.push(element === undef ? "null" : element);
            }
            return any ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
          } else {
            // Recursively serialize object members. Members are selected from
            // either a user-specified list of property names, or the object
            // itself.
            forEach(properties || value, __annotator(function (property) {
              var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
              if (element !== undef) {
                // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                // is not the empty string, let `member` {quote(property) + ":"}
                // be the concatenation of `member` and the `space` character."
                // The "`space` character" refers to the literal space
                // character, not the `space` {width} argument provided to
                // `JSON.stringify`.
                results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
              }
              any || (any = true);
            }, {"module":"JSON3","line":409,"column":41}));
            return any ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
          }
          // Remove the object from the traversed object stack.
          stack.pop();
        }
      }, {"module":"JSON3","line":306,"column":18});

      // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
      JSON3.stringify = __annotator(function (source, filter, width) {
        var whitespace, callback, properties, index, length, value;
        if (typeof filter == "function" || typeof filter == "object" && filter) {
          if (getClass.call(filter) == "[object Function]") {
            callback = filter;
          } else if (getClass.call(filter) == "[object Array]") {
            // Convert the property names array into a makeshift set.
            properties = {};
            for (index = 0, length = filter.length; index < length; value = filter[index++], ((getClass.call(value) == "[object String]" || getClass.call(value) == "[object Number]") && (properties[value] = 1)));
          }
        }
        if (width) {
          if (getClass.call(width) == "[object Number]") {
            // Convert the `width` to an integer and create a string containing
            // `width` number of space characters.
            if ((width -= width % 1) > 0) {
              for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
            }
          } else if (getClass.call(width) == "[object String]") {
            whitespace = width.length <= 10 ? width : width.slice(0, 10);
          }
        }
        // Opera <= 7.54u2 discards the values associated with empty string keys
        // (`""`) only if they are used directly within an object member list
        // (e.g., `!("" in { "": 1})`).
        return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
      }, {"module":"JSON3","line":430,"column":24});
    }

    // Public: Parses a JSON source string.
    if (!parseSupported) {
      fromCharCode = String.fromCharCode;
      // Internal: A map of escaped control characters and their unescaped
      // equivalents.
      Unescapes = {
        "\\": "\\",
        '"': '"',
        "/": "/",
        "b": "\b",
        "t": "\t",
        "n": "\n",
        "f": "\f",
        "r": "\r"
      };

      // Internal: Resets the parser state and throws a `SyntaxError`.
      abort = __annotator(function() {
        Index = Source = null;
        throw SyntaxError();
      }, {"module":"JSON3","line":476,"column":14});

      // Internal: Returns the next token, or `"$"` if the parser has reached
      // the end of the source string. A token may be a string, number, `null`
      // literal, or Boolean literal.
      lex = __annotator(function () {
        var source = Source, length = source.length, symbol, value, begin, position, sign;
        while (Index < length) {
          symbol = source.charAt(Index);
          if ("\t\r\n ".indexOf(symbol) > -1) {
            // Skip whitespace tokens, including tabs, carriage returns, line
            // feeds, and space characters.
            Index++;
          } else if ("{}[]:,".indexOf(symbol) > -1) {
            // Parse a punctuator token at the current position.
            Index++;
            return symbol;
          } else if (symbol == '"') {
            // Advance to the next character and parse a JSON string at the
            // current position. String tokens are prefixed with the sentinel
            // `@` character to distinguish them from punctuators.
            for (value = "@", Index++; Index < length;) {
              symbol = source.charAt(Index);
              if (symbol < " ") {
                // Unescaped ASCII control characters are not permitted.
                abort();
              } else if (symbol == "\\") {
                // Parse escaped JSON control characters, `"`, `\`, `/`, and
                // Unicode escape sequences.
                symbol = source.charAt(++Index);
                if ('\\"/btnfr'.indexOf(symbol) > -1) {
                  // Revive escaped control characters.
                  value += Unescapes[symbol];
                  Index++;
                } else if (symbol == "u") {
                  // Advance to the first character of the escape sequence.
                  begin = ++Index;
                  // Validate the Unicode escape sequence.
                  for (position = Index + 4; Index < position; Index++) {
                    symbol = source.charAt(Index);
                    // A valid sequence comprises four hexdigits that form a
                    // single hexadecimal value.
                    if (!(symbol >= "0" && symbol <= "9" || symbol >= "a" && symbol <= "f" || symbol >= "A" && symbol <= "F")) {
                      // Invalid Unicode escape sequence.
                      abort();
                    }
                  }
                  // Revive the escaped character.
                  value += fromCharCode("0x" + source.slice(begin, Index));
                } else {
                  // Invalid escape sequence.
                  abort();
                }
              } else {
                if (symbol == '"') {
                  // An unescaped double-quote character marks the end of the
                  // string.
                  break;
                }
                // Append the original character as-is.
                value += symbol;
                Index++;
              }
            }
            if (source.charAt(Index) == '"') {
              Index++;
              // Return the revived string.
              return value;
            }
            // Unterminated string.
            abort();
          } else {
            // Parse numbers and literals.
            begin = Index;
            // Advance the scanner's position past the sign, if one is
            // specified.
            if (symbol == "-") {
              sign = true;
              symbol = source.charAt(++Index);
            }
            // Parse an integer or floating-point value.
            if (symbol >= "0" && symbol <= "9") {
              // Leading zeroes are interpreted as octal literals.
              if (symbol == "0" && (symbol = source.charAt(Index + 1), symbol >= "0" && symbol <= "9")) {
                // Illegal octal literal.
                abort();
              }
              sign = false;
              // Parse the integer component.
              for (; Index < length && (symbol = source.charAt(Index), symbol >= "0" && symbol <= "9"); Index++);
              // Floats cannot contain a leading decimal point; however, this
              // case is already accounted for by the parser.
              if (source.charAt(Index) == ".") {
                position = ++Index;
                // Parse the decimal component.
                for (; position < length && (symbol = source.charAt(position), symbol >= "0" && symbol <= "9"); position++);
                if (position == Index) {
                  // Illegal trailing decimal.
                  abort();
                }
                Index = position;
              }
              // Parse exponents.
              symbol = source.charAt(Index);
              if (symbol == "e" || symbol == "E") {
                // Skip past the sign following the exponent, if one is
                // specified.
                symbol = source.charAt(++Index);
                if (symbol == "+" || symbol == "-") {
                  Index++;
                }
                // Parse the exponential component.
                for (position = Index; position < length && (symbol = source.charAt(position), symbol >= "0" && symbol <= "9"); position++);
                if (position == Index) {
                  // Illegal empty exponent.
                  abort();
                }
                Index = position;
              }
              // Coerce the parsed value to a JavaScript number.
              return +source.slice(begin, Index);
            }
            // A negative sign may only precede numbers.
            if (sign) {
              abort();
            }
            // `true`, `false`, and `null` literals.
            if (source.slice(Index, Index + 4) == "true") {
              Index += 4;
              return true;
            } else if (source.slice(Index, Index + 5) == "false") {
              Index += 5;
              return false;
            } else if (source.slice(Index, Index + 4) == "null") {
              Index += 4;
              return null;
            }
            // Unrecognized token.
            abort();
          }
        }
        // Return the sentinel `$` character if the parser has reached the end
        // of the source string.
        return "$";
      }, {"module":"JSON3","line":484,"column":12});

      // Internal: Parses a JSON `value` token.
      get = __annotator(function (value) {
        var results, any, key;
        if (value == "$") {
          // Unexpected end of input.
          abort();
        }
        if (typeof value == "string") {
          if (value.charAt(0) == "@") {
            // Remove the sentinel `@` character.
            return value.slice(1);
          }
          // Parse object and array literals.
          if (value == "[") {
            // Parses a JSON array, returning a new JavaScript array.
            results = [];
            for (;; any || (any = true)) {
              value = lex();
              // A closing square bracket marks the end of the array literal.
              if (value == "]") {
                break;
              }
              // If the array literal contains elements, the current token
              // should be a comma separating the previous element from the
              // next.
              if (any) {
                if (value == ",") {
                  value = lex();
                  if (value == "]") {
                    // Unexpected trailing `,` in array literal.
                    abort();
                  }
                } else {
                  // A `,` must separate each array element.
                  abort();
                }
              }
              // Elisions and leading commas are not permitted.
              if (value == ",") {
                abort();
              }
              results.push(get(value));
            }
            return results;
          } else if (value == "{") {
            // Parses a JSON object, returning a new JavaScript object.
            results = {};
            for (;; any || (any = true)) {
              value = lex();
              // A closing curly brace marks the end of the object literal.
              if (value == "}") {
                break;
              }
              // If the object literal contains members, the current token
              // should be a comma separator.
              if (any) {
                if (value == ",") {
                  value = lex();
                  if (value == "}") {
                    // Unexpected trailing `,` in object literal.
                    abort();
                  }
                } else {
                  // A `,` must separate each object member.
                  abort();
                }
              }
              // Leading commas are not permitted, object property names must be
              // double-quoted strings, and a `:` must separate each property
              // name and value.
              if (value == "," || typeof value != "string" || value.charAt(0) != "@" || lex() != ":") {
                abort();
              }
              results[value.slice(1)] = get(lex());
            }
            return results;
          }
          // Unexpected token encountered.
          abort();
        }
        return value;
      }, {"module":"JSON3","line":626,"column":12});

      // Internal: Updates a traversed object member.
      update = __annotator(function(source, property, callback) {
        var element = walk(source, property, callback);
        if (element === undef) {
          delete source[property];
        } else {
          source[property] = element;
        }
      }, {"module":"JSON3","line":709,"column":15});

      // Internal: Recursively traverses a parsed JSON object, invoking the
      // `callback` function for each value. This is an implementation of the
      // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
      walk = __annotator(function (source, property, callback) {
        var value = source[property], length;
        if (typeof value == "object" && value) {
          if (getClass.call(value) == "[object Array]") {
            for (length = value.length; length--;) {
              update(value, length, callback);
            }
          } else {
            // `forEach` can't be used to traverse an array in Opera <= 8.54,
            // as `Object#hasOwnProperty` returns `false` for array indices
            // (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            forEach(value, __annotator(function (property) {
              update(value, property, callback);
            }, {"module":"JSON3","line":732,"column":27}));
          }
        }
        return callback.call(source, property, value);
      }, {"module":"JSON3","line":721,"column":13});

      // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
      JSON3.parse = __annotator(function (source, callback) {
        Index = 0;
        Source = source;
        var result = get(lex());
        // If a JSON string contains multiple tokens, it is invalid.
        if (lex() != "$") {
          abort();
        }
        // Reset the parser state.
        Index = Source = null;
        return callback && getClass.call(callback) == "[object Function]" ? walk((value = {}, value[""] = result, value), "", callback) : result;
      }, {"module":"JSON3","line":741,"column":20});
    }
  }
}, {"module":"JSON3","line":7,"column":2})).call(this);

/* 2KL294koxM_ */
}, {"module":"JSON3","line":6,"column":18}),null);
/** Path: html/js/sdk/ES6Object.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES6Object
 */
__d("ES6Object",["ie8DontEnum"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ie8DontEnum) {require.__markCompiled && require.__markCompiled();
   
var hasOwnProperty = ({}).hasOwnProperty;

var ES6Object = {
  /**
   * Merges several objects in one, returns the agumented target.
   *
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign
   */
  assign:__annotator(function(target ) {for (var sources=[],$__0=1,$__1=arguments.length;$__0<$__1;$__0++) sources.push(arguments[$__0]);
    if (target == null) {
      throw new TypeError('Object.assign target cannot be null or undefined');
    }

    target = Object(target);

    for (var i = 0; i < sources.length; i++) {
      var source = sources[i];

      if (source == null) {
        continue;
      }

      source = Object(source);

      for (var prop in source) {
        if (hasOwnProperty.call(source, prop)) {
          target[prop] = source[prop];
        }
      }

      // Fix {DontEnum} IE8 bug.
      ie8DontEnum(source, __annotator(function(prop)  {return target[prop] = source[prop];}, {"module":"ES6Object","line":39,"column":26}));
    }

    return target;
  }, {"module":"ES6Object","line":16,"column":9})
};

module.exports = ES6Object;

/* DAgBbK5bQDP */
}, {"module":"ES6Object","line":6,"column":32}),null);
/** Path: html/js/sdk/ES6ArrayPrototype.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES6ArrayPrototype
 */
__d("ES6ArrayPrototype",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var ES6ArrayPrototype = {
  /**
   * https://developer.mozilla.org
   *  /en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
   */
  find:__annotator(function(/*function*/ predicate, thisArg) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }

    var index = ES6ArrayPrototype.findIndex.call(this, predicate, thisArg);
    return index === -1 ? void 0 : this[index];
  }, {"module":"ES6ArrayPrototype","line":12,"column":7}),

  /**
   * https://developer.mozilla.org
   *  /en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
   */
  findIndex:__annotator(function(/*function*/ predicate, thisArg) {
    if (this == null) {
      throw new TypeError(
        'Array.prototype.findIndex called on null or undefined'
      );
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    for (var i = 0; i < length; i++) {
      if (predicate.call(thisArg, list[i], i, list)) {
        return i;
      }
    }
    return -1;
  }, {"module":"ES6ArrayPrototype","line":28,"column":12})

}

module.exports = ES6ArrayPrototype;

/* ftK07A9mJN8 */
}, {"module":"ES6ArrayPrototype","line":6,"column":27}),null);
/** Path: html/js/sdk/ES6DatePrototype.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES6DatePrototype
 */
__d("ES6DatePrototype",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function pad(number) {
 return (number < 10 ? '0' : '') + number;
}__annotator(pad, {"module":"ES6DatePrototype","line":7,"column":0,"name":"pad"});

var ES6DatePrototype = {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString#Polyfill
   */
  toISOString:__annotator(function() {
    if (!isFinite(this)) {
      throw new Error('Invalid time value');
    }
    var year = this.getUTCFullYear();
    year = (year < 0 ? '-' : (year > 9999 ? '+' : '')) +
      ('00000' + Math.abs(year)).slice(0 <= year && year <= 9999 ? -4 : -6);
    return year +
      '-' + pad(this.getUTCMonth() + 1) +
      '-' + pad(this.getUTCDate()) +
      'T' + pad(this.getUTCHours()) +
      ':' + pad(this.getUTCMinutes()) +
      ':' + pad(this.getUTCSeconds()) +
      '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
      'Z';
  }, {"module":"ES6DatePrototype","line":15,"column":14})
};

module.exports = ES6DatePrototype;

/* Ef3upjPNuVS */
}, {"module":"ES6DatePrototype","line":6,"column":26}),null);
/** Path: html/js/sdk/ES6Number.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES6Number
 */
__d("ES6Number",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var ES6Number = {
  isFinite:__annotator(function(value) {
    return (typeof value == 'number') && isFinite(value);
  }, {"module":"ES6Number","line":8,"column":11}),

  isNaN:__annotator(function(value) {
    return (typeof value == 'number') && isNaN(value);
  }, {"module":"ES6Number","line":12,"column":8})
};

module.exports = ES6Number;

/* QLLqANSCDwC */
}, {"module":"ES6Number","line":6,"column":19}),null);
/** Path: html/js/sdk/ES.js */
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ES
 *
 * scripts/jssdk/default.spatch converts ES5/ES6 code into using this module in
 * ES3 style.
 */
__d("ES",["ES5ArrayPrototype","ES5FunctionPrototype","ES5StringPrototype","ES5Array","ES5Object","ES5Date","JSON3","ES6Object","ES6ArrayPrototype","ES6DatePrototype","ES6Number"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ES5ArrayPrototype,ES5FunctionPrototype,ES5StringPrototype,ES5Array,ES5Object,ES5Date,JSON3,ES6Object,ES6ArrayPrototype,ES6DatePrototype,ES6Number) {require.__markCompiled && require.__markCompiled();
   
   
   
  
   
   
   
   
   
   
   

var toString = ({}).toString;

var methodCache = {
  // Always use the polyfill for JSON to work around Prototype 1.6.x issues.
  // JSON3 will use the native versions if possible.
  'JSON.stringify': JSON3.stringify,
  'JSON.parse': JSON3.parse
};

var es5Polyfills = {
  'Array.prototype': ES5ArrayPrototype,
  'Function.prototype': ES5FunctionPrototype,
  'String.prototype': ES5StringPrototype,
  'Object': ES5Object,
  'Array': ES5Array,
  'Date': ES5Date
};

var es6Polyfills = {
  'Object': ES6Object,
  'Array.prototype': ES6ArrayPrototype,
  'Date.prototype': ES6DatePrototype,
  'Number': ES6Number
};

function setupMethodsCache(polyfills) {
  // Iterate over the polyfills, and add either a valid native implementation or
  // a polyfill to the methodCache
  for (var pName in polyfills) {
    if (!polyfills.hasOwnProperty(pName)) { continue; }
    var polyfillObject =  polyfills[pName];

    // Resolve which native object holds the function we are looking for
    var accessor = pName.split('.');
    var nativeObject = accessor.length == 2
      ? window[accessor[0]][accessor[1]]
      : window[pName];

    // Iterate over the shimmed methods, testing the native implementation
    for (var fName in polyfillObject) {
      if (!polyfillObject.hasOwnProperty(fName)) { continue; }

      var nativeFunction = nativeObject[fName];
      // If the native function exist, and tests as a native function, then
      // we save it for later
      methodCache[pName + '.' + fName] =
        nativeFunction && /\{\s+\[native code\]\s\}/.test(nativeFunction)
          ? nativeFunction
          : polyfillObject[fName];
    }
  }
}__annotator(setupMethodsCache, {"module":"ES","line":47,"column":0,"name":"setupMethodsCache"});

// Setup ES5, and ES6 polyfills
setupMethodsCache(es5Polyfills);
setupMethodsCache(es6Polyfills);

function ES(lhs, rhs, proto ) {for (var args=[],$__0=3,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
  // Normalize the type information
  var type = proto
    ? toString.call(lhs).slice(8, -1) + '.prototype'
    : lhs;

  // Locate the method to use
  var method = methodCache[type + '.' + rhs] || lhs[rhs];

  // Invoke or throw
  if (typeof method === 'function') {
    return method.apply(lhs, args);
  }

  if (__DEV__) {
    throw new Error('Polyfill ' + type + ' does not have a method ' + rhs);
  }
}__annotator(ES, {"module":"ES","line":79,"column":0,"name":"ES"});

module.exports = ES;

/* 8t3naSxRM6- */
}, {"module":"ES","line":9,"column":179}),null);
var ES = require('ES');
__d("JSSDKRuntimeConfig",[],{"locale":"en_US","rtl":false,"revision":"1666213"});__d("JSSDKConfig",[],{"bustCache":true,"tagCountLogRate":0.01,"errorHandling":{"rate":4},"usePluginPipe":true,"features":{"allow_non_canvas_app_events":false,"event_subscriptions_log":{"rate":0.01,"value":10000},"should_force_single_dialog_instance":true,"kill_fragment":true,"xfbml_profile_pic_server":true,"error_handling":{"rate":4},"e2e_ping_tracking":{"rate":1.0e-6},"xd_timeout":{"rate":4,"value":30000},"use_bundle":true,"launch_payment_dialog_via_pac":{"rate":100},"plugin_tags_blacklist":["recommendations_bar"],"should_log_response_error":true},"api":{"mode":"warn","whitelist":["AppEvents","AppEvents.EventNames","AppEvents.ParameterNames","AppEvents.activateApp","AppEvents.logEvent","AppEvents.logPurchase","Canvas","Canvas.Prefetcher","Canvas.Prefetcher.addStaticResource","Canvas.Prefetcher.setCollectionMode","Canvas.getPageInfo","Canvas.hideFlashElement","Canvas.scrollTo","Canvas.setAutoGrow","Canvas.setDoneLoading","Canvas.setSize","Canvas.setUrlHandler","Canvas.showFlashElement","Canvas.startTimer","Canvas.stopTimer","Event","Event.subscribe","Event.unsubscribe","Music.flashCallback","Music.init","Music.send","Payment","Payment.cancelFlow","Payment.continueFlow","Payment.init","Payment.lockForProcessing","Payment.parse","Payment.setSize","Payment.unlockForProcessing","ThirdPartyProvider","ThirdPartyProvider.init","ThirdPartyProvider.sendData","UA","UA.nativeApp","XFBML","XFBML.RecommendationsBar","XFBML.RecommendationsBar.markRead","XFBML.parse","addFriend","api","getAccessToken","getAuthResponse","getLoginStatus","getUserID","init","login","logout","publish","share","ui"]},"initSitevars":{"enableMobileComments":1,"iframePermissions":{"read_stream":false,"manage_mailbox":false,"manage_friendlists":false,"read_mailbox":false,"publish_checkins":true,"status_update":true,"photo_upload":true,"video_upload":true,"sms":false,"create_event":true,"rsvp_event":true,"offline_access":true,"email":true,"xmpp_login":false,"create_note":true,"share_item":true,"export_stream":false,"publish_stream":true,"publish_likes":true,"ads_management":false,"contact_email":true,"access_private_data":false,"read_insights":false,"read_requests":false,"read_friendlists":true,"manage_pages":false,"physical_login":false,"manage_groups":false,"read_deals":false}}});__d("UrlMapConfig",[],{"www":"www.facebook.com","m":"m.facebook.com","connect":"connect.facebook.net","business":"business.facebook.com","api_https":"api.facebook.com","api_read_https":"api-read.facebook.com","graph_https":"graph.facebook.com","fbcdn_http":"static.ak.fbcdn.net","fbcdn_https":"fbstatic-a.akamaihd.net","cdn_http":"static.ak.facebook.com","cdn_https":"s-static.ak.facebook.com"});__d("JSSDKXDConfig",[],{"XdUrl":"\/connect\/xd_arbiter.php?version=41","XdBundleUrl":"\/connect\/xd_arbiter\/T_ZS6qndZ2q.js?version=41","Flash":{"path":"https:\/\/connect.facebook.net\/rsrc.php\/v1\/yW\/r\/yOZN1vHw3Z_.swf"},"useCdn":true});__d("JSSDKCssConfig",[],{"rules":".fb_hidden{position:absolute;top:-10000px;z-index:10001}.fb_invisible{display:none}.fb_reset{background:none;border:0;border-spacing:0;color:#000;cursor:auto;direction:ltr;font-family:\"lucida grande\", tahoma, verdana, arial, sans-serif;font-size:11px;font-style:normal;font-variant:normal;font-weight:normal;letter-spacing:normal;line-height:1;margin:0;overflow:visible;padding:0;text-align:left;text-decoration:none;text-indent:0;text-shadow:none;text-transform:none;visibility:visible;white-space:normal;word-spacing:normal}.fb_reset>div{overflow:hidden}.fb_link img{border:none}\n.fb_dialog{background:rgba(82, 82, 82, .7);position:absolute;top:-10000px;z-index:10001}.fb_reset .fb_dialog_legacy{overflow:visible}.fb_dialog_advanced{padding:10px;-moz-border-radius:8px;-webkit-border-radius:8px;border-radius:8px}.fb_dialog_content{background:#fff;color:#333}.fb_dialog_close_icon{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yq\/r\/IE9JII6Z1Ys.png) no-repeat scroll 0 0 transparent;_background-image:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yL\/r\/s816eWC-2sl.gif);cursor:pointer;display:block;height:15px;position:absolute;right:18px;top:17px;width:15px}.fb_dialog_mobile .fb_dialog_close_icon{top:5px;left:5px;right:auto}.fb_dialog_padding{background-color:transparent;position:absolute;width:1px;z-index:-1}.fb_dialog_close_icon:hover{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yq\/r\/IE9JII6Z1Ys.png) no-repeat scroll 0 -15px transparent;_background-image:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yL\/r\/s816eWC-2sl.gif)}.fb_dialog_close_icon:active{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yq\/r\/IE9JII6Z1Ys.png) no-repeat scroll 0 -30px transparent;_background-image:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yL\/r\/s816eWC-2sl.gif)}.fb_dialog_loader{background-color:#f6f7f8;border:1px solid #606060;font-size:24px;padding:20px}.fb_dialog_top_left,.fb_dialog_top_right,.fb_dialog_bottom_left,.fb_dialog_bottom_right{height:10px;width:10px;overflow:hidden;position:absolute}.fb_dialog_top_left{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/ye\/r\/8YeTNIlTZjm.png) no-repeat 0 0;left:-10px;top:-10px}.fb_dialog_top_right{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/ye\/r\/8YeTNIlTZjm.png) no-repeat 0 -10px;right:-10px;top:-10px}.fb_dialog_bottom_left{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/ye\/r\/8YeTNIlTZjm.png) no-repeat 0 -20px;bottom:-10px;left:-10px}.fb_dialog_bottom_right{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/ye\/r\/8YeTNIlTZjm.png) no-repeat 0 -30px;right:-10px;bottom:-10px}.fb_dialog_vert_left,.fb_dialog_vert_right,.fb_dialog_horiz_top,.fb_dialog_horiz_bottom{position:absolute;background:#525252;filter:alpha(opacity=70);opacity:.7}.fb_dialog_vert_left,.fb_dialog_vert_right{width:10px;height:100\u0025}.fb_dialog_vert_left{margin-left:-10px}.fb_dialog_vert_right{right:0;margin-right:-10px}.fb_dialog_horiz_top,.fb_dialog_horiz_bottom{width:100\u0025;height:10px}.fb_dialog_horiz_top{margin-top:-10px}.fb_dialog_horiz_bottom{bottom:0;margin-bottom:-10px}.fb_dialog_iframe{line-height:0}.fb_dialog_content .dialog_title{background:#6d84b4;border:1px solid #3a5795;color:#fff;font-size:14px;font-weight:bold;margin:0}.fb_dialog_content .dialog_title>span{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yd\/r\/Cou7n-nqK52.gif) no-repeat 5px 50\u0025;float:left;padding:5px 0 7px 26px}body.fb_hidden{-webkit-transform:none;height:100\u0025;margin:0;overflow:visible;position:absolute;top:-10000px;left:0;width:100\u0025}.fb_dialog.fb_dialog_mobile.loading{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/ya\/r\/3rhSv5V8j3o.gif) white no-repeat 50\u0025 50\u0025;min-height:100\u0025;min-width:100\u0025;overflow:hidden;position:absolute;top:0;z-index:10001}.fb_dialog.fb_dialog_mobile.loading.centered{max-height:590px;min-height:590px;max-width:500px;min-width:500px}#fb-root #fb_dialog_ipad_overlay{background:rgba(0, 0, 0, .45);position:absolute;left:0;top:0;width:100\u0025;min-height:100\u0025;z-index:10000}#fb-root #fb_dialog_ipad_overlay.hidden{display:none}.fb_dialog.fb_dialog_mobile.loading iframe{visibility:hidden}.fb_dialog_content .dialog_header{-webkit-box-shadow:white 0 1px 1px -1px inset;background:-webkit-gradient(linear, 0\u0025 0\u0025, 0\u0025 100\u0025, from(#738ABA), to(#2C4987));border-bottom:1px solid;border-color:#1d4088;color:#fff;font:14px Helvetica, sans-serif;font-weight:bold;text-overflow:ellipsis;text-shadow:rgba(0, 30, 84, .296875) 0 -1px 0;vertical-align:middle;white-space:nowrap}.fb_dialog_content .dialog_header table{-webkit-font-smoothing:subpixel-antialiased;height:43px;width:100\u0025}.fb_dialog_content .dialog_header td.header_left{font-size:12px;padding-left:5px;vertical-align:middle;width:60px}.fb_dialog_content .dialog_header td.header_right{font-size:12px;padding-right:5px;vertical-align:middle;width:60px}.fb_dialog_content .touchable_button{background:-webkit-gradient(linear, 0\u0025 0\u0025, 0\u0025 100\u0025, from(#4966A6), color-stop(.5, #355492), to(#2A4887));border:1px solid #2f477a;-webkit-background-clip:padding-box;-webkit-border-radius:3px;-webkit-box-shadow:rgba(0, 0, 0, .117188) 0 1px 1px inset, rgba(255, 255, 255, .167969) 0 1px 0;display:inline-block;margin-top:3px;max-width:85px;line-height:18px;padding:4px 12px;position:relative}.fb_dialog_content .dialog_header .touchable_button input{border:none;background:none;color:#fff;font:12px Helvetica, sans-serif;font-weight:bold;margin:2px -12px;padding:2px 6px 3px 6px;text-shadow:rgba(0, 30, 84, .296875) 0 -1px 0}.fb_dialog_content .dialog_header .header_center{color:#fff;font-size:16px;font-weight:bold;line-height:18px;text-align:center;vertical-align:middle}.fb_dialog_content .dialog_content{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/y9\/r\/jKEcVPZFk-2.gif) no-repeat 50\u0025 50\u0025;border:1px solid #555;border-bottom:0;border-top:0;height:150px}.fb_dialog_content .dialog_footer{background:#f6f7f8;border:1px solid #555;border-top-color:#ccc;height:40px}#fb_dialog_loader_close{float:left}.fb_dialog.fb_dialog_mobile .fb_dialog_close_button{text-shadow:rgba(0, 30, 84, .296875) 0 -1px 0}.fb_dialog.fb_dialog_mobile .fb_dialog_close_icon{visibility:hidden}\n.fb_iframe_widget{display:inline-block;position:relative}.fb_iframe_widget span{display:inline-block;position:relative;text-align:justify}.fb_iframe_widget iframe{position:absolute}.fb_iframe_widget_fluid_desktop,.fb_iframe_widget_fluid_desktop span,.fb_iframe_widget_fluid_desktop iframe{max-width:100\u0025}.fb_iframe_widget_fluid_desktop iframe{min-width:220px;position:relative}.fb_iframe_widget_lift{z-index:1}.fb_hide_iframes iframe{position:relative;left:-10000px}.fb_iframe_widget_loader{position:relative;display:inline-block}.fb_iframe_widget_fluid{display:inline}.fb_iframe_widget_fluid span{width:100\u0025}.fb_iframe_widget_loader iframe{min-height:32px;z-index:2;zoom:1}.fb_iframe_widget_loader .FB_Loader{background:url(http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/y9\/r\/jKEcVPZFk-2.gif) no-repeat;height:32px;width:32px;margin-left:-16px;position:absolute;left:50\u0025;z-index:4}","components":["css:fb.css.base","css:fb.css.dialog","css:fb.css.iframewidget"]});__d("ApiClientConfig",[],{"FlashRequest":{"swfUrl":"https:\/\/connect.facebook.net\/rsrc.php\/v1\/yd\/r\/mxzow1Sdmxr.swf"}});__d("JSSDKCanvasPrefetcherConfig",[],{"blacklist":[144959615576466],"sampleRate":500});__d("JSSDKPluginPipeConfig",[],{"threshold":0,"enabledApps":{"209753825810663":1,"187288694643718":1}});


__d("QueryString",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();


function encode(/*object*/ bag) /*string*/ {return __bodyWrapper(this, arguments, function() {
  var pairs = [];
  ES(ES('Object', 'keys', false,bag).sort(), 'forEach', true,__annotator(function(key) {
    var value = bag[key];
    
    if (typeof value === 'undefined') {
      return;
    }
    
    if (value === null) {
      pairs.push(key);
      return;
    }
    
    pairs.push(encodeURIComponent(key) +
               '=' +
               encodeURIComponent(value));
  }, {"module":"QueryString","line":30,"column":34}));
  return pairs.join('&');
}, {"params":[[bag, 'object', 'bag']],"returns":'string'});}__annotator(encode, {"module":"QueryString","line":28,"column":0,"name":"encode"}, {"params":["object"],"returns":"string"});


function decode(/*string*/ str, /*?boolean*/ strict) /*object*/ {return __bodyWrapper(this, arguments, function() {
  var data = {};
  if (str === '') {
    return data;
  }

  var pairs = str.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=', 2);
    var key = decodeURIComponent(pair[0]);
    if (strict && data.hasOwnProperty(key)) {
      throw new URIError('Duplicate key: ' + key);
    }
    data[key] = pair.length === 2
      ? decodeURIComponent(pair[1])
      : null;
  }
  return data;
}, {"params":[[str, 'string', 'str'], [strict, '?boolean', 'strict']],"returns":'object'});}__annotator(decode, {"module":"QueryString","line":52,"column":0,"name":"decode"}, {"params":["string","?boolean"],"returns":"object"});


function appendToUrl(/*string*/ url, params) /*string*/ {return __bodyWrapper(this, arguments, function() {
  return url +
    (~ES(url, 'indexOf', true,'?') ? '&' : '?') +
    (typeof params === 'string'
      ? params
      : QueryString.encode(params));
}, {"params":[[url, 'string', 'url']],"returns":'string'});}__annotator(appendToUrl, {"module":"QueryString","line":77,"column":0,"name":"appendToUrl"}, {"params":["string"],"returns":"string"});

var QueryString = {
  encode: encode,
  decode: decode,
  appendToUrl: appendToUrl
};

module.exports = QueryString;


}, {"module":"QueryString","line":23,"column":21}),null);


__d("ManagedError",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function ManagedError(message, innerError) {
  Error.prototype.constructor.call(this, message);
  this.message = message;
  this.innerError = innerError;
}__annotator(ManagedError, {"module":"ManagedError","line":30,"column":0,"name":"ManagedError"});
ManagedError.prototype = new Error();
ManagedError.prototype.constructor = ManagedError;

module.exports = ManagedError;


}, {"module":"ManagedError","line":29,"column":22}),null);


__d("AssertionError",["ManagedError"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ManagedError) {require.__markCompiled && require.__markCompiled();
   

function AssertionError(message) {
  ManagedError.prototype.constructor.apply(this, arguments);
}__annotator(AssertionError, {"module":"AssertionError","line":12,"column":0,"name":"AssertionError"});
AssertionError.prototype = new ManagedError();
AssertionError.prototype.constructor = AssertionError;

module.exports = AssertionError;



}, {"module":"AssertionError","line":9,"column":38}),null);


__d("sprintf",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();

function sprintf(format ) {return __bodyWrapper(this, arguments, function() {for (var args=[],$__0=1,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
  var index = 0;
  return format.replace(/%s/g, __annotator(function(match)  {return args[index++];}, {"module":"sprintf","line":32,"column":31}));
}, {"params":[[format, 'string', 'format']],"returns":'string'});}__annotator(sprintf, {"module":"sprintf","line":30,"column":0,"name":"sprintf"}, {"params":["string"],"returns":"string"});

module.exports = sprintf;


}, {"module":"sprintf","line":20,"column":17}),null);


__d("Assert",["AssertionError","sprintf"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,AssertionError,sprintf) {require.__markCompiled && require.__markCompiled();
   

   


function assert(/*boolean*/ expression, /*?string*/ message) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  if (typeof expression !== 'boolean' || !expression) {
    throw new AssertionError(message);
  }
  return expression;
}, {"params":[[expression, 'boolean', 'expression'], [message, '?string', 'message']],"returns":'boolean'});}__annotator(assert, {"module":"Assert","line":23,"column":0,"name":"assert"}, {"params":["boolean","?string"],"returns":"boolean"});


function assertType(/*string*/ type, expression, /*?string*/ message) {return __bodyWrapper(this, arguments, function() {
  var actualType;

  if (expression === (void 0)) {
    actualType = 'undefined';
  } else if (expression === null) {
    actualType = 'null';
  } else {
    var className = Object.prototype.toString.call(expression);
    actualType = /\s(\w*)/.exec(className)[1].toLowerCase();
  }

  assert(
    ES(type, 'indexOf', true,actualType) !== -1,
    message || sprintf('Expression is of type %s, not %s', actualType, type)
  );
  return expression;
}, {"params":[[type, 'string', 'type'], [message, '?string', 'message']]});}__annotator(assertType, {"module":"Assert","line":39,"column":0,"name":"assertType"}, {"params":["string","?string"]});


function assertInstanceOf(/*function*/ type, expression, /*?string*/ message) {return __bodyWrapper(this, arguments, function() {
  assert(
    expression instanceof type,
    message || 'Expression not instance of type'
  );
  return expression;
}, {"params":[[type, 'function', 'type'], [message, '?string', 'message']]});}__annotator(assertInstanceOf, {"module":"Assert","line":67,"column":0,"name":"assertInstanceOf"}, {"params":["function","?string"]});

function define(/*string*/ type, /*function*/ test) {return __bodyWrapper(this, arguments, function() {
  Assert['is' + type] = test;
  Assert['maybe' + type] = __annotator(function(expression, message) {
    
    if (expression != null) {
      test(expression, message);
    }
  }, {"module":"Assert","line":77,"column":27});
}, {"params":[[type, 'string', 'type'], [test, 'function', 'test']]});}__annotator(define, {"module":"Assert","line":75,"column":0,"name":"define"}, {"params":["string","function"]});

var Assert = {
  isInstanceOf: assertInstanceOf,
  isTrue      : assert,
  isTruthy    : __annotator(function(expression, /*?string*/ message) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    return assert(!!expression, message);
  }, {"params":[[message, '?string', 'message']],"returns":'boolean'});}, {"module":"Assert","line":88,"column":16}, {"params":["?string"],"returns":"boolean"}),
  type        : assertType,
  define      : __annotator(function(/*string*/ type, /*function*/ fn) {return __bodyWrapper(this, arguments, function() {
    type = type.substring(0, 1).toUpperCase() +
      type.substring(1).toLowerCase();

    define(type, __annotator(function(expression, message) {
      assert(fn(expression), message);
    }, {"module":"Assert","line":96,"column":17}));
  }, {"params":[[type, 'string', 'type'], [fn, 'function', 'fn']]});}, {"module":"Assert","line":92,"column":16}, {"params":["string","function"]})
};


ES(['Array',
 'Boolean',
 'Date',
 'Function',
 'Null',
 'Number',
 'Object',
 'Regexp',
 'String',
 'Undefined'], 'forEach', true,__annotator(function(/*string*/ type) {return __bodyWrapper(this, arguments, function() {
   define(type, ES(assertType, 'bind', true,null, type.toLowerCase()));
 }, {"params":[[type, 'string', 'type']]});}, {"module":"Assert","line":112,"column":22}, {"params":["string"]}));

module.exports = Assert;


}, {"module":"Assert","line":10,"column":42}),null);

__d("Type",["Assert"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Assert) {require.__markCompiled && require.__markCompiled();
   


function Type() {
  var mixins = this.__mixins;
  if (mixins) {
    for (var i = 0; i < mixins.length; i++) {
      mixins[i].apply(this, arguments);
    }
  }
}__annotator(Type, {"module":"Type","line":75,"column":0,"name":"Type"});


function instanceOf(/*function*/ constructor, which) /*boolean*/ {return __bodyWrapper(this, arguments, function() {

  
  if (which instanceof constructor) {
    return true;
  }

  
  if (which instanceof Type) {
    for (var i = 0; i < which.__mixins.length; i++) {
      if (which.__mixins[i] == constructor) {
        return true;
      }
    }
  }

  return false;
}, {"params":[[constructor, 'function', 'constructor']],"returns":'boolean'});}__annotator(instanceOf, {"module":"Type","line":94,"column":0,"name":"instanceOf"}, {"params":["function"],"returns":"boolean"});


function mixin(/*function*/ to, from) {return __bodyWrapper(this, arguments, function() {
  var prototype = to.prototype;

  if (!ES('Array', 'isArray', false,from)) {
    from = [from];
  }

  for (var i = 0; i < from.length; i++) {
    var mixinFrom = from[i];
    
    if(typeof mixinFrom == 'function') {
      prototype.__mixins.push(mixinFrom);
      mixinFrom = mixinFrom.prototype;
    }
    
    ES(ES('Object', 'keys', false,mixinFrom), 'forEach', true,__annotator(function(key) {
      prototype[key] = mixinFrom[key];
    }, {"module":"Type","line":136,"column":35}));
  }
}, {"params":[[to, 'function', 'to']]});}__annotator(mixin, {"module":"Type","line":121,"column":0,"name":"mixin"}, {"params":["function"]});


function extend(/*?function*/ from, /*?object*/ prototype, mixins)
    /*function*/ {return __bodyWrapper(this, arguments, function() {
  var constructor = prototype && prototype.hasOwnProperty('constructor')
    ? prototype.constructor
    : __annotator(function() {this.parent.apply(this, arguments);}, {"module":"Type","line":160,"column":6});

  Assert.isFunction(constructor);

  
  if (from && from.prototype instanceof Type === false) {
    throw new Error('parent type does not inherit from Type');
  }
  from = from || Type;

  
  function F() {}__annotator(F, {"module":"Type","line":171,"column":2,"name":"F"});
  F.prototype = from.prototype;
  constructor.prototype = new F();

  if (prototype) {
    ES('Object', 'assign', false,constructor.prototype, prototype);
  }

  
  constructor.prototype.constructor = constructor;
  
  constructor.parent = from;

  
  
  constructor.prototype.__mixins = from.prototype.__mixins
    ? Array.prototype.slice.call(from.prototype.__mixins)
    : [];

  
  if (mixins) {
    mixin(constructor, mixins);
  }

  
  constructor.prototype.parent = __annotator(function() {
    this.parent = from.prototype.parent;
    from.apply(this, arguments);
  }, {"module":"Type","line":196,"column":33});

  // Allow the new type to call this.parentCall('method'/*, args*/);
  constructor.prototype.parentCall = __annotator(function(/*string*/ method) {return __bodyWrapper(this, arguments, function() {
    return from.prototype[method].apply(this,
      Array.prototype.slice.call(arguments, 1));
  }, {"params":[[method, 'string', 'method']]});}, {"module":"Type","line":202,"column":37}, {"params":["string"]});

  constructor.extend = __annotator(function(/*?object*/ prototype, mixins) {return __bodyWrapper(this, arguments, function() {
    return extend(this, prototype, mixins);
  }, {"params":[[prototype, '?object', 'prototype']]});}, {"module":"Type","line":207,"column":23}, {"params":["?object"]});
  return constructor;
}, {"params":[[from, '?function', 'from'], [prototype, '?object', 'prototype']],"returns":'function'});}__annotator(extend, {"module":"Type","line":156,"column":0,"name":"extend"}, {"params":["?function","?object"],"returns":"function"});

ES('Object', 'assign', false,Type.prototype, {
  instanceOf: __annotator(function(/*function*/ type) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    return instanceOf(type, this);
  }, {"params":[[type, 'function', 'type']],"returns":'boolean'});}, {"module":"Type","line":214,"column":14}, {"params":["function"],"returns":"boolean"})
});

ES('Object', 'assign', false,Type, {
  extend: __annotator(function(prototype, mixins) /*function*/ {return __bodyWrapper(this, arguments, function() {
    return typeof prototype === 'function'
      ? extend.apply(null, arguments)
      : extend(null, prototype, mixins);
  }, {"returns":'function'});}, {"module":"Type","line":220,"column":10}, {"returns":"function"}),
  instanceOf: instanceOf
});

module.exports = Type;


}, {"module":"Type","line":68,"column":25}),null);


__d("ObservableMixin",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function ObservableMixin() {
  this.__observableEvents = {};
}__annotator(ObservableMixin, {"module":"ObservableMixin","line":22,"column":0,"name":"ObservableMixin"});

ObservableMixin.prototype = {

  
  inform: __annotator(function(/*string*/ what ) {return __bodyWrapper(this, arguments, function() {

    var args = Array.prototype.slice.call(arguments, 1);
    var list = Array.prototype.slice.call(this.getSubscribers(what));
    for (var i = 0; i < list.length; i++) {
      if (list[i] === null) continue;
      if (__DEV__) {
        list[i].apply(this, args);
      } else {
        try {
          list[i].apply(this, args);
        } catch(e) {
          // we want the loop to continue, but we don't want to swallow the
          
          setTimeout(__annotator(function() { throw e; }, {"module":"ObservableMixin","line":51,"column":21}), 0);
        }
      }
    }
    return this;
  }, {"params":[[what, 'string', 'what']]});}, {"module":"ObservableMixin","line":37,"column":10}, {"params":["string"]}),

  
  getSubscribers: __annotator(function(/*string*/ toWhat) /*array*/ {return __bodyWrapper(this, arguments, function() {

    return this.__observableEvents[toWhat] ||
      (this.__observableEvents[toWhat] = []);
  }, {"params":[[toWhat, 'string', 'toWhat']],"returns":'array'});}, {"module":"ObservableMixin","line":64,"column":18}, {"params":["string"],"returns":"array"}),

  
  clearSubscribers: __annotator(function(/*string*/ toWhat) {return __bodyWrapper(this, arguments, function() {

    if (toWhat) {
      this.__observableEvents[toWhat] = [];
    }
    return this;
  }, {"params":[[toWhat, 'string', 'toWhat']]});}, {"module":"ObservableMixin","line":75,"column":20}, {"params":["string"]}),

  
  clearAllSubscribers: __annotator(function() {
    this.__observableEvents = {};
    return this;
  }, {"module":"ObservableMixin","line":87,"column":23}),

  
  subscribe: __annotator(function(/*string*/ toWhat, /*function*/ withWhat) {return __bodyWrapper(this, arguments, function() {

    var list = this.getSubscribers(toWhat);
    list.push(withWhat);
    return this;
  }, {"params":[[toWhat, 'string', 'toWhat'], [withWhat, 'function', 'withWhat']]});}, {"module":"ObservableMixin","line":99,"column":13}, {"params":["string","function"]}),

  
  unsubscribe: __annotator(function(/*string*/ toWhat, /*function*/ withWhat) {return __bodyWrapper(this, arguments, function() {

    var list = this.getSubscribers(toWhat);
    for (var i = 0; i < list.length; i++) {
      if (list[i] === withWhat) {
        list.splice(i, 1);
        break;
      }
    }
    return this;
  }, {"params":[[toWhat, 'string', 'toWhat'], [withWhat, 'function', 'withWhat']]});}, {"module":"ObservableMixin","line":113,"column":15}, {"params":["string","function"]}),

  
  monitor: __annotator(function(/*string*/ toWhat, /*function*/ withWhat) {return __bodyWrapper(this, arguments, function() {
    if (!withWhat()) {
      var monitor = ES(__annotator(function(value) {
        if (withWhat.apply(withWhat, arguments)) {
          this.unsubscribe(toWhat, monitor);
        }
      }, {"module":"ObservableMixin","line":135,"column":20}), 'bind', true,this);
      this.subscribe(toWhat, monitor);
    }
    return this;
  }, {"params":[[toWhat, 'string', 'toWhat'], [withWhat, 'function', 'withWhat']]});}, {"module":"ObservableMixin","line":133,"column":11}, {"params":["string","function"]})

};


module.exports = ObservableMixin;


}, {"module":"ObservableMixin","line":21,"column":25}),null);


__d("sdk.Model",["Type","ObservableMixin"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Type,ObservableMixin) {require.__markCompiled && require.__markCompiled();
   
   

var Model = Type.extend({
  constructor: __annotator(function(/*object*/ properties) {return __bodyWrapper(this, arguments, function() {
    this.parent();

    
    var propContainer = {};
    var model = this;

    ES(ES('Object', 'keys', false,properties), 'forEach', true,__annotator(function(/*string*/ name) {return __bodyWrapper(this, arguments, function() {
      
      propContainer[name] = properties[name];

      
      model['set' + name] = __annotator(function(value) {
        if (value === propContainer[name]) {
          return this;
        }
        propContainer[name] = value;
        model.inform(name + '.change', value);
        return model;
      }, {"module":"sdk.Model","line":48,"column":28});

      
      model['get' + name] = __annotator(function() {
        return propContainer[name];
      }, {"module":"sdk.Model","line":58,"column":28});
    }, {"params":[[name, 'string', 'name']]});}, {"module":"sdk.Model","line":43,"column":36}, {"params":["string"]}));
  }, {"params":[[properties, 'object', 'properties']]});}, {"module":"sdk.Model","line":36,"column":15}, {"params":["object"]})
}, ObservableMixin);

module.exports = Model;


}, {"module":"sdk.Model","line":31,"column":43}),null);


__d("sdk.Runtime",["sdk.Model","JSSDKRuntimeConfig"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Model,RuntimeConfig) {require.__markCompiled && require.__markCompiled();
   
   


var ENVIRONMENTS = {
  UNKNOWN: 0,
  PAGETAB: 1,
  CANVAS: 2,
  PLATFORM: 4
};

var Runtime = new Model({
  AccessToken: '',
  ClientID: '',
  CookieUserID: '',
  Environment: ENVIRONMENTS.UNKNOWN,
  Initialized: false,
  IsVersioned: false,
  KidDirectedSite: (void 0),
  Locale: RuntimeConfig.locale,
  LoginStatus: (void 0),
  Revision: RuntimeConfig.revision,
  Rtl: RuntimeConfig.rtl,
  Scope: (void 0),
  Secure: (void 0),
  UseCookie: false,
  UserID: '',
  Version: (void 0)
});

ES('Object', 'assign', false,Runtime, {

  ENVIRONMENTS: ENVIRONMENTS,

  isEnvironment: __annotator(function(/*number*/ target) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    var environment = this.getEnvironment();
    return (target | environment) === environment;
  }, {"params":[[target, 'number', 'target']],"returns":'boolean'});}, {"module":"sdk.Runtime","line":45,"column":17}, {"params":["number"],"returns":"boolean"}),

  isCanvasEnvironment: __annotator(function() /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    return this.isEnvironment(ENVIRONMENTS.CANVAS) ||
      this.isEnvironment(ENVIRONMENTS.PAGETAB);
  }, {"returns":'boolean'});}, {"module":"sdk.Runtime","line":50,"column":23}, {"returns":"boolean"})
});

(__annotator(function() {
  var environment = /app_runner/.test(window.name)
    ? ENVIRONMENTS.PAGETAB
    : /iframe_canvas/.test(window.name)
      ? ENVIRONMENTS.CANVAS
      : ENVIRONMENTS.UNKNOWN;

  
  if ((environment | ENVIRONMENTS.PAGETAB) === environment) {
    environment = environment | ENVIRONMENTS.CANVAS;
  }
  Runtime.setEnvironment(environment);
}, {"module":"sdk.Runtime","line":56,"column":1}))();

module.exports = Runtime;


}, {"module":"sdk.Runtime","line":10,"column":53}),null);


__d("sdk.Cookie",["QueryString","sdk.Runtime"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,QueryString,Runtime) {require.__markCompiled && require.__markCompiled();
   
   



var domain = null;


function setRaw(/*string*/ prefix, /*string*/ val, /*number*/ ts) {return __bodyWrapper(this, arguments, function() {
  prefix = prefix + Runtime.getClientID();

  var useDomain = domain && domain !== '.';
  
  if (useDomain) {
    
    document.cookie = prefix + '=; expires=Wed, 04 Feb 2004 08:00:00 GMT;';
    
    document.cookie = prefix  + '=; expires=Wed, 04 Feb 2004 08:00:00 GMT;' +
      'domain=' + location.hostname + ';';
  }

  var expires = new Date(ts).toGMTString();
  document.cookie = prefix +  '=' + val +
    (val && ts === 0 ? '' : '; expires=' + expires) +
    '; path=/' +
    (useDomain ? '; domain=' + domain : '');
}, {"params":[[prefix, 'string', 'prefix'], [val, 'string', 'val'], [ts, 'number', 'ts']]});}__annotator(setRaw, {"module":"sdk.Cookie","line":28,"column":0,"name":"setRaw"}, {"params":["string","string","number"]});

function getRaw(/*string*/ prefix) /*?string*/ {return __bodyWrapper(this, arguments, function() {
  prefix = prefix + Runtime.getClientID();
  var regExp = new RegExp('\\b' + prefix + '=([^;]*)\\b');
  return regExp.test(document.cookie)
    ? RegExp.$1
    : null;
}, {"params":[[prefix, 'string', 'prefix']],"returns":'?string'});}__annotator(getRaw, {"module":"sdk.Cookie","line":48,"column":0,"name":"getRaw"}, {"params":["string"],"returns":"?string"});

var Cookie = {
  setDomain: __annotator(function(/*?string*/ val) {return __bodyWrapper(this, arguments, function() {
    domain = val;
    
    var meta  = QueryString.encode({
      base_domain: domain && domain !== '.' ? domain : ''
    });
    var expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1);
    setRaw('fbm_', meta, expiration.getTime());
  }, {"params":[[val, '?string', 'val']]});}, {"module":"sdk.Cookie","line":57,"column":13}, {"params":["?string"]}),

  getDomain: __annotator(function() /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return domain;
  }, {"returns":'?string'});}, {"module":"sdk.Cookie","line":68,"column":13}, {"returns":"?string"}),

  
  loadMeta: __annotator(function() /*?object*/ {return __bodyWrapper(this, arguments, function() {
    var cookie = getRaw('fbm_');
    if (cookie) {
      // url encoded session stored as "sub-cookies"
      var meta = QueryString.decode(cookie);
      if (!domain) {
        
        domain = meta.base_domain;
      }
      return meta;
    }
  }, {"returns":'?object'});}, {"module":"sdk.Cookie","line":77,"column":12}, {"returns":"?object"}),

  
  loadSignedRequest: __annotator(function() /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return getRaw('fbsr_');
  }, {"returns":'?string'});}, {"module":"sdk.Cookie","line":95,"column":21}, {"returns":"?string"}),

  
  setSignedRequestCookie: __annotator(function(/*string*/ signedRequest,
      /*number*/ expiration) {return __bodyWrapper(this, arguments, function() {
    if (!signedRequest) {
      throw new Error('Value passed to Cookie.setSignedRequestCookie ' +
                      'was empty.');
    }
    setRaw('fbsr_', signedRequest, expiration);
  }, {"params":[[signedRequest, 'string', 'signedRequest'], [expiration, 'number', 'expiration']]});}, {"module":"sdk.Cookie","line":108,"column":26}, {"params":["string","number"]}),

  
  clearSignedRequestCookie: __annotator(function() {
    setRaw('fbsr_', '', 0);
  }, {"module":"sdk.Cookie","line":121,"column":28}),

  setRaw: setRaw
};

module.exports = Cookie;


}, {"module":"sdk.Cookie","line":13,"column":47}),null);


__d("wrapFunction",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var wrappers = {};
function wrapFunction(/*function*/ fn, /*?string*/ type, /*?string*/ source)
    /*function*/ {return __bodyWrapper(this, arguments, function() {
  type = type || 'default';

  return __annotator(function() {
    var callee = type in wrappers
      ? wrappers[type](fn, source)
      : fn;

    return callee.apply(this, arguments);
  }, {"module":"wrapFunction","line":34,"column":9});
}, {"params":[[fn, 'function', 'fn'], [type, '?string', 'type'], [source, '?string', 'source']],"returns":'function'});}__annotator(wrapFunction, {"module":"wrapFunction","line":30,"column":0,"name":"wrapFunction"}, {"params":["function","?string","?string"],"returns":"function"});

wrapFunction.setWrapper = __annotator(function(/*function*/ fn, /*?string*/ type) {return __bodyWrapper(this, arguments, function() {
  type = type || 'default';
  wrappers[type] = fn;
}, {"params":[[fn, 'function', 'fn'], [type, '?string', 'type']]});}, {"module":"wrapFunction","line":43,"column":26}, {"params":["function","?string"]});

module.exports = wrapFunction;


}, {"module":"wrapFunction","line":28,"column":22}),null);


__d("DOMEventListener",["wrapFunction"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,wrapFunction) {require.__markCompiled && require.__markCompiled();
   

var add, remove;

if (window.addEventListener) {

  
  add = __annotator(function(target, /*string*/ name, /*function*/ listener) {return __bodyWrapper(this, arguments, function() {
    listener.wrapper =
      wrapFunction(listener, 'entry', 'DOMEventListener.add ' + name);
    target.addEventListener(name, listener.wrapper, false);
  }, {"params":[[name, 'string', 'name'], [listener, 'function', 'listener']]});}, {"module":"DOMEventListener","line":23,"column":8}, {"params":["string","function"]});
  remove = __annotator(function(target, /*string*/ name, /*function*/ listener) {return __bodyWrapper(this, arguments, function() {
    target.removeEventListener(name, listener.wrapper, false);
  }, {"params":[[name, 'string', 'name'], [listener, 'function', 'listener']]});}, {"module":"DOMEventListener","line":28,"column":11}, {"params":["string","function"]});

} else if (window.attachEvent) {

  
  add = __annotator(function(target, /*string*/ name, /*function*/ listener) {return __bodyWrapper(this, arguments, function() {
    listener.wrapper =
      wrapFunction(listener, 'entry', 'DOMEventListener.add ' + name);
    target.attachEvent('on' + name, listener.wrapper);
  }, {"params":[[name, 'string', 'name'], [listener, 'function', 'listener']]});}, {"module":"DOMEventListener","line":35,"column":8}, {"params":["string","function"]});
  remove = __annotator(function(target, /*string*/ name, /*function*/ listener) {return __bodyWrapper(this, arguments, function() {
    target.detachEvent('on' + name, listener.wrapper);
  }, {"params":[[name, 'string', 'name'], [listener, 'function', 'listener']]});}, {"module":"DOMEventListener","line":40,"column":11}, {"params":["string","function"]});

} else {
  remove = add = __annotator(function()  {}, {"module":"DOMEventListener","line":45,"column":17});
}

var DOMEventListener = {

  
  add: __annotator(function(target, /*string*/ name, /*function*/ listener) {return __bodyWrapper(this, arguments, function() {
    
    
    add(target, name, listener);
    return {
      
      
      // someone is hanging on to this 'event' object.
      remove: __annotator(function() {
        remove(target, name, listener);
        target = null;
      }, {"module":"DOMEventListener","line":68,"column":14})
    };
  }, {"params":[[name, 'string', 'name'], [listener, 'function', 'listener']]});}, {"module":"DOMEventListener","line":60,"column":7}, {"params":["string","function"]}),

  
  remove: remove

};
module.exports = DOMEventListener;


}, {"module":"DOMEventListener","line":15,"column":40}),null);


__d("sdk.UA",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var uas = navigator.userAgent;


var devices = {
  iphone: /\b(iPhone|iP[ao]d)/.test(uas),
  ipad: /\b(iP[ao]d)/.test(uas),
  android: /Android/i.test(uas),
  nativeApp: /FBAN\/\w+;/i.test(uas)
};
var mobile = /Mobile/i.test(uas);


var versions = {
  ie: '',
  firefox: '',
  chrome: '',
  webkit: '',
  osx: ''
};
var agent =
  /(?:MSIE.(\d+\.\d+))|(?:(?:Firefox|GranParadiso|Iceweasel).(\d+\.\d+))|(?:AppleWebKit.(\d+(?:\.\d+)?))|(?:Trident\/\d+\.\d+.*rv:(\d+\.\d+))/
    .exec(uas);
if (agent) {
  versions.ie = agent[1]
    ? parseFloat(agent[1])
    : agent[4]
      ? parseFloat(agent[4])
      : '';

  versions.firefox = agent[2] || '';
  versions.webkit  = agent[3] || '';
  if (agent[3]) {
    
    // match 'safari' only since 'AppleWebKit' appears before 'Chrome' in
    
    var chromeAgent = /(?:Chrome\/(\d+\.\d+))/.exec(uas);
    versions.chrome = chromeAgent ? chromeAgent[1] : '';
  }
}


var mac = /(?:Mac OS X (\d+(?:[._]\d+)?))/.exec(uas);
if (mac) {
  versions.osx = mac[1];
}

function getVersionParts(/*string*/ version) /*array*/ {return __bodyWrapper(this, arguments, function() {
  return ES(version.split('.'), 'map', true,__annotator(function(v)  {return parseFloat(v);}, {"module":"sdk.UA","line":92,"column":32}));
}, {"params":[[version, 'string', 'version']],"returns":'array'});}__annotator(getVersionParts, {"module":"sdk.UA","line":91,"column":0,"name":"getVersionParts"}, {"params":["string"],"returns":"array"});

var UA = {};

ES(ES('Object', 'keys', false,versions), 'map', true,__annotator(function(key)  {
  
  UA[key] = __annotator(function()  {return __bodyWrapper(this, arguments, function() {return parseFloat(versions[key]);}, {"returns":'number'});}, {"module":"sdk.UA","line":101,"column":12}, {"returns":"number"});
  
  UA[key].getVersionParts = __annotator(function()  {return __bodyWrapper(this, arguments, function() {return getVersionParts(versions[key]);}, {"returns":'array'});}, {"module":"sdk.UA","line":105,"column":28}, {"returns":"array"});
}, {"module":"sdk.UA","line":97,"column":26}));

ES(ES('Object', 'keys', false,devices), 'map', true,__annotator(function(key)  {
  
  UA[key] = __annotator(function()  {return __bodyWrapper(this, arguments, function() {return devices[key];}, {"returns":'boolean'});}, {"module":"sdk.UA","line":112,"column":12}, {"returns":"boolean"});
}, {"module":"sdk.UA","line":108,"column":25}));


UA.mobile = __annotator(function()  {return __bodyWrapper(this, arguments, function() {return devices.iphone || devices.ipad || devices.android || mobile;}, {"returns":'boolean'});}, {"module":"sdk.UA","line":118,"column":12}, {"returns":"boolean"});


module.exports = UA;


}, {"module":"sdk.UA","line":44,"column":16}),null);


__d("getBlankIframeSrc",["sdk.UA"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,UA) {require.__markCompiled && require.__markCompiled();
   

function getBlankIframeSrc()   /*string*/       {
  return UA.ie() < 10 ? 'javascript:false' : 'about:blank';
}__annotator(getBlankIframeSrc, {"module":"getBlankIframeSrc","line":16,"column":0,"name":"getBlankIframeSrc"});

module.exports = getBlankIframeSrc;


}, {"module":"getBlankIframeSrc","line":13,"column":35}),null);


__d("guid",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
/*jshint bitwise: false*/

function guid() {
  return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
}__annotator(guid, {"module":"guid","line":27,"column":0,"name":"guid"});

module.exports = guid;


}, {"module":"guid","line":24,"column":14}),null);


__d("UserAgent_DEPRECATED",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();


var _populated = false;


var _ie, _firefox, _opera, _webkit, _chrome;


var _ie_real_version;


var _osx, _windows, _linux, _android;


var _win64;


var _iphone, _ipad, _native;

var _mobile;

function _populate() {
  if (_populated) {
    return;
  }

  _populated = true;

  // To work around buggy JS libraries that can't handle multi-digit
  // version numbers, Opera 10's user agent string claims it's Opera
  
  
  
  var uas = navigator.userAgent;
  var agent = /(?:MSIE.(\d+\.\d+))|(?:(?:Firefox|GranParadiso|Iceweasel).(\d+\.\d+))|(?:Opera(?:.+Version.|.)(\d+\.\d+))|(?:AppleWebKit.(\d+(?:\.\d+)?))|(?:Trident\/\d+\.\d+.*rv:(\d+\.\d+))/.exec(uas);
  var os    = /(Mac OS X)|(Windows)|(Linux)/.exec(uas);

  _iphone = /\b(iPhone|iP[ao]d)/.exec(uas);
  _ipad = /\b(iP[ao]d)/.exec(uas);
  _android = /Android/i.exec(uas);
  _native = /FBAN\/\w+;/i.exec(uas);
  _mobile = /Mobile/i.exec(uas);

  
  // for 'Win64; x64'.  But MSDN then reveals that you can actually be coming
  
  // as in indicator of whether you're in 64-bit IE.  32-bit IE on 64-bit
  // Windows will send 'WOW64' instead.
  _win64 = !!(/Win64/.exec(uas));

  if (agent) {
    _ie = agent[1] ? parseFloat(agent[1]) : (
          agent[5] ? parseFloat(agent[5]) : NaN);
    
    if (_ie && document && document.documentMode) {
      _ie = document.documentMode;
    }
    // grab the "true" ie version from the trident token if available
    var trident = /(?:Trident\/(\d+.\d+))/.exec(uas);
    _ie_real_version = trident ? parseFloat(trident[1]) + 4 : _ie;

    _firefox = agent[2] ? parseFloat(agent[2]) : NaN;
    _opera   = agent[3] ? parseFloat(agent[3]) : NaN;
    _webkit  = agent[4] ? parseFloat(agent[4]) : NaN;
    if (_webkit) {
      
      // match 'safari' only since 'AppleWebKit' appears before 'Chrome' in
      
      agent = /(?:Chrome\/(\d+\.\d+))/.exec(uas);
      _chrome = agent && agent[1] ? parseFloat(agent[1]) : NaN;
    } else {
      _chrome = NaN;
    }
  } else {
    _ie = _firefox = _opera = _chrome = _webkit = NaN;
  }

  if (os) {
    if (os[1]) {
      
      
      
      
      
      var ver = /(?:Mac OS X (\d+(?:[._]\d+)?))/.exec(uas);

      _osx = ver ? parseFloat(ver[1].replace('_', '.')) : true;
    } else {
      _osx = false;
    }
    _windows = !!os[2];
    _linux   = !!os[3];
  } else {
    _osx = _windows = _linux = false;
  }
}__annotator(_populate, {"module":"UserAgent_DEPRECATED","line":79,"column":0,"name":"_populate"});

var UserAgent_DEPRECATED = {

  
  ie: __annotator(function() {
    return _populate() || _ie;
  }, {"module":"UserAgent_DEPRECATED","line":163,"column":6}),

  
  ieCompatibilityMode: __annotator(function() {
    return _populate() || (_ie_real_version > _ie);
  }, {"module":"UserAgent_DEPRECATED","line":173,"column":23}),


  
  ie64: __annotator(function() {
    return UserAgent_DEPRECATED.ie() && _win64;
  }, {"module":"UserAgent_DEPRECATED","line":183,"column":8}),

  
  firefox: __annotator(function() {
    return _populate() || _firefox;
  }, {"module":"UserAgent_DEPRECATED","line":193,"column":11}),


  
  opera: __annotator(function() {
    return _populate() || _opera;
  }, {"module":"UserAgent_DEPRECATED","line":204,"column":9}),


  
  webkit: __annotator(function() {
    return _populate() || _webkit;
  }, {"module":"UserAgent_DEPRECATED","line":215,"column":10}),

  
  safari: __annotator(function() {
    return UserAgent_DEPRECATED.webkit();
  }, {"module":"UserAgent_DEPRECATED","line":223,"column":10}),

  
  chrome : __annotator(function() {
    return _populate() || _chrome;
  }, {"module":"UserAgent_DEPRECATED","line":233,"column":11}),


  
  windows: __annotator(function() {
    return _populate() || _windows;
  }, {"module":"UserAgent_DEPRECATED","line":243,"column":11}),


  
  osx: __annotator(function() {
    return _populate() || _osx;
  }, {"module":"UserAgent_DEPRECATED","line":254,"column":7}),

  
  linux: __annotator(function() {
    return _populate() || _linux;
  }, {"module":"UserAgent_DEPRECATED","line":263,"column":9}),

  
  iphone: __annotator(function() {
    return _populate() || _iphone;
  }, {"module":"UserAgent_DEPRECATED","line":273,"column":10}),

  mobile: __annotator(function() {
    return _populate() || (_iphone || _ipad || _android || _mobile);
  }, {"module":"UserAgent_DEPRECATED","line":277,"column":10}),

  nativeApp: __annotator(function() {
    
    return _populate() || _native;
  }, {"module":"UserAgent_DEPRECATED","line":281,"column":13}),

  android: __annotator(function() {
    return _populate() || _android;
  }, {"module":"UserAgent_DEPRECATED","line":286,"column":11}),

  ipad: __annotator(function() {
    return _populate() || _ipad;
  }, {"module":"UserAgent_DEPRECATED","line":290,"column":8})
};

module.exports = UserAgent_DEPRECATED;


}, {"module":"UserAgent_DEPRECATED","line":19,"column":30}),null);


__d("hasNamePropertyBug",["guid","UserAgent_DEPRECATED"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,guid,UserAgent_DEPRECATED) {require.__markCompiled && require.__markCompiled();
   
   

var hasBug = UserAgent_DEPRECATED.ie() ? (void 0) : false;




function test() /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    var form = document.createElement("form"),
        input = form.appendChild(document.createElement("input"));
    input.name = guid();
    hasBug = input !== form.elements[input.name];
    form = input = null;
    return hasBug;
}, {"returns":'boolean'});}__annotator(test, {"module":"hasNamePropertyBug","line":16,"column":0,"name":"test"}, {"returns":"boolean"});

function hasNamePropertyBug() /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  return typeof hasBug === 'undefined'
    ? test()
    : hasBug;
}, {"returns":'boolean'});}__annotator(hasNamePropertyBug, {"module":"hasNamePropertyBug","line":25,"column":0,"name":"hasNamePropertyBug"}, {"returns":"boolean"});

module.exports = hasNamePropertyBug;


}, {"module":"hasNamePropertyBug","line":7,"column":57}),null);


__d("sdk.createIframe",["DOMEventListener","getBlankIframeSrc","guid","hasNamePropertyBug"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,DOMEventListener,getBlankIframeSrc,guid,hasNamePropertyBug) {require.__markCompiled && require.__markCompiled();
   

   
   
   

function createIframe(/*object*/ opts) /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {
  opts = ES('Object', 'assign', false,{}, opts);
  var frame;
  var name = opts.name || guid();
  var root = opts.root;
  var style = opts.style ||  { border: 'none' };
  var src = opts.url;
  var onLoad = opts.onload;
  var onError = opts.onerror;

  if (hasNamePropertyBug()) {
    frame = document.createElement('<iframe name="' + name + '"/>');
  } else {
    frame = document.createElement("iframe");
    frame.name = name;
  }

  // delete attributes that we're setting directly
  delete opts.style;
  delete opts.name;
  delete opts.url;
  delete opts.root;
  delete opts.onload;
  delete opts.onerror;

  var attributes =  ES('Object', 'assign', false,{
    frameBorder: 0,
    allowTransparency: true,
    scrolling: 'no'
  }, opts);


  if (attributes.width) {
    frame.width = attributes.width + 'px';
  }
  if (attributes.height) {
    frame.height = attributes.height + 'px';
  }

  delete attributes.height;
  delete attributes.width;

  for (var key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      frame.setAttribute(key, attributes[key]);
    }
  }

  ES('Object', 'assign', false,frame.style, style);

  
  
  frame.src = getBlankIframeSrc();
  root.appendChild(frame);
  if (onLoad) {
    var onLoadListener = DOMEventListener.add(frame, 'load', __annotator(function()  {
      onLoadListener.remove();
      onLoad();
    }, {"module":"sdk.createIframe","line":71,"column":61}));
  }

  if (onError) {
    var onErrorListener = DOMEventListener.add(frame, 'error', __annotator(function()  {
      onErrorListener.remove();
      onError();
    }, {"module":"sdk.createIframe","line":78,"column":63}));
  }

  
  // "javascript:false" to work around the IE issue mentioned above)
  frame.src = src;
  return frame;
}, {"params":[[opts, 'object', 'opts']],"returns":'HTMLElement'});}__annotator(createIframe, {"module":"sdk.createIframe","line":16,"column":0,"name":"createIframe"}, {"params":["object"],"returns":"DOMElement"});

module.exports = createIframe;


}, {"module":"sdk.createIframe","line":9,"column":92}),null);

__d("DOMWrapper",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
/*global self:true*/
var rootElement,
    windowRef;


// `obj || default` pattern to account for 'resetting'.
var DOMWrapper = {
  setRoot: __annotator(function(/*?DOMElement*/ root) {return __bodyWrapper(this, arguments, function() {
    rootElement = root;
  }, {"params":[[root, '?HTMLElement', 'root']]});}, {"module":"DOMWrapper","line":20,"column":11}, {"params":["?DOMElement"]}),
  getRoot: __annotator(function() /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {
    return rootElement || document.body;
  }, {"returns":'HTMLElement'});}, {"module":"DOMWrapper","line":23,"column":11}, {"returns":"DOMElement"}),
  setWindow: __annotator(function(win) {
    windowRef = win;
  }, {"module":"DOMWrapper","line":26,"column":13}),
  getWindow: __annotator(function() {
    return windowRef || self;
  }, {"module":"DOMWrapper","line":29,"column":13})
};

module.exports = DOMWrapper;


}, {"module":"DOMWrapper","line":12,"column":23}),null);


__d("eprintf",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();


var eprintf = __annotator(function(errorMessage) {
  var args = ES(Array.prototype.slice.call(arguments), 'map', true,__annotator(function(arg) {
    return String(arg);
  }, {"module":"eprintf","line":33,"column":55}));
  var expectedLength = errorMessage.split('%s').length - 1;

  if (expectedLength !== args.length - 1) {
    
    return eprintf('eprintf args number mismatch: %s', ES('JSON', 'stringify', false,args));
  }

  var index = 1;
  return errorMessage.replace(/%s/g, __annotator(function(whole) {
    return String(args[index++]);
  }, {"module":"eprintf","line":44,"column":37}));
}, {"module":"eprintf","line":32,"column":14});

module.exports = eprintf;


}, {"module":"eprintf","line":21,"column":17}),null);


__d("ex",["eprintf"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,eprintf) {require.__markCompiled && require.__markCompiled();
   



var ex = __annotator(function() {for (var args=[],$__0=0,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
  args = ES(args, 'map', true,__annotator(function(arg)  {return String(arg);}, {"module":"ex","line":39,"column":18}));
  if (args[0].split('%s').length !== args.length) {
    
    return ex('ex args number mismatch: %s', ES('JSON', 'stringify', false,args));
  }

  if (__DEV__) {
    return eprintf.apply(null, args);
  } else {
    return ex._prefix + ES('JSON', 'stringify', false,args) + ex._suffix;
  }
}, {"module":"ex","line":38,"column":9});


ex._prefix = '<![EX[';
ex._suffix = ']]>';

module.exports = ex;


}, {"module":"ex","line":21,"column":21}),null);


__d("invariant",["ex","sprintf"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ex,sprintf) {require.__markCompiled && require.__markCompiled();
"use strict";

   
   

var printingFunction = ex;
if (__DEV__) {
  printingFunction = sprintf; 
}



var invariant = __annotator(function(condition, format) {
  if (__DEV__) {
    if (format === (void 0)) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === (void 0)) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var messageWithParams = ['Invariant Violation: ' + format];
      for (var i = 2, l = arguments.length; i < l; i++) {
        messageWithParams.push(arguments[i]);
      }
      error = new Error(printingFunction.apply(null, messageWithParams));
      error.messageWithParams = messageWithParams;
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}, {"module":"invariant","line":53,"column":16});

module.exports = invariant;


}, {"module":"invariant","line":31,"column":33}),null);


__d("sdk.feature",["JSSDKConfig","invariant"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,SDKConfig,invariant) {require.__markCompiled && require.__markCompiled();
   

   


function feature(/*string*/ name        , defaultValue       )        {return __bodyWrapper(this, arguments, function() {
  invariant(
    arguments.length >= 2,
    'Default value is required'
  );
  if (SDKConfig.features && name in SDKConfig.features) {
    var value = SDKConfig.features[name];
    if (typeof value === 'object' && typeof value.rate === 'number') {
      if (value.rate && Math.random() * 100 <= value.rate) {
        return value.value || true;
      } else {
        return value.value ? null : false;
      }
    } else {
      return value;
    }
  }
  return defaultValue;
}, {"params":[[name, 'string', 'name']]});}__annotator(feature, {"module":"sdk.feature","line":20,"column":0,"name":"feature"}, {"params":["string"]});

module.exports = feature;


}, {"module":"sdk.feature","line":8,"column":46}),null);


__d("sdk.getContextType",["sdk.Runtime","sdk.UA"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Runtime,UA) {require.__markCompiled && require.__markCompiled();
   
   

function getContextType() /*number*/ {return __bodyWrapper(this, arguments, function() {
  
  
  
  
  
  
  if (UA.nativeApp()) {
    return 3;
  }
  if (UA.mobile()) {
    return 2;
  }
  if (Runtime.isEnvironment(Runtime.ENVIRONMENTS.CANVAS)) {
    return 5;
  }
  return 1;
}, {"returns":'number'});}__annotator(getContextType, {"module":"sdk.getContextType","line":11,"column":0,"name":"getContextType"}, {"returns":"number"});

module.exports = getContextType;


}, {"module":"sdk.getContextType","line":7,"column":50}),null);


__d("Log",["sprintf"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,sprintf) {require.__markCompiled && require.__markCompiled();
   

var Level = {
  DEBUG    : 3,
  INFO     : 2,
  WARNING  : 1,
  ERROR    : 0
};

function log(/*string*/ name, /*number*/ level ) {return __bodyWrapper(this, arguments, function() {
  var args = Array.prototype.slice.call(arguments, 2);
  var msg = sprintf.apply(null, args);
  var console = window.console;
  if (console && Log.level >= level) {
    console[name in console ? name : 'log'](msg);
  }
}, {"params":[[name, 'string', 'name'], [level, 'number', 'level']]});}__annotator(log, {"module":"Log","line":38,"column":0,"name":"log"}, {"params":["string","number"]});

var Log = {
  
  level: __DEV__ ? 3 : -1,

  
  Level: Level,

  
  debug : ES(log, 'bind', true,null, 'debug', Level.DEBUG),
  info  : ES(log, 'bind', true,null, 'info',  Level.INFO),
  warn  : ES(log, 'bind', true,null, 'warn',  Level.WARNING),
  error : ES(log, 'bind', true,null, 'error', Level.ERROR)
};
module.exports = Log;



}, {"module":"Log","line":28,"column":22}),null);

__d("sdk.domReady",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var queue;
var domIsReady = "readyState" in document
  ? /loaded|complete/.test(document.readyState)
  
  
  
  
  
  : !!document.body;

function flush() {
  if (!queue) {
    return;
  }

  var fn;
  while (fn = queue.shift()) {
    fn();
  }
  queue = null;
}__annotator(flush, {"module":"sdk.domReady","line":18,"column":0,"name":"flush"});

function domReady(/*function*/ fn) {return __bodyWrapper(this, arguments, function() {
  if (queue) {
    queue.push(fn);
    return;
  } else {
    fn();
  }
}, {"params":[[fn, 'function', 'fn']]});}__annotator(domReady, {"module":"sdk.domReady","line":30,"column":0,"name":"domReady"}, {"params":["function"]});

if(!domIsReady) {
  queue = [];
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', flush, false);
    window.addEventListener('load', flush, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', flush);
    window.attachEvent('onload', flush);
  }

  
  
  if (document.documentElement.doScroll && window == window.top) {
    var test = __annotator(function() {
      try {
        
        
        document.documentElement.doScroll('left');
      } catch(error) {
        setTimeout(test, 0);
        return;
      }
      flush();
    }, {"module":"sdk.domReady","line":52,"column":15});
    test();
  }
}

module.exports = domReady;


}, {"module":"sdk.domReady","line":7,"column":25}),3);


__d("sdk.Content",["Log","sdk.UA","sdk.domReady"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Log,UA,domReady) {require.__markCompiled && require.__markCompiled();
   
   

   

var visibleRoot;
var hiddenRoot;

var Content = {

  
  append: __annotator(function(/*DOMElement|string*/ content, /*?DOMElement*/ root)
      /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {

    
    if (!root) {
      if (!visibleRoot) {
        visibleRoot = root = document.getElementById('fb-root');
        if (!root) {
          Log.warn('The "fb-root" div has not been created, auto-creating');
          
          visibleRoot = root = document.createElement('div');
          root.id = 'fb-root';
          
          // that the body has loaded to avoid potential "operation aborted"
          
          
          
          
          if (UA.ie() || !document.body) {
            domReady(__annotator(function() {
              document.body.appendChild(root);
            }, {"module":"sdk.Content","line":44,"column":21}));
          } else {
            document.body.appendChild(root);
          }
        }
        root.className += ' fb_reset';
      } else {
        root = visibleRoot;
      }
    }

    if (typeof content == 'string') {
      var div = document.createElement('div');
      root.appendChild(div).innerHTML = content;
      return div;
    } else {
      return root.appendChild(content);
    }
  }, {"params":[[content, 'HTMLElement|string', 'content'], [root, '?HTMLElement', 'root']],"returns":'HTMLElement'});}, {"module":"sdk.Content","line":25,"column":10}, {"params":["DOMElement|string","?DOMElement"],"returns":"DOMElement"}),

  
  appendHidden: __annotator(function(/*DOMElement|string*/ content) /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {
    if (!hiddenRoot) {
      var
        hiddenRoot = document.createElement('div'),
        style      = hiddenRoot.style;
      style.position = 'absolute';
      style.top      = '-10000px';
      style.width    = style.height = 0;
      hiddenRoot = Content.append(hiddenRoot);
    }

    return Content.append(content, hiddenRoot);
  }, {"params":[[content, 'HTMLElement|string', 'content']],"returns":'HTMLElement'});}, {"module":"sdk.Content","line":72,"column":16}, {"params":["DOMElement|string"],"returns":"DOMElement"}),

  
  submitToTarget: __annotator(function(/*object*/ opts, /*?boolean*/ get) {return __bodyWrapper(this, arguments, function() {
    var form = document.createElement('form');
    form.action = opts.url;
    form.target = opts.target;
    form.method = (get) ? 'GET' : 'POST';
    Content.appendHidden(form);

    for (var key in opts.params) {
      if (opts.params.hasOwnProperty(key)) {
        var val = opts.params[key];
        if (val !== null && val !== (void 0)) {
          var input = document.createElement('input');
          input.name = key;
          input.value = val;
          form.appendChild(input);
        }
      }
    }

    form.submit();
    form.parentNode.removeChild(form);
  }, {"params":[[opts, 'object', 'opts'], [get, '?boolean', 'get']]});}, {"module":"sdk.Content","line":98,"column":18}, {"params":["object","?boolean"]})
};

module.exports = Content;


}, {"module":"sdk.Content","line":7,"column":50}),null);


__d("Miny",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var MAGIC = 'Miny1';


var _indexMap = {encode: [], decode: {}};
var LO = 'wxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'.split('');
function getIndexMap(length) {
  for (var i = _indexMap.encode.length; i < length; i++) {
    
    var s = i.toString(32).split('');
    s[s.length - 1] = LO[parseInt(s[s.length - 1], 32)];
    s = s.join('');

    _indexMap.encode[i] = s;
    _indexMap.decode[s] = i;
  }

  return _indexMap;
}__annotator(getIndexMap, {"module":"Miny","line":16,"column":0,"name":"getIndexMap"});


function encode(s) {
  if (/^$|[~\\]|__proto__/.test(s)) return s;

  
  var parts = s.match(/\w+|\W+/g);

  // Create dictionary we'll use to encode, but initialize it to part counts
  
  var dict = {};
  for (var i = 0; i < parts.length; i++) {
    dict[parts[i]] = (dict[parts[i]] || 0) + 1;
  }

  // Create array of part strings we'll use to decode, sort by frequency so
  
  var byCount = ES('Object', 'keys', false,dict);
  byCount.sort(__annotator(function(a,b) {
    return dict[a] < dict[b] ? 1 : (dict[b] < dict[a] ? -1 : 0);
  }, {"module":"Miny","line":47,"column":15}));

  
  var encodeMap = getIndexMap(byCount.length).encode;
  for (i = 0; i < byCount.length; i++) {
    dict[byCount[i]] = encodeMap[i];
  }

  
  var codes = [];
  for (i = 0; i < parts.length; i++) {
    codes[i] = dict[parts[i]];
  }

  return [MAGIC, byCount.length].
         concat(byCount).
         concat(codes.join('')).
         join('~');
}__annotator(encode, {"module":"Miny","line":31,"column":0,"name":"encode"});


function decode(s) {
  var fields = s.split('~');

  if (fields.shift() != MAGIC) {
    
    return s;
  }
  var nKeys = parseInt(fields.shift(), 10);
  var codes = fields.pop();
  codes = codes.match(/[0-9a-v]*[\-w-zA-Z_]/g);

  var dict = fields;

  var decodeMap = getIndexMap(nKeys).decode;
  var parts = [];
  for (var i = 0; i < codes.length; i++) {
    parts[i] = dict[decodeMap[codes[i]]];
  }

  return parts.join('');
}__annotator(decode, {"module":"Miny","line":70,"column":0,"name":"decode"});

var Miny = {
  encode: encode,
  decode: decode
};

module.exports = Miny;


}, {"module":"Miny","line":10,"column":14}),null);


__d("UrlMap",["UrlMapConfig"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,UrlMapConfig) {require.__markCompiled && require.__markCompiled();
   

var UrlMap = {
  
  resolve: __annotator(function(/*string*/ key, /*?boolean*/ https) /*string*/ {return __bodyWrapper(this, arguments, function() {
    var protocol = typeof https == 'undefined'
      ? location.protocol.replace(':', '')
      : https ? 'https' : 'http';

    
    if (key in UrlMapConfig) {
      return protocol + '://' + UrlMapConfig[key];
    }

    
    if (typeof https == 'undefined' && key + '_' + protocol in UrlMapConfig) {
      return protocol + '://' + UrlMapConfig[key + '_' + protocol];
    }

    
    if (https !== true && key + '_http' in UrlMapConfig) {
      return 'http://' + UrlMapConfig[key + '_http'];
    }

    
    if (https !== false && key + '_https' in UrlMapConfig) {
      return 'https://' + UrlMapConfig[key + '_https'];
    }
  }, {"params":[[key, 'string', 'key'], [https, '?boolean', 'https']],"returns":'string'});}, {"module":"UrlMap","line":28,"column":11}, {"params":["string","?boolean"],"returns":"string"})
};

module.exports = UrlMap;


}, {"module":"UrlMap","line":16,"column":30}),null);


__d("dotAccess",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function dotAccess(head, path, create) {
  var stack = path.split('.');
  do {
    var key = stack.shift();
    head = head[key] || create && (head[key] = {});
  } while(stack.length && head);
  return head;
}__annotator(dotAccess, {"module":"dotAccess","line":33,"column":0,"name":"dotAccess"});

module.exports = dotAccess;


}, {"module":"dotAccess","line":32,"column":19}),null);


__d("GlobalCallback",["DOMWrapper","dotAccess","guid","wrapFunction"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,DOMWrapper,dotAccess,guid,wrapFunction) {require.__markCompiled && require.__markCompiled();
   
   
   
   

// window is the same as the 'global' object in the browser, but the variable
// 'global' might be shadowed.
var rootObject;
var callbackPrefix;

var GlobalCallback = {

  setPrefix: __annotator(function(/*string*/ prefix) {return __bodyWrapper(this, arguments, function() {
    rootObject = dotAccess(DOMWrapper.getWindow(), prefix, true);
    callbackPrefix = prefix;
  }, {"params":[[prefix, 'string', 'prefix']]});}, {"module":"GlobalCallback","line":37,"column":13}, {"params":["string"]}),

  create: __annotator(function(/*function*/ fn, /*?string*/ description) /*string*/ {return __bodyWrapper(this, arguments, function() {
    if (!rootObject) {
      
      
      this.setPrefix('__globalCallbacks');
    }
    var id = guid();
    rootObject[id] = wrapFunction(fn, 'entry', description || 'GlobalCallback');

    return callbackPrefix + '.' + id;
  }, {"params":[[fn, 'function', 'fn'], [description, '?string', 'description']],"returns":'string'});}, {"module":"GlobalCallback","line":42,"column":10}, {"params":["function","?string"],"returns":"string"}),

  remove: __annotator(function(/*string*/ name) {return __bodyWrapper(this, arguments, function() {
    var id = name.substring(callbackPrefix.length + 1);
    delete rootObject[id];
  }, {"params":[[name, 'string', 'name']]});}, {"module":"GlobalCallback","line":54,"column":10}, {"params":["string"]})

};

module.exports = GlobalCallback;


}, {"module":"GlobalCallback","line":24,"column":70}),null);


__d("insertIframe",["GlobalCallback","getBlankIframeSrc","guid"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,GlobalCallback,getBlankIframeSrc,guid) {require.__markCompiled && require.__markCompiled();
   

   
   

function insertIframe(/*object*/ opts) {return __bodyWrapper(this, arguments, function() {

  
  
  


  opts.id = opts.id || guid();
  opts.name = opts.name || guid();

  
  // browsers (e.g. Webkit) appear to try to do the "right thing" and will fire
  
  
  
  var srcSet = false;
  var onloadDone = false;
  var callback = __annotator(function() {
    if (srcSet && !onloadDone) {
      onloadDone = true;
      opts.onload && opts.onload(opts.root.firstChild);
    }
  }, {"module":"insertIframe","line":45,"column":17});
  var globalCallback = GlobalCallback.create(callback);


  
  
  // Dear Webkit, you're okay. Works either way.

  if (document.attachEvent) {
    
    
    var html = (
      '<iframe' +
        ' id="' + opts.id + '"' +
        ' name="' + opts.name + '"' +
        (opts.title ? ' title="' + opts.title + '"' : '') +
        (opts.className ? ' class="' + opts.className + '"' : '') +
        ' style="border:none;' +
        (opts.width ? 'width:' + opts.width + 'px;' : '') +
        (opts.height ? 'height:' + opts.height + 'px;' : '') +
        '"' +
        ' src="' + getBlankIframeSrc() + '"' +
        ' frameborder="0"' +
        ' scrolling="no"' +
        ' allowtransparency="true"' +
        ' onload="' + globalCallback + '()"' +
        '></iframe>'
    );

    
    
    // actually sets the content to the HTML we created above, and because it's
    
    
    
    // the string 'false', we set the iframe height to 1px so that it gets
    
    opts.root.innerHTML = (
      '<iframe src="' + getBlankIframeSrc() + '"' +
        ' frameborder="0"' +
        ' scrolling="no"' +
        ' style="height:1px"></iframe>'
    );

    // Now we'll be setting the real src.
    srcSet = true;

    
    
    
    
    
    setTimeout(__annotator(function() {
      opts.root.innerHTML = html;
      opts.root.firstChild.src = opts.url;
      opts.onInsert && opts.onInsert(opts.root.firstChild);
    }, {"module":"insertIframe","line":102,"column":15}), 0);

  } else {
    // This block works for all non-IE browsers, but it's specifically designed
    
    
    var node = document.createElement('iframe');
    node.id = opts.id;
    node.name = opts.name;
    node.onload = callback;
    node.scrolling = 'no';
    node.style.border = 'none';
    node.style.overflow = 'hidden';
    if (opts.title) {
      node.title = opts.title;
    }
    if (opts.className) {
      node.className = opts.className;
    }
    if (opts.height !== (void 0)) {
      node.style.height = opts.height + 'px';
    }
    if (opts.width !== (void 0)) {
      if (opts.width == '100%') {
        node.style.width = opts.width;
      } else {
        node.style.width = opts.width + 'px';
      }
    }
    opts.root.appendChild(node);

    // Now we'll be setting the real src.
    srcSet = true;

    node.src = opts.url;
    opts.onInsert && opts.onInsert(node);
  }
}, {"params":[[opts, 'object', 'opts']]});}__annotator(insertIframe, {"module":"insertIframe","line":28,"column":0,"name":"insertIframe"}, {"params":["object"]});

module.exports = insertIframe;


}, {"module":"insertIframe","line":22,"column":65}),null);


__d("sdk.Impressions",["sdk.Content","Miny","QueryString","sdk.Runtime","UrlMap","getBlankIframeSrc","guid","insertIframe"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Content,Miny,QueryString,Runtime,UrlMap,getBlankIframeSrc,guid,insertIframe) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   

   
   
   

function request(/*object*/ params) {return __bodyWrapper(this, arguments, function() {
  var clientID = Runtime.getClientID();

  if (!params.api_key && clientID) {
    params.api_key = clientID;
  }

  params.kid_directed_site = Runtime.getKidDirectedSite();

  var url = UrlMap.resolve('www', /*force ssl*/true) +
    '/impression.php/' + guid() + '/';
  var fullUrlPath = QueryString.appendToUrl(url, params);
  if (fullUrlPath.length > 2000) {
    
    
    if (params.payload && typeof params.payload === 'string') {
      var minyPayload = Miny.encode(params.payload);
      if (minyPayload && minyPayload.length < params.payload.length) {
        params.payload = minyPayload;
        fullUrlPath = QueryString.appendToUrl(url, params);
      }
    }
  }

  if (fullUrlPath.length <= 2000) {
    var image = new Image();
    image.src = fullUrlPath;
  } else {
    
    var name = guid();
    var root = Content.appendHidden('');
    insertIframe({
      url: getBlankIframeSrc(),
      root: root,
      name: name,
      className: 'fb_hidden fb_invisible',
      onload: __annotator(function() {
        root.parentNode.removeChild(root);
      }, {"module":"sdk.Impressions","line":54,"column":14})
    });

    Content.submitToTarget({
      url: url,
      target: name,
      params: params
    });
  }
}, {"params":[[params, 'object', 'params']]});}__annotator(request, {"module":"sdk.Impressions","line":18,"column":0,"name":"request"}, {"params":["object"]});

var Impressions = {
  log: __annotator(function(/*number*/ lid, /*object*/ payload) {return __bodyWrapper(this, arguments, function() {
    if (!payload.source) {
      payload.source = 'jssdk';
    }

    request({
      lid: lid, 
      payload: ES('JSON', 'stringify', false,payload)
    });
  }, {"params":[[lid, 'number', 'lid'], [payload, 'object', 'payload']]});}, {"module":"sdk.Impressions","line":68,"column":7}, {"params":["number","object"]}),

  impression: request
};

module.exports = Impressions;


}, {"module":"sdk.Impressions","line":7,"column":124}),null);


__d("Base64",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();



var en =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function en3(c) {
  c = (c.charCodeAt(0) << 16) | (c.charCodeAt(1) << 8) | c.charCodeAt(2);
  return String.fromCharCode(
    en.charCodeAt(c >>> 18), en.charCodeAt((c >>> 12) & 63),
    en.charCodeAt((c >>> 6) & 63), en.charCodeAt(c & 63));
}__annotator(en3, {"module":"Base64","line":34,"column":0,"name":"en3"});


// Position 0 corresponds to '+' (ASCII 43), and underscores are padding.
// The octal sequence \13 is used because IE doesn't recognize \v
var de =
  '>___?456789:;<=_______' +
  '\0\1\2\3\4\5\6\7\b\t\n\13\f\r\16\17\20\21\22\23\24\25\26\27\30\31' +
  '______\32\33\34\35\36\37 !"#$%&\'()*+,-./0123';
function de4(c) {
  c = (de.charCodeAt(c.charCodeAt(0) - 43) << 18) |
      (de.charCodeAt(c.charCodeAt(1) - 43) << 12) |
      (de.charCodeAt(c.charCodeAt(2) - 43) <<  6) |
       de.charCodeAt(c.charCodeAt(3) - 43);
  return String.fromCharCode(c >>> 16, (c >>> 8) & 255, c & 255);
}__annotator(de4, {"module":"Base64","line":48,"column":0,"name":"de4"});

var Base64 = {
  encode: __annotator(function(s) {
    
    s = unescape(encodeURI(s));
    var i = (s.length + 2) % 3;
    s = (s + '\0\0'.slice(i)).replace(/[\s\S]{3}/g, en3);
    return s.slice(0, s.length + i - 2) + '=='.slice(i);
  }, {"module":"Base64","line":57,"column":10}),
  decode: __annotator(function(s) {
    
    s = s.replace(/[^A-Za-z0-9+\/]/g, '');
    var i = (s.length + 3) & 3;
    s = (s + 'AAA'.slice(i)).replace(/..../g, de4);
    s = s.slice(0, s.length + i - 3);
    
    try { return decodeURIComponent(escape(s)); }
    catch (_) { throw new Error('Not valid UTF-8'); }
  }, {"module":"Base64","line":64,"column":10}),
  encodeObject: __annotator(function(obj) {
    return Base64.encode(ES('JSON', 'stringify', false,obj));
  }, {"module":"Base64","line":74,"column":16}),
  decodeObject: __annotator(function(b64) {
    return ES('JSON', 'parse', false,Base64.decode(b64));
  }, {"module":"Base64","line":77,"column":16}),
  
  encodeNums: __annotator(function(l) {
    return String.fromCharCode.apply(String, ES(l, 'map', true,__annotator(function(val) {
      return en.charCodeAt((val | -(val > 63)) & -(val > 0) & 63);
    }, {"module":"Base64","line":82,"column":51})));
  }, {"module":"Base64","line":81,"column":14})
};

module.exports = Base64;


}, {"module":"Base64","line":19,"column":16}),null);


__d("sdk.SignedRequest",["Base64"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Base64) {require.__markCompiled && require.__markCompiled();
   

function parse(/*?string*/ signed_request) /*?object*/ {return __bodyWrapper(this, arguments, function() {
  if (!signed_request) {
    return null;
  }

  
  var payload = signed_request.split('.', 2)[1]
    .replace(/\-/g, '+').replace(/\_/g, '/');
  return Base64.decodeObject(payload);
}, {"params":[[signed_request, '?string', 'signed_request']],"returns":'?object'});}__annotator(parse, {"module":"sdk.SignedRequest","line":17,"column":0,"name":"parse"}, {"params":["?string"],"returns":"?object"});


var SignedRequest = {
  parse: parse
};

module.exports = SignedRequest;


}, {"module":"sdk.SignedRequest","line":14,"column":35}),null);


__d("URIRFC3986",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var PARSE_PATTERN = new RegExp(
  '^'+
  '([^:/?#]+:)?'+                
  '(//'+                         
    '([^\\\\/?#@]*@)?'+          
    '('+                         
      '\\[[A-Fa-f0-9:.]+\\]|'+   
      '[^\\/?#:]*'+              
    ')'+                         
    '(:[0-9]*)?'+                
  ')?'+                          
  '([^?#]*)'+                    
  '(\\?[^#]*)?'+                 
  '(#.*)?'                       
);


var URIRFC3986 = {

  
  parse: __annotator(function(uriString) {return __bodyWrapper(this, arguments, function() {
    if (ES(uriString,'trim', true) === '') {
      return null;
    }
    var captures = uriString.match(PARSE_PATTERN);
    var uri = {};
    
    // other browsers return undefined. This means there's no way to
    
    
    uri.uri = captures[0] ? captures[0] : null;
    uri.scheme = captures[1] ?
      captures[1].substr(0, captures[1].length - 1) :
      null;
    uri.authority = captures[2] ? captures[2].substr(2) : null;
    uri.userinfo = captures[3] ?
      captures[3].substr(0, captures[3].length - 1) :
      null;
    uri.host = captures[2] ? captures[4] : null;
    uri.port = captures[5] ?
      (captures[5].substr(1) ? parseInt(captures[5].substr(1), 10) : null) :
      null;
    uri.path = captures[6] ? captures[6] : null;
    uri.query = captures[7] ? captures[7].substr(1) : null;
    uri.fragment = captures[8] ? captures[8].substr(1) : null;
    uri.isGenericURI = uri.authority === null && !!uri.scheme;
    return uri;
  }, {"params":[[uriString, 'string', 'uriString']],"returns":'?object'});}, {"module":"URIRFC3986","line":52,"column":9}, {"params":["string"],"returns":"?object"})
};

module.exports = URIRFC3986;


}, {"module":"URIRFC3986","line":20,"column":20}),null);


__d("createObjectFrom",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();

function createObjectFrom(keys, values ) {
  if (__DEV__) {
    if (!ES('Array', 'isArray', false,keys)) {
      throw new TypeError('Must pass an array of keys.');
    }
  }

  var object = {};
  var isArray = ES('Array', 'isArray', false,values);
  if (typeof values == 'undefined') {
    values = true;
  }

  for (var ii = keys.length; ii--;) {
    object[keys[ii]] = isArray ? values[ii] : values;
  }
  return object;
}__annotator(createObjectFrom, {"module":"createObjectFrom","line":43,"column":0,"name":"createObjectFrom"});

module.exports = createObjectFrom;


}, {"module":"createObjectFrom","line":19,"column":26}),null);


__d("URISchemes",["createObjectFrom"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,createObjectFrom) {require.__markCompiled && require.__markCompiled();
   

var defaultSchemes = createObjectFrom([
  'fb',        
  'fb-ama',    
  'fb-messenger', 
  'fbcf',
  'fbconnect', 
  'fbrpc',
  'file',
  'ftp',
  'http',
  'https',
  'mailto',
  'ms-app',    
  'itms',      
  'itms-apps', 
  'itms-services', 
  'market',    
  'svn+ssh',   
  'fbstaging', 
  'tel',       
  'sms',       
  'pebblejs',  
  'sftp'      
]);

var URISchemes = {

  
  isAllowed: __annotator(function(schema) {return __bodyWrapper(this, arguments, function() {
    if (!schema) {
      return true;
    }
    return defaultSchemes.hasOwnProperty(schema.toLowerCase());
  }, {"params":[[schema, '?string', 'schema']],"returns":'boolean'});}, {"module":"URISchemes","line":54,"column":13}, {"params":["?string"],"returns":"boolean"})
};

module.exports = URISchemes;


}, {"module":"URISchemes","line":20,"column":38}),null);


__d("copyProperties",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();

function copyProperties(obj, a, b, c, d, e, f) {
  obj = obj || {};

  if (__DEV__) {
    if (f) {
      throw new Error('Too many arguments passed to copyProperties');
    }
  }

  var args = [a, b, c, d, e];
  var ii = 0, v;
  while (args[ii]) {
    v = args[ii++];
    for (var k in v) {
      obj[k] = v[k];
    }

    
    
    if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
        (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
      obj.toString = v.toString;
    }
  }

  return obj;
}__annotator(copyProperties, {"module":"copyProperties","line":27,"column":0,"name":"copyProperties"});

module.exports = copyProperties;


}, {"module":"copyProperties","line":19,"column":24}),null);


__d("URIBase",["URIRFC3986","URISchemes","copyProperties","ex","invariant"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,URIRFC3986,URISchemes,copyProperties,ex,invariant) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   


var UNSAFE_DOMAIN_PATTERN = new RegExp(
  
  
  '[\\x00-\\x2c\\x2f\\x3b-\\x40\\x5c\\x5e\\x60\\x7b-\\x7f' +
    
    '\\uFDD0-\\uFDEF\\uFFF0-\\uFFFF' +
    
    '\\u2047\\u2048\\uFE56\\uFE5F\\uFF03\\uFF0F\\uFF1F]');


var SECURITY_PATTERN = new RegExp(
  // URI has a ":" before the first "/"
  '^(?:[^/]*:|' +
  
  '[\\x00-\\x1f]*/[\\x00-\\x1f]*/)');


function parse(uri, uriToParse, shouldThrow, serializer) {
  if (!uriToParse) {
    return true;
  }

  
  if (uriToParse instanceof URIBase) {
    uri.setProtocol(uriToParse.getProtocol());
    uri.setDomain(uriToParse.getDomain());
    uri.setPort(uriToParse.getPort());
    uri.setPath(uriToParse.getPath());
    uri.setQueryData(
      serializer.deserialize(
        serializer.serialize(uriToParse.getQueryData())
      )
    );
    uri.setFragment(uriToParse.getFragment());
    uri.setForceFragmentSeparator(uriToParse.getForceFragmentSeparator());
    return true;
  }

  uriToParse = ES(uriToParse.toString(),'trim', true);
  var components = URIRFC3986.parse(uriToParse) || {};
  if (!shouldThrow && !URISchemes.isAllowed(components.scheme)) {
    return false;
  }
  uri.setProtocol(components.scheme || '');
  if (!shouldThrow && UNSAFE_DOMAIN_PATTERN.test(components.host)) {
    return false;
  }
  uri.setDomain(components.host || '');
  uri.setPort(components.port || '');
  uri.setPath(components.path || '');
  if (shouldThrow) {
    uri.setQueryData(serializer.deserialize(components.query) || {});
  } else {
    try {
      uri.setQueryData(serializer.deserialize(components.query) || {});
    } catch (err) {
      return false;
    }
  }
  uri.setFragment(components.fragment || '');
  
  
  if (components.fragment === '') {
    uri.setForceFragmentSeparator(true);
  }

  if (components.userinfo !== null) {
    if (shouldThrow) {
        throw new Error(ex(
          'URI.parse: invalid URI (userinfo is not allowed in a URI): %s',
          uri.toString()
        ));
    } else {
      return false;
    }
  }

  
  
  if (!uri.getDomain() && ES(uri.getPath(), 'indexOf', true,'\\') !== -1) {
    if (shouldThrow) {
      throw new Error(ex(
        'URI.parse: invalid URI (no domain but multiple back-slashes): %s',
        uri.toString()
      ));
    } else {
      return false;
    }
  }

  
  
  if (!uri.getProtocol() && SECURITY_PATTERN.test(uriToParse)) {
    if (shouldThrow) {
      throw new Error(ex(
        'URI.parse: invalid URI (unsafe protocol-relative URLs): %s',
        uri.toString()
      ));
    } else {
      return false;
    }
  }
  return true;
}__annotator(parse, {"module":"URIBase","line":56,"column":0,"name":"parse"});


var uriFilters = [];




  
  function URIBase(uri, serializer) {"use strict";
    invariant(serializer, 'no serializer set');
    this.$URIBase_serializer = serializer;

    this.$URIBase_protocol = '';
    this.$URIBase_domain = '';
    this.$URIBase_port = '';
    this.$URIBase_path = '';
    this.$URIBase_fragment = '';
    this.$URIBase_queryData = {};
    this.$URIBase_forceFragmentSeparator = false;
    parse(this, uri, true, serializer);
  }__annotator(URIBase, {"module":"URIBase","line":180,"column":2,"name":"URIBase"});

  
  URIBase.prototype.setProtocol=__annotator(function(protocol) {"use strict";
    invariant(
      URISchemes.isAllowed(protocol),
      '"%s" is not a valid protocol for a URI.', protocol
    );
    this.$URIBase_protocol = protocol;
    return this;
  }, {"module":"URIBase","line":200,"column":32});

  
  URIBase.prototype.getProtocol=__annotator(function(protocol) {"use strict";
    return this.$URIBase_protocol;
  }, {"module":"URIBase","line":214,"column":32});

  
  URIBase.prototype.setSecure=__annotator(function(secure) {"use strict";
    return this.setProtocol(secure ? 'https' : 'http');
  }, {"module":"URIBase","line":224,"column":30});

  
  URIBase.prototype.isSecure=__annotator(function() {"use strict";
    return this.getProtocol() === 'https';
  }, {"module":"URIBase","line":233,"column":29});

  
  URIBase.prototype.setDomain=__annotator(function(domain) {"use strict";
    
    if (UNSAFE_DOMAIN_PATTERN.test(domain)) {
      throw new Error(ex(
        'URI.setDomain: unsafe domain specified: %s for url %s',
        domain,
        this.toString()
      ));
    }

    this.$URIBase_domain = domain;
    return this;
  }, {"module":"URIBase","line":243,"column":30});

  
  URIBase.prototype.getDomain=__annotator(function() {"use strict";
    return this.$URIBase_domain;
  }, {"module":"URIBase","line":265,"column":30});

  
  URIBase.prototype.setPort=__annotator(function(port) {"use strict";
    this.$URIBase_port = port;
    return this;
  }, {"module":"URIBase","line":275,"column":28});

  
  URIBase.prototype.getPort=__annotator(function() {"use strict";
    return this.$URIBase_port;
  }, {"module":"URIBase","line":285,"column":28});

  
  URIBase.prototype.setPath=__annotator(function(path) {"use strict";
    if (__DEV__) {
      if (path && path.charAt(0) !== '/') {
        console.warn('Path does not begin with a "/" which means this URI ' +
          'will likely be malformed. Ensure any string passed to .setPath() ' +
          'leads with "/"');
      }
    }
    this.$URIBase_path = path;
    return this;
  }, {"module":"URIBase","line":295,"column":28});

  
  URIBase.prototype.getPath=__annotator(function() {"use strict";
    return this.$URIBase_path;
  }, {"module":"URIBase","line":312,"column":28});

  
  URIBase.prototype.addQueryData=__annotator(function(mapOrKey, value) {"use strict";
    // Don't use instanceof, as it doesn't work across windows
    if (Object.prototype.toString.call(mapOrKey) === '[object Object]') {
      copyProperties(this.$URIBase_queryData, mapOrKey);
    } else {
      this.$URIBase_queryData[mapOrKey] = value;
    }
    return this;
  }, {"module":"URIBase","line":323,"column":33});

  
  URIBase.prototype.setQueryData=__annotator(function(map) {"use strict";
    this.$URIBase_queryData = map;
    return this;
  }, {"module":"URIBase","line":340,"column":33});

  
  URIBase.prototype.getQueryData=__annotator(function() {"use strict";
    return this.$URIBase_queryData;
  }, {"module":"URIBase","line":350,"column":33});

  
  URIBase.prototype.removeQueryData=__annotator(function(keys) {"use strict";
    if (!ES('Array', 'isArray', false,keys)) {
      keys = [keys];
    }
    for (var i = 0, length = keys.length; i < length; ++i) {
      delete this.$URIBase_queryData[keys[i]];
    }
    return this;
  }, {"module":"URIBase","line":360,"column":36});

  
  URIBase.prototype.setFragment=__annotator(function(fragment) {"use strict";
    this.$URIBase_fragment = fragment;
    // fragment was updated - we don't care about forcing separator
    this.setForceFragmentSeparator(false);
    return this;
  }, {"module":"URIBase","line":376,"column":32});

  
  URIBase.prototype.getFragment=__annotator(function() {"use strict";
    return this.$URIBase_fragment;
  }, {"module":"URIBase","line":388,"column":32});


  
  URIBase.prototype.setForceFragmentSeparator=__annotator(function(shouldForce) {"use strict";
    this.$URIBase_forceFragmentSeparator = shouldForce;
    return this;
  }, {"module":"URIBase","line":407,"column":46});

  
  URIBase.prototype.getForceFragmentSeparator=__annotator(function() {"use strict";
    return this.$URIBase_forceFragmentSeparator;
  }, {"module":"URIBase","line":418,"column":46});

  
  URIBase.prototype.isEmpty=__annotator(function() {"use strict";
    return !(
      this.getPath() ||
      this.getProtocol() ||
      this.getDomain() ||
      this.getPort() ||
      ES('Object', 'keys', false,this.getQueryData()).length > 0 ||
      this.getFragment()
    );
  }, {"module":"URIBase","line":427,"column":28});

 
  URIBase.prototype.toString=__annotator(function() {"use strict";
    var uri = this;
    for (var i = 0; i < uriFilters.length; i++) {
      uri = uriFilters[i](uri);
    }
    return uri.$URIBase_toStringImpl();
  }, {"module":"URIBase","line":443,"column":29});

  
  URIBase.prototype.$URIBase_toStringImpl=__annotator(function() {"use strict";
    var str = '';
    var protocol = this.getProtocol();
    if (protocol) {
      str += protocol + '://';
    }
    var domain = this.getDomain();
    if (domain) {
      str += domain;
    }
    var port = this.getPort();
    if (port) {
      str += ':' + port;
    }
    // If there is a protocol, domain or port, we need to provide '/' for the
    // path. If we don't have either and also don't have a path, we can omit
    
    // with "?", "#", or is empty.
    var path = this.getPath();
    if (path) {
      str += path;
    } else if (str) {
      str += '/';
    }
    var queryStr = this.$URIBase_serializer.serialize(this.getQueryData());
    if (queryStr) {
      str += '?' + queryStr;
    }
    var fragment = this.getFragment();
    if (fragment) {
      str += '#' + fragment;
    } else if (this.getForceFragmentSeparator()) {
      str += '#';
    }
    return str;
  }, {"module":"URIBase","line":457,"column":42});

  
  URIBase.registerFilter=__annotator(function(filter) {"use strict";
    uriFilters.push(filter);
  }, {"module":"URIBase","line":501,"column":25});

  
  URIBase.prototype.getOrigin=__annotator(function() {"use strict";
    var port = this.getPort();
    return this.getProtocol()
      + '://'
      + this.getDomain()
      + (port ? ':' + port : '');
  }, {"module":"URIBase","line":509,"column":30});



URIBase.isValidURI = __annotator(function(uri, serializer) {
  return parse(new URIBase(null, serializer), uri, false, serializer);
}, {"module":"URIBase","line":528,"column":21});

module.exports = URIBase;


}, {"module":"URIBase","line":19,"column":76}),null);


__d("sdk.URI",["Assert","QueryString","URIBase"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Assert,QueryString,URIBase) {require.__markCompiled && require.__markCompiled();
   
   
   

var facebookRe = /\.facebook\.com$/;

var serializer = {
  serialize: __annotator(function(map) {
    return map
      ? QueryString.encode(map)
      : '';
  }, {"module":"sdk.URI","line":27,"column":13}),
  deserialize: __annotator(function(text) {
    return text
      ? QueryString.decode(text)
      : {};
  }, {"module":"sdk.URI","line":32,"column":15})
};

for(var URIBase____Key in URIBase){if(URIBase.hasOwnProperty(URIBase____Key)){URI[URIBase____Key]=URIBase[URIBase____Key];}}var ____SuperProtoOfURIBase=URIBase===null?null:URIBase.prototype;URI.prototype=ES('Object', 'create', false,____SuperProtoOfURIBase);URI.prototype.constructor=URI;URI.__superConstructor__=URIBase;
  function URI(uri) {"use strict";
    Assert.isString(uri, 'The passed argument was of invalid type.');

    if (!(this instanceof URI)) {
      return new URI(uri);
    }

    URIBase.call(this,uri, serializer);
  }__annotator(URI, {"module":"sdk.URI","line":40,"column":2,"name":"URI"});

  URI.prototype.isFacebookURI=__annotator(function() /*boolean*/ {return __bodyWrapper(this, arguments, function() {"use strict";
    return facebookRe.test(this.getDomain());
  }, {"returns":'boolean'});}, {"module":"sdk.URI","line":50,"column":30}, {"returns":"boolean"});

  URI.prototype.valueOf=__annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {"use strict";
    return this.toString();
  }, {"returns":'string'});}, {"module":"sdk.URI","line":54,"column":24}, {"returns":"string"});


module.exports = URI;


}, {"module":"sdk.URI","line":19,"column":49}),null);


__d("sdk.Event",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var Event = {

  SUBSCRIBE: 'event.subscribe',
  UNSUBSCRIBE: 'event.unsubscribe',

  
  subscribers: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    
    
    
    
    if (!this._subscribersMap) {
      this._subscribersMap = {};
    }
    return this._subscribersMap;
  }, {"returns":'object'});}, {"module":"sdk.Event","line":19,"column":15}, {"returns":"object"}),

  
  subscribe: __annotator(function(/*string*/ name, /*function*/ cb) {return __bodyWrapper(this, arguments, function() {
    var subs = this.subscribers();

    if (!subs[name]) {
      subs[name] = [cb];
    } else {
      if (ES(subs[name], 'indexOf', true,cb) == -1){
        subs[name].push(cb);
      }
    }
    if (name != this.SUBSCRIBE && name != this.UNSUBSCRIBE) {
      this.fire(this.SUBSCRIBE, name, subs[name]);
    }
  }, {"params":[[name, 'string', 'name'], [cb, 'function', 'cb']]});}, {"module":"sdk.Event","line":64,"column":13}, {"params":["string","function"]}),

  
  unsubscribe: __annotator(function(/*string*/ name, /*function*/ cb) {return __bodyWrapper(this, arguments, function() {
    var subs = this.subscribers()[name];
    if (subs) {
      ES(subs, 'forEach', true,__annotator(function(value, key) {
        if (value == cb) {
          subs.splice(key, 1);
        }
      }, {"module":"sdk.Event","line":101,"column":19}));
    }
    if (name != this.SUBSCRIBE && name != this.UNSUBSCRIBE) {
      this.fire(this.UNSUBSCRIBE, name, subs);
    }
  }, {"params":[[name, 'string', 'name'], [cb, 'function', 'cb']]});}, {"module":"sdk.Event","line":98,"column":15}, {"params":["string","function"]}),

  
  monitor: __annotator(function(/*string*/ name, /*function*/ callback) {return __bodyWrapper(this, arguments, function() {
    if (!callback()) {
      var
        ctx = this,
        fn = __annotator(function() {
          if (callback.apply(callback, arguments)) {
            ctx.unsubscribe(name, fn);
          }
        }, {"module":"sdk.Event","line":126,"column":13});

      this.subscribe(name, fn);
    }
  }, {"params":[[name, 'string', 'name'], [callback, 'function', 'callback']]});}, {"module":"sdk.Event","line":122,"column":11}, {"params":["string","function"]}),

  
  clear: __annotator(function(/*string*/ name) {return __bodyWrapper(this, arguments, function() {
    delete this.subscribers()[name];
  }, {"params":[[name, 'string', 'name']]});}, {"module":"sdk.Event","line":145,"column":9}, {"params":["string"]}),

  
  fire: __annotator(function(/*string*/ name) {return __bodyWrapper(this, arguments, function() {
    var
      args = Array.prototype.slice.call(arguments, 1),
      subs = this.subscribers()[name];

    if (subs) {
      ES(subs, 'forEach', true,__annotator(function(sub) {
        
        
        if (sub) {
          sub.apply(this, args);
        }
      }, {"module":"sdk.Event","line":161,"column":19}));
    }
  }, {"params":[[name, 'string', 'name']]});}, {"module":"sdk.Event","line":155,"column":8}, {"params":["string"]})
};

module.exports = Event;


}, {"module":"sdk.Event","line":7,"column":19}),null);


__d("Queue",["copyProperties"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,copyProperties) {require.__markCompiled && require.__markCompiled();
   


var registry = {};


  
  function Queue(opts) {"use strict";
    
    this._opts = copyProperties({
      interval: 0,
      processor: null
    }, opts);

    
    this._queue = [];
    this._stopped = true;
  }__annotator(Queue, {"module":"Queue","line":46,"column":2,"name":"Queue"});

  
  Queue.prototype._dispatch=__annotator(function(force) {"use strict";
    if (this._stopped || this._queue.length === 0) {
      return;
    }
    if (!this._opts.processor) {
      this._stopped = true;
      throw new Error('No processor available');
    }

    if (this._opts.interval) {
      this._opts.processor.call(this, this._queue.shift());
      this._timeout = setTimeout(
        ES(this._dispatch, 'bind', true,this),
        this._opts.interval
      );
    } else {
      while(this._queue.length) {
        this._opts.processor.call(this, this._queue.shift());
      }
    }
  }, {"module":"Queue","line":65,"column":28});

  
  Queue.prototype.enqueue=__annotator(function(message) {"use strict";
    if (this._opts.processor && !this._stopped) {
      this._opts.processor.call(this, message);
    } else {
      this._queue.push(message);
    }
    return this;
  }, {"module":"Queue","line":95,"column":26});

  
  Queue.prototype.start=__annotator(function(processor) {"use strict";
    if (processor) {
      this._opts.processor = processor;
    }
    this._stopped = false;
    this._dispatch();
    return this;
  }, {"module":"Queue","line":111,"column":24});

  Queue.prototype.isStarted=__annotator(function() /*boolean*/ {"use strict";
    return !this._stopped;
  }, {"module":"Queue","line":120,"column":28});

  
  Queue.prototype.dispatch=__annotator(function() {"use strict";
    this._dispatch(true);
  }, {"module":"Queue","line":128,"column":27});

  
  Queue.prototype.stop=__annotator(function(scheduled) {"use strict";
    this._stopped = true;
    if (scheduled) {
      clearTimeout(this._timeout);
    }
    return this;
  }, {"module":"Queue","line":138,"column":23});

  
  Queue.prototype.merge=__annotator(function(queue, prepend) {"use strict";
    this._queue[prepend ? 'unshift' : 'push']
      .apply(this._queue, queue._queue);
    queue._queue = [];
    this._dispatch();
    return this;
  }, {"module":"Queue","line":154,"column":24});

  
  Queue.prototype.getLength=__annotator(function() {"use strict";
    return this._queue.length;
  }, {"module":"Queue","line":165,"column":28});

  
  Queue.get=__annotator(function(name, opts) {"use strict";
   var queue;
   if (name in registry) {
     queue = registry[name];
   } else {
    queue = registry[name] = new Queue(opts);
   }
   return queue;
  }, {"module":"Queue","line":177,"column":12});

  
  Queue.exists=__annotator(function(name) {"use strict";
    return name in registry;
  }, {"module":"Queue","line":193,"column":15});

  
  Queue.remove=__annotator(function(name) {"use strict";
    return delete registry[name];
  }, {"module":"Queue","line":204,"column":15});



module.exports = Queue;


}, {"module":"Queue","line":32,"column":31}),null);


__d("JSONRPC",["Log"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Log) {require.__markCompiled && require.__markCompiled();
   



  function JSONRPC(write) {"use strict";
    this.$JSONRPC_counter = 0;
    this.$JSONRPC_callbacks = {};

    this.remote = ES(__annotator(function(context)  {
      this.$JSONRPC_context = context;
      return this.remote;
    }, {"module":"JSONRPC","line":86,"column":18}), 'bind', true,this);

    this.local = {};

    this.$JSONRPC_write = write;
  }__annotator(JSONRPC, {"module":"JSONRPC","line":82,"column":2,"name":"JSONRPC"});

  
  JSONRPC.prototype.stub=__annotator(function(stub) {"use strict";
    this.remote[stub] = ES(__annotator(function()  {for (var args=[],$__0=0,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
      var message = {
        jsonrpc: '2.0',
        method: stub
      };

      if (typeof args[args.length - 1] == 'function') {
        message.id = ++this.$JSONRPC_counter;
        this.$JSONRPC_callbacks[message.id] = args.pop();
      }

      message.params = args;

      this.$JSONRPC_write(ES('JSON', 'stringify', false,message), this.$JSONRPC_context || {method: stub });
    }, {"module":"JSONRPC","line":106,"column":24}), 'bind', true,this);
  }, {"module":"JSONRPC","line":105,"column":25});

  
  JSONRPC.prototype.read=__annotator(function(message, context) {"use strict";
    var rpc = ES('JSON', 'parse', false,message), id = rpc.id;

    if (!rpc.method) {
      
      if (!this.$JSONRPC_callbacks[id]) {
        Log.warn('Could not find callback %s', id);
        return;
      }
      var callback = this.$JSONRPC_callbacks[id];
      delete this.$JSONRPC_callbacks[id];

      delete rpc.id;
      delete rpc.jsonrpc;

      callback(rpc);
      return;
    }

    
    var instance = this, method = this.local[rpc.method], send;
    if (id) {
      
      send = __annotator(function(/*string*/ type, value) {return __bodyWrapper(this, arguments, function() {
        var response = {
          jsonrpc: '2.0',
          id: id
        };
        response[type] = value;

        
        
        setTimeout(__annotator(function() {
          instance.$JSONRPC_write(ES('JSON', 'stringify', false,response), context);
        }, {"module":"JSONRPC","line":165,"column":19}), 0);
      }, {"params":[[type, 'string', 'type']]});}, {"module":"JSONRPC","line":156,"column":13}, {"params":["string"]});
    } else {
      
      send = __annotator(function() {}, {"module":"JSONRPC","line":171,"column":13});
    }

    if (!method) {
      Log.error('Method "%s" has not been defined', rpc.method);

      send('error', {
        code: -32601,
        message: 'Method not found',
        data: rpc.method
      });
      return;
    }

    
    rpc.params.push(ES(send, 'bind', true,null, 'result'));
    rpc.params.push(ES(send, 'bind', true,null, 'error'));

    
    try {
      var returnValue = method.apply(context || null, rpc.params);
      
      if (typeof returnValue !== 'undefined') {
        send('result', returnValue);
      }
    } catch(rpcEx) {
      Log.error('Invokation of RPC method %s resulted in the error: %s',
        rpc.method, rpcEx.message);

      send('error', {
        code: -32603,
        message: 'Internal error',
        data: rpcEx.message
      });
    }
  }, {"module":"JSONRPC","line":133,"column":25});


module.exports = JSONRPC;


}, {"module":"JSONRPC","line":77,"column":22}),null);


__d("sdk.RPC",["Assert","JSONRPC","Queue"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Assert,JSONRPC,Queue) {require.__markCompiled && require.__markCompiled();
   
   
   

var outQueue = new Queue();
var jsonrpc = new JSONRPC(__annotator(function(/*string*/ message) {return __bodyWrapper(this, arguments, function() {
  outQueue.enqueue(message);
}, {"params":[[message, 'string', 'message']]});}, {"module":"sdk.RPC","line":13,"column":26}, {"params":["string"]}));

var RPC = {
  local: jsonrpc.local,
  remote: jsonrpc.remote,
  stub: ES(jsonrpc.stub, 'bind', true,jsonrpc),
  setInQueue: __annotator(function(/*object*/ queue) {return __bodyWrapper(this, arguments, function() {
    Assert.isInstanceOf(Queue, queue);

    queue.start(__annotator(function(/*string*/ message) {return __bodyWrapper(this, arguments, function() {
      jsonrpc.read(message);
    }, {"params":[[message, 'string', 'message']]});}, {"module":"sdk.RPC","line":24,"column":16}, {"params":["string"]}));
  }, {"params":[[queue, 'object', 'queue']]});}, {"module":"sdk.RPC","line":21,"column":14}, {"params":["object"]}),
  getOutQueue: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    return outQueue;
  }, {"returns":'object'});}, {"module":"sdk.RPC","line":28,"column":15}, {"returns":"object"})
};

module.exports = RPC;


}, {"module":"sdk.RPC","line":7,"column":43}),null);

__d("sdk.Scribe",["QueryString","sdk.Runtime","UrlMap"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,QueryString,Runtime,UrlMap) {require.__markCompiled && require.__markCompiled();
   
   
   

function log(/*string*/ category, /*object*/ data) {return __bodyWrapper(this, arguments, function() {
  if (typeof data.extra == 'object') {
    data.extra.revision = Runtime.getRevision();
  }
  (new Image()).src = QueryString.appendToUrl(
    UrlMap.resolve('www', /*force ssl*/true) + '/common/scribe_endpoint.php',
    {
      c: category,
      m: ES('JSON', 'stringify', false,data)
    }
  );
}, {"params":[[category, 'string', 'category'], [data, 'object', 'data']]});}__annotator(log, {"module":"sdk.Scribe","line":11,"column":0,"name":"log"}, {"params":["string","object"]});

var Scribe = {
  log: log
};

module.exports = Scribe;


}, {"module":"sdk.Scribe","line":6,"column":59}),null);


__d("emptyFunction",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function makeEmptyFunction(arg) {
  return __annotator(function() {
    return arg;
  }, {"module":"emptyFunction","line":21,"column":9});
}__annotator(makeEmptyFunction, {"module":"emptyFunction","line":20,"column":0,"name":"makeEmptyFunction"});


function emptyFunction() {}__annotator(emptyFunction, {"module":"emptyFunction","line":31,"column":0,"name":"emptyFunction"});

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = __annotator(function() { return this; }, {"module":"emptyFunction","line":37,"column":32});
emptyFunction.thatReturnsArgument = __annotator(function(arg) { return arg; }, {"module":"emptyFunction","line":38,"column":36});

module.exports = emptyFunction;


}, {"module":"emptyFunction","line":19,"column":23}),null);

__d("htmlSpecialChars",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();


var r_amp = /&/g;
var r_lt = /</g;
var r_gt = />/g;
var r_quot = /"/g;
var r_squo = /'/g;

function htmlSpecialChars(text) {
  if (typeof text == 'undefined' || text === null || !text.toString) {
    return '';
  }

  if (text === false) {
    return '0';
  } else if (text === true) {
    return '1';
  }

  return text
    .toString()
    .replace(r_amp, '&amp;')
    .replace(r_quot, '&quot;')
    .replace(r_squo, '&#039;')
    .replace(r_lt, '&lt;')
    .replace(r_gt, '&gt;');
}__annotator(htmlSpecialChars, {"module":"htmlSpecialChars","line":33,"column":0,"name":"htmlSpecialChars"});

module.exports = htmlSpecialChars;


}, {"module":"htmlSpecialChars","line":18,"column":29}),null);


__d("Flash",["DOMEventListener","DOMWrapper","QueryString","UserAgent_DEPRECATED","copyProperties","guid","htmlSpecialChars"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,DOMEventListener,DOMWrapper,QueryString,UserAgent_DEPRECATED,copyProperties,guid,htmlSpecialChars) {require.__markCompiled && require.__markCompiled();
/*globals ActiveXObject */

   
   
   
   

   
   
   

var registry = {};
var unloadHandlerAttached;
var document = DOMWrapper.getWindow().document;

function remove(id) {
  var swf = document.getElementById(id);
  if (swf) {
    swf.parentNode.removeChild(swf);
  }
  delete registry[id];
}__annotator(remove, {"module":"Flash","line":30,"column":0,"name":"remove"});

function unloadRegisteredSWFs() {
  for (var id in registry) {
    if (registry.hasOwnProperty(id)) {
        remove(id);
    }
  }
}__annotator(unloadRegisteredSWFs, {"module":"Flash","line":38,"column":0,"name":"unloadRegisteredSWFs"});


function normalize(s) {
  return s.replace(
    /\d+/g,
    __annotator(function (m) { return '000'.substring(m.length) + m; }, {"module":"Flash","line":52,"column":4})
  );
}__annotator(normalize, {"module":"Flash","line":49,"column":0,"name":"normalize"});

function register(id) {
  if (!unloadHandlerAttached) {
    
    
    if (UserAgent_DEPRECATED.ie() >= 9) {
      DOMEventListener.add(window, 'unload', unloadRegisteredSWFs);
    }
    unloadHandlerAttached = true;
  }
  registry[id] = id;
}__annotator(register, {"module":"Flash","line":56,"column":0,"name":"register"});


var Flash = {

  
  embed: __annotator(function(src, container, params, flashvars) {
    // Always give SWFs unique id's in order to kill instance caching.
    var id = guid();
    
    // This is still safe because there isn't an & sequence that can
    
    src = htmlSpecialChars(src).replace(/&amp;/g, '&');

    
    params = copyProperties({
        allowscriptaccess: 'always',
        flashvars: flashvars,
        movie: src
      },
      params || {});

    
    if (typeof params.flashvars == 'object') {
      params.flashvars = QueryString.encode(params.flashvars);
    }

    
    var pElements = [];
    for (var key in params) {
      if (params.hasOwnProperty(key) && params[key]) {
        pElements.push('<param name="' + htmlSpecialChars(key) + '" value="' +
          htmlSpecialChars(params[key]) + '">');
      }
    }

    var span = container.appendChild(document.createElement('span'));
    var html =
      '<object ' + (UserAgent_DEPRECATED.ie()
         ? 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" '
         : 'type="application/x-shockwave-flash"') +
        'data="' + src + '" ' +
        (params.height ? 'height="' + params.height + '" ' : '') +
        (params.width ? 'width="' + params.width + '" ' : '') +
        'id="' + id + '">' + pElements.join('') + '</object>';
    span.innerHTML = html;
    var swf = span.firstChild;

    register(id);
    return swf;
  }, {"module":"Flash","line":82,"column":9}),

  
  remove: remove,

  
  getVersion: __annotator(function() {
    var name = 'Shockwave Flash';
    var mimeType = 'application/x-shockwave-flash';
    var activexType = 'ShockwaveFlash.ShockwaveFlash';
    var flashVersion;

    if (navigator.plugins && typeof navigator.plugins[name] == 'object') {
        
        var description = navigator.plugins[name].description;
        if (description && navigator.mimeTypes &&
              navigator.mimeTypes[mimeType] &&
              navigator.mimeTypes[mimeType].enabledPlugin) {
            flashVersion = description.match(/\d+/g);
        }
    }
    if (!flashVersion) {
        try {
            flashVersion = (new ActiveXObject(activexType))
              .GetVariable('$version')
              .match(/(\d+),(\d+),(\d+),(\d+)/);
            flashVersion = Array.prototype.slice.call(flashVersion, 1);
        }
        catch (notSupportedException) {
        }
    }
    return flashVersion;
  }, {"module":"Flash","line":139,"column":14}),

  
  checkMinVersion: __annotator(function(minVersion) {
    var version = Flash.getVersion();
    if (!version) {
      return false;
    }
    return normalize(version.join('.')) >= normalize(minVersion);
  }, {"module":"Flash","line":174,"column":19}),

  
  isAvailable : __annotator(function() {
    return !!Flash.getVersion();
  }, {"module":"Flash","line":187,"column":16})

};

module.exports = Flash;


}, {"module":"Flash","line":14,"column":126}),null);


__d("XDM",["DOMEventListener","DOMWrapper","emptyFunction","Flash","GlobalCallback","guid","Log","UserAgent_DEPRECATED","wrapFunction"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,DOMEventListener,DOMWrapper,emptyFunction,Flash,GlobalCallback,guid,Log,UserAgent_DEPRECATED,wrapFunction) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   

var transports = {};
var configuration = {
  transports : []
};
var window = DOMWrapper.getWindow();

function findTransport(blacklist) {
  var blacklistMap = {},
      i = blacklist.length,
      list = configuration.transports;

  while (i--) { blacklistMap[blacklist[i]] = 1; }

  i = list.length;
  while (i--) {
    var name = list[i],
        transport = transports[name];
    if (!blacklistMap[name] && transport.isAvailable()) {
      return name;
    }
  }
}__annotator(findTransport, {"module":"XDM","line":65,"column":0,"name":"findTransport"});

var XDM = {

  
  register: __annotator(function(name, provider) {
    Log.debug('Registering %s as XDM provider', name);
    configuration.transports.push(name);
    transports[name] = provider;
  }, {"module":"XDM","line":88,"column":12}),

  
  create: __annotator(function(config) {
    if (!config.whenReady && !config.onMessage) {
      Log.error('An instance without whenReady or onMessage makes no sense');
      throw new Error('An instance without whenReady or ' +
                      'onMessage makes no sense');
    }
    if (!config.channel) {
      Log.warn('Missing channel name, selecting at random');
      config.channel = guid();
    }

    if (!config.whenReady) {
      config.whenReady = emptyFunction;
    }
    if (!config.onMessage) {
      config.onMessage = emptyFunction;
    }

    var name = config.transport || findTransport(config.blacklist || []),
        transport = transports[name];
    if (transport && transport.isAvailable()) {
      Log.debug('%s is available', name);
      transport.init(config);
      return name;
    }
  }, {"module":"XDM","line":118,"column":10})

};


XDM.register('flash', (__annotator(function() {
  var inited = false;
  var swf;
  var doLog = false;
  var timeout = 15000;
  var timer;

  if (__DEV__) {
    doLog = true;
  }

  return {
    isAvailable: __annotator(function() {
      
      
      return Flash.checkMinVersion('8.0.24');
    }, {"module":"XDM","line":163,"column":17}),
    init: __annotator(function(config) {
      Log.debug('init flash: ' + config.channel);
      var xdm = {
        send: __annotator(function(message, origin, windowRef, channel) {
          Log.debug('sending to: %s (%s)', origin, channel);
          swf.postMessage(message, origin, channel);
        }, {"module":"XDM","line":171,"column":14})
      };
      if (inited) {
        config.whenReady(xdm);
        return;
      }
      var div = config.root.appendChild(window.document.createElement('div'));

      var callback = GlobalCallback.create(__annotator(function() {
        GlobalCallback.remove(callback);
        clearTimeout(timer);
        Log.info('xdm.swf called the callback');
        var messageCallback = GlobalCallback.create(__annotator(function(msg, origin) {
          msg = decodeURIComponent(msg);
          origin = decodeURIComponent(origin);
          Log.debug('received message %s from %s', msg, origin);
          config.onMessage(msg, origin);
        }, {"module":"XDM","line":186,"column":52}), 'xdm.swf:onMessage');
        swf.init(config.channel, messageCallback);
        config.whenReady(xdm);
      }, {"module":"XDM","line":182,"column":43}), 'xdm.swf:load');

      swf = Flash.embed(config.flashUrl, div, null, {
        protocol: location.protocol.replace(':', ''),
        host: location.host,
        callback: callback,
        log: doLog
      });

      timer = setTimeout(__annotator(function() {
        Log.warn('The Flash component did not load within %s ms - ' +
          'verify that the container is not set to hidden or invisible ' +
          'using CSS as this will cause some browsers to not load ' +
          'the components', timeout);
      }, {"module":"XDM","line":203,"column":25}), timeout);
      inited = true;
    }, {"module":"XDM","line":168,"column":10})
  };
}, {"module":"XDM","line":151,"column":23}))());


XDM.register('postmessage', (__annotator(function() {
  var inited = false;

  return {
    isAvailable : __annotator(function() {
      return !!window.postMessage;
    }, {"module":"XDM","line":227,"column":18}),
    init: __annotator(function(config) {
      Log.debug('init postMessage: ' + config.channel);
      var prefix = '_FB_' + config.channel;
      var xdm = {
        send: __annotator(function(message, origin, windowRef, channel) {
          if (window === windowRef) {
            Log.error('Invalid windowref, equal to window (self)');
            throw new Error();
          }
          Log.debug('sending to: %s (%s)', origin, channel);
          var send = __annotator(function() {
            
            windowRef.postMessage('_FB_' + channel + message, origin);
          }, {"module":"XDM","line":240,"column":21});
          // IE8's postMessage is syncronous, meaning that if you have a
          
          
          
          
          
          
          
          if (UserAgent_DEPRECATED.ie() == 8 || UserAgent_DEPRECATED.ieCompatibilityMode()) {
            setTimeout(send, 0);
          } else{
            send();
          }
        }, {"module":"XDM","line":234,"column":14})
      };
      if (inited) {
        config.whenReady(xdm);
        return;
      }

      DOMEventListener.add(window, 'message', wrapFunction(__annotator(function(event) {
        var message = event.data;
        
        
        var origin = event.origin || 'native';
        if (!/^(https?:\/\/|native$)/.test(origin)) {
          Log.debug('Received message from invalid origin type: %s', origin);
          return;
        }

        if (typeof message != 'string') {
          Log.warn('Received message of type %s from %s, expected a string',
            typeof message, origin);
          return;
        }

        Log.debug('received message %s from %s', message, origin);
        
        if (message.substring(0, prefix.length) == prefix) {
          message = message.substring(prefix.length);
        }
        config.onMessage(message, origin);
      }, {"module":"XDM","line":264,"column":59}), 'entry', 'onMessage'));
      config.whenReady(xdm);
      inited = true;
    }, {"module":"XDM","line":230,"column":10})
  };
}, {"module":"XDM","line":223,"column":29}))());

module.exports = XDM;


}, {"module":"XDM","line":48,"column":136}),null);


__d("isFacebookURI",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var facebookURIRegex = null;

var FB_PROTOCOLS = ['http', 'https'];


function isFacebookURI(uri) {return __bodyWrapper(this, arguments, function() {
  if (!facebookURIRegex) {
    
    facebookURIRegex = new RegExp('(^|\\.)facebook\\.com$', 'i');
  }

  if (uri.isEmpty() && uri.toString() !== '#') {
    return false;
  }

  if (!uri.getDomain() && !uri.getProtocol()) {
    return true;
  }

  return (ES(FB_PROTOCOLS, 'indexOf', true,uri.getProtocol()) !== -1 &&
          facebookURIRegex.test(uri.getDomain()));
}, {"params":[[uri, 'URI', 'uri']],"returns":'boolean'});}__annotator(isFacebookURI, {"module":"isFacebookURI","line":32,"column":0,"name":"isFacebookURI"}, {"params":["URI"],"returns":"boolean"});

isFacebookURI.setRegex = __annotator(function(regex) {
  facebookURIRegex = regex;
}, {"module":"isFacebookURI","line":50,"column":25});

module.exports = isFacebookURI;


}, {"module":"isFacebookURI","line":20,"column":23}),null);


__d("sdk.XD",["sdk.Content","sdk.Event","Log","QueryString","Queue","sdk.RPC","sdk.Runtime","sdk.Scribe","sdk.URI","UrlMap","JSSDKXDConfig","XDM","isFacebookURI","sdk.createIframe","sdk.feature","guid"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Content,Event,Log,QueryString,Queue,RPC,Runtime,Scribe,URI,UrlMap,XDConfig,XDM,isFacebookURI,createIframe,feature,guid) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   
   
   
   

   
   
   
   

var facebookQueue = new Queue();
var httpProxyQueue = new Queue();
var httpsProxyQueue = new Queue();
var httpProxyFrame;
var httpsProxyFrame;
var proxySecret = guid();

var xdArbiterTier = XDConfig.useCdn ? 'cdn' : 'www';
var xdArbiterPathAndQuery = feature('use_bundle', false)
  ? XDConfig.XdBundleUrl
  : XDConfig.XdUrl;
var xdArbiterHttpUrl
  = UrlMap.resolve(xdArbiterTier, false) + xdArbiterPathAndQuery;
var xdArbiterHttpsUrl
  = UrlMap.resolve(xdArbiterTier, true) + xdArbiterPathAndQuery;

var channel = guid();
var origin = location.protocol + '//' + location.host;
var xdm;
var inited = false;
var IFRAME_TITLE = 'Facebook Cross Domain Communication Frame';

var pluginRegistry = {};
var rpcQueue = new Queue();
RPC.setInQueue(rpcQueue);

function onRegister(/*string*/ registeredAs) {return __bodyWrapper(this, arguments, function() {
  Log.info('Remote XD can talk to facebook.com (%s)', registeredAs);
  Runtime.setEnvironment(
    registeredAs === 'canvas'
      ? Runtime.ENVIRONMENTS.CANVAS
      : Runtime.ENVIRONMENTS.PAGETAB);
}, {"params":[[registeredAs, 'string', 'registeredAs']]});}__annotator(onRegister, {"module":"sdk.XD","line":52,"column":0,"name":"onRegister"}, {"params":["string"]});

function handleAction(/*object*/ message, /*string*/ senderOrigin) {return __bodyWrapper(this, arguments, function() {
  if (!senderOrigin) {
    Log.error('No senderOrigin');
    throw new Error();
  }

  var protocol = /^https?/.exec(senderOrigin)[0];

  switch(message.xd_action) {
    case 'proxy_ready':
      var proxyQueue;
      var targetProxyFrame;

      if (protocol == 'https') {
        proxyQueue = httpsProxyQueue;
        targetProxyFrame = httpsProxyFrame;
      } else {
        proxyQueue = httpProxyQueue;
        targetProxyFrame = httpProxyFrame;
      }

      if (message.registered) {
        onRegister(message.registered);
        facebookQueue = proxyQueue.merge(facebookQueue);
      }

      Log.info('Proxy ready, starting queue %s containing %s messages',
        protocol + 'ProxyQueue', proxyQueue.getLength());

      proxyQueue.start(__annotator(function(/*string|object*/ message) {return __bodyWrapper(this, arguments, function() {
        xdm.send(
          typeof message === 'string' ? message : QueryString.encode(message),
          senderOrigin,
          targetProxyFrame.contentWindow,
          channel + '_' + protocol
        );
      }, {"params":[[message, 'string|object', 'message']]});}, {"module":"sdk.XD","line":89,"column":23}, {"params":["string|object"]}));
      break;

    case 'plugin_ready':
      Log.info('Plugin %s ready, protocol: %s', message.name, protocol);
      pluginRegistry[message.name] = { protocol: protocol };
      if (Queue.exists(message.name)) {
        var queue = Queue.get(message.name);
        Log.debug('Enqueuing %s messages for %s in %s', queue.getLength(),
          message.name, protocol + 'ProxyQueue');

        (protocol == 'https' ? httpsProxyQueue : httpProxyQueue).merge(queue);
      }
      break;
  }

  
  if (message.data) {
    onMessage(message.data, senderOrigin);
  }
}, {"params":[[message, 'object', 'message'], [senderOrigin, 'string', 'senderOrigin']]});}__annotator(handleAction, {"module":"sdk.XD","line":60,"column":0,"name":"handleAction"}, {"params":["object","string"]});




function onMessage(/*string|object*/ message, /*?string*/ senderOrigin) {return __bodyWrapper(this, arguments, function() {
  if (senderOrigin && senderOrigin !== 'native' &&
      !isFacebookURI(URI(senderOrigin))) {
    return;
  }
  if (typeof message == 'string') {
    if (/^FB_RPC:/.test(message)) {
      rpcQueue.enqueue(message.substring(7));
      return;
    }
    
    if (message.substring(0, 1) == '{') {
      try {
        message = ES('JSON', 'parse', false,message);
      } catch (decodeException) {
        Log.warn('Failed to decode %s as JSON', message);
        return;
      }
    } else {
      message = QueryString.decode(message);
    }
  }
  

  if (!senderOrigin) {
    
    if (message.xd_sig == proxySecret) {
      senderOrigin = message.xd_origin;
    }
  }

  if (message.xd_action) {
    handleAction(message, senderOrigin);
    return;
  }

  
  
  if (message.access_token) {
    Runtime.setSecure(/^https/.test(origin));
  }

  
  if (message.cb) {
    var cb = XD._callbacks[message.cb];
    if (!XD._forever[message.cb]) {
      delete XD._callbacks[message.cb];
    }
    if (cb) {
      cb(message);
    }
  }
}, {"params":[[message, 'string|object', 'message'], [senderOrigin, '?string', 'senderOrigin']]});}__annotator(onMessage, {"module":"sdk.XD","line":121,"column":0,"name":"onMessage"}, {"params":["string|object","?string"]});

function sendToFacebook(/*string*/ recipient, /*object|string*/ message) {return __bodyWrapper(this, arguments, function() {
  if (recipient == 'facebook') {
    message.relation = 'parent.parent';
    facebookQueue.enqueue(message);
  } else {
    message.relation = 'parent.frames["' + recipient + '"]';
    var regInfo = pluginRegistry[recipient];
    if (regInfo) {
      Log.debug('Enqueuing message for plugin %s in %s',
        recipient, regInfo.protocol + 'ProxyQueue');

      (regInfo.protocol == 'https' ? httpsProxyQueue : httpProxyQueue)
        .enqueue(message);
    } else {
      Log.debug('Buffering message for plugin %s', recipient);
      Queue.get(recipient).enqueue(message);
    }
  }
}, {"params":[[recipient, 'string', 'recipient'], [message, 'object|string', 'message']]});}__annotator(sendToFacebook, {"module":"sdk.XD","line":175,"column":0,"name":"sendToFacebook"}, {"params":["string","object|string"]});


RPC.getOutQueue().start(__annotator(function(/*string*/ message) {return __bodyWrapper(this, arguments, function() {
  sendToFacebook('facebook', 'FB_RPC:' + message);
}, {"params":[[message, 'string', 'message']]});}, {"module":"sdk.XD","line":196,"column":24}, {"params":["string"]}));

function init(/*?string*/ xdProxyName) {return __bodyWrapper(this, arguments, function() {
  if (inited) {
    return;
  }

  
  var container = Content.appendHidden(document.createElement('div'));

  
  var transport = XDM.create({
    blacklist: null,
    root: container,
    channel: channel,
    flashUrl: XDConfig.Flash.path,
    whenReady: __annotator(function(/*object*/ instance) {return __bodyWrapper(this, arguments, function() {
      xdm = instance;
      
      var proxyData = {
        channel: channel, 
        origin: location.protocol + '//' + location.host, 
        transport: transport, 
        xd_name: xdProxyName 
      };

      var xdArbiterFragment = '#' + QueryString.encode(proxyData);

      
      

      
      
      if (Runtime.getSecure() !== true) {
        
        
        httpProxyFrame = createIframe({
          url: xdArbiterHttpUrl + xdArbiterFragment,
          name: 'fb_xdm_frame_http',
          id: 'fb_xdm_frame_http',
          root: container,
          'aria-hidden':true,
          title: IFRAME_TITLE,
          tabindex: -1
        });
      }

      
      
      httpsProxyFrame = createIframe({
        url: xdArbiterHttpsUrl + xdArbiterFragment,
        name: 'fb_xdm_frame_https',
        id: 'fb_xdm_frame_https',
        root: container,
        'aria-hidden':true,
        title: IFRAME_TITLE,
        tabindex: -1
      });
    }, {"params":[[instance, 'object', 'instance']]});}, {"module":"sdk.XD","line":214,"column":15}, {"params":["object"]}),
    onMessage: onMessage
  });
  if (!transport) {
    Scribe.log('jssdk_error', {
      appId: Runtime.getClientID(),
      error: 'XD_TRANSPORT',
      extra: {
        message: 'Failed to create a valid transport'
      }
    });
  }
  inited = true;
}, {"params":[[xdProxyName, '?string', 'xdProxyName']]});}__annotator(init, {"module":"sdk.XD","line":200,"column":0,"name":"init"}, {"params":["?string"]});


var XD = {
  // needs to be exposed in a more controlled way once we're more
  // into 'CJS land'.
  rpc: RPC,

  _callbacks: {},
  _forever: {},
  _channel: channel,
  _origin: origin,

  onMessage: onMessage,
  recv: onMessage,

  
  init: init,

  
  sendToFacebook: sendToFacebook,

  
  inform: __annotator(function(/*string*/ method, /*?object*/ params, /*?string*/ relation,
      /*?string*/ behavior) {return __bodyWrapper(this, arguments, function() {
    sendToFacebook('facebook', {
      method: method,
      params: ES('JSON', 'stringify', false,params || {}),
      behavior: behavior || 'p',
      relation: relation
    });
  }, {"params":[[method, 'string', 'method'], [params, '?object', 'params'], [relation, '?string', 'relation'], [behavior, '?string', 'behavior']]});}, {"module":"sdk.XD","line":312,"column":10}, {"params":["string","?object","?string","?string"]}),

  
  handler: __annotator(function(/*function*/ cb, /*?string*/ relation, /*?boolean*/ forever,
      /*?string*/ id) /*string*/ {return __bodyWrapper(this, arguments, function() {
    var xdArbiterFragment = '#' + QueryString.encode({
      cb        : this.registerCallback(cb, forever, id),
      origin    : origin + '/' + channel,
      domain    : location.hostname,
      relation  : relation || 'opener'
    });
    return (location.protocol == 'https:'
      ? xdArbiterHttpsUrl
      : xdArbiterHttpUrl
    ) + xdArbiterFragment;
  }, {"params":[[cb, 'function', 'cb'], [relation, '?string', 'relation'], [forever, '?boolean', 'forever'], [id, '?string', 'id']],"returns":'string'});}, {"module":"sdk.XD","line":336,"column":11}, {"params":["function","?string","?boolean","?string"],"returns":"string"}),

  registerCallback: __annotator(function(/*function*/ cb, /*?boolean*/ persistent,
      /*?string*/ id) /*string*/ {return __bodyWrapper(this, arguments, function() {
    id = id || guid();
    if (persistent) {
      XD._forever[id] = true;
    }
    XD._callbacks[id] = cb;
    return id;
  }, {"params":[[cb, 'function', 'cb'], [persistent, '?boolean', 'persistent'], [id, '?string', 'id']],"returns":'string'});}, {"module":"sdk.XD","line":350,"column":20}, {"params":["function","?boolean","?string"],"returns":"string"})
};





Event.subscribe('init:post', __annotator(function(/*object*/ options) {return __bodyWrapper(this, arguments, function() {
  init(options.xdProxyName);
  var timeout = feature('xd_timeout', false);
  if (timeout) {
    setTimeout(__annotator(function() {
      var initialized =
        httpsProxyFrame
        && (!!httpProxyFrame == httpProxyQueue.isStarted()
            && !!httpsProxyFrame == httpsProxyQueue.isStarted());

      if (!initialized) {
        Scribe.log('jssdk_error', {
          appId: Runtime.getClientID(),
          error: 'XD_INITIALIZATION',
          extra: {
            message: 'Failed to initialize in ' + timeout + 'ms'
          }
        });
      }
    }, {"module":"sdk.XD","line":369,"column":15}), timeout);
  }
}, {"params":[[options, 'object', 'options']]});}, {"module":"sdk.XD","line":365,"column":29}, {"params":["object"]}));


module.exports = XD;


}, {"module":"sdk.XD","line":7,"column":203}),null);


__d("sdk.Auth",["sdk.Cookie","sdk.createIframe","DOMWrapper","sdk.feature","sdk.getContextType","guid","sdk.Impressions","Log","ObservableMixin","sdk.Runtime","sdk.SignedRequest","UrlMap","sdk.URI","sdk.XD"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Cookie,createIframe,DOMWrapper,feature,getContextType,guid,Impressions,Log,ObservableMixin,Runtime,SignedRequest,UrlMap,URI,XD) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   
   
   
   
   
   

var currentAuthResponse;

var timer;

var Auth = new ObservableMixin();

function setAuthResponse(/*?object*/ authResponse, /*string*/ status) {return __bodyWrapper(this, arguments, function() {
  var currentUserID = Runtime.getUserID();
  var userID = '';
  if (authResponse) {
    // if there's an auth record, then there are a few ways we might
    
    // then go with that.  If there's no explicit user ID, but there's a valid
    
    if (authResponse.userID) {
      userID = authResponse.userID;
    } else if (authResponse.signedRequest) {
      var parsedSignedRequest =
        SignedRequest.parse(authResponse.signedRequest);
      if (parsedSignedRequest && parsedSignedRequest.user_id) {
        userID = parsedSignedRequest.user_id;
      }
    }
  }

  var
    currentStatus = Runtime.getLoginStatus(),
    login = (currentStatus === 'unknown' && authResponse)
            || (Runtime.getUseCookie() && Runtime.getCookieUserID() !== userID),
    logout = currentUserID && !authResponse,
    both = authResponse && currentUserID && currentUserID != userID,
    authResponseChange = authResponse != currentAuthResponse,
    statusChange = status != (currentStatus || 'unknown');

  
  
  Runtime.setLoginStatus(status);
  Runtime.setAccessToken(authResponse && authResponse.accessToken || null);
  Runtime.setUserID(userID);

  currentAuthResponse = authResponse;

  var response = {
    authResponse : authResponse,
    status : status
  };

  if (logout || both) {
    Auth.inform('logout', response);
  }
  if (login || both) {
    Auth.inform('login', response);
  }
  if (authResponseChange) {
    Auth.inform('authresponse.change', response);
  }
  if (statusChange) {
    Auth.inform('status.change', response);
  }
  return response;
}, {"params":[[authResponse, '?object', 'authResponse'], [status, 'string', 'status']]});}__annotator(setAuthResponse, {"module":"sdk.Auth","line":29,"column":0,"name":"setAuthResponse"}, {"params":["?object","string"]});

function getAuthResponse() /*?object*/ {return __bodyWrapper(this, arguments, function() {
  return currentAuthResponse;
}, {"returns":'?object'});}__annotator(getAuthResponse, {"module":"sdk.Auth","line":85,"column":0,"name":"getAuthResponse"}, {"returns":"?object"});

function xdResponseWrapper(/*function*/ cb, /*?object*/ authResponse,
    /*?string*/ method) /*function*/ {return __bodyWrapper(this, arguments, function() {
  return __annotator(function (/*?object*/ params) /*?object*/ {return __bodyWrapper(this, arguments, function() {
    var status;

    if (params && params.access_token) {
      
      var parsedSignedRequest = SignedRequest.parse(params.signed_request);
      authResponse = {
        accessToken: params.access_token,
        userID: parsedSignedRequest.user_id,
        expiresIn: parseInt(params.expires_in, 10),
        signedRequest: params.signed_request
      };

      if (params.granted_scopes) {
        authResponse.grantedScopes = params.granted_scopes;
      }

      if (Runtime.getUseCookie()) {
        var expirationTime = authResponse.expiresIn === 0
          ? 0 // make this a session cookie if it's for offline access
          : ES('Date', 'now', false) + authResponse.expiresIn * 1000;
        var baseDomain = Cookie.getDomain();
        if (!baseDomain && params.base_domain) {
          
          
          
          
          Cookie.setDomain('.' + params.base_domain);
        }
        Cookie.setSignedRequestCookie(params.signed_request,
                                         expirationTime);
      }
      status = 'connected';
      setAuthResponse(authResponse, status);
    } else if (method === 'logout' || method === 'login_status') {
      
      
      
      
      if (params.error && params.error === 'not_authorized') {
        status = 'not_authorized';
      } else {
        status = 'unknown';
      }
      setAuthResponse(null, status);
      if (Runtime.getUseCookie()) {
        Cookie.clearSignedRequestCookie();
      }
    }

    
    if (params && params.https == 1) {
      Runtime.setSecure(true);
    }

    if (cb) {
      cb({
        authResponse: authResponse,
        status: Runtime.getLoginStatus()
      });
    }
    return authResponse;
  }, {"params":[[params, '?object', 'params']],"returns":'?object'});}, {"module":"sdk.Auth","line":91,"column":9}, {"params":["?object"],"returns":"?object"});
}, {"params":[[cb, 'function', 'cb'], [authResponse, '?object', 'authResponse'], [method, '?string', 'method']],"returns":'function'});}__annotator(xdResponseWrapper, {"module":"sdk.Auth","line":89,"column":0,"name":"xdResponseWrapper"}, {"params":["function","?object","?string"],"returns":"function"});

function fetchLoginStatus(/*function*/ fn) {return __bodyWrapper(this, arguments, function() {
  var frame, fetchStart = ES('Date', 'now', false);

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  var handleResponse = xdResponseWrapper(fn, currentAuthResponse,
    'login_status');

  var url = URI(UrlMap.resolve('www', true) + '/connect/ping')
    .setQueryData({
      client_id: Runtime.getClientID(),
      response_type: 'token,signed_request,code',
      domain: location.hostname,
      origin: getContextType(),
      redirect_uri: XD.handler(__annotator(function(/*object*/ response) {return __bodyWrapper(this, arguments, function() {
        if (feature('e2e_ping_tracking', true)) {
          var events = {
            init: fetchStart,
            close: ES('Date', 'now', false),
            method: 'ping'
          };
          Log.debug('e2e: %s', ES('JSON', 'stringify', false,events));
          
          Impressions.log(114, {
            payload: events
          });
        }
        frame.parentNode.removeChild(frame);
        if (handleResponse(response)) {
          
          timer = setTimeout(__annotator(function() {
            fetchLoginStatus(__annotator(function() {}, {"module":"sdk.Auth","line":190,"column":29}));
          }, {"module":"sdk.Auth","line":189,"column":29}), 1200000); 
        }
      }, {"params":[[response, 'object', 'response']]});}, {"module":"sdk.Auth","line":173,"column":31}, {"params":["object"]}), 'parent'),
      sdk: 'joey',
      kid_directed_site: Runtime.getKidDirectedSite()
    });

  frame = createIframe({
    root: DOMWrapper.getRoot(),
    name: guid(),
    url: url.toString(),
    style: { display: 'none' }
  });

}, {"params":[[fn, 'function', 'fn']]});}__annotator(fetchLoginStatus, {"module":"sdk.Auth","line":156,"column":0,"name":"fetchLoginStatus"}, {"params":["function"]});

var loadState;
function getLoginStatus(/*?function*/ cb, /*?boolean*/ force) {return __bodyWrapper(this, arguments, function() {
  if (!Runtime.getClientID()) {
    Log.warn('FB.getLoginStatus() called before calling FB.init().');
    return;
  }

  
  
  if (cb) {
    if (!force && loadState == 'loaded') {
      cb({ status: Runtime.getLoginStatus(),
           authResponse: getAuthResponse()});
      return;
    } else {
      Auth.subscribe('FB.loginStatus', cb);
    }
  }

  // if we're already loading, and this is not a force load, we're done
  if (!force && loadState == 'loading') {
    return;
  }

  loadState = 'loading';

  
  var lsCb = __annotator(function(/*?object*/ response) {return __bodyWrapper(this, arguments, function() {
    
    loadState = 'loaded';

    
    Auth.inform('FB.loginStatus', response);
    Auth.clearSubscribers('FB.loginStatus');
  }, {"params":[[response, '?object', 'response']]});}, {"module":"sdk.Auth","line":234,"column":13}, {"params":["?object"]});

  fetchLoginStatus(lsCb);
}, {"params":[[cb, '?function', 'cb'], [force, '?boolean', 'force']]});}__annotator(getLoginStatus, {"module":"sdk.Auth","line":208,"column":0,"name":"getLoginStatus"}, {"params":["?function","?boolean"]});

ES('Object', 'assign', false,Auth, {
  getLoginStatus: getLoginStatus,
  fetchLoginStatus: fetchLoginStatus,
  setAuthResponse: setAuthResponse,
  getAuthResponse: getAuthResponse,
  parseSignedRequest: SignedRequest.parse,
  
  xdResponseWrapper: xdResponseWrapper
});

module.exports = Auth;


}, {"module":"sdk.Auth","line":7,"column":208}),null);


__d("toArray",["invariant"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,invariant) {require.__markCompiled && require.__markCompiled();
   


function toArray(obj) {return __bodyWrapper(this, arguments, function() {
  var length = obj.length;

  // Some browse builtin objects can report typeof 'function' (e.g. NodeList in
  
  invariant(
    !ES('Array', 'isArray', false,obj) &&
    (typeof obj === 'object' || typeof obj === 'function'),
    'toArray: Array-like object expected'
  );

  invariant(
    typeof length === 'number',
    'toArray: Object needs a length property'
  );

  invariant(
    length === 0 ||
    (length - 1) in obj,
    'toArray: Object should have keys for indices'
  );

  // Old IE doesn't give collections access to hasOwnProperty. Assume inputs
  
  
  if (obj.hasOwnProperty) {
    try {
      return Array.prototype.slice.call(obj);
    } catch (e) {
      
    }
  }

  
  
  var ret = Array(length);
  for (var ii = 0; ii < length; ii++) {
    ret[ii] = obj[ii];
  }
  return ret;
}, {"params":[[obj, 'object|function|filelist', 'obj']],"returns":'array'});}__annotator(toArray, {"module":"toArray","line":32,"column":0,"name":"toArray"}, {"params":["object|function|filelist"],"returns":"array"});

module.exports = toArray;


}, {"module":"toArray","line":20,"column":28}),null);


__d("createArrayFromMixed",["toArray"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,toArray) {require.__markCompiled && require.__markCompiled();
   


function hasArrayNature(obj) {return __bodyWrapper(this, arguments, function() {
  return (
    
    !!obj &&
    
    (typeof obj == 'object' || typeof obj == 'function') &&
    
    ('length' in obj) &&
    
    !('setInterval' in obj) &&
    
    // a 'select' element has 'length' and 'item' properties on IE8
    (typeof obj.nodeType != 'number') &&
    (
      
      ES('Array', 'isArray', false,obj) ||
      
      ('callee' in obj) ||
      
      ('item' in obj)
    )
  );
}, {"returns":'boolean'});}__annotator(hasArrayNature, {"module":"createArrayFromMixed","line":38,"column":0,"name":"hasArrayNature"}, {"returns":"boolean"});


function createArrayFromMixed(obj) {return __bodyWrapper(this, arguments, function() {
  if (!hasArrayNature(obj)) {
    return [obj];
  } else if (ES('Array', 'isArray', false,obj)) {
    return obj.slice();
  } else {
    return toArray(obj);
  }
}, {"returns":'array'});}__annotator(createArrayFromMixed, {"module":"createArrayFromMixed","line":83,"column":0,"name":"createArrayFromMixed"}, {"returns":"array"});

module.exports = createArrayFromMixed;


}, {"module":"createArrayFromMixed","line":20,"column":39}),null);


__d("sdk.DOM",["Assert","sdk.UA","createArrayFromMixed","sdk.domReady"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Assert,UA,createArrayFromMixed,domReady) {require.__markCompiled && require.__markCompiled();
   
   

   
   

var cssRules = {};

function getAttr(/*DOMElement*/ dom, /*string*/ name) /*?string*/ {return __bodyWrapper(this, arguments, function() {
  var attribute = (
    dom.getAttribute(name) ||
    dom.getAttribute(name.replace(/_/g, '-')) ||
    dom.getAttribute(name.replace(/-/g, '_')) ||
    dom.getAttribute(name.replace(/-/g, '')) ||
    dom.getAttribute(name.replace(/_/g, '')) ||
    dom.getAttribute('data-' + name) ||
    dom.getAttribute('data-' + name.replace(/_/g, '-')) ||
    dom.getAttribute('data-' + name.replace(/-/g, '_')) ||
    dom.getAttribute('data-' + name.replace(/-/g, '')) ||
    dom.getAttribute('data-' + name.replace(/_/g, ''))
  );
  return attribute
    ? String(attribute)
    : null;
}, {"params":[[dom, 'HTMLElement', 'dom'], [name, 'string', 'name']],"returns":'?string'});}__annotator(getAttr, {"module":"sdk.DOM","line":16,"column":0,"name":"getAttr"}, {"params":["DOMElement","string"],"returns":"?string"});

function getBoolAttr(/*DOMElement*/ dom, /*string*/ name) /*?boolean*/ {return __bodyWrapper(this, arguments, function() {
  var attribute = getAttr(dom, name);
  return attribute
    ? /^(true|1|yes|on)$/.test(attribute)
    : null;
}, {"params":[[dom, 'HTMLElement', 'dom'], [name, 'string', 'name']],"returns":'?boolean'});}__annotator(getBoolAttr, {"module":"sdk.DOM","line":34,"column":0,"name":"getBoolAttr"}, {"params":["DOMElement","string"],"returns":"?boolean"});

function getProp(/*DOMElement*/ dom, /*string*/ name) /*string*/ {return __bodyWrapper(this, arguments, function() {
  Assert.isTruthy(dom, 'element not specified');
  Assert.isString(name);

  try {
    return String(dom[name]);
  } catch (e) {
    throw new Error('Could not read property ' + name + ' : ' + e.message);
  }
}, {"params":[[dom, 'HTMLElement', 'dom'], [name, 'string', 'name']],"returns":'string'});}__annotator(getProp, {"module":"sdk.DOM","line":41,"column":0,"name":"getProp"}, {"params":["DOMElement","string"],"returns":"string"});

function html(/*DOMElement*/ dom, /*string*/ content) {return __bodyWrapper(this, arguments, function() {
  Assert.isTruthy(dom, 'element not specified');
  Assert.isString(content);

  try {
    dom.innerHTML = content;
  } catch (e) {
    throw new Error('Could not set innerHTML : ' + e.message);
  }
}, {"params":[[dom, 'HTMLElement', 'dom'], [content, 'string', 'content']]});}__annotator(html, {"module":"sdk.DOM","line":52,"column":0,"name":"html"}, {"params":["DOMElement","string"]});


function hasClass(/*DOMElement*/ dom, /*string*/ className) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  Assert.isTruthy(dom, 'element not specified');
  Assert.isString(className);

  var cssClassWithSpace = ' ' + getProp(dom, 'className') + ' ';
  return ES(cssClassWithSpace, 'indexOf', true,' ' + className + ' ') >= 0;
}, {"params":[[dom, 'HTMLElement', 'dom'], [className, 'string', 'className']],"returns":'boolean'});}__annotator(hasClass, {"module":"sdk.DOM","line":66,"column":0,"name":"hasClass"}, {"params":["DOMElement","string"],"returns":"boolean"});


function addClass(/*DOMElement*/ dom, /*string*/ className) {return __bodyWrapper(this, arguments, function() {
  Assert.isTruthy(dom, 'element not specified');
  Assert.isString(className);

  if (!hasClass(dom, className)) {
    dom.className = getProp(dom, 'className') + ' ' + className;
  }
}, {"params":[[dom, 'HTMLElement', 'dom'], [className, 'string', 'className']]});}__annotator(addClass, {"module":"sdk.DOM","line":77,"column":0,"name":"addClass"}, {"params":["DOMElement","string"]});


function removeClass(/*DOMElement*/ dom, /*string*/ className) {return __bodyWrapper(this, arguments, function() {
  Assert.isTruthy(dom, 'element not specified');
  Assert.isString(className);

  var regExp = new RegExp('\\s*' + className, 'g');
  dom.className = ES(getProp(dom, 'className').replace(regExp, ''),'trim', true);
}, {"params":[[dom, 'HTMLElement', 'dom'], [className, 'string', 'className']]});}__annotator(removeClass, {"module":"sdk.DOM","line":89,"column":0,"name":"removeClass"}, {"params":["DOMElement","string"]});


function getByClass(/*string*/ className, dom, tagName) /*array<DOMElement>*/ {return __bodyWrapper(this, arguments, function() {
  Assert.isString(className);

  dom = dom || document.body;
  tagName = tagName || '*';
  if (dom.querySelectorAll) {
    return createArrayFromMixed(
      dom.querySelectorAll(tagName + '.' + className)
    );
  }
  var all = dom.getElementsByTagName(tagName),
      els = [];
  for (var i = 0, len = all.length; i < len; i++) {
    if (hasClass(all[i], className)) {
      els[els.length] = all[i];
    }
  }
  return els;
}, {"params":[[className, 'string', 'className']],"returns":'array<HTMLElement>'});}__annotator(getByClass, {"module":"sdk.DOM","line":103,"column":0,"name":"getByClass"}, {"params":["string"],"returns":"array<DOMElement>"});


function getStyle(/*DOMElement*/ dom, /*string*/ styleProp) /*string*/ {return __bodyWrapper(this, arguments, function() {
  Assert.isTruthy(dom, 'element not specified');
  Assert.isString(styleProp);

  // camelCase (e.g. 'marginTop')
  styleProp = styleProp.replace(/-(\w)/g, __annotator(function(m, g1) {
    return g1.toUpperCase();
  }, {"module":"sdk.DOM","line":136,"column":42}));

  var currentStyle = dom.currentStyle ||
    document.defaultView.getComputedStyle(dom, null);

  var computedStyle = currentStyle[styleProp];

  
  // for some reason it doesn't return '0%' for defaults. so needed to
  // translate 'top' and 'left' into '0px'
  if (/backgroundPosition?/.test(styleProp) &&
      /top|left/.test(computedStyle)) {
    computedStyle = '0%';
  }
  return computedStyle;
}, {"params":[[dom, 'HTMLElement', 'dom'], [styleProp, 'string', 'styleProp']],"returns":'string'});}__annotator(getStyle, {"module":"sdk.DOM","line":131,"column":0,"name":"getStyle"}, {"params":["DOMElement","string"],"returns":"string"});


function setStyle(/*DOMElement*/ dom, /*string*/ styleProp, value) {return __bodyWrapper(this, arguments, function() {
  Assert.isTruthy(dom, 'element not specified');
  Assert.isString(styleProp);

  // camelCase (e.g. 'marginTop')
  styleProp = styleProp.replace(/-(\w)/g, __annotator(function(m, g1) {
    return g1.toUpperCase();
  }, {"module":"sdk.DOM","line":166,"column":42}));
  dom.style[styleProp] = value;
}, {"params":[[dom, 'HTMLElement', 'dom'], [styleProp, 'string', 'styleProp']]});}__annotator(setStyle, {"module":"sdk.DOM","line":161,"column":0,"name":"setStyle"}, {"params":["DOMElement","string"]});


function addCssRules(/*string*/ styles, /*array<string>*/ names) {return __bodyWrapper(this, arguments, function() {
  
  
  var allIncluded = true;
  for (var i = 0, id; id = names[i++];) {
    if (!(id in cssRules)) {
      allIncluded = false;
      cssRules[id] = true;
    }
  }

  if (allIncluded) {
    return;
  }

  if (UA.ie() < 11) {
    try {
      document.createStyleSheet().cssText = styles;
    } catch (exc) {
      
      
      
      if (document.styleSheets[0]) {
        document.styleSheets[0].cssText += styles;
      }
    }
  } else {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = styles;
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}, {"params":[[styles, 'string', 'styles'], [names, 'array<string>', 'names']]});}__annotator(addCssRules, {"module":"sdk.DOM","line":175,"column":0,"name":"addCssRules"}, {"params":["string","array<string>"]});


function getViewportInfo() /*object*/ {return __bodyWrapper(this, arguments, function() {
  
  var root = (document.documentElement && document.compatMode == 'CSS1Compat')
    ? document.documentElement
    : document.body;

  return {
    
    scrollTop  : root.scrollTop || document.body.scrollTop,
    scrollLeft : root.scrollLeft || document.body.scrollLeft,
    width      : window.innerWidth  ? window.innerWidth  : root.clientWidth,
    height     : window.innerHeight ? window.innerHeight : root.clientHeight
  };
}, {"returns":'object'});}__annotator(getViewportInfo, {"module":"sdk.DOM","line":213,"column":0,"name":"getViewportInfo"}, {"returns":"object"});


function getPosition(/*DOMElement*/ node) /*object*/ {return __bodyWrapper(this, arguments, function() {
  Assert.isTruthy(node, 'element not specified');

  var x = 0,
      y = 0;
  do {
    x += node.offsetLeft;
    y += node.offsetTop;
  } while (node = node.offsetParent);

  return {x: x, y: y};
}, {"params":[[node, 'HTMLElement', 'node']],"returns":'object'});}__annotator(getPosition, {"module":"sdk.DOM","line":232,"column":0,"name":"getPosition"}, {"params":["DOMElement"],"returns":"object"});


var DOM = {
  containsCss: hasClass,
  addCss: addClass,
  removeCss: removeClass,
  getByClass: getByClass,

  getStyle: getStyle,
  setStyle: setStyle,

  getAttr: getAttr,
  getBoolAttr: getBoolAttr,
  getProp: getProp,

  html: html,

  addCssRules: addCssRules,

  getViewportInfo: getViewportInfo,
  getPosition: getPosition,

  ready: domReady
};

module.exports = DOM;


}, {"module":"sdk.DOM","line":7,"column":72}),null);


__d("sdk.ErrorHandling",["ManagedError","sdk.Runtime","sdk.Scribe","sdk.UA","sdk.feature","wrapFunction"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ManagedError,Runtime,Scribe,UA,feature,wrapFunction) {require.__markCompiled && require.__markCompiled();
   
   
   
   

   
   

var handleError = feature('error_handling', false);
var currentEntry = '';

function errorHandler(/*object*/ error) {return __bodyWrapper(this, arguments, function() {
  var originalError = error._originalError;
  delete error._originalError;
  Scribe.log('jssdk_error', {
    appId: Runtime.getClientID(),
    error: error.name || error.message,
    extra: error
  });

  
  throw originalError;
}, {"params":[[error, 'object', 'error']]});}__annotator(errorHandler, {"module":"sdk.ErrorHandling","line":19,"column":0,"name":"errorHandler"}, {"params":["object"]});


function normalizeError(err) /*object*/ {return __bodyWrapper(this, arguments, function() {
  var info = {
    line: err.lineNumber || err.line,
    message: err.message,
    name: err.name,
    script: err.fileName || err.sourceURL || err.script,
    stack: err.stackTrace || err.stack
  };

  
  info._originalError = err;

  // Chrome: There's no script/line info in Error objects, and if you rethrow
  
  
  
  if (UA.chrome() && /([\w:\.\/]+\.js):(\d+)/.test(err.stack)) {
    info.script = RegExp.$1;
    info.line = parseInt(RegExp.$2, 10);
  }

  
  for (var k in info) {
    (info[k] == null && delete info[k]);
  }
  return info;
}, {"returns":'object'});}__annotator(normalizeError, {"module":"sdk.ErrorHandling","line":39,"column":0,"name":"normalizeError"}, {"returns":"object"});

function guard(/*function*/ func, /*?string*/ entry) /*function*/ {return __bodyWrapper(this, arguments, function() {
  return __annotator(function() {
    
    
    if (!handleError) {
      return func.apply(this, arguments);
    }

    try {
      currentEntry = entry;
      return func.apply(this, arguments);
    } catch(error) {
      
      
      if (error instanceof ManagedError) {
        throw error;
      }

      var data = normalizeError(error);
      data.entry = entry;

      
      var sanitizedArgs = ES(Array.prototype.slice.call(arguments), 'map', true,__annotator(function(arg) {
        var type = Object.prototype.toString.call(arg);
        return (/^\[object (String|Number|Boolean|Object|Date)\]$/).test(type)
          ? arg
          : arg.toString();
      }, {"module":"sdk.ErrorHandling","line":90,"column":13}));

      data.args = ES('JSON', 'stringify', false,sanitizedArgs).substring(0, 200);
      errorHandler(data);
    } finally {
      currentEntry = '';
    }
  }, {"module":"sdk.ErrorHandling","line":68,"column":9});
}, {"params":[[func, 'function', 'func'], [entry, '?string', 'entry']],"returns":'function'});}__annotator(guard, {"module":"sdk.ErrorHandling","line":67,"column":0,"name":"guard"}, {"params":["function","?string"],"returns":"function"});

function unguard(/*function*/ func) /*function*/ {return __bodyWrapper(this, arguments, function() {
  if (!func.__wrapper) {
    func.__wrapper = __annotator(function() {
      try {
        return func.apply(this, arguments);
      } catch(e) {
        
        window.setTimeout(__annotator(function() {
          throw e;
        }, {"module":"sdk.ErrorHandling","line":112,"column":26}), 0);
        return false;
      }
    }, {"module":"sdk.ErrorHandling","line":107,"column":21});
  }
  return func.__wrapper;
}, {"params":[[func, 'function', 'func']],"returns":'function'});}__annotator(unguard, {"module":"sdk.ErrorHandling","line":105,"column":0,"name":"unguard"}, {"params":["function"],"returns":"function"});

function wrap(real, entry) {
  return __annotator(function(fn, delay) {
    var name = entry + ':' +
      (currentEntry || '[global]') + ':' +
      (fn.name
       || '[anonymous]' + (arguments.callee.caller.name
         ? '(' +  arguments.callee.caller.name + ')'
         : ''));
    return real(wrapFunction(fn, 'entry', name), delay);
  }, {"module":"sdk.ErrorHandling","line":123,"column":9});
}__annotator(wrap, {"module":"sdk.ErrorHandling","line":122,"column":0,"name":"wrap"});

if (handleError) {
  
  setTimeout = wrap(setTimeout, 'setTimeout');
  setInterval = wrap(setInterval, 'setInterval');
  wrapFunction.setWrapper(guard, 'entry');
}


var ErrorHandler = {
  guard: guard,
  unguard: unguard
};

module.exports = ErrorHandler;


}, {"module":"sdk.ErrorHandling","line":7,"column":106}),null);


__d("sdk.Insights",["sdk.Impressions"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Impressions) {require.__markCompiled && require.__markCompiled();
   

var Insights = {
  TYPE: {
    NOTICE: 'notice',
    WARNING: 'warn',
    ERROR: 'error'
  },
  CATEGORY:  {
    DEPRECATED: 'deprecated',
    APIERROR: 'apierror'
  },

  
  log: __annotator(function(/*string*/ type, /*string*/ category, /*string*/ content) {return __bodyWrapper(this, arguments, function() {
    var payload = {
      source: 'jssdk',
      type: type,
      category: category,
      payload: content
    };

    Impressions.log(
      113, 
      payload
    );
  }, {"params":[[type, 'string', 'type'], [category, 'string', 'category'], [content, 'string', 'content']]});}, {"module":"sdk.Insights","line":22,"column":7}, {"params":["string","string","string"]}),
  
  impression: Impressions.impression
};

module.exports = Insights;


}, {"module":"sdk.Insights","line":7,"column":39}),null);


__d("FB",["sdk.Auth","JSSDKCssConfig","dotAccess","sdk.domReady","sdk.DOM","sdk.ErrorHandling","sdk.Content","DOMWrapper","GlobalCallback","sdk.Insights","Log","sdk.Runtime","sdk.Scribe","JSSDKConfig"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Auth,CssConfig,dotAccess,domReady,DOM,ErrorHandling,Content,DOMWrapper,GlobalCallback,Insights,Log,Runtime,Scribe,SDKConfig) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   
   
   
   
   
   

var externalInterface;
var apiWhitelist, apiWhitelistMode = dotAccess(SDKConfig, 'api.mode');
var logged = {};
externalInterface = window.FB = {};
var FB = {};

if (__DEV__) {
  FB.require = require;
  window._FB = FB
}




Log.level = __DEV__ ? 3 : 1;

// Whitelisted by our SWF's
GlobalCallback.setPrefix('FB.__globalCallbacks');

var fbRoot = document.createElement('div');
DOMWrapper.setRoot(fbRoot);

domReady(__annotator(function() {
  Log.info('domReady');
  Content.appendHidden(fbRoot);
  if (CssConfig.rules) {
    DOM.addCssRules(CssConfig.rules, CssConfig.components);
  }
}, {"module":"FB","line":52,"column":9}));

Runtime.subscribe('AccessToken.change', __annotator(function(/*?string*/ value) {return __bodyWrapper(this, arguments, function() {
  if (!value && Runtime.getLoginStatus() === 'connected') {
    // The access token was invalidated, but we're still connected
    
    Auth.getLoginStatus(null, true);
  }
}, {"params":[[value, '?string', 'value']]});}, {"module":"FB","line":60,"column":40}, {"params":["?string"]}));



if (dotAccess(SDKConfig, 'api.whitelist.length')) {
  apiWhitelist = {};
  ES(SDKConfig.api.whitelist, 'forEach', true,__annotator(function(/*string*/ key) {return __bodyWrapper(this, arguments, function() {
    apiWhitelist[key] = 1;
  }, {"params":[[key, 'string', 'key']]});}, {"module":"FB","line":72,"column":34}, {"params":["string"]}));
}

function protect(/*function*/ fn, /*string*/ accessor, /*string*/ key,
    /*object*/ context) /*?function*/ {return __bodyWrapper(this, arguments, function() {
  var exportMode;
  if (/^_/.test(key)) {
    exportMode = 'hide';
  } else if (apiWhitelist && !apiWhitelist[accessor]) {
    exportMode = apiWhitelistMode;
  }

  switch(exportMode) {
    case 'hide':
      return;
    case 'stub':
      return __annotator(function() {
        Log.warn('The method FB.%s has been removed from the JS SDK.',
          accessor);
      }, {"module":"FB","line":90,"column":13});
      break;
    default:
      return ErrorHandling.guard(__annotator(function(/*args*/) {
        if (exportMode === 'warn') {
          Log.warn('The method FB.%s is not officially supported by ' +
            'Facebook and access to it will soon be removed.', accessor);
          if (!logged.hasOwnProperty(accessor)) {
            Insights.log(
              Insights.TYPE.WARNING,
              Insights.CATEGORY.DEPRECATED,
              'FB.' + accessor
            );

            
            Scribe.log('jssdk_error', {
              appId: Runtime.getClientID(),
              error: 'Private method used',
              extra: {args: accessor}
            });

            logged[accessor] = true;
          }
        }

        function unwrap(val) {
          if (ES('Array', 'isArray', false,val)) {
            return ES(val, 'map', true,unwrap);
          }
          if (val && typeof val === 'object' && val.__wrapped) {
            
            return val.__wrapped;
          }
          
          // throwing an error during execution, it doesn't bubble up through
          // the JS SDK's callstack.
          // Due to FF's typeof returning 'function' for HTMLObjectElement,
          
          return typeof val === 'function' && /^function/.test(val.toString())
            ? ErrorHandling.unguard(val)
            : val;
        }__annotator(unwrap, {"module":"FB","line":118,"column":8,"name":"unwrap"});

        var args = ES(Array.prototype.slice.call(arguments), 'map', true,unwrap);

        var result = fn.apply(context, args);
        var facade;
        var isPlainObject = true;

        if (result && typeof result === 'object') {
          // Create a 'facade' object that we can return
          
          // object, they aren't subject to the same limitations :)
          facade = ES('Object', 'create', false,result);
          facade.__wrapped = result;

          
          
          for (var key in result) {
            var property = result[key];
            if (typeof property !== 'function' || key === 'constructor') {
              continue;
            }
            isPlainObject = false;
            facade[key] = protect(property, accessor + ':' + key, key, result);
          }
        }

          if (!isPlainObject) {
            return facade;
          }
        return isPlainObject
          ? result
          : facade;
      }, {"module":"FB","line":96,"column":33}), accessor);
  }
}, {"params":[[fn, 'function', 'fn'], [accessor, 'string', 'accessor'], [key, 'string', 'key'], [context, 'object', 'context']],"returns":'?function'});}__annotator(protect, {"module":"FB","line":77,"column":0,"name":"protect"}, {"params":["function","string","string","object"],"returns":"?function"});


function provide(/*string*/ name, /*object*/ source) {return __bodyWrapper(this, arguments, function() {
  var externalTarget = name
    ? dotAccess(externalInterface, name, true)
    : externalInterface;

  ES(ES('Object', 'keys', false,source), 'forEach', true,__annotator(function(/*string*/ key) {return __bodyWrapper(this, arguments, function() {
    var value = source[key];

    
    if (typeof value === 'function') {
      var accessor = (name ? name + '.' : '') + key;
      var exportedProperty = protect(value, accessor, key, source);
      if (exportedProperty) {
        externalTarget[key] = exportedProperty;
      }
    } else if (typeof value === 'object') {
      
      accessor = (name ? name + '.' : '') + key;
      if(apiWhitelist && apiWhitelist[accessor]) {
        externalTarget[key] = value;
      }
    }
  }, {"params":[[key, 'string', 'key']]});}, {"module":"FB","line":189,"column":30}, {"params":["string"]}));
}, {"params":[[name, 'string', 'name'], [source, 'object', 'source']]});}__annotator(provide, {"module":"FB","line":184,"column":0,"name":"provide"}, {"params":["string","object"]});



Runtime.setSecure((__annotator(function() /*?boolean*/ {return __bodyWrapper(this, arguments, function() {
  // Resolve whether we're in a canvas context or not
  var inCanvas = /iframe_canvas|app_runner/.test(window.name);
  var inDialog = /dialog/.test(window.name);

  
  
  if (location.protocol == 'https:' &&
      (window == top || !(inCanvas || inDialog))) {
    
    
    
    return true;
  }

  
  
  if (/_fb_https?/.test(window.name)) {
    return ES(window.name, 'indexOf', true,'_fb_https') != -1;
  }
}, {"returns":'?boolean'});}, {"module":"FB","line":211,"column":19}, {"returns":"?boolean"}))());


ES('Object', 'assign', false,FB, {

  
  provide: provide

});

module.exports = FB;


}, {"module":"FB","line":14,"column":202}),null);


__d("ArgumentError",["ManagedError"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ManagedError) {require.__markCompiled && require.__markCompiled();
   

function ArgumentError(message, innerError) {
  ManagedError.prototype.constructor.apply(this, arguments);
}__annotator(ArgumentError, {"module":"ArgumentError","line":12,"column":0,"name":"ArgumentError"});
ArgumentError.prototype = new ManagedError();
ArgumentError.prototype.constructor = ArgumentError;

module.exports = ArgumentError;


}, {"module":"ArgumentError","line":9,"column":37}),null);

__d("CORSRequest",["wrapFunction","QueryString"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,wrapFunction,QueryString) {require.__markCompiled && require.__markCompiled();
/*global self:true*/
   
   

function createCORSRequest(/*string*/ method, /*string*/ url) /*?object*/ {return __bodyWrapper(this, arguments, function() {
   if (!self.XMLHttpRequest) {
    return null;
   }
   var xhr = new XMLHttpRequest();
   var noop = __annotator(function() {}, {"module":"CORSRequest","line":30,"column":14});
   if ('withCredentials' in xhr) {
     xhr.open(method, url, true);
     xhr.setRequestHeader(
       'Content-type', 'application/x-www-form-urlencoded');
   } else if (self.XDomainRequest) {
     xhr = new XDomainRequest();
     try {
       
       
       
       
       xhr.open(method, url);

       
       
       
       
       
       
       xhr.onprogress = xhr.ontimeout = noop;
     } catch (accessDeniedError) {
       return null;
     }
   } else {
     return null;
   }

   var wrapper = {
     send: __annotator(function(/*string*/ data) {return __bodyWrapper(this, arguments, function() {
       xhr.send(data);
     }, {"params":[[data, 'string', 'data']]});}, {"module":"CORSRequest","line":59,"column":11}, {"params":["string"]})
   };
   var onload = wrapFunction(__annotator(function() {
     onload = noop;
     if ('onload' in wrapper)  {
       wrapper.onload(xhr);
     }
   }, {"module":"CORSRequest","line":63,"column":29}), 'entry', 'XMLHttpRequest:load');
   var onerror = wrapFunction(__annotator(function() {
     onerror = noop;
     if ('onerror' in wrapper) {
       wrapper.onerror(xhr);
     }
   }, {"module":"CORSRequest","line":69,"column":30}), 'entry', 'XMLHttpRequest:error');

   
   
   
   

   xhr.onload = __annotator(function() {
     onload();
   }, {"module":"CORSRequest","line":81,"column":16});

   xhr.onerror = __annotator(function() {
     onerror();
   }, {"module":"CORSRequest","line":85,"column":17});

   xhr.onreadystatechange = __annotator(function() {
     if (xhr.readyState == 4) {
       if (xhr.status == 200) {
         onload();
       } else {
         onerror();
       }
     }
   }, {"module":"CORSRequest","line":89,"column":28});

   return wrapper;
}, {"params":[[method, 'string', 'method'], [url, 'string', 'url']],"returns":'?object'});}__annotator(createCORSRequest, {"module":"CORSRequest","line":25,"column":0,"name":"createCORSRequest"}, {"params":["string","string"],"returns":"?object"});

function execute(/*string*/ url, /*string*/ method, /*object*/ params,
    /*function*/ cb) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  params.suppress_http_code = 1;
  var data = QueryString.encode(params);

  if (method != 'post') {
    url = QueryString.appendToUrl(url, data);
    data = '';
  }

  var request = createCORSRequest(method, url);
  if (!request) {
    return false;
  }

  request.onload = __annotator(function(xhr) {
    cb(ES('JSON', 'parse', false,xhr.responseText));
  }, {"module":"CORSRequest","line":117,"column":19});
  request.onerror = __annotator(function(xhr) {
    if (xhr.responseText) {
      cb(ES('JSON', 'parse', false,xhr.responseText));
    } else {
      cb({
        error: {
          type   : 'http',
          message: 'unknown error',
          status : xhr.status
        }
      });
    }
  }, {"module":"CORSRequest","line":120,"column":20});
  request.send(data);
  return true;
}, {"params":[[url, 'string', 'url'], [method, 'string', 'method'], [params, 'object', 'params'], [cb, 'function', 'cb']],"returns":'boolean'});}__annotator(execute, {"module":"CORSRequest","line":102,"column":0,"name":"execute"}, {"params":["string","string","object","function"],"returns":"boolean"});

var CORSRequest = {
  execute: execute
};
module.exports = CORSRequest;


}, {"module":"CORSRequest","line":20,"column":52}),null);


__d("FlashRequest",["DOMWrapper","Flash","GlobalCallback","QueryString","Queue"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,DOMWrapper,Flash,GlobalCallback,QueryString,Queue) {require.__markCompiled && require.__markCompiled();
       
            
   
      
            

var flashQueue; 
var requestCallbacks = {}; 
var swfUrl; 
var swf; 

function initFlash() {
  if (!swfUrl) {
    throw new Error('swfUrl has not been set');
  }

  var initCallback = GlobalCallback.create(__annotator(function() {
    flashQueue.start(__annotator(function(/*object*/ item) {return __bodyWrapper(this, arguments, function() {
      var id = swf.execute(
        item.method,
        item.url,
        item.body);

      if (!id) {
        throw new Error('Could create request');
      }
      requestCallbacks[id] = item.callback;
    }, {"params":[[item, 'object', 'item']]});}, {"module":"FlashRequest","line":42,"column":21}, {"params":["object"]}));
  }, {"module":"FlashRequest","line":41,"column":43}));

  
  var requestCallback = GlobalCallback.create(__annotator(function(/*number*/ id,
      /*number*/ status, /*string*/ response) {return __bodyWrapper(this, arguments, function() {
    var data;
    try {
      data = ES('JSON', 'parse', false,decodeURIComponent(response));
    } catch (parseError) {
      data = {
        error: {
          type   : 'SyntaxError',
          message: parseError.message,
          status : status,
          raw    : response
        }
      };
    }

    requestCallbacks[id](data);
    delete requestCallbacks[id];
  }, {"params":[[id, 'number', 'id'], [status, 'number', 'status'], [response, 'string', 'response']]});}, {"module":"FlashRequest","line":56,"column":46}, {"params":["number","number","string"]}));

  swf = Flash.embed(swfUrl, DOMWrapper.getRoot(), null, {
    log: __DEV__ ? true : false,
    initCallback: initCallback,
    requestCallback: requestCallback
  });
}__annotator(initFlash, {"module":"FlashRequest","line":36,"column":0,"name":"initFlash"});


function execute(/*string*/ url, /*string*/ method, /*object*/ params,
    /*function*/ cb) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  
  
  params.suppress_http_code = 1;

  
  
  
  if (!params.method) {
    params.method = method;
  }


  var body = QueryString.encode(params);
  if (method === 'get' && url.length + body.length < 2000) {
    
    
    url = QueryString.appendToUrl(url, body);
    body = '';
  } else {
    method = 'post';
  }

  
  if (!flashQueue) {
    if (!Flash.isAvailable()) {
      return false;
    }
    flashQueue = new Queue();
    initFlash();
  }

  
  flashQueue.enqueue({
    method: method,
    url: url,
    body: body,
    callback: cb
  });
  return true;
}, {"params":[[url, 'string', 'url'], [method, 'string', 'method'], [params, 'object', 'params'], [cb, 'function', 'cb']],"returns":'boolean'});}__annotator(execute, {"module":"FlashRequest","line":91,"column":0,"name":"execute"}, {"params":["string","string","object","function"],"returns":"boolean"});

var FlashRequest = {
  setSwfUrl: __annotator(function(/*string*/ swf_url) {return __bodyWrapper(this, arguments, function() {
    swfUrl = swf_url;
  }, {"params":[[swf_url, 'string', 'swf_url']]});}, {"module":"FlashRequest","line":135,"column":13}, {"params":["string"]}),
  execute: execute
};

module.exports = FlashRequest;


}, {"module":"FlashRequest","line":24,"column":81}),null);


__d("flattenObject",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();

function flattenObject(/*object*/ obj) /*object*/ {return __bodyWrapper(this, arguments, function() {
  var flat = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var value = obj[key];
      if (null === value || (void 0) === value) {
        continue;
      } else if (typeof value == 'string') {
        flat[key] = value;
      } else {
        flat[key] = ES('JSON', 'stringify', false,value); }
    }
  }
  return flat;
}, {"params":[[obj, 'object', 'obj']],"returns":'object'});}__annotator(flattenObject, {"module":"flattenObject","line":17,"column":0,"name":"flattenObject"}, {"params":["object"],"returns":"object"});

module.exports = flattenObject;


}, {"module":"flattenObject","line":7,"column":23}),null);


__d("JSONPRequest",["DOMWrapper","GlobalCallback","QueryString"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,DOMWrapper,GlobalCallback,QueryString) {require.__markCompiled && require.__markCompiled();
       
   
      

var MAX_QUERYSTRING_LENGTH = 2000;


function execute(/*string*/ url, /*string*/ method, /*object*/ params,
    /*function*/ cb) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  var script = document.createElement('script');

  var callbackWrapper = __annotator(function(response) {
    callbackWrapper = __annotator(function() {}, {"module":"JSONPRequest","line":41,"column":22});
    GlobalCallback.remove(params.callback);
    cb(response);
    script.parentNode.removeChild(script);
  }, {"module":"JSONPRequest","line":40,"column":24});

  params.callback = GlobalCallback.create(callbackWrapper);

  
  if (!params.method) {
    params.method = method;
  }

  url = QueryString.appendToUrl(url, params);
  if (url.length > MAX_QUERYSTRING_LENGTH) {
    GlobalCallback.remove(params.callback);
    return false;
  }

  
  script.onerror = __annotator(function() {
    callbackWrapper({
      error: {
        type   : 'http',
        message: 'unknown error'
      }
    });
  }, {"module":"JSONPRequest","line":61,"column":19});

  
  var ensureCallbackCalled = __annotator(function() {
    setTimeout(__annotator(function() {
      
      
      callbackWrapper({
        error: {
          type   : 'http',
          message: 'unknown error'
        }
      });
    }, {"module":"JSONPRequest","line":72,"column":15}), 0);
  }, {"module":"JSONPRequest","line":71,"column":29});
  if (script.addEventListener) {
    script.addEventListener('load', ensureCallbackCalled, false);
  } else {
    script.onreadystatechange = __annotator(function() {
      if (/loaded|complete/.test(this.readyState)) {
        ensureCallbackCalled();
      }
    }, {"module":"JSONPRequest","line":86,"column":32});
  }

  script.src = url;
  DOMWrapper.getRoot().appendChild(script);
  return true;
}, {"params":[[url, 'string', 'url'], [method, 'string', 'method'], [params, 'object', 'params'], [cb, 'function', 'cb']],"returns":'boolean'});}__annotator(execute, {"module":"JSONPRequest","line":36,"column":0,"name":"execute"}, {"params":["string","string","object","function"],"returns":"boolean"});

var JSONPRequest = {
  execute: execute,
  MAX_QUERYSTRING_LENGTH: MAX_QUERYSTRING_LENGTH
};

module.exports = JSONPRequest;


}, {"module":"JSONPRequest","line":21,"column":65}),null);


__d("ApiClient",["ArgumentError","Assert","CORSRequest","FlashRequest","flattenObject","JSONPRequest","Log","ObservableMixin","QueryString","sprintf","sdk.URI","UrlMap","ApiClientConfig","invariant"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ArgumentError,Assert,CORSRequest,FlashRequest,flattenObject,JSONPRequest,Log,ObservableMixin,QueryString,sprintf,URI,UrlMap,ApiClientConfig,invariant) {require.__markCompiled && require.__markCompiled();
    
           
      
     
    
     
              
   
      
          
              
           

   

   

var accessToken;
var clientID;
var defaultParams;

var MAX_QUERYSTRING_LENGTH = JSONPRequest.MAX_QUERYSTRING_LENGTH;
var METHODS = {
  'get': true,
  'post': true,
  'delete': true,
  'put': true
};

var READONLYCALLS = {
  fql_query: true,
  fql_multiquery: true,
  friends_get: true,
  notifications_get: true,
  stream_get: true,
  users_getinfo: true
};


var batchCalls = [];
var batchCallbacks = [];
var scheduleId = null;



var REQUESTS_PER_BATCH = 50;




var DEFAULT_BATCH_APP_ID = 105440539523; 


function request(/*string*/ url, /*string*/ method, /*object*/ params,
    /*function*/ cb) {return __bodyWrapper(this, arguments, function() {
  if (defaultParams) {
    params = ES('Object', 'assign', false,{}, defaultParams, params);
  }

  params.access_token = params.access_token || accessToken;
  params.pretty = params.pretty || 0;

  params = flattenObject(params);
  var availableTransports = {
    jsonp: JSONPRequest,
    cors : CORSRequest,
    flash: FlashRequest
  };

  
  
  var transports;
  if (params.transport) {
    transports = [params.transport];
    delete params.transport;
  } else {
    transports = ['jsonp', 'cors', 'flash'];
  }

  for (var i = 0; i < transports.length; i++) {
    var transport = availableTransports[transports[i]];
    var paramsCopy = ES('Object', 'assign', false,{}, params);
    if (transport.execute(url, method, paramsCopy, cb)) {
      return;
    }
  }

  cb({
    error: {
      type   : 'no-transport',
      message: 'Could not find a usable transport for request'
    }
  });
}, {"params":[[url, 'string', 'url'], [method, 'string', 'method'], [params, 'object', 'params'], [cb, 'function', 'cb']]});}__annotator(request, {"module":"ApiClient","line":68,"column":0,"name":"request"}, {"params":["string","string","object","function"]});

function inspect(/*?function*/ callback, /*string*/ endpoint, /*string*/ method,
    /*object*/ params, /*number*/ startTime, response) {return __bodyWrapper(this, arguments, function() {
  if (response && response.error) {
    ApiClient.inform(
      'request.error',
      endpoint,
      method,
      params,
      response,
      /*duration*/ ES('Date', 'now', false) - startTime
    );
  }

  ApiClient.inform(
    'request.complete',
    endpoint,
    method,
    params,
    response,
    /*duration*/ ES('Date', 'now', false) - startTime
  );

  if (callback) {
    callback(response);
  }
}, {"params":[[callback, '?function', 'callback'], [endpoint, 'string', 'endpoint'], [method, 'string', 'method'], [params, 'object', 'params'], [startTime, 'number', 'startTime']]});}__annotator(inspect, {"module":"ApiClient","line":110,"column":0,"name":"inspect"}, {"params":["?function","string","string","object","number"]});


function parseCallDataFromArgs(/*array*/ args) {return __bodyWrapper(this, arguments, function() {
  var path = args.shift();
  Assert.isString(path, 'Invalid path');
  if (!/^https?/.test(path) && path.charAt(0) !== '/')  {
    path = '/' + path;
  }

  var uri;
  var argsMap = {};

  try {
    uri = new URI(path);
  } catch (e) {
    throw new ArgumentError(e.message, e);
  }

  
  ES(args, 'forEach', true,__annotator(function(arg)  {return argsMap[typeof arg] = arg;}, {"module":"ApiClient","line":158,"column":15}));

  var method = (argsMap.string || 'get').toLowerCase();

  Assert.isTrue(
    METHODS.hasOwnProperty(method),
    sprintf('Invalid method passed to ApiClient: %s', method)
  );

  var callback = argsMap['function'];
  if (!callback) {
    Log.warn('No callback passed to the ApiClient');
  }

  if (argsMap.object) {
    uri.addQueryData(flattenObject(argsMap.object));
  }

  var params = uri.getQueryData();
  params.method = method;

  return {uri:uri, callback:callback, params:params};
}, {"params":[[args, 'array', 'args']]});}__annotator(parseCallDataFromArgs, {"module":"ApiClient","line":141,"column":0,"name":"parseCallDataFromArgs"}, {"params":["array"]});


function requestUsingGraph() {for (var args=[],$__0=0,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
  var $__2=    parseCallDataFromArgs(args),uri=$__2.uri,callback=$__2.callback,params=$__2.params;
  var method = params.method;

  if (requestIsTooLargeForGet(uri, method)) {
    method = 'post';
  }

  var url = uri.getProtocol() && uri.getDomain()
    ? uri.setQueryData({}).toString()
    : UrlMap.resolve('graph') + uri.getPath();

  ApiClient.inform('request.prepare', url, params);

  request(
    url,
    method == 'get' ? 'get' : 'post',
    params,
    ES(inspect, 'bind', true,null, callback, uri.getPath(), method, params, ES('Date', 'now', false))
  );
}__annotator(requestUsingGraph, {"module":"ApiClient","line":205,"column":0,"name":"requestUsingGraph"});


function scheduleBatchCall() {for (var args=[],$__0=0,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
  var $__2=     parseCallDataFromArgs(args),uri=$__2.uri,callback=$__2.callback,$__3=$__2.params,method=$__3.method;

  var batchCall = {
    method: method,
    relative_url: uri
      .removeQueryData('method')
      .toString()
  };

  if (method.toLowerCase() == 'post') {
    batchCall.body = QueryString.encode(uri.getQueryData());
    batchCall.relative_url = uri
      .setQueryData({})
      .toString();
  }

  batchCalls.push(batchCall);
  batchCallbacks.push(callback);

  
  
  if (batchCalls.length == REQUESTS_PER_BATCH) {
    if (scheduleId) {
      clearTimeout(scheduleId);
    }
    dispatchBatchCalls();
  } else if (!scheduleId) {
    
    scheduleId = setTimeout(dispatchBatchCalls, 0);
  }
}__annotator(scheduleBatchCall, {"module":"ApiClient","line":230,"column":0,"name":"scheduleBatchCall"});


function dispatchBatchCalls() {
  invariant(
    batchCalls.length > 0,
    'ApiClient: batchCalls is empty at dispatch.'
  );
  invariant(
    batchCalls.length === batchCallbacks.length,
    'ApiClient: Every batch call should have a callback'
  );

  
  
  var copiedBatchCalls = batchCalls;
  var copiedBatchCallbacks = batchCallbacks;

  batchCalls = [];
  batchCallbacks = [];
  scheduleId = null;

  // If there's only one request, just send it directly
  if (copiedBatchCalls.length === 1) {
    var call = copiedBatchCalls[0];
    var callback = copiedBatchCallbacks[0];
    
    
    var body = call.body ? QueryString.decode(call.body) : null;

    requestUsingGraph(
      call.relative_url,
      call.method,
      body,
      callback
    );
    return;
  }

  requestUsingGraph(
    '/',
    'POST',
    {
      batch: copiedBatchCalls,
      include_headers: false,
      batch_app_id: clientID || DEFAULT_BATCH_APP_ID
    },
    __annotator(function(response)  {
      if (ES('Array', 'isArray', false,response)) {
        ES(response, 'forEach', true,__annotator(function(data, idx)  {
          copiedBatchCallbacks[idx](ES('JSON', 'parse', false,data.body));
        }, {"module":"ApiClient","line":313,"column":25}));
      } else {
        ES(copiedBatchCallbacks, 'forEach', true,__annotator(function(callback) 
          {return callback({error: {message: 'Fatal: batch call failed.'}});}, {"module":"ApiClient","line":317,"column":37})
        );
      }
    }, {"module":"ApiClient","line":311,"column":4})
  );
}__annotator(dispatchBatchCalls, {"module":"ApiClient","line":267,"column":0,"name":"dispatchBatchCalls"});


function requestUsingRest(/*object*/ params, /*?function*/ cb) {return __bodyWrapper(this, arguments, function() {
  Assert.isObject(params);
  Assert.isString(params.method, 'method missing');

  if (!cb) {
    Log.warn('No callback passed to the ApiClient');
  }
  var method = params.method.toLowerCase().replace('.', '_');
  params.format = 'json-strings';
  params.api_key = clientID;

  var domain = method in READONLYCALLS ? 'api_read' : 'api';
  var url = UrlMap.resolve(domain) + '/restserver.php';
  var inspector =
    ES(inspect, 'bind', true,null, cb, '/restserver.php', 'get', params, ES('Date', 'now', false));
  request(url, 'get', params, inspector);
}, {"params":[[params, 'object', 'params'], [cb, '?function', 'cb']]});}__annotator(requestUsingRest, {"module":"ApiClient","line":336,"column":0,"name":"requestUsingRest"}, {"params":["object","?function"]});

var ApiClient = ES('Object', 'assign', false,new ObservableMixin(), {
  setAccessToken:__annotator(function(/*?string*/ access_token) {return __bodyWrapper(this, arguments, function() {
    accessToken = access_token;
  }, {"params":[[access_token, '?string', 'access_token']]});}, {"module":"ApiClient","line":355,"column":17}, {"params":["?string"]}),
  setClientID:__annotator(function(/*?string*/ client_id) {return __bodyWrapper(this, arguments, function() {
    clientID = client_id;
  }, {"params":[[client_id, '?string', 'client_id']]});}, {"module":"ApiClient","line":358,"column":14}, {"params":["?string"]}),
  setDefaultParams:__annotator(function(/*?object*/ default_params) {return __bodyWrapper(this, arguments, function() {
    defaultParams = default_params;
  }, {"params":[[default_params, '?object', 'default_params']]});}, {"module":"ApiClient","line":361,"column":19}, {"params":["?object"]}),
  rest: requestUsingRest,
  graph: requestUsingGraph,
  scheduleBatchCall: scheduleBatchCall
});

function requestIsTooLargeForGet(/*URI*/ uri, /*?string*/ method) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  return (uri.toString().length > MAX_QUERYSTRING_LENGTH && method === 'get');
}, {"params":[[uri, 'URI', 'uri'], [method, '?string', 'method']],"returns":'boolean'});}__annotator(requestIsTooLargeForGet, {"module":"ApiClient","line":369,"column":0,"name":"requestIsTooLargeForGet"}, {"params":["URI","?string"],"returns":"boolean"});


FlashRequest.setSwfUrl(ApiClientConfig.FlashRequest.swfUrl);

module.exports = ApiClient;


}, {"module":"ApiClient","line":7,"column":200}),null);


__d("sdk.PlatformVersioning",["sdk.Runtime","ManagedError"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Runtime,ManagedError) {require.__markCompiled && require.__markCompiled();
   
   

var REGEX = /^v\d+\.\d\d?$/;

var PlatformVersioning = {

  REGEX: REGEX,

  assertVersionIsSet: __annotator(function() {
    if (!Runtime.getVersion()) {
      throw new ManagedError('init not called with valid version');
    }
  }, {"module":"sdk.PlatformVersioning","line":17,"column":22}),

  assertValidVersion: __annotator(function(/*string*/ version) {return __bodyWrapper(this, arguments, function() {
    if (!REGEX.test(version)) {
      throw new ManagedError('invalid version specified');
    }
  }, {"params":[[version, 'string', 'version']]});}, {"module":"sdk.PlatformVersioning","line":23,"column":22}, {"params":["string"]})

};

module.exports = PlatformVersioning;


}, {"module":"sdk.PlatformVersioning","line":7,"column":60}),null);


__d("sdk.api",["ApiClient","sdk.PlatformVersioning","sdk.Runtime","sdk.Scribe","sdk.URI","sdk.feature"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ApiClient,PlatformVersioning,Runtime,Scribe,URI,feature) {require.__markCompiled && require.__markCompiled();
    
   
   
   
   

   
var shouldLogResponseError = feature('should_log_response_error', false);

var currentAccessToken;

Runtime.subscribe(
  'ClientID.change',
  __annotator(function(/*?string*/ value)  {return __bodyWrapper(this, arguments, function() {return ApiClient.setClientID(value);}, {"params":[[value, '?string', 'value']]});}, {"module":"sdk.api","line":21,"column":2}, {"params":["?string"]})
);

Runtime.subscribe(
  'AccessToken.change',
  __annotator(function(/*?string*/ value)   {return __bodyWrapper(this, arguments, function() {
    currentAccessToken = value;
    ApiClient.setAccessToken(value);
  }, {"params":[[value, '?string', 'value']]});}, {"module":"sdk.api","line":26,"column":2}, {"params":["?string"]})
);

ApiClient.setDefaultParams({
  sdk: 'joey'
});


ApiClient.subscribe(
  'request.complete',
  __annotator(function(/*string*/ endpoint, /*string*/ method, /*object*/ params, response)   {return __bodyWrapper(this, arguments, function() {
    var invalidateToken = false;
    if (response && typeof response == 'object') {
      if (response.error) {
        if (response.error == 'invalid_token'
            || (response.error.type == 'OAuthException'
                && response.error.code == 190)) {
          invalidateToken = true;
        }
      } else if (response.error_code) {
        if (response.error_code == '190') {
          invalidateToken = true;
        }
      }
    }
    if (invalidateToken
        && currentAccessToken === Runtime.getAccessToken()) {
      
      Runtime.setAccessToken(null);
  }
}, {"params":[[endpoint, 'string', 'endpoint'], [method, 'string', 'method'], [params, 'object', 'params']]});}, {"module":"sdk.api","line":39,"column":2}, {"params":["string","string","object"]}));

// Inspector for calls that untos'es the app
ApiClient.subscribe(
  'request.complete',
  __annotator(function(/*string*/ endpoint, /*string*/ method, /*object*/ params, response)  {return __bodyWrapper(this, arguments, function() {
    if (((endpoint == '/me/permissions'
          && method === 'delete')
         || (endpoint == '/restserver.php'
              && params.method == 'Auth.revokeAuthorization'))
        && response === true) {
      Runtime.setAccessToken(null);
    }
  }, {"params":[[endpoint, 'string', 'endpoint'], [method, 'string', 'method'], [params, 'object', 'params']]});}, {"module":"sdk.api","line":64,"column":2}, {"params":["string","string","object"]})
);


ApiClient.subscribe(
  'request.error',
  __annotator(function(/*string*/ endpoint, /*string*/ method, /*object*/ params, response)  {return __bodyWrapper(this, arguments, function() {
    if (shouldLogResponseError && response.error.type === 'http') {
      Scribe.log('jssdk_error', {
        appId: Runtime.getClientID(),
        error: 'transport',
        extra: {
          name: 'transport',
          // Let's stringify the error as transports build specific error
          message: ES('JSON', 'stringify', false,response.error)
        }
      });
    }
  }, {"params":[[endpoint, 'string', 'endpoint'], [method, 'string', 'method'], [params, 'object', 'params']]});}, {"module":"sdk.api","line":78,"column":2}, {"params":["string","string","object"]})
);


function api(path) {

  
  if (typeof path === 'string') {
    if (Runtime.getIsVersioned()) {
      PlatformVersioning.assertVersionIsSet();

      
      if (!/https?/.test(path) && path.charAt(0) !== '/') {
        path = '/' + path;
      }
      path = URI(path).setDomain(null).setProtocol(null).toString();

      
      if (!PlatformVersioning.REGEX
            .test(path.substring(1, ES(path, 'indexOf', true,'/', 1)))) {
        path = '/' + Runtime.getVersion() + path;
      }

      var args = [path].concat(Array.prototype.slice.call(arguments, 1));
      ApiClient.graph.apply(ApiClient, args);
    } else {
      ApiClient.graph.apply(ApiClient, arguments);
    }
  } else {
    ApiClient.rest.apply(ApiClient, arguments);
  }
}__annotator(api, {"module":"sdk.api","line":99,"column":0,"name":"api"});

module.exports = api;


}, {"module":"sdk.api","line":7,"column":104}),null);


__d("legacy:fb.api",["FB","sdk.api"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,api) {require.__markCompiled && require.__markCompiled();
   
   

FB.provide('', {
  api: api
});


}, {"module":"fb.api","line":4,"column":37}),3);


__d("sdk.Canvas.Environment",["sdk.RPC"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,RPC) {require.__markCompiled && require.__markCompiled();
   

function getPageInfo(/*function*/ appCallback) {return __bodyWrapper(this, arguments, function() {
  RPC.remote.getPageInfo(__annotator(function(/*object*/ response) {return __bodyWrapper(this, arguments, function() {
    appCallback(response.result);
  }, {"params":[[response, 'object', 'response']]});}, {"module":"sdk.Canvas.Environment","line":11,"column":25}, {"params":["object"]}));
}, {"params":[[appCallback, 'function', 'appCallback']]});}__annotator(getPageInfo, {"module":"sdk.Canvas.Environment","line":10,"column":0,"name":"getPageInfo"}, {"params":["function"]});

function scrollTo(/*?number*/ x, /*?number*/ y) {return __bodyWrapper(this, arguments, function() {
  RPC.remote.scrollTo({ x: x || 0, y: y || 0 });
}, {"params":[[x, '?number', 'x'], [y, '?number', 'y']]});}__annotator(scrollTo, {"module":"sdk.Canvas.Environment","line":16,"column":0,"name":"scrollTo"}, {"params":["?number","?number"]});


RPC.stub('getPageInfo');
RPC.stub('scrollTo');

var Environment = {
  getPageInfo: getPageInfo,
  scrollTo: scrollTo
};

module.exports = Environment;


}, {"module":"sdk.Canvas.Environment","line":7,"column":41}),null);


__d("sdk.fbt",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();



var fbt = {
  _:__annotator(function(table) {
    if (__DEV__) {
      if (arguments.length > 1) {
        throw ('You are not using a simple string');
      }
    }
    return typeof table === 'string' ? table : table[0];
  }, {"module":"sdk.fbt","line":11,"column":4})
};
module.exports = fbt;


}, {"module":"sdk.fbt","line":6,"column":17}),null);


__d("sdk.Dialog",["sdk.Canvas.Environment","sdk.Content","sdk.DOM","DOMEventListener","ObservableMixin","sdk.Runtime","Type","sdk.UA","sdk.fbt","sdk.feature"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,CanvasEnvironment,Content,DOM,DOMEventListener,ObservableMixin,Runtime,Type,UA,fbt,feature) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   

   
   

var MAX_HEIGHT_MOBILE = 590;
var MAX_WIDTH_MOBILE = 500;
var MAX_HEIGHT_DESKTOP = 240;
var MAX_WIDTH_DESKTOP = 575;

var isTablet = __annotator(function() /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  var result;
  if (feature('dialog_resize_refactor', false)) {
      var size = getMobileSize();
      result = size
        && (size.height >= MAX_HEIGHT_MOBILE || size.width >= MAX_WIDTH_MOBILE);
    } else {
      result = !!UA.ipad();
    }
    isTablet = __annotator(function() /*boolean*/ {return __bodyWrapper(this, arguments, function() { return result; }, {"returns":'boolean'});}, {"module":"sdk.Dialog","line":35,"column":15}, {"returns":"boolean"});
    return result;
}, {"returns":'boolean'});}, {"module":"sdk.Dialog","line":26,"column":15}, {"returns":"boolean"});

function getMobileSize() /*?object*/ {return __bodyWrapper(this, arguments, function() {
  
  if (feature('dialog_resize_refactor', false)) {
    var info = DOM.getViewportInfo();
    if (info.height && info.width) {
      return {
        width: Math.min(info.width, MAX_HEIGHT_MOBILE),
        height: Math.min(info.height, MAX_WIDTH_MOBILE)
      };
    }
  }
  return null;
}, {"returns":'?object'});}__annotator(getMobileSize, {"module":"sdk.Dialog","line":39,"column":0,"name":"getMobileSize"}, {"returns":"?object"});


var SdkDialog = Type.extend({
  constructor: __annotator(function SdkDialog(/*string*/ id, /*string*/ display) {return __bodyWrapper(this, arguments, function() {
    this.parent();
    this.id = id;
    this.display = display;
    
    this._e2e = {};

    if (!Dialog._dialogs) {
      Dialog._dialogs = {};
      Dialog._addOrientationHandler();
    }
    Dialog._dialogs[id] = this;
    this.trackEvent('init');
  }, {"params":[[id, 'string', 'id'], [display, 'string', 'display']]});}, {"module":"sdk.Dialog","line":68,"column":15,"name":"SdkDialog"}, {"params":["string","string"]}),

  trackEvent: __annotator(function(/*string*/ name, /*?number*/ time) /*SdkDialog*/ {return __bodyWrapper(this, arguments, function() {
    if (this._e2e[name]) {
      return this;
    }
    this._e2e[name] = time || ES('Date', 'now', false);
    if (name == 'close') {
      
      this.inform('e2e:end', this._e2e);
    }
    return this;
  }, {"params":[[name, 'string', 'name'], [time, '?number', 'time']],"returns":'SdkDialog'});}, {"module":"sdk.Dialog","line":83,"column":14}, {"params":["string","?number"],"returns":"SdkDialog"}),

  trackEvents: __annotator(function(/*string|object*/ events) /*SdkDialog*/ {return __bodyWrapper(this, arguments, function() {
    if (typeof events === 'string') {
      events = ES('JSON', 'parse', false,events);
    }
    for (var key in events) {
      if (events.hasOwnProperty(key)) {
        this.trackEvent(key, events[key]);
      }
    }
    return this;
  }, {"params":[[events, 'string|object', 'events']],"returns":'SdkDialog'});}, {"module":"sdk.Dialog","line":95,"column":15}, {"params":["string|object"],"returns":"SdkDialog"})
}, ObservableMixin);

var Dialog = {
  newInstance: __annotator(function(/*string*/ id, /*string*/ display) /*SdkDialog*/ {return __bodyWrapper(this, arguments, function() {
    return new SdkDialog(id, display);
  }, {"params":[[id, 'string', 'id'], [display, 'string', 'display']],"returns":'SdkDialog'});}, {"module":"sdk.Dialog","line":109,"column":15}, {"params":["string","string"],"returns":"SdkDialog"}),

  
  _dialogs: null,
  _lastYOffset: 0,

  
  _loaderEl: null,

  
  _overlayEl: null,

  
  _stack: [],

  
  _active: null,

  
  get: __annotator(function(/*string*/ id) /*SdkDialog*/ {return __bodyWrapper(this, arguments, function() {
    return Dialog._dialogs[id];
  }, {"params":[[id, 'string', 'id']],"returns":'SdkDialog'});}, {"module":"sdk.Dialog","line":152,"column":7}, {"params":["string"],"returns":"SdkDialog"}),


  
  _findRoot: __annotator(function(/*DOMElement*/ node) /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {
    while (node) {
      if (DOM.containsCss(node, 'fb_dialog')) {
        return node;
      }
      node = node.parentNode;
    }
  }, {"params":[[node, 'HTMLElement', 'node']],"returns":'HTMLElement'});}, {"module":"sdk.Dialog","line":165,"column":13}, {"params":["DOMElement"],"returns":"DOMElement"}),

  _createWWWLoader: __annotator(function(/*number*/ width) /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {
    width = width ? width : 460;
    return Dialog.create({
      content: (
      '<div class="dialog_title">' +
      '  <a id="fb_dialog_loader_close">' +
      '    <div class="fb_dialog_close_icon"></div>' +
      '  </a>' +
      '  <span>Facebook</span>' +
      '  <div style="clear:both;"></div>' +
      '</div>' +
      '<div class="dialog_content"></div>' +
      '<div class="dialog_footer"></div>'),
      width: width
    });
  }, {"params":[[width, 'number', 'width']],"returns":'HTMLElement'});}, {"module":"sdk.Dialog","line":174,"column":20}, {"params":["number"],"returns":"DOMElement"}),

  _createMobileLoader: __annotator(function() /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {
    
    // We're copying the HTML/CSS output of an XHP element here
    
    
    
    var chrome = UA.nativeApp()
      ? ''
      : ('<table>' +
        '  <tbody>' +
        '    <tr>' +
        '      <td class="header_left">' +
        '        <label class="touchable_button">' +
        '          <input type="submit" value="' +
                     fbt._("Cancel"
) + '"' +
        '            id="fb_dialog_loader_close"/>' +
        '        </label>' +
        '      </td>' +
        '      <td class="header_center">' +
        '        <div>' +
        '         ' + fbt._("Loading..."
) +
        '        </div>' +
        '      </td>' +
        '      <td class="header_right">' +
        '      </td>' +
        '    </tr>' +
        '  </tbody>' +
        '</table>');

    return Dialog.create({
      classes: 'loading' + (isTablet() ? ' centered' : ''),
      content: (
        '<div class="dialog_header">' +
          chrome +
        '</div>')
    });
  }, {"returns":'HTMLElement'});}, {"module":"sdk.Dialog","line":191,"column":23}, {"returns":"DOMElement"}),

  _restoreBodyPosition: __annotator(function() {
    if (!isTablet()) {
      var body = document.getElementsByTagName('body')[0];
      DOM.removeCss(body, 'fb_hidden');
    }
  }, {"module":"sdk.Dialog","line":231,"column":24}),

  _showTabletOverlay: __annotator(function() {
    if (!isTablet()) {
      return;
    }
    if (!Dialog._overlayEl) {
      Dialog._overlayEl = document.createElement('div');
      Dialog._overlayEl.setAttribute('id', 'fb_dialog_ipad_overlay');
      Content.append(Dialog._overlayEl, null);
    }
    Dialog._overlayEl.className = '';
  }, {"module":"sdk.Dialog","line":238,"column":22}),

  _hideTabletOverlay: __annotator(function() {
    if (isTablet()) {
      Dialog._overlayEl.className = 'hidden';
    }
  }, {"module":"sdk.Dialog","line":250,"column":22}),

  
  showLoader: __annotator(function(/*?function*/ cb, /*number*/ width) {return __bodyWrapper(this, arguments, function() {
    Dialog._showTabletOverlay();

    if (!Dialog._loaderEl) {
      Dialog._loaderEl = Dialog._findRoot(UA.mobile()
        ? Dialog._createMobileLoader()
        : Dialog._createWWWLoader(width));
    }

    // this needs to be done for each invocation of showLoader. since we don't
    
    
    
    if (!cb) {
      cb = __annotator(function() {}, {"module":"sdk.Dialog","line":277,"column":11});
    }
    var loaderClose = document.getElementById('fb_dialog_loader_close');
    DOM.removeCss(loaderClose, 'fb_hidden');
    loaderClose.onclick = __annotator(function() {
      Dialog._hideLoader();
      Dialog._restoreBodyPosition();
      Dialog._hideTabletOverlay();
      cb();
    }, {"module":"sdk.Dialog","line":281,"column":26});
    var tabletOverlay = document.getElementById('fb_dialog_ipad_overlay');
    if (tabletOverlay) {
      tabletOverlay.ontouchstart = loaderClose.onclick;
    }

    Dialog._makeActive(Dialog._loaderEl);
  }, {"params":[[cb, '?function', 'cb'], [width, 'number', 'width']]});}, {"module":"sdk.Dialog","line":263,"column":14}, {"params":["?function","number"]}),

  
  _hideLoader: __annotator(function() {
    if (Dialog._loaderEl && Dialog._loaderEl == Dialog._active) {
      Dialog._loaderEl.style.top = '-10000px';
    }
  }, {"module":"sdk.Dialog","line":299,"column":15}),

  
  _makeActive: __annotator(function(/*DOMElement*/ el) {return __bodyWrapper(this, arguments, function() {
    Dialog._setDialogSizes();
    Dialog._lowerActive();
    Dialog._active = el;
    if (Runtime.isEnvironment(Runtime.ENVIRONMENTS.CANVAS)) {
      CanvasEnvironment.getPageInfo(__annotator(function(pageInfo) {
        Dialog._centerActive(pageInfo);
      }, {"module":"sdk.Dialog","line":316,"column":36}));
    }
    Dialog._centerActive();
  }, {"params":[[el, 'HTMLElement', 'el']]});}, {"module":"sdk.Dialog","line":311,"column":15}, {"params":["DOMElement"]}),

  
  _lowerActive: __annotator(function() {
    if (!Dialog._active) {
      return;
    }
    Dialog._active.style.top = '-10000px';
    Dialog._active = null;
  }, {"module":"sdk.Dialog","line":326,"column":16}),

  
  _removeStacked: __annotator(function(/*DOMElement*/ dialog) {return __bodyWrapper(this, arguments, function() {
    Dialog._stack = ES(Dialog._stack, 'filter', true,__annotator(function(node) {
      return node != dialog;
    }, {"module":"sdk.Dialog","line":340,"column":41}));
  }, {"params":[[dialog, 'HTMLElement', 'dialog']]});}, {"module":"sdk.Dialog","line":339,"column":18}, {"params":["DOMElement"]}),

  
  _centerActive: __annotator(function(/*?object*/ pageInfo) {return __bodyWrapper(this, arguments, function() {
    var dialog = Dialog._active;
    if (!dialog) {
      return;
    }

    var view = DOM.getViewportInfo();
    var width = parseInt(dialog.offsetWidth, 10);
    var height = parseInt(dialog.offsetHeight, 10);
    var left = view.scrollLeft + (view.width - width) / 2;

    
    // these ensure that the dialog is always within the iframe's
    
    
    
    
    
    var minTop = (view.height - height) / 2.5;
    if (left < minTop) {
      minTop = left;
    }
    var maxTop = view.height - height - minTop;

    
    var top = (view.height - height) / 2;
    if (pageInfo) {
      top = pageInfo.scrollTop - pageInfo.offsetTop +
        (pageInfo.clientHeight - height) / 2;
    }

    
    if (top < minTop) {
      top = minTop;
    } else if (top > maxTop) {
      top = maxTop;
    }

    // offset by the iframe's scroll
    top += view.scrollTop;

    
    
    if (UA.mobile()) {
      
      
      
      // space. If page doesn't have enough height, then OS will effectively
      
      
      
      
      
      
      // down, then the "click" event may fire from a differnt DOM element and
      
      
      
      
      // such that page won't be forced to scroll beyeond its limit when
      
      
      
      var paddingHeight = 100;

      
      
      if (isTablet()) {
        paddingHeight += (view.height - height) / 2;
      } else {
        var body = document.getElementsByTagName('body')[0];
        DOM.addCss(body, 'fb_hidden');
        if (feature('dialog_resize_refactor', false)) {
          body.style.width = 'auto';
        }
        top = 10000;
      }

      var paddingDivs = DOM.getByClass('fb_dialog_padding', dialog);
      if (paddingDivs.length) {
        paddingDivs[0].style.height = paddingHeight + 'px';
      }
    }

    dialog.style.left = (left > 0 ? left : 0) + 'px';
    dialog.style.top = (top > 0 ? top : 0) + 'px';
  }, {"params":[[pageInfo, '?object', 'pageInfo']]});}, {"module":"sdk.Dialog","line":349,"column":17}, {"params":["?object"]}),

  _setDialogSizes: __annotator(function() {
    if (!UA.mobile() || isTablet()) {
      return;
    }
    for (var id in Dialog._dialogs) {
      if (Dialog._dialogs.hasOwnProperty(id)) {
        var iframe = document.getElementById(id);
        if (iframe) {
          iframe.style.width = Dialog.getDefaultSize().width + 'px';
          iframe.style.height = Dialog.getDefaultSize().height + 'px';
        }
      }
    }
  }, {"module":"sdk.Dialog","line":437,"column":19}),
  getDefaultSize: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    if (UA.mobile()) {
      var size = getMobileSize();

      if (size) {
        return size;
      }

      
      // Keep this old ipad logic: it's pretty straightforward.
      if (UA.ipad()) {
        return {
          width: MAX_WIDTH_MOBILE,
          height: MAX_HEIGHT_MOBILE
        };
      }

      if (UA.android()) {
        
        // window.innerWidth/Height doesn't return correct values
        return {
          width: screen.availWidth,
          height: screen.availHeight
        };
      } else {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var isLandscape = width / height > 1.2;
        
        
        // window.innerHeight is not good enough because it doesn't take into
        
        
        
        
        
        
        
        
        return {
          width: width,
          height: Math.max(height,
                         (isLandscape ? screen.width : screen.height))
        };
      }
    }
    return {width: MAX_WIDTH_DESKTOP, height: MAX_HEIGHT_DESKTOP};
  }, {"returns":'object'});}, {"module":"sdk.Dialog","line":451,"column":18}, {"returns":"object"}),


  
  _handleOrientationChange: __annotator(function(e) {

    var screenWidth = feature('dialog_resize_refactor', false)
      ? DOM.getViewportInfo().width
      : screen.availWidth;

    
    
    
    
    // "orientation" event, but change shortly after (50-150ms later).
    
    
    
    
    if (UA.android() &&
        screenWidth == Dialog._availScreenWidth) {
      setTimeout(Dialog._handleOrientationChange, 50);
      return;
    }

    Dialog._availScreenWidth = screenWidth;

    if (isTablet()) {
      Dialog._centerActive();
    } else {
      var width = Dialog.getDefaultSize().width;
      for (var id in Dialog._dialogs) {
        if (Dialog._dialogs.hasOwnProperty(id)) {
          
          var iframe = document.getElementById(id);
          if (iframe) {
            iframe.style.width = width + 'px';
          }
        }
      }
    }
  }, {"module":"sdk.Dialog","line":504,"column":28}),

  
  _addOrientationHandler: __annotator(function() {
    if (!UA.mobile()) {
      return;
    }
    
    
    
    var event_name = "onorientationchange" in window
      ? 'orientationchange'
      : 'resize';

    Dialog._availScreenWidth = feature('dialog_resize_refactor', false)
      ? DOM.getViewportInfo().width
      : screen.availWidth;

    DOMEventListener.add(window, event_name, Dialog._handleOrientationChange);
  }, {"module":"sdk.Dialog","line":546,"column":26}),

  
  create: __annotator(function(/*object*/ opts) /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {
    opts = opts || {};

    var
      dialog      = document.createElement('div'),
      contentRoot = document.createElement('div'),
      className   = 'fb_dialog';

    
    if (opts.closeIcon && opts.onClose) {
      var closeIcon = document.createElement('a');
      closeIcon.className = 'fb_dialog_close_icon';
      closeIcon.onclick = opts.onClose;
      dialog.appendChild(closeIcon);
    }

    className += ' ' + (opts.classes || '');

    
    if (UA.ie()) {
      className += ' fb_dialog_legacy';
      ES([ 'vert_left',
        'vert_right',
        'horiz_top',
        'horiz_bottom',
        'top_left',
        'top_right',
        'bottom_left',
        'bottom_right'], 'forEach', true,__annotator(function(/*string*/ name) {return __bodyWrapper(this, arguments, function() {
          var span = document.createElement('span');
          span.className = 'fb_dialog_' + name;
          dialog.appendChild(span);
        }, {"params":[[name, 'string', 'name']]});}, {"module":"sdk.Dialog","line":609,"column":32}, {"params":["string"]}));
    } else {
      className += UA.mobile()
        ? ' fb_dialog_mobile'
        : ' fb_dialog_advanced';
    }

    if (opts.content) {
      Content.append(opts.content, contentRoot);
    }
    dialog.className = className;
    var width = parseInt(opts.width, 10);
    if (!isNaN(width)) {
      dialog.style.width = width + 'px';
    }
    contentRoot.className = 'fb_dialog_content';

    dialog.appendChild(contentRoot);
    if (UA.mobile()) {
      var padding = document.createElement('div');
      padding.className = 'fb_dialog_padding';
      dialog.appendChild(padding);
    }

    Content.append(dialog);

    if (opts.visible) {
      Dialog.show(dialog);
    }
    return contentRoot;
  }, {"params":[[opts, 'object', 'opts']],"returns":'HTMLElement'});}, {"module":"sdk.Dialog","line":581,"column":10}, {"params":["object"],"returns":"DOMElement"}),

  
  show: __annotator(function(/*DOMElement*/ dialog) {return __bodyWrapper(this, arguments, function() {
    var root = Dialog._findRoot(dialog);
    if (root) {
      Dialog._removeStacked(root);
      Dialog._hideLoader();
      Dialog._makeActive(root);
      Dialog._stack.push(root);
      if ('fbCallID' in dialog) {
        Dialog.get(dialog.fbCallID)
          .inform('iframe_show')
          .trackEvent('show');
      }
    }
  }, {"params":[[dialog, 'HTMLElement', 'dialog']]});}, {"module":"sdk.Dialog","line":653,"column":8}, {"params":["DOMElement"]}),

  
  hide: __annotator(function(/*DOMElement*/ dialog) {return __bodyWrapper(this, arguments, function() {
    var root = Dialog._findRoot(dialog);
    Dialog._hideLoader();
    if (root == Dialog._active) {
      Dialog._lowerActive();
      Dialog._restoreBodyPosition();
      Dialog._hideTabletOverlay();
      if ('fbCallID' in dialog) {
        Dialog.get(dialog.fbCallID)
          .inform('iframe_hide')
          .trackEvent('hide');
      }
    }
  }, {"params":[[dialog, 'HTMLElement', 'dialog']]});}, {"module":"sdk.Dialog","line":674,"column":8}, {"params":["DOMElement"]}),

  
  remove: __annotator(function(/*DOMElement*/ dialog) {return __bodyWrapper(this, arguments, function() {
    dialog = Dialog._findRoot(dialog);
    if (dialog) {
      var is_active = Dialog._active == dialog;
      Dialog._removeStacked(dialog);
      if (is_active) {
        Dialog._hideLoader();
        if (Dialog._stack.length > 0) {
          Dialog.show(Dialog._stack.pop());
        } else {
          Dialog._lowerActive();
          Dialog._restoreBodyPosition();
          Dialog._hideTabletOverlay();
        }
      } else if (Dialog._active === null && Dialog._stack.length > 0) {
        Dialog.show(Dialog._stack.pop());
      }

      
      // flash crap. seriously, don't ever ask me about it.
      // if we remove this without deferring, then in IE only, we'll get an
      
      // traces. the 3 second delay isn't a problem because the <div> is
      // already hidden, it's just not removed from the DOM yet.
      setTimeout(__annotator(function() {
        dialog.parentNode.removeChild(dialog);
      }, {"module":"sdk.Dialog","line":718,"column":17}), 3000);
    }
  }, {"params":[[dialog, 'HTMLElement', 'dialog']]});}, {"module":"sdk.Dialog","line":694,"column":10}, {"params":["DOMElement"]}),

  
  isActive: __annotator(function(/*DOMElement*/ node) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    var root = Dialog._findRoot(node);
    return root && root === Dialog._active;
  }, {"params":[[node, 'HTMLElement', 'node']],"returns":'boolean'});}, {"module":"sdk.Dialog","line":729,"column":12}, {"params":["DOMElement"],"returns":"boolean"})

};

module.exports = Dialog;


}, {"module":"sdk.Dialog","line":8,"column":159}),null);


__d("sdk.Frictionless",["sdk.Auth","sdk.api","sdk.Event","sdk.Dialog"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Auth,api,Event,Dialog) {require.__markCompiled && require.__markCompiled();
   
   
   
   

var Frictionless = {

  
  
  _allowedRecipients: {},

  _useFrictionless: false,

  
  _updateRecipients: __annotator(function() {
    Frictionless._allowedRecipients = {};
    api('/me/apprequestformerrecipients', __annotator(function(response) {
      if (!response || response.error) {
        return;
      }
      ES(response.data, 'forEach', true,__annotator(function(/*object*/ recipient) {return __bodyWrapper(this, arguments, function() {
        Frictionless._allowedRecipients[recipient.recipient_id] = true;
      }, {"params":[[recipient, 'object', 'recipient']]});}, {"module":"sdk.Frictionless","line":30,"column":28}, {"params":["object"]}));
    }, {"module":"sdk.Frictionless","line":26,"column":42}));
  }, {"module":"sdk.Frictionless","line":24,"column":21}),

  
  init: __annotator(function() {
    Frictionless._useFrictionless = true;
    Auth.getLoginStatus(__annotator(function(/*object*/ response) {return __bodyWrapper(this, arguments, function() {
      if (response.status == 'connected') {
        Frictionless._updateRecipients();
      }
    }, {"params":[[response, 'object', 'response']]});}, {"module":"sdk.Frictionless","line":41,"column":24}, {"params":["object"]}));
    Event.subscribe('auth.login', __annotator(function(/*object*/ login) {return __bodyWrapper(this, arguments, function() {
      if (login.authResponse) {
        Frictionless._updateRecipients();
      }
    }, {"params":[[login, 'object', 'login']]});}, {"module":"sdk.Frictionless","line":46,"column":34}, {"params":["object"]}));
  }, {"module":"sdk.Frictionless","line":39,"column":8}),

  
  _processRequestResponse: __annotator(function(/*function*/ cb, /*?boolean */hidden)
      /*function*/ {return __bodyWrapper(this, arguments, function() {
    return __annotator(function(/*?object*/ params) {return __bodyWrapper(this, arguments, function() {
      var updated = params && params.updated_frictionless;
      if (Frictionless._useFrictionless && updated) {
        
        
        Frictionless._updateRecipients();
      }

      if (params) {
        if (!hidden && params.frictionless) {
          Dialog._hideLoader();
          Dialog._restoreBodyPosition();
          Dialog._hideIPadOverlay();
        }
        delete params.frictionless;
        delete params.updated_frictionless;
      }
      
      cb && cb(params);
    }, {"params":[[params, '?object', 'params']]});}, {"module":"sdk.Frictionless","line":62,"column":11}, {"params":["?object"]});
  }, {"params":[[cb, 'function', 'cb']],"returns":'function'});}, {"module":"sdk.Frictionless","line":60,"column":27}, {"params":["function"],"returns":"function"}),

  
  isAllowed: __annotator(function(user_ids) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    if (!user_ids) {
      return false;
    }

    if (typeof user_ids === 'number') {
      return user_ids in Frictionless._allowedRecipients;
    }
    if (typeof user_ids === 'string') {
      user_ids = user_ids.split(',');
    }
    user_ids = ES(user_ids, 'map', true,__annotator(function(s) {return ES(String(s),'trim', true);}, {"module":"sdk.Frictionless","line":102,"column":28}));

    var allowed = true;
    var has_user_ids = false;
    ES(user_ids, 'forEach', true,__annotator(function(/*string*/ user_id) {return __bodyWrapper(this, arguments, function() {
      allowed = allowed && user_id in Frictionless._allowedRecipients;
      has_user_ids = true;
    }, {"params":[[user_id, 'string', 'user_id']]});}, {"module":"sdk.Frictionless","line":106,"column":21}, {"params":["string"]}));
    return allowed && has_user_ids;
  }, {"returns":'boolean'});}, {"module":"sdk.Frictionless","line":91,"column":13}, {"returns":"boolean"})
};

Event.subscribe('init:post', __annotator(function(/*object*/ options) {return __bodyWrapper(this, arguments, function() {
  if (options.frictionlessRequests) {
    Frictionless.init();
  }
}, {"params":[[options, 'object', 'options']]});}, {"module":"sdk.Frictionless","line":114,"column":29}, {"params":["object"]}));


module.exports = Frictionless;


}, {"module":"sdk.Frictionless","line":7,"column":71}),null);


__d("sdk.Native",["Log","sdk.UA"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Log,UA) {require.__markCompiled && require.__markCompiled();
   
   

var NATIVE_READY_EVENT = 'fbNativeReady';

var Native = {

  
  onready: __annotator(function(/*function*/ func) {return __bodyWrapper(this, arguments, function() {
    // Check that we're within a native container
    if (!UA.nativeApp()) {
      Log.error('FB.Native.onready only works when the page is rendered ' +
             'in a WebView of the native Facebook app. Test if this is the ' +
             'case calling FB.UA.nativeApp()');
      return;
    }

    // if the native container has injected JS but we haven't copied it
    
    
    
    if (window.__fbNative && !this.nativeReady) {
      ES('Object', 'assign', false,this, window.__fbNative);
    }

    
    if (this.nativeReady) {
      func();
    } else {
      // If the native interfaces haven't been injected yet,
      
      var nativeReadyCallback = __annotator(function(evt) {
        window.removeEventListener(NATIVE_READY_EVENT, nativeReadyCallback);
        this.onready(func);
      }, {"module":"sdk.Native","line":44,"column":32});
      window.addEventListener(NATIVE_READY_EVENT, nativeReadyCallback, false);
    }
  }, {"params":[[func, 'function', 'func']]});}, {"module":"sdk.Native","line":21,"column":11}, {"params":["function"]})
};

module.exports = Native;


}, {"module":"sdk.Native","line":7,"column":34}),null);


__d("resolveURI",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function resolveURI(/*?string*/ uri) /*string*/ {return __bodyWrapper(this, arguments, function() {
  if (!uri) { 
    return window.location.href;
  }

  uri = uri.replace(/&/g, '&amp;') 
           .replace(/"/g, '&quot;'); 

  var div = document.createElement('div');
  // This uses `innerHTML` because anything else doesn't resolve properly or
  
  div.innerHTML = '<a href="' + uri + '"></a>';

  return div.firstChild.href; 
}, {"params":[[uri, '?string', 'uri']],"returns":'string'});}__annotator(resolveURI, {"module":"resolveURI","line":11,"column":0,"name":"resolveURI"}, {"params":["?string"],"returns":"string"});

module.exports = resolveURI;


}, {"module":"resolveURI","line":10,"column":20}),null);


__d("sdk.UIServer",["sdk.Auth","sdk.Content","sdk.DOM","sdk.Dialog","sdk.Event","sdk.Frictionless","Log","sdk.Native","QueryString","sdk.RPC","sdk.Runtime","JSSDKConfig","sdk.UA","UrlMap","sdk.XD","createObjectFrom","sdk.feature","flattenObject","sdk.getContextType","guid","insertIframe","resolveURI"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Auth,Content,DOM,Dialog,Event,Frictionless,Log,Native,QueryString,RPC,Runtime,SDKConfig,UA,UrlMap,XD,createObjectFrom,feature,flattenObject,getContextType,guid,insertIframe,resolveURI) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   

   
   
   
   
   
   
   

var MobileIframeable = {
  transform:__annotator(function(/*object*/ call) /*object*/ {return __bodyWrapper(this, arguments, function() {
    
    
    
    if (call.params.display === 'touch' &&
        call.params.access_token &&
        window.postMessage
       ) {
      
      
      call.params.channel = UIServer._xdChannelHandler(
        call.id,
        'parent'
      );
      
      if (!UA.nativeApp()) {
        call.params.in_iframe = 1;
      }
      return call;
    } else {
      return UIServer.genericTransform(call);
    }
  }, {"params":[[call, 'object', 'call']],"returns":'object'});}, {"module":"sdk.UIServer","line":36,"column":12}, {"params":["object"],"returns":"object"}),
  getXdRelation:__annotator(function(/*object*/ params) /*string*/ {return __bodyWrapper(this, arguments, function() {
    var display = params.display;
    if (display === 'touch' && window.postMessage && params.in_iframe) {
      
      
      
      return 'parent';
    }
    return UIServer.getXdRelation(params);
  }, {"params":[[params, 'object', 'params']],"returns":'string'});}, {"module":"sdk.UIServer","line":59,"column":16}, {"params":["object"],"returns":"string"})
};

var Methods = {
  'stream.share': {
    size      : { width: 670, height: 340 },
    url       : 'sharer.php',
    transform:__annotator(function(/*object*/ call) /*object*/ {return __bodyWrapper(this, arguments, function() {
      if (!call.params.u) {
        call.params.u = window.location.toString();
      }
      call.params.display = 'popup';
      return call;
    }, {"params":[[call, 'object', 'call']],"returns":'object'});}, {"module":"sdk.UIServer","line":75,"column":14}, {"params":["object"],"returns":"object"})
  },

  
  'apprequests': {
    transform:__annotator(function(/*object*/ call) /*object*/ {return __bodyWrapper(this, arguments, function() {
      call = MobileIframeable.transform(call);

      call.params.frictionless = Frictionless &&
        Frictionless._useFrictionless;
      if (call.params.frictionless) {

        if (Frictionless.isAllowed(call.params.to)) {
          
          // for frictionless request that's already
          
          
          call.params.display = 'iframe';
          call.params.in_iframe = true;
          
          call.hideLoader = true;
        }

        
        call.cb = Frictionless._processRequestResponse(
          call.cb,
          call.hideLoader
        );
      }
      
      
      call.closeIcon = false;
      return call;
    }, {"params":[[call, 'object', 'call']],"returns":'object'});}, {"module":"sdk.UIServer","line":86,"column":14}, {"params":["object"],"returns":"object"}),
    getXdRelation: MobileIframeable.getXdRelation
  },

  'feed': MobileIframeable,

  'permissions.oauth': {
    url       : 'dialog/oauth',
    size      : { width: (UA.mobile() ? null : 475),
                  height: (UA.mobile() ? null : 183) },
    transform:__annotator(function(/*object*/ call) /*?object*/ {return __bodyWrapper(this, arguments, function() {
      if (!Runtime.getClientID()) {
        Log.error('FB.login() called before FB.init().');
        return;
      }

      
      
      
      if (Auth.getAuthResponse()
          && !call.params.scope
          && !call.params.auth_type) {
        Log.error('FB.login() called when user is already connected.');
        call.cb && call.cb({ status: Runtime.getLoginStatus(),
                             authResponse: Auth.getAuthResponse()});
        return;
      }

      var
        cb = call.cb,
        id = call.id;
      delete call.cb;

      var responseTypes = ES('Object', 'keys', false,ES('Object', 'assign', false,
        call.params.response_type
          ? createObjectFrom(call.params.response_type.split(','))
          : {},
        { token: true, signed_request: true }
      )).join(',');

      if (call.params.display === 'async') {
        ES('Object', 'assign', false,
          call.params, {
            client_id : Runtime.getClientID(),
            origin : getContextType(),
            response_type: responseTypes,
            domain: location.hostname
          });

        call.cb = Auth.xdResponseWrapper(
          cb, Auth.getAuthResponse(), 'permissions.oauth');
      } else {
        ES('Object', 'assign', false,
          call.params, {
            client_id : Runtime.getClientID(),
            redirect_uri : resolveURI(
              UIServer.xdHandler(
                cb,
                id,
                'opener',
                Auth.getAuthResponse(),
                'permissions.oauth')),
            origin : getContextType(),
            response_type: responseTypes,
            domain: location.hostname
          });
      }

      return call;
    }, {"params":[[call, 'object', 'call']],"returns":'?object'});}, {"module":"sdk.UIServer","line":124,"column":14}, {"params":["object"],"returns":"?object"})
  },

  'auth.logout': {
    url       : 'logout.php',
    transform:__annotator(function(/*object*/ call) /*?object*/ {return __bodyWrapper(this, arguments, function() {
      if (!Runtime.getClientID()) {
        Log.error('FB.logout() called before calling FB.init().');
      } else if (!Auth.getAuthResponse()) {
        Log.error('FB.logout() called without an access token.');
      } else {
        call.params.next = UIServer.xdHandler(call.cb,
                                             call.id,
                                             'parent',
                                             Auth.getAuthResponse(),
                                             'logout');
        return call;
      }
    }, {"params":[[call, 'object', 'call']],"returns":'?object'});}, {"module":"sdk.UIServer","line":188,"column":14}, {"params":["object"],"returns":"?object"})
  },

  'login.status': {
    url       : 'dialog/oauth',
    transform:__annotator(function(/*object*/ call) /*object*/ {return __bodyWrapper(this, arguments, function() {
      var
        cb = call.cb,
        id = call.id;
      delete call.cb;
      ES('Object', 'assign', false,call.params, {
        client_id : Runtime.getClientID(),
        redirect_uri : UIServer.xdHandler(cb,
                                         id,
                                         'parent',
                                         Auth.getAuthResponse(),
                                         'login_status'),
        origin : getContextType(),
        response_type : 'token,signed_request,code',
        domain: location.hostname
      });

      return call;
    }, {"params":[[call, 'object', 'call']],"returns":'object'});}, {"module":"sdk.UIServer","line":206,"column":14}, {"params":["object"],"returns":"object"})
  },

  'pay': {
    size : { width: 555, height: 120 },
    connectDisplay : 'popup'
  }
};


var _dialogStates = {};

function _trackRunState(/*function*/ cb, /*string*/id) {return __bodyWrapper(this, arguments, function() {
  _dialogStates[id] = true;
  return __annotator(function(response)  {
    delete _dialogStates[id];
    cb(response);
  }, {"module":"sdk.UIServer","line":241,"column":9});
}, {"params":[[cb, 'function', 'cb']]});}__annotator(_trackRunState, {"module":"sdk.UIServer","line":239,"column":0,"name":"_trackRunState"}, {"params":["function"]});


function shouldEnforceSingleDialogInstance(params) {
  
  if (!feature('should_force_single_dialog_instance', true)) {
    return false;
  }

  
  var name = params.method.toLowerCase();

  
  if (name === 'pay' && params.display === 'async') {
    return true;
  }

  return false;
}__annotator(shouldEnforceSingleDialogInstance, {"module":"sdk.UIServer","line":251,"column":0,"name":"shouldEnforceSingleDialogInstance"});

var UIServer = {
  
  Methods: Methods,
  
  _loadedNodes   : {},
  _defaultCb     : {},
  _resultToken   : '"xxRESULTTOKENxx"',

  
  genericTransform:__annotator(function(/*object*/ call) /*object*/ {return __bodyWrapper(this, arguments, function() {
    if (call.params.display == 'dialog' || call.params.display == 'iframe') {
      ES('Object', 'assign', false,call.params, {
        display: 'iframe',
        channel: UIServer._xdChannelHandler(call.id, 'parent.parent')
      }, true);
    }

    return call;
  }, {"params":[[call, 'object', 'call']],"returns":'object'});}, {"module":"sdk.UIServer","line":287,"column":19}, {"params":["object"],"returns":"object"}),

  
  checkOauthDisplay:__annotator(function(params) {
    var scope = params.scope || params.perms || Runtime.getScope();
    if (!scope) {
      return params.display;
    }

    var scopes = scope.split(/\s|,/g);
    for (var ii = 0; ii< scopes.length; ii++) {
      if (!SDKConfig.initSitevars.iframePermissions[ES(scopes[ii],'trim', true)]) {
        return 'popup';
      }
    }

    return params.display;
  }, {"module":"sdk.UIServer","line":302,"column":20}),

  
  prepareCall:__annotator(function(/*object*/ params, /*function*/ cb) /*?object*/ {return __bodyWrapper(this, arguments, function() {
    var
      name   = params.method.toLowerCase(),
      method = UIServer.Methods.hasOwnProperty(name)
        ? ES('Object', 'assign', false,{}, UIServer.Methods[name])
        : {},
      id     = guid(),
      useSSL = Runtime.getSecure()
        || (name !== 'auth.status' && name != 'login.status');

    
    ES('Object', 'assign', false,params, {
      app_id       : Runtime.getClientID(),
      locale       : Runtime.getLocale(),
      sdk          : 'joey',
      access_token : useSSL && Runtime.getAccessToken() || (void 0)
    });

    
    params.display = UIServer.getDisplayMode(method, params);

    // set the default dialog URL if one doesn't exist
    if (!method.url) {
      method.url = 'dialog/' + name;
    }

    if ((method.url == 'dialog/oauth'
         || method.url == 'dialog/permissions.request')
        && (params.display == 'iframe'
            || (params.display == 'touch' && params.in_iframe))) {
      params.display = UIServer.checkOauthDisplay(params);
    }

    // don't pass the access token to the popup; if it's no longer valid the
    // popup will fail even if the user's session is valid
    if (params.display == 'popup') {
      delete params.access_token;
    }

    if (Runtime.getIsVersioned() && method.url.substring(0, 7) === 'dialog/') {
      method.url = params.version + '/' + method.url;
    }

    if (shouldEnforceSingleDialogInstance(params)) {
      // Don't allow running the dialog twice, until the callback is fired.
      if (_dialogStates[name]) {
        var errorMessage = 'Dialog "' + name +
          '" is trying to run more than once.';
        Log.warn(errorMessage);
        cb({error_code: -100, error_message: errorMessage});
        return;
      }

      cb = _trackRunState(cb, name);
    }

    
    var call = {
      cb     : cb,
      id     : id,
      size   : method.size || UIServer.getDefaultSize(),
      url    : UrlMap.resolve(params.display == 'touch' ? 'm' :'www', useSSL)
               + '/' + method.url,
      params : params,
      name   : name,
      dialog : Dialog.newInstance(id, params.display)
    };

    
    var transform = method.transform
      ? method.transform
      : UIServer.genericTransform;
    if (transform) {
      call = transform(call);

      
      if (!call) {
        return;
      }
    }

    // params.in_iframe isn't set until after the transform call
    if (params.display === 'touch' && params.in_iframe) {
      
      
      
      
      
      
      
      call.params.parent_height = window.innerHeight;
    }

    
    
    var getXdRelationFn = method.getXdRelation || UIServer.getXdRelation;
    var relation = getXdRelationFn(call.params);
    if (!(call.id in UIServer._defaultCb) &&
        !('next' in call.params) &&
        !('redirect_uri' in call.params)) {
      call.params.next = UIServer._xdResult(
        call.cb,
        call.id,
        relation,
        true 
      );
    }
    if (relation === 'parent') {
      ES('Object', 'assign', false,call.params, {
        channel_url: UIServer._xdChannelHandler(id, 'parent.parent')
      }, true);
    }

    
    call = UIServer.prepareParams(call);

    return call;
  }, {"params":[[params, 'object', 'params'], [cb, 'function', 'cb']],"returns":'?object'});}, {"module":"sdk.UIServer","line":326,"column":14}, {"params":["object","function"],"returns":"?object"}),

  prepareParams:__annotator(function(/*object*/ call) /*object*/ {return __bodyWrapper(this, arguments, function() {
    
    
    
    
    if (call.params.display !== 'async') {
      delete call.params.method;
    }

    
    call.params = flattenObject(call.params);
    var encodedQS = QueryString.encode(call.params);

    
    // (the fb native app is an exception because it doesn't
    // doesn't support POST for dialogs).
    if (!UA.nativeApp() &&
        UIServer.urlTooLongForIE(call.url + '?' + encodedQS)) {
      call.post = true;
    } else if (encodedQS) {
      call.url += '?' + encodedQS;
    }

    return call;
  }, {"params":[[call, 'object', 'call']],"returns":'object'});}, {"module":"sdk.UIServer","line":445,"column":16}, {"params":["object"],"returns":"object"}),

  urlTooLongForIE:__annotator(function(/*string*/ fullURL) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    return fullURL.length > 2000;
  }, {"params":[[fullURL, 'string', 'fullURL']],"returns":'boolean'});}, {"module":"sdk.UIServer","line":471,"column":18}, {"params":["string"],"returns":"boolean"}),

  
  getDisplayMode:__annotator(function(/*object*/ method, /*object*/ params) /*string*/ {return __bodyWrapper(this, arguments, function() {
    if (params.display === 'hidden' ||
        params.display === 'none') {
      return params.display;
    }

    var canvas = Runtime.isEnvironment(Runtime.ENVIRONMENTS.CANVAS) ||
                 Runtime.isEnvironment(Runtime.ENVIRONMENTS.PAGETAB);
    if (canvas && !params.display) {
      return 'async';
    }

    
    if (UA.mobile() || params.display === 'touch') {
      return 'touch';
    }

    // cannot use an iframe "dialog" if an access token is not available
    if (!Runtime.getAccessToken() &&
        
        
        (params.display == 'iframe' || params.display == 'dialog') &&
        !method.loggedOutIframe) {
      Log.error('"dialog" mode can only be used when the user is connected.');
      return 'popup';
    }

    if (method.connectDisplay && !canvas) {
      return method.connectDisplay;
    }

    // TODO change "dialog" to "iframe" once moved to uiserver
    return params.display || (Runtime.getAccessToken() ? 'dialog' : 'popup');
  }, {"params":[[method, 'object', 'method'], [params, 'object', 'params']],"returns":'string'});}, {"module":"sdk.UIServer","line":482,"column":17}, {"params":["object","object"],"returns":"string"}),

  
  getXdRelation:__annotator(function(/*object*/ params) /*string*/ {return __bodyWrapper(this, arguments, function() {
    var display = params.display;
    if (display === 'popup' || display === 'touch') {
      return 'opener';
    }
    if (display === 'dialog' || display === 'iframe' ||
        display === 'hidden' || display === 'none') {
      return 'parent';
    }
    if (display === 'async') {
      return 'parent.frames[' + window.name + ']';
    }
  }, {"params":[[params, 'object', 'params']],"returns":'string'});}, {"module":"sdk.UIServer","line":523,"column":16}, {"params":["object"],"returns":"string"}),

  
  popup:__annotator(function(/*object*/ call) {return __bodyWrapper(this, arguments, function() {
    
    var
      _screenX   = typeof window.screenX      != 'undefined'
        ? window.screenX
        : window.screenLeft,
      screenY    = typeof window.screenY      != 'undefined'
        ? window.screenY
        : window.screenTop,
      outerWidth = typeof window.outerWidth   != 'undefined'
        ? window.outerWidth
        : document.documentElement.clientWidth,
      outerHeight = typeof window.outerHeight != 'undefined'
        ? window.outerHeight
        : (document.documentElement.clientHeight - 22), 

      
      
      width    = UA.mobile() ? null : call.size.width,
      height   = UA.mobile() ? null : call.size.height,
      screenX  = (_screenX < 0) ? window.screen.width + _screenX : _screenX,
      left     = parseInt(screenX + ((outerWidth - width) / 2), 10),
      top      = parseInt(screenY + ((outerHeight - height) / 2.5), 10),
      features = [];

    if (width !== null) {
      features.push('width=' + width);
    }
    if (height !== null) {
      features.push('height=' + height);
    }
    features.push('left=' + left);
    features.push('top=' + top);
    features.push('scrollbars=1');
    if (call.name == 'permissions.request' ||
        call.name == 'permissions.oauth') {
      features.push('location=1,toolbar=0');
    }
    features = features.join(',');

    
    var popup;
    if (call.post) {
      popup = window.open('about:blank', call.id, features);
      if (popup) {
        UIServer.setLoadedNode(call, popup, 'popup');
        Content.submitToTarget({
          url    : call.url,
          target : call.id,
          params : call.params
        });
      }
    } else {
      popup = window.open(call.url, call.id, features);
      if (popup) {
        UIServer.setLoadedNode(call, popup, 'popup');
      }
    }

    
    if (!popup) {
      
      return;
    }

    // if there's a default close action, setup the monitor for it
    if (call.id in UIServer._defaultCb) {
      UIServer._popupMonitor();
    }
  }, {"params":[[call, 'object', 'call']]});}, {"module":"sdk.UIServer","line":543,"column":8}, {"params":["object"]}),

  setLoadedNode:__annotator(function(/*object*/ call, node, /*?string*/ type) {return __bodyWrapper(this, arguments, function() {
    if (call.params && call.params.display != 'popup') {
      
      
      // you can't set a property on an https popup window in IE.
      node.fbCallID = call.id;
    }
    node = {
      node: node,
      type: type,
      fbCallID: call.id
    };
    UIServer._loadedNodes[call.id] = node;
  }, {"params":[[call, 'object', 'call'], [type, '?string', 'type']]});}, {"module":"sdk.UIServer","line":614,"column":16}, {"params":["object","?string"]}),

  getLoadedNode:__annotator(function(call) {
    var id = typeof call == 'object' ? call.id : call,
        node = UIServer._loadedNodes[id];
    return node ? node.node : null;
  }, {"module":"sdk.UIServer","line":629,"column":16}),

  
  hidden:__annotator(function(/*object*/ call) {return __bodyWrapper(this, arguments, function() {
    call.className = 'FB_UI_Hidden';
    call.root = Content.appendHidden('');
    UIServer._insertIframe(call);
  }, {"params":[[call, 'object', 'call']]});}, {"module":"sdk.UIServer","line":640,"column":9}, {"params":["object"]}),

  
  iframe:__annotator(function(/*object*/ call) {return __bodyWrapper(this, arguments, function() {
    call.className = 'FB_UI_Dialog';
    var onClose = __annotator(function() {
      UIServer._triggerDefault(call.id);
    }, {"module":"sdk.UIServer","line":653,"column":18});
    call.root = Dialog.create({
      onClose: onClose,
      closeIcon: call.closeIcon === (void 0) ? true : call.closeIcon,
      classes: (UA.ipad() ? 'centered' : '')
    });
    if (!call.hideLoader) {
      Dialog.showLoader(onClose, call.size.width);
    }
    DOM.addCss(call.root, 'fb_dialog_iframe');
    UIServer._insertIframe(call);
  }, {"params":[[call, 'object', 'call']]});}, {"module":"sdk.UIServer","line":651,"column":9}, {"params":["object"]}),

  
  touch:__annotator(function(/*object*/ call) {return __bodyWrapper(this, arguments, function() {
    if (call.params && call.params.in_iframe) {
      
      
      if (call.ui_created) {
        Dialog.showLoader(__annotator(function() {
          UIServer._triggerDefault(call.id);
        }, {"module":"sdk.UIServer","line":679,"column":26}), 0);
      } else {
        UIServer.iframe(call);
      }
    } else if (UA.nativeApp() && !call.ui_created) {
      
      
      call.frame = call.id;
      Native.onready(__annotator(function() {
        
        
        // Native.open doesn't accept a name parameter that it
        
        
        
        UIServer.setLoadedNode(
          call,
          Native.open(call.url + '#cb=' + call.frameName),
          'native');
      }, {"module":"sdk.UIServer","line":689,"column":21}));
      UIServer._popupMonitor();
    } else if (!call.ui_created) {
      
      UIServer.popup(call);
    }
  }, {"params":[[call, 'object', 'call']]});}, {"module":"sdk.UIServer","line":674,"column":8}, {"params":["object"]}),

  
  async:__annotator(function(/*object*/ call) {return __bodyWrapper(this, arguments, function() {
    call.params.redirect_uri = location.protocol + '//' +
      location.host + location.pathname;
    delete call.params.access_token;

    RPC.remote.showDialog(
      call.params,
      
      __annotator(function(/*object*/ response)  {return __bodyWrapper(this, arguments, function() {
        var result = response.result;
        
        if (result && result.e2e) {
          var dialog = Dialog.get(call.id);
          dialog.trackEvents(result.e2e);
          dialog.trackEvent('close');
          delete result.e2e;
        }
        call.cb(result);
      }, {"params":[[response, 'object', 'response']]});}, {"module":"sdk.UIServer","line":723,"column":6}, {"params":["object"]})
    );
  }, {"params":[[call, 'object', 'call']]});}, {"module":"sdk.UIServer","line":715,"column":8}, {"params":["object"]}),

  getDefaultSize:__annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    return Dialog.getDefaultSize();
  }, {"returns":'object'});}, {"module":"sdk.UIServer","line":737,"column":17}, {"returns":"object"}),

  
  _insertIframe:__annotator(function(/*object*/ call) {return __bodyWrapper(this, arguments, function() {
    
    
    // from the _frames nodes, and we won't add the node back in.
    UIServer._loadedNodes[call.id] = false;
    var activate = __annotator(function(/*DOMElement*/ node) {return __bodyWrapper(this, arguments, function() {
      if (call.id in UIServer._loadedNodes) {
        UIServer.setLoadedNode(call, node, 'iframe');
      }
    }, {"params":[[node, 'HTMLElement', 'node']]});}, {"module":"sdk.UIServer","line":751,"column":19}, {"params":["DOMElement"]});

    
    if (call.post) {
      insertIframe({
        url       : 'about:blank',
        root      : call.root,
        className : call.className,
        width     : call.size.width,
        height    : call.size.height,
        id        : call.id,
        onInsert  : activate,
        onload    : __annotator(function(/*DOMElement*/ node) {return __bodyWrapper(this, arguments, function() {
          Content.submitToTarget({
            url    : call.url,
            target : node.name,
            params : call.params
          });
        }, {"params":[[node, 'HTMLElement', 'node']]});}, {"module":"sdk.UIServer","line":767,"column":20}, {"params":["DOMElement"]})
      });
    } else {
      insertIframe({
        url       : call.url,
        root      : call.root,
        className : call.className,
        width     : call.size.width,
        height    : call.size.height,
        id        : call.id,
        name      : call.frameName,
        onInsert  : activate
      });
    }
  }, {"params":[[call, 'object', 'call']]});}, {"module":"sdk.UIServer","line":746,"column":16}, {"params":["object"]}),

  
  _handleResizeMessage:__annotator(function(/*string*/ frame, /*object*/ data) {return __bodyWrapper(this, arguments, function() {
    var node = UIServer.getLoadedNode(frame);
    if (!node) {
      return;
    }

    if (data.height) {
      node.style.height = data.height + 'px';
    }
    if (data.width) {
      node.style.width = data.width + 'px';
    }

    XD.inform(
      'resize.ack',
      data || {},
      'parent.frames[' + node.name + ']');

    if (!Dialog.isActive(node)) {
      Dialog.show(node);
    }
  }, {"params":[[frame, 'string', 'frame'], [data, 'object', 'data']]});}, {"module":"sdk.UIServer","line":794,"column":23}, {"params":["string","object"]}),

  
  _triggerDefault:__annotator(function(/*string*/ id) {return __bodyWrapper(this, arguments, function() {
    UIServer._xdRecv(
      { frame: id },
      UIServer._defaultCb[id] || __annotator(function() {}, {"module":"sdk.UIServer","line":825,"column":33})
    );
  }, {"params":[[id, 'string', 'id']]});}, {"module":"sdk.UIServer","line":822,"column":18}, {"params":["string"]}),

  
  _popupMonitor:__annotator(function() {
    
    var found;
    for (var id in UIServer._loadedNodes) {
      
      if (UIServer._loadedNodes.hasOwnProperty(id) &&
          id in UIServer._defaultCb) {
        var node = UIServer._loadedNodes[id];
        if (node.type != 'popup' && node.type != 'native') {
          continue;
        }
        var win = node.node;

        try {
          
          if (win.closed) {
            UIServer._triggerDefault(id);
          } else {
            found = true; 
          }
        } catch (y) {
          
        }
      }
    }

    if (found && !UIServer._popupInterval) {
      // start the monitor if needed and it's not already running
      UIServer._popupInterval = setInterval(UIServer._popupMonitor, 100);
    } else if (!found && UIServer._popupInterval) {
      // shutdown if we have nothing to monitor but it's running
      clearInterval(UIServer._popupInterval);
      UIServer._popupInterval = null;
    }
  }, {"module":"sdk.UIServer","line":835,"column":16}),

  
  _xdChannelHandler:__annotator(function(/*string*/ frame, /*string*/ relation)
      /*string*/ {return __bodyWrapper(this, arguments, function() {
    return XD.handler(__annotator(function(/*object*/ data) {return __bodyWrapper(this, arguments, function() {
      var node = UIServer.getLoadedNode(frame);
      if (!node) { 
        return;
      }

      if (data.type == 'resize') {
        UIServer._handleResizeMessage(frame, data);
      } else if (data.type == 'hide') {
        Dialog.hide(node);
      } else if (data.type == 'rendered') {
        var root = Dialog._findRoot(node);
        Dialog.show(root);
      } else if (data.type == 'fireevent') {
        Event.fire(data.event);
      }
    }, {"params":[[data, 'object', 'data']]});}, {"module":"sdk.UIServer","line":881,"column":22}, {"params":["object"]}), relation, true, null);
  }, {"params":[[frame, 'string', 'frame'], [relation, 'string', 'relation']],"returns":'string'});}, {"module":"sdk.UIServer","line":879,"column":20}, {"params":["string","string"],"returns":"string"}),

  
  _xdNextHandler:__annotator(function(/*function*/ cb, /*string*/ frame,
       /*string*/ relation, /*boolean*/ isDefault) /*string*/ {return __bodyWrapper(this, arguments, function() {
    if (isDefault) {
      UIServer._defaultCb[frame] = cb;
    }

    return XD.handler(__annotator(function(data) {
      UIServer._xdRecv(data, cb);
    }, {"module":"sdk.UIServer","line":917,"column":22}), relation) + '&frame=' + frame;
  }, {"params":[[cb, 'function', 'cb'], [frame, 'string', 'frame'], [relation, 'string', 'relation'], [isDefault, 'boolean', 'isDefault']],"returns":'string'});}, {"module":"sdk.UIServer","line":911,"column":17}, {"params":["function","string","string","boolean"],"returns":"string"}),

  
  _xdRecv:__annotator(function(/*object*/ data, /*function*/ cb) {return __bodyWrapper(this, arguments, function() {
    var frame = UIServer.getLoadedNode(data.frame);
    if (frame) {
      if (frame.close) {
        
        try {
          frame.close();
          
          
          
          if (/iPhone.*Version\/(5|6)/.test(navigator.userAgent)
              && RegExp.$1 !== '5') {
            window.focus();
          }
          UIServer._popupCount--;
        } catch (y) {
          
        }
      } else {
        
        if (DOM.containsCss(frame, 'FB_UI_Hidden')) {
          
          // async flash crap. seriously, don't ever ask me about it.
          setTimeout(__annotator(function() {
            
            frame.parentNode.parentNode.removeChild(frame.parentNode);
          }, {"module":"sdk.UIServer","line":953,"column":21}), 3000);
        } else if (DOM.containsCss(frame, 'FB_UI_Dialog')) {
          Dialog.remove(frame);
        }
      }
    }
    
    delete UIServer._loadedNodes[data.frame];
    delete UIServer._defaultCb[data.frame];
    
    if (data.e2e) {
      var dialog = Dialog.get(data.frame);
      dialog.trackEvents(data.e2e);
      dialog.trackEvent('close');
      delete data.e2e;
    }
    cb(data);
  }, {"params":[[data, 'object', 'data'], [cb, 'function', 'cb']]});}, {"module":"sdk.UIServer","line":930,"column":10}, {"params":["object","function"]}),

  
  _xdResult:__annotator(function(/*function*/ cb, /*string*/ frame, /*string*/ target,
      /*boolean*/ isDefault) /*string*/ {return __bodyWrapper(this, arguments, function() {
    return (
      UIServer._xdNextHandler(__annotator(function(params) {
        cb && cb(params.result &&
                 params.result != UIServer._resultToken &&
                 ES('JSON', 'parse', false,params.result));
      }, {"module":"sdk.UIServer","line":989,"column":30}), frame, target, isDefault) +
      
      '&result=' + encodeURIComponent(UIServer._resultToken)
    );
  }, {"params":[[cb, 'function', 'cb'], [frame, 'string', 'frame'], [target, 'string', 'target'], [isDefault, 'boolean', 'isDefault']],"returns":'string'});}, {"module":"sdk.UIServer","line":986,"column":12}, {"params":["function","string","string","boolean"],"returns":"string"}),

  xdHandler:__annotator(function(/*function*/ cb, /*string*/ frame, /*string*/ target,
      /*?object*/ authResponse, /*string*/ method) /*string*/ {return __bodyWrapper(this, arguments, function() {
    return UIServer._xdNextHandler(
      Auth.xdResponseWrapper(cb, authResponse, method),
      frame,
      target,
      true);
  }, {"params":[[cb, 'function', 'cb'], [frame, 'string', 'frame'], [target, 'string', 'target'], [authResponse, '?object', 'authResponse'], [method, 'string', 'method']],"returns":'string'});}, {"module":"sdk.UIServer","line":999,"column":12}, {"params":["function","string","string","?object","string"],"returns":"string"})

};

RPC.stub('showDialog');
module.exports = UIServer;


}, {"module":"sdk.UIServer","line":10,"column":303}),null);


__d("sdk.ui",["Assert","sdk.Impressions","Log","sdk.PlatformVersioning","sdk.Runtime","sdk.UIServer","sdk.feature"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Assert,Impressions,Log,PlatformVersioning,Runtime,UIServer,feature) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   

   


function ui(/*object*/ params, /*?function*/ cb) /*?object*/ {return __bodyWrapper(this, arguments, function() {
  Assert.isObject(params);
  Assert.maybeFunction(cb);

  if (Runtime.getIsVersioned()) {
    PlatformVersioning.assertVersionIsSet();
    if (params.version) {
      PlatformVersioning.assertValidVersion(params.version);
    } else {
      params.version = Runtime.getVersion();
    }
  }

  params = ES('Object', 'assign', false,{}, params);
  if (!params.method) {
    Log.error('"method" is a required parameter for FB.ui().');
    return null;
  }

  if (params.method == 'pay.prompt') {
    params.method = 'pay';
  }

  var method = params.method;

  if (params.redirect_uri) {
    Log.warn('When using FB.ui, you should not specify a redirect_uri.');
    delete params.redirect_uri;
  }

  
  if ((method == 'permissions.request' || method == 'permissions.oauth') &&
      (params.display == 'iframe' || params.display == 'dialog')) {
    params.display = UIServer.checkOauthDisplay(params);
  }

  var enableE2E = feature('e2e_tracking', true);
  if (enableE2E) {
    
    params.e2e = {};
  }
  var call = UIServer.prepareCall(params, cb || __annotator(function() {}, {"module":"sdk.ui","line":113,"column":48}));
  if (!call) { 
    return null;
  }

  // each allowed "display" value maps to a function
  var displayName = call.params.display;
  if (displayName === 'dialog') { 
                                 
    displayName = 'iframe';
  } else if (displayName === 'none') {
    displayName = 'hidden';
  }

  var displayFn = UIServer[displayName];
  if (!displayFn) {
    Log.error('"display" must be one of "popup", ' +
           '"dialog", "iframe", "touch", "async", "hidden", or "none"');
    return null;
  }

  if (enableE2E) {
    call.dialog.subscribe('e2e:end', __annotator(function(/*object*/ events) {return __bodyWrapper(this, arguments, function() {
      events.method = method;
      events.display = displayName;
      Log.debug('e2e: %s', ES('JSON', 'stringify', false,events));
      
      Impressions.log(114, {
        payload: events
      });
    }, {"params":[[events, 'object', 'events']]});}, {"module":"sdk.ui","line":135,"column":37}, {"params":["object"]}));
  }
  displayFn(call);
  return call.dialog;
}, {"params":[[params, 'object', 'params'], [cb, '?function', 'cb']],"returns":'?object'});}__annotator(ui, {"module":"sdk.ui","line":72,"column":0,"name":"ui"}, {"params":["object","?function"],"returns":"?object"});

module.exports = ui;


}, {"module":"sdk.ui","line":7,"column":116}),null);


__d("legacy:fb.auth",["sdk.Auth","sdk.Cookie","copyProperties","sdk.Event","FB","Log","sdk.Runtime","sdk.SignedRequest","sdk.ui"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,Auth,Cookie,copyProperties,Event,FB,Log,Runtime,SignedRequest,ui) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   

FB.provide('', {

  getLoginStatus: __annotator(function() /*?object*/ {return __bodyWrapper(this, arguments, function() {
    return Auth.getLoginStatus.apply(Auth, arguments);
  }, {"returns":'?object'});}, {"module":"fb.auth","line":18,"column":18}, {"returns":"?object"}),

  getAuthResponse: __annotator(function() /*?object*/ {return __bodyWrapper(this, arguments, function() {
    return Auth.getAuthResponse();
  }, {"returns":'?object'});}, {"module":"fb.auth","line":22,"column":19}, {"returns":"?object"}),

  getAccessToken: __annotator(function() /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return Runtime.getAccessToken() || null;
  }, {"returns":'?string'});}, {"module":"fb.auth","line":26,"column":18}, {"returns":"?string"}),

  getUserID: __annotator(function() /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return Runtime.getUserID() || Runtime.getCookieUserID();
  }, {"returns":'?string'});}, {"module":"fb.auth","line":30,"column":13}, {"returns":"?string"}),

  login: __annotator(function(/*?function*/ cb, /*?object*/ opts) {return __bodyWrapper(this, arguments, function() {
    if (opts && opts.perms && !opts.scope) {
      opts.scope = opts.perms;
      delete opts.perms;
      Log.warn('OAuth2 specification states that \'perms\' ' +
             'should now be called \'scope\'.  Please update.');
    }
    var canvas = Runtime.isEnvironment(Runtime.ENVIRONMENTS.CANVAS) ||
                 Runtime.isEnvironment(Runtime.ENVIRONMENTS.PAGETAB);
    ui(copyProperties({
        method: 'permissions.oauth',
        display: canvas
          ? 'async'
          : 'popup',
        domain: location.hostname
      }, opts || {}),
    cb);
  }, {"params":[[cb, '?function', 'cb'], [opts, '?object', 'opts']]});}, {"module":"fb.auth","line":34,"column":9}, {"params":["?function","?object"]}),


  logout: __annotator(function(/*?function*/ cb) {return __bodyWrapper(this, arguments, function() {
    ui({ method: 'auth.logout', display: 'hidden' }, cb);
  }, {"params":[[cb, '?function', 'cb']]});}, {"module":"fb.auth","line":54,"column":10}, {"params":["?function"]})
});

Auth.subscribe('logout', ES(Event.fire, 'bind', true,Event, 'auth.logout'));
Auth.subscribe('login', ES(Event.fire, 'bind', true,Event, 'auth.login'));
Auth.subscribe('authresponse.change', ES(Event.fire, 'bind', true,Event,
  'auth.authResponseChange'));
Auth.subscribe('status.change', ES(Event.fire, 'bind', true,Event, 'auth.statusChange'));

Event.subscribe('init:post', __annotator(function(/*object*/ options) {return __bodyWrapper(this, arguments, function() {
  if (options.status) {
    Auth.getLoginStatus();
  }
  if (Runtime.getClientID()) {
    if (options.authResponse) {
      Auth.setAuthResponse(options.authResponse, 'connected');
    } else if (Runtime.getUseCookie()) {
      // we don't have an access token yet, but we might have a user
      
      var signedRequest = Cookie.loadSignedRequest(), parsedSignedRequest;
      if (signedRequest) {
        try {
          parsedSignedRequest = SignedRequest.parse(signedRequest);
        } catch (e) {
          
          Cookie.clearSignedRequestCookie();
        }
        if (parsedSignedRequest && parsedSignedRequest.user_id) {
          Runtime.setCookieUserID(parsedSignedRequest.user_id);
        }
      }
      Cookie.loadMeta();
    }
  }
}, {"params":[[options, 'object', 'options']]});}, {"module":"fb.auth","line":65,"column":29}, {"params":["object"]}));


}, {"module":"fb.auth","line":5,"column":130}),3);


__d("sdk.Canvas.IframeHandling",["DOMWrapper","sdk.RPC"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,DOMWrapper,RPC) {require.__markCompiled && require.__markCompiled();
   
   

var autoGrowTimer = null;
var autoGrowLastSize;

function getHeight() {
  var document = DOMWrapper.getWindow().document;
  var body = document.body,
      docElement = document.documentElement,
      bodyTop = Math.max(body.offsetTop, 0),
      docTop = Math.max(docElement.offsetTop, 0),
      bodyScroll = body.scrollHeight + bodyTop,
      bodyOffset = body.offsetHeight + bodyTop,
      docScroll = docElement.scrollHeight + docTop,
      docOffset = docElement.offsetHeight + docTop;

  return Math.max(bodyScroll, bodyOffset, docScroll, docOffset);
}__annotator(getHeight, {"module":"sdk.Canvas.IframeHandling","line":14,"column":0,"name":"getHeight"});

function setSize(/*?object*/ params) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  
  if (typeof params != 'object') {
    params = {};
  }
  var minShrink = 0,
      minGrow = 0;
  if (!params.height) {
    params.height = getHeight();
    
    
    
    
    
    minShrink = 16;
    minGrow = 4;
  }

  if (!params.frame) {
    params.frame = window.name || 'iframe_canvas';
  }

  if (autoGrowLastSize) {
    var oldHeight = autoGrowLastSize.height;
    var dHeight = params.height - oldHeight;
    if (dHeight <= minGrow && dHeight >= -minShrink) {
      return false;
    }
  }
  autoGrowLastSize = params;
  RPC.remote.setSize(params);
  return true;
}, {"params":[[params, '?object', 'params']],"returns":'boolean'});}__annotator(setSize, {"module":"sdk.Canvas.IframeHandling","line":28,"column":0,"name":"setSize"}, {"params":["?object"],"returns":"boolean"});

function setAutoGrow(on, interval) {
  if (interval === (void 0) && typeof on === 'number') {
    interval = on;
    on = true;
  }

  if (on || on === (void 0)) {
    if (autoGrowTimer === null) {
      // Wrap the call in a function to avoid having FF pass in the 'Lateness'
      
      autoGrowTimer = setInterval(__annotator(function() {
        setSize();
      }, {"module":"sdk.Canvas.IframeHandling","line":72,"column":34}), interval || 100);
    }
    setSize();
  } else {
    if (autoGrowTimer !== null) {
      clearInterval(autoGrowTimer);
      autoGrowTimer = null;
    }
  }
}__annotator(setAutoGrow, {"module":"sdk.Canvas.IframeHandling","line":62,"column":0,"name":"setAutoGrow"});

RPC.stub('setSize');

var IframeHandling = {
  setSize: setSize,
  setAutoGrow: setAutoGrow
};

module.exports = IframeHandling;


}, {"module":"sdk.Canvas.IframeHandling","line":7,"column":57}),null);


__d("sdk.Canvas.Navigation",["sdk.RPC"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,RPC) {require.__markCompiled && require.__markCompiled();
   


function setUrlHandler(/*function*/ callback) {return __bodyWrapper(this, arguments, function() {
  RPC.local.navigate = __annotator(function(/*string*/ path) {return __bodyWrapper(this, arguments, function() {
    callback({ path: path });
  }, {"params":[[path, 'string', 'path']]});}, {"module":"sdk.Canvas.Navigation","line":38,"column":23}, {"params":["string"]});
  RPC.remote.setNavigationEnabled(true);
}, {"params":[[callback, 'function', 'callback']]});}__annotator(setUrlHandler, {"module":"sdk.Canvas.Navigation","line":37,"column":0,"name":"setUrlHandler"}, {"params":["function"]});


RPC.stub('setNavigationEnabled');

var Navigation = {
  setUrlHandler: setUrlHandler
};

module.exports = Navigation;


}, {"module":"sdk.Canvas.Navigation","line":7,"column":40}),null);


__d("sdk.Canvas.Plugin",["Log","sdk.RPC","sdk.Runtime","sdk.UA","sdk.api","createArrayFromMixed"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Log,RPC,Runtime,UA,api,createArrayFromMixed) {require.__markCompiled && require.__markCompiled();
   
   
   
   

   
   

var flashClassID = 'CLSID:D27CDB6E-AE6D-11CF-96B8-444553540000';
var unityClassID = 'CLSID:444785F1-DE89-4295-863A-D46C3A781394';
var devHidePluginCallback = null;


var osx = UA.osx() && UA.osx.getVersionParts();
var unityNeedsToBeHidden = !((osx && osx[0] > 10 && osx[1] > 10) 
                             && (UA.chrome() >= 31
                                 || UA.webkit() >= 537.71
                                 || UA.firefox() >= 25));


function hideUnityElement(/*DOMElement*/ elem) {return __bodyWrapper(this, arguments, function() {
  elem._hideunity_savedstyle = {};
  elem._hideunity_savedstyle.left = elem.style.left;
  elem._hideunity_savedstyle.position = elem.style.position;
  elem._hideunity_savedstyle.width = elem.style.width;
  elem._hideunity_savedstyle.height = elem.style.height;
  elem.style.left = '-10000px';
  elem.style.position = 'absolute';
  elem.style.width = '1px';
  elem.style.height = '1px';
}, {"params":[[elem, 'HTMLElement', 'elem']]});}__annotator(hideUnityElement, {"module":"sdk.Canvas.Plugin","line":41,"column":0,"name":"hideUnityElement"}, {"params":["DOMElement"]});


function showUnityElement(/*DOMElement*/ elem) {return __bodyWrapper(this, arguments, function() {
  if (elem._hideunity_savedstyle) {
    elem.style.left     = elem._hideunity_savedstyle.left;
    elem.style.position = elem._hideunity_savedstyle.position;
    elem.style.width    = elem._hideunity_savedstyle.width;
    elem.style.height   = elem._hideunity_savedstyle.height;
  }
}, {"params":[[elem, 'HTMLElement', 'elem']]});}__annotator(showUnityElement, {"module":"sdk.Canvas.Plugin","line":60,"column":0,"name":"showUnityElement"}, {"params":["DOMElement"]});


function hideFlashElement(/*DOMElement*/ elem) {return __bodyWrapper(this, arguments, function() {
  elem._old_visibility = elem.style.visibility;
  elem.style.visibility = 'hidden';
}, {"params":[[elem, 'HTMLElement', 'elem']]});}__annotator(hideFlashElement, {"module":"sdk.Canvas.Plugin","line":76,"column":0,"name":"hideFlashElement"}, {"params":["DOMElement"]});


function showFlashElement(/*DOMElement*/ elem) {return __bodyWrapper(this, arguments, function() {
  elem.style.visibility = elem._old_visibility || '';
  delete elem._old_visibility;
}, {"params":[[elem, 'HTMLElement', 'elem']]});}__annotator(showFlashElement, {"module":"sdk.Canvas.Plugin","line":88,"column":0,"name":"showFlashElement"}, {"params":["DOMElement"]});

function isHideableFlashElement(/*DOMElement*/ elem) {return __bodyWrapper(this, arguments, function() {
  var type = elem.type ? elem.type.toLowerCase() : null;
  var isHideable = type === 'application/x-shockwave-flash'
        || (elem.classid && elem.classid.toUpperCase() == flashClassID);

  if (!isHideable) {
    return false;
  }

  // for flash elements we don't need to hide if it is in wmode
  
  var keepvisibleRegex = /opaque|transparent/i;
  if (keepvisibleRegex.test(elem.getAttribute('wmode'))) {
    return false;
  }

  for (var j = 0; j < elem.childNodes.length; j++) {
    var node = elem.childNodes[j];
    if (/param/i.test(node.nodeName) && /wmode/i.test(node.name) &&
      keepvisibleRegex.test(node.value)) {
      return false;
    }
  }
  return true;
}, {"params":[[elem, 'HTMLElement', 'elem']]});}__annotator(isHideableFlashElement, {"module":"sdk.Canvas.Plugin","line":93,"column":0,"name":"isHideableFlashElement"}, {"params":["DOMElement"]});

function isHideableUnityElement(/*DOMElement*/ elem) {return __bodyWrapper(this, arguments, function() {
  var type = elem.type ? elem.type.toLowerCase() : null;
  return type === 'application/vnd.unity'
    || (elem.classid && elem.classid.toUpperCase() == unityClassID);
}, {"params":[[elem, 'HTMLElement', 'elem']]});}__annotator(isHideableUnityElement, {"module":"sdk.Canvas.Plugin","line":119,"column":0,"name":"isHideableUnityElement"}, {"params":["DOMElement"]});


function hidePluginCallback(/*object*/ params) {return __bodyWrapper(this, arguments, function() {
  var candidates = createArrayFromMixed(
    window.document.getElementsByTagName('object')
  );
  candidates = candidates.concat(
    createArrayFromMixed(window.document.getElementsByTagName('embed'))
  );

  var flashPresent = false;
  var unityPresent = false;
  ES(candidates, 'forEach', true,__annotator(function(/*DOMElement*/ elem) {return __bodyWrapper(this, arguments, function() {
    var isFlashElement = isHideableFlashElement(elem);
    var isUnityElement = unityNeedsToBeHidden && isHideableUnityElement(elem);
    if (!isFlashElement && !isUnityElement) {
      return;
    }

    flashPresent = flashPresent || isFlashElement;
    unityPresent = unityPresent || isUnityElement;

    var visibilityToggleCb = __annotator(function() {
      if (params.state === 'opened') {
        if (isFlashElement) {
          hideFlashElement(elem);
        } else {
          hideUnityElement(elem);
        }
      } else {
        if (isFlashElement) {
          showFlashElement(elem);
        } else {
          showUnityElement(elem);
        }
      }
    }, {"module":"sdk.Canvas.Plugin","line":150,"column":29});

    if (devHidePluginCallback) {
      Log.info('Calling developer specified callback');
      
      
      
      var devArgs = { state : params.state, elem : elem };
      devHidePluginCallback(devArgs);
      setTimeout(visibilityToggleCb, 200);
    } else {
      visibilityToggleCb();
    }
  }, {"params":[[elem, 'HTMLElement', 'elem']]});}, {"module":"sdk.Canvas.Plugin","line":140,"column":21}, {"params":["DOMElement"]}));

  if (Math.random() <= 1 / 1000) {
    var opts = {
      'unity': unityPresent,
      'flash': flashPresent
    };
    api(Runtime.getClientID() + '/occludespopups', 'post', opts);
  }
}, {"params":[[params, 'object', 'params']]});}__annotator(hidePluginCallback, {"module":"sdk.Canvas.Plugin","line":130,"column":0,"name":"hidePluginCallback"}, {"params":["object"]});

RPC.local.hidePluginObjects = __annotator(function() {
  Log.info('hidePluginObjects called');
  hidePluginCallback({state: 'opened'});
}, {"module":"sdk.Canvas.Plugin","line":188,"column":30});
RPC.local.showPluginObjects = __annotator(function() {
  Log.info('showPluginObjects called');
  hidePluginCallback({state: 'closed'});
}, {"module":"sdk.Canvas.Plugin","line":192,"column":30});


RPC.local.showFlashObjects = RPC.local.showPluginObjects;
RPC.local.hideFlashObjects = RPC.local.hidePluginObjects;

function hidePluginElement() {
  hideFlashElement();
  hideUnityElement();
}__annotator(hidePluginElement, {"module":"sdk.Canvas.Plugin","line":201,"column":0,"name":"hidePluginElement"});
function showPluginElement() {
  showFlashElement();
  showUnityElement();
}__annotator(showPluginElement, {"module":"sdk.Canvas.Plugin","line":205,"column":0,"name":"showPluginElement"});

var Plugin = {
  
  _setHidePluginCallback: __annotator(function(/*?function*/ callback) {return __bodyWrapper(this, arguments, function() {
    devHidePluginCallback = callback;
  }, {"params":[[callback, '?function', 'callback']]});}, {"module":"sdk.Canvas.Plugin","line":212,"column":26}, {"params":["?function"]}),

  hidePluginElement: hidePluginElement,
  showPluginElement: showPluginElement
};

module.exports = Plugin;


}, {"module":"sdk.Canvas.Plugin","line":7,"column":98}),null);


__d("sdk.Canvas.Tti",["sdk.RPC","sdk.Runtime"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,RPC,Runtime) {require.__markCompiled && require.__markCompiled();
   
   

function passAppTtiMessage(/*?function*/ callback, /*string*/ messageName) {return __bodyWrapper(this, arguments, function() {
  var params = {
    appId: Runtime.getClientID(),
    time: ES('Date', 'now', false),
    name: messageName
  };

  var args = [params];
  if (callback) {
    args.push(__annotator(function(/*object*/ response) {return __bodyWrapper(this, arguments, function() {
      callback(response.result);
    }, {"params":[[response, 'object', 'response']]});}, {"module":"sdk.Canvas.Tti","line":20,"column":14}, {"params":["object"]}));
  }

  RPC.remote.logTtiMessage.apply(null, args);
}, {"params":[[callback, '?function', 'callback'], [messageName, 'string', 'messageName']]});}__annotator(passAppTtiMessage, {"module":"sdk.Canvas.Tti","line":11,"column":0,"name":"passAppTtiMessage"}, {"params":["?function","string"]});


function startTimer() {
  passAppTtiMessage(null, 'StartIframeAppTtiTimer');
}__annotator(startTimer, {"module":"sdk.Canvas.Tti","line":33,"column":0,"name":"startTimer"});

function stopTimer(/*?function*/ callback) {return __bodyWrapper(this, arguments, function() {
  passAppTtiMessage(callback, 'StopIframeAppTtiTimer');
}, {"params":[[callback, '?function', 'callback']]});}__annotator(stopTimer, {"module":"sdk.Canvas.Tti","line":45,"column":0,"name":"stopTimer"}, {"params":["?function"]});


function setDoneLoading(/*?function*/ callback) {return __bodyWrapper(this, arguments, function() {
  passAppTtiMessage(callback, 'RecordIframeAppTti');
}, {"params":[[callback, '?function', 'callback']]});}__annotator(setDoneLoading, {"module":"sdk.Canvas.Tti","line":58,"column":0,"name":"setDoneLoading"}, {"params":["?function"]});

RPC.stub('logTtiMessage');

var Tti = {
  setDoneLoading: setDoneLoading,
  startTimer: startTimer,
  stopTimer: stopTimer
};

module.exports = Tti;


}, {"module":"sdk.Canvas.Tti","line":7,"column":47}),null);


__d("legacy:fb.canvas",["Assert","sdk.Canvas.Environment","sdk.Event","FB","sdk.Canvas.IframeHandling","sdk.Canvas.Navigation","sdk.Canvas.Plugin","sdk.RPC","sdk.Runtime","sdk.Canvas.Tti"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,Assert,Environment,Event,FB,IframeHandling,Navigation,Plugin,RPC,Runtime,Tti) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   
   

FB.provide('Canvas', {
  
  setSize: __annotator(function(params) {
    Assert.maybeObject(params, 'Invalid argument');
    return IframeHandling.setSize.apply(null, arguments);
  }, {"module":"fb.canvas","line":18,"column":11}),
  setAutoGrow: __annotator(function() {
    return IframeHandling.setAutoGrow.apply(null, arguments);
  }, {"module":"fb.canvas","line":22,"column":15}),

  
  getPageInfo: __annotator(function(callback) {
    Assert.isFunction(callback, 'Invalid argument');
    return Environment.getPageInfo.apply(null, arguments);
  }, {"module":"fb.canvas","line":27,"column":15}),
  scrollTo: __annotator(function(x, y) {
    Assert.maybeNumber(x, 'Invalid argument');
    Assert.maybeNumber(y, 'Invalid argument');
    return Environment.scrollTo.apply(null, arguments);
  }, {"module":"fb.canvas","line":31,"column":12}),

  
  setDoneLoading: __annotator(function(callback) {
    Assert.maybeFunction(callback, 'Invalid argument');
    return Tti.setDoneLoading.apply(null, arguments);
  }, {"module":"fb.canvas","line":38,"column":18}),
  startTimer: __annotator(function() {
    return Tti.startTimer.apply(null, arguments);
  }, {"module":"fb.canvas","line":42,"column":14}),
  stopTimer: __annotator(function(callback) {
    Assert.maybeFunction(callback, 'Invalid argument');
    return Tti.stopTimer.apply(null, arguments);
  }, {"module":"fb.canvas","line":45,"column":13}),

  
  getHash: __annotator(function(callback) {
    Assert.isFunction(callback, 'Invalid argument');
    return Navigation.getHash.apply(null, arguments);
  }, {"module":"fb.canvas","line":51,"column":11}),
  setHash: __annotator(function(hash) {
    Assert.isString(hash, 'Invalid argument');
    return Navigation.setHash.apply(null, arguments);
  }, {"module":"fb.canvas","line":55,"column":11}),
  setUrlHandler: __annotator(function(callback) {
    Assert.isFunction(callback, 'Invalid argument');
    return Navigation.setUrlHandler.apply(null, arguments);
  }, {"module":"fb.canvas","line":59,"column":17})

});

RPC.local.fireEvent = ES(Event.fire, 'bind', true,Event);

Event.subscribe('init:post', __annotator(function(options) {
  if (Runtime.isEnvironment(Runtime.ENVIRONMENTS.CANVAS)) {
    Assert.isTrue(
      !options.hideFlashCallback || !options.hidePluginCallback,
      'cannot specify deprecated hideFlashCallback and new hidePluginCallback'
    );
    Plugin._setHidePluginCallback(
      options.hidePluginCallback ||
        options.hideFlashCallback 
    );
  }
}, {"module":"fb.canvas","line":68,"column":29}));


}, {"module":"fb.canvas","line":4,"column":189}),3);


__d("legacy:fb.canvas-legacy",["Assert","FB","Log","sdk.Canvas.Tti"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,Assert,FB,Log,Tti) {require.__markCompiled && require.__markCompiled();
   
   
   
   

FB.provide('CanvasInsights', {
  setDoneLoading: __annotator(function(callback) {
    Log.warn('Deprecated: use FB.Canvas.setDoneLoading');
    Assert.maybeFunction(callback, 'Invalid argument');
    return Tti.setDoneLoading.apply(null, arguments);
  }, {"module":"fb.canvas-legacy","line":11,"column":18})
});


}, {"module":"fb.canvas-legacy","line":4,"column":69}),3);


__d("sdk.Canvas.Prefetcher",["sdk.api","createArrayFromMixed","JSSDKCanvasPrefetcherConfig","sdk.Runtime"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,api,createArrayFromMixed,CanvasPrefetcherConfig,Runtime) {require.__markCompiled && require.__markCompiled();
   
   
   
   

var COLLECT = {
  AUTOMATIC : 0,
  MANUAL : 1
};

var sampleRate = CanvasPrefetcherConfig.sampleRate;
var blacklist = CanvasPrefetcherConfig.blacklist;
var collectionMode = COLLECT.AUTOMATIC;
var links = [];

function sample() {
  
  var resourceFieldsByTag = {
    object: 'data',
    link: 'href',
    script: 'src'
  };

  if (collectionMode == COLLECT.AUTOMATIC) {
    ES(ES('Object', 'keys', false,resourceFieldsByTag), 'forEach', true,__annotator(function(/*string*/ tagName) {return __bodyWrapper(this, arguments, function() {
      var propertyName = resourceFieldsByTag[tagName];
      ES(createArrayFromMixed(document.getElementsByTagName(tagName)), 'forEach', true,__annotator(function(/*DOMElement*/ tag) {return __bodyWrapper(this, arguments, function() {
          if (tag[propertyName]) {
            links.push(tag[propertyName]);
          }
        }, {"params":[[tag, 'HTMLElement', 'tag']]});}, {"module":"sdk.Canvas.Prefetcher","line":35,"column":17}, {"params":["DOMElement"]}));
    }, {"params":[[tagName, 'string', 'tagName']]});}, {"module":"sdk.Canvas.Prefetcher","line":32,"column":45}, {"params":["string"]}));
  }

  if (links.length === 0) {
    return;
  }

  
  api(Runtime.getClientID() + '/staticresources', 'post', {
    urls: ES('JSON', 'stringify', false,links),
    is_https: location.protocol === 'https:'
  });

  links = [];
}__annotator(sample, {"module":"sdk.Canvas.Prefetcher","line":23,"column":0,"name":"sample"});

function maybeSample() {
  if (!Runtime.isEnvironment(Runtime.ENVIRONMENTS.CANVAS) ||
      !Runtime.getClientID() ||
      !sampleRate) {
    return;
  }

  if (Math.random() > 1 / sampleRate ||
      blacklist == '*' || ~ES(blacklist, 'indexOf', true,Runtime.getClientID())) {
    return;
  }

  
  setTimeout(sample, 30000);
}__annotator(maybeSample, {"module":"sdk.Canvas.Prefetcher","line":56,"column":0,"name":"maybeSample"});


function setCollectionMode(/*number*/ mode) {return __bodyWrapper(this, arguments, function() {
  collectionMode = mode;
}, {"params":[[mode, 'number', 'mode']]});}__annotator(setCollectionMode, {"module":"sdk.Canvas.Prefetcher","line":85,"column":0,"name":"setCollectionMode"}, {"params":["number"]});


function addStaticResource(/*string*/ url) {return __bodyWrapper(this, arguments, function() {
  links.push(url);
}, {"params":[[url, 'string', 'url']]});}__annotator(addStaticResource, {"module":"sdk.Canvas.Prefetcher","line":93,"column":0,"name":"addStaticResource"}, {"params":["string"]});

var CanvasPrefetcher = {
  COLLECT_AUTOMATIC : COLLECT.AUTOMATIC,
  COLLECT_MANUAL : COLLECT.MANUAL,

  addStaticResource: addStaticResource,
  setCollectionMode: setCollectionMode,

  
  _maybeSample: maybeSample
};

module.exports = CanvasPrefetcher;


}, {"module":"sdk.Canvas.Prefetcher","line":7,"column":107}),null);


__d("legacy:fb.canvas.prefetcher",["FB","sdk.Canvas.Prefetcher","sdk.Event","sdk.Runtime"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,CanvasPrefetcher,Event,Runtime) {require.__markCompiled && require.__markCompiled();
   
   
   
   

FB.provide('Canvas.Prefetcher', CanvasPrefetcher);

Event.subscribe('init:post', __annotator(function(options) {
  if (Runtime.isEnvironment(Runtime.ENVIRONMENTS.CANVAS)) {
    CanvasPrefetcher._maybeSample();
  }
}, {"module":"fb.canvas.prefetcher","line":12,"column":29}));


}, {"module":"fb.canvas.prefetcher","line":4,"column":91}),3);


__d("legacy:fb.compat.ui",["copyProperties","FB","Log","sdk.ui","sdk.UIServer"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,copyProperties,FB,Log,ui,UIServer) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   

FB.provide('', {
  share: __annotator(function(u) {
    Log.error('share() has been deprecated. Please use FB.ui() instead.');
    ui({
      display : 'popup',
      method  : 'stream.share',
      u       : u
    });
  }, {"module":"fb.compat.ui","line":12,"column":9}),

  publish: __annotator(function(post, cb) {
    Log.error('publish() has been deprecated. Please use FB.ui() instead.');
    post = post || {};
    ui(copyProperties({
      display : 'popup',
      method  : 'stream.publish',
      preview : 1
    }, post || {}), cb);
  }, {"module":"fb.compat.ui","line":21,"column":11}),

  addFriend: __annotator(function(id, cb) {
    Log.error('addFriend() has been deprecated. Please use FB.ui() instead.');
    ui({
      display : 'popup',
      id      : id,
      method  : 'friend.add'
    }, cb);
  }, {"module":"fb.compat.ui","line":31,"column":13})
});

// the "fake" UIServer method was called auth.login
UIServer.Methods['auth.login'] = UIServer.Methods['permissions.request'];


}, {"module":"fb.compat.ui","line":4,"column":80}),3);


__d("mergeArrays",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function mergeArrays(/*array*/ target, /*array*/ source) /*array*/ {return __bodyWrapper(this, arguments, function() {
  for (var i=0; i < source.length; i++) {
    if (ES(target, 'indexOf', true,source[i]) < 0) {
      target.push(source[i]);
    }
  }
  return target;
}, {"params":[[target, 'array', 'target'], [source, 'array', 'source']],"returns":'array'});}__annotator(mergeArrays, {"module":"mergeArrays","line":8,"column":0,"name":"mergeArrays"}, {"params":["array","array"],"returns":"array"});
module.exports = mergeArrays;


}, {"module":"mergeArrays","line":7,"column":21}),null);


__d("format",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function format(/*string*/ str, argsdotdot) /*string*/ {return __bodyWrapper(this, arguments, function() {
  argsdotdot = Array.prototype.slice.call(arguments, 1);
  return str.replace(/\{(\d+)\}/g, __annotator(function(_, index) {
    var value = argsdotdot[Number(index)];
    return (value === null || value === (void 0))
     ? ''
     : value.toString();
  }, {"module":"format","line":23,"column":35}));
}, {"params":[[str, 'string', 'str']],"returns":'string'});}__annotator(format, {"module":"format","line":21,"column":0,"name":"format"}, {"params":["string"],"returns":"string"});
module.exports = format;


}, {"module":"format","line":20,"column":16}),null);


__d("safeEval",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function safeEval(source, /*?array*/ args) {return __bodyWrapper(this, arguments, function() {
  if (source === null || typeof source === 'undefined') {
    return;
  }
  if (typeof source !== 'string') {
    return source;
  }

  // We're asked to invoke a global function
  if (/^\w+$/.test(source) && typeof window[source] === 'function') {
    return window[source].apply(null, args || []);
  }

  // We're asked to eval code
  return Function('return eval("' + source.replace(/"/g, '\\"')  + '");')
    .apply(null, args || []);
}, {"params":[[args, '?array', 'args']]});}__annotator(safeEval, {"module":"safeEval","line":11,"column":0,"name":"safeEval"}, {"params":["?array"]});

module.exports = safeEval;


}, {"module":"safeEval","line":10,"column":18}),null);


__d("sdk.Waitable",["sdk.Model"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Model) {require.__markCompiled && require.__markCompiled();
   


var Waitable = Model.extend({
  
  constructor: __annotator(function() {
    this.parent({Value: (void 0)});
  }, {"module":"sdk.Waitable","line":21,"column":15}),

  
  error: __annotator(function(/*Error*/ ex) {return __bodyWrapper(this, arguments, function() {
    this.inform("error", ex);
  }, {"params":[[ex, 'Error', 'ex']]});}, {"module":"sdk.Waitable","line":30,"column":9}, {"params":["Error"]}),

  
  wait: __annotator(function(/*?function*/ callback, /*?function*/ errorHandler) {return __bodyWrapper(this, arguments, function() {
    
    if (errorHandler) {
      this.subscribe('error', errorHandler);
    }

    this.monitor('Value.change', ES(__annotator(function() /*?boolean*/ {return __bodyWrapper(this, arguments, function() {
      var value = this.getValue();
      if (value !== (void 0)) {
        
        this.value = value;
        callback(value);
        return true;
      }
    }, {"returns":'?boolean'});}, {"module":"sdk.Waitable","line":65,"column":33}, {"returns":"?boolean"}), 'bind', true,this));
  }, {"params":[[callback, '?function', 'callback'], [errorHandler, '?function', 'errorHandler']]});}, {"module":"sdk.Waitable","line":59,"column":8}, {"params":["?function","?function"]})
});

module.exports = Waitable;


}, {"module":"sdk.Waitable","line":7,"column":33}),null);


__d("sdk.Query",["format","safeEval","Type","sdk.Waitable"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,format,safeEval,Type,Waitable) {require.__markCompiled && require.__markCompiled();
   
   
   
   





function toFields(/*string*/ s) /*array<string>*/ {return __bodyWrapper(this, arguments, function() {
  return ES(s.split(','), 'map', true,__annotator(function(s) {return ES(s,'trim', true);}, {"module":"sdk.Query","line":63,"column":26}));
}, {"params":[[s, 'string', 's']],"returns":'array<string>'});}__annotator(toFields, {"module":"sdk.Query","line":62,"column":0,"name":"toFields"}, {"params":["string"],"returns":"array<string>"});


function parseWhere(/*string*/ s) /*object*/ {return __bodyWrapper(this, arguments, function() {
  
  
  var
    re = (/^\s*(\w+)\s*=\s*(.*)\s*$/i).exec(s),
    result,
    value,
    type = 'unknown';
  if (re) {
    
    value = re[2];
    
    
    if (/^(["'])(?:\\?.)*?\1$/.test(value)) {
      
      
      value = safeEval(value);
      type = 'index';
    } else if (/^\d+\.?\d*$/.test(value)) {
      type = 'index';
    }
  }

  if (type == 'index') {
    
    result = { type: 'index', key: re[1], value: value };
  } else {
    
    result = { type: 'unknown', value: s };
  }
  return result;
}, {"params":[[s, 'string', 's']],"returns":'object'});}__annotator(parseWhere, {"module":"sdk.Query","line":72,"column":0,"name":"parseWhere"}, {"params":["string"],"returns":"object"});

function encode(value) /*string*/ {return __bodyWrapper(this, arguments, function() {
  return typeof value === 'string'
    ? ES('JSON', 'stringify', false,value)
    : value;
}, {"returns":'string'});}__annotator(encode, {"module":"sdk.Query","line":110,"column":0,"name":"encode"}, {"returns":"string"});

var counter = 1;

var Query = Waitable.extend({
  constructor: __annotator(function() {
    this.parent();
    this.name = 'v_' + counter++;
  }, {"module":"sdk.Query","line":119,"column":15}),
  
  hasDependency: __annotator(function(/*?boolean*/ value) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    if (arguments.length) {
      this._hasDependency = value;
    }
    return !!this._hasDependency;
  }, {"params":[[value, '?boolean', 'value']],"returns":'boolean'});}, {"module":"sdk.Query","line":124,"column":17}, {"params":["?boolean"],"returns":"boolean"}),

  
  parse: __annotator(function(/*array*/ args) /*object*/ {return __bodyWrapper(this, arguments, function() {
    var
      fql = format.apply(null, args),
      re = (/^select (.*?) from (\w+)\s+where (.*)$/i).exec(fql); 
    this.fields = toFields(re[1]);
    this.table = re[2];
    this.where = parseWhere(re[3]);

    for (var i=1; i < args.length; i++) {
      if (Type.instanceOf(Query, args[i])) {
        
        
        args[i].hasDependency(true);
      }
    }

    return this;
  }, {"params":[[args, 'array', 'args']],"returns":'object'});}, {"module":"sdk.Query","line":137,"column":9}, {"params":["array"],"returns":"object"}),

  
  toFql: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    var s = 'select ' + this.fields.join(',') + ' from ' +
            this.table + ' where ';
    switch (this.where.type) {
      case 'unknown':
        s += this.where.value;
        break;
      case 'index':
        s += this.where.key + '=' + encode(this.where.value);
        break;
      case 'in':
        if (this.where.value.length == 1) {
          s += this.where.key + '=' +  encode(this.where.value[0]);
        } else {
          s += this.where.key + ' in (' +
            ES(this.where.value, 'map', true,encode).join(',') + ')';
        }
        break;
    }
    return s;
  }, {"returns":'string'});}, {"module":"sdk.Query","line":161,"column":9}, {"returns":"string"}),


  
  toString: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    return '#' + this.name;
  }, {"returns":'string'});}, {"module":"sdk.Query","line":191,"column":12}, {"returns":"string"})
});

module.exports = Query;


}, {"module":"sdk.Query","line":7,"column":60}),null);


__d("sdk.Data",["sdk.api","sdk.ErrorHandling","mergeArrays","sdk.Query","safeEval","sdk.Waitable"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,api,ErrorHandling,mergeArrays,Query,safeEval,Waitable) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   



var Data = {
  
  query: __annotator(function(/*string*/ template, data) /*object*/ {return __bodyWrapper(this, arguments, function() {
    var query = new Query().parse(Array.prototype.slice.call(arguments));
    Data.queue.push(query);
    Data._waitToProcess();
    return query;
  }, {"params":[[template, 'string', 'template']],"returns":'object'});}, {"module":"sdk.Data","line":109,"column":9}, {"params":["string"],"returns":"object"}),

  
  waitOn: __annotator(function(/*array*/ dependencies, /*function*/ callback) /*Waitable*/ {return __bodyWrapper(this, arguments, function() {
    var
      result = new Waitable(),
      count = dependencies.length;

    
    
    if (typeof(callback) == 'string') {
      var s = callback;
      callback = ErrorHandling.unguard(__annotator(function() { return safeEval(s); }, {"module":"sdk.Data","line":190,"column":39}));
    }

    ES(dependencies, 'forEach', true,__annotator(function(/*object*/ item) {return __bodyWrapper(this, arguments, function() {
      item.monitor('Value.change', __annotator(function() {
        var done = false;
        if (Data._getValue(item) !== (void 0)) {
          
          item.value = item.getValue();
          count--;
          done = true;
        }
        if (count === 0) {
          var value = callback(ES(dependencies, 'map', true,Data._getValue));
          result.setValue(value !== (void 0) ? value : true);
        }
        return done;
      }, {"module":"sdk.Data","line":194,"column":35}));
    }, {"params":[[item, 'object', 'item']]});}, {"module":"sdk.Data","line":193,"column":25}, {"params":["object"]}));
    return result;
  }, {"params":[[dependencies, 'array', 'dependencies'], [callback, 'function', 'callback']],"returns":'Waitable'});}, {"module":"sdk.Data","line":181,"column":10}, {"params":["array","function"],"returns":"Waitable"}),

  
  process: __annotator(function(/*?string*/ token) {return __bodyWrapper(this, arguments, function() {
    Data._process(token);
  }, {"params":[[token, '?string', 'token']]});}, {"module":"sdk.Data","line":217,"column":11}, {"params":["?string"]}),

  
  _getValue: __annotator(function(item) {
    return item instanceof Waitable
      ? item.getValue()
      : item;
  }, {"module":"sdk.Data","line":227,"column":13}),

  
  _selectByIndex: __annotator(function(/*array*/ fields, /*string*/ table, /*string*/ name,
      /*string*/ value) /*object*/ {return __bodyWrapper(this, arguments, function() {
    var query = new Query();
    query.fields = fields;
    query.table = table;
    query.where = { type: 'index', key: name, value: value };
    Data.queue.push(query);
    Data._waitToProcess();
    return query;
  }, {"params":[[fields, 'array', 'fields'], [table, 'string', 'table'], [name, 'string', 'name'], [value, 'string', 'value']],"returns":'object'});}, {"module":"sdk.Data","line":243,"column":18}, {"params":["array","string","string","string"],"returns":"object"}),

  
  _waitToProcess: __annotator(function() {
    if (Data.timer < 0) {
      Data.timer = setTimeout(__annotator(function() {
        Data._process();
      }, {"module":"sdk.Data","line":260,"column":30}), 10);
    }
  }, {"module":"sdk.Data","line":258,"column":18}),

  
  _process: __annotator(function(/*?string*/ token) {return __bodyWrapper(this, arguments, function() {
    Data.timer = -1;

    var
      mqueries = {},
      q = Data.queue;

    if (!q.length) {
      return;
    }

    Data.queue = [];

    for (var i=0; i < q.length; i++) {
      var item = q[i];
      if (item.where.type == 'index' && !item.hasDependency()) {
        Data._mergeIndexQuery(item, mqueries);
      } else {
        mqueries[item.name] = item;
      }
    }

    
    var params = { q : {} };
    for (var key in mqueries) {
      if (mqueries.hasOwnProperty(key)) {
        params.q[key] = mqueries[key].toFql();
      }
    }

    if (token) {
      params.access_token = token;
    }

    api('/fql', 'GET', params, __annotator(function(/*object*/ result) {return __bodyWrapper(this, arguments, function() {
      if (result.error) {
        ES(ES('Object', 'keys', false,mqueries), 'forEach', true,__annotator(function(/*string*/ key) {return __bodyWrapper(this, arguments, function() {
          mqueries[key].error(new Error(result.error.message));
        }, {"params":[[key, 'string', 'key']]});}, {"module":"sdk.Data","line":307,"column":38}, {"params":["string"]}));
      } else {
        ES(result.data, 'forEach', true,__annotator(function(/*object*/ o) {return __bodyWrapper(this, arguments, function() {
          mqueries[o.name].setValue(o.fql_result_set);
        }, {"params":[[o, 'object', 'o']]});}, {"module":"sdk.Data","line":311,"column":28}, {"params":["object"]}));
      }
    }, {"params":[[result, 'object', 'result']]});}, {"module":"sdk.Data","line":305,"column":31}, {"params":["object"]}));
  }, {"params":[[token, '?string', 'token']]});}, {"module":"sdk.Data","line":271,"column":12}, {"params":["?string"]}),

  
  _mergeIndexQuery: __annotator(function(/*object*/ item, /*object*/ mqueries) {return __bodyWrapper(this, arguments, function() {
    var key = item.where.key,
    value = item.where.value;

    var name = 'index_' +  item.table + '_' + key;
    var master = mqueries[name];
    if (!master) {
      master = mqueries[name] = new Query();
      master.fields = [key];
      master.table = item.table;
      master.where = {type: 'in', key: key, value: []};
    }

    
    mergeArrays(master.fields, item.fields);
    mergeArrays(master.where.value, [value]);

    
    master.wait(__annotator(function(/*array<object>*/ r) {return __bodyWrapper(this, arguments, function() {
      item.setValue(ES(r, 'filter', true,__annotator(function(/*object*/ x) {return __bodyWrapper(this, arguments, function() {
        return x[key] == value;
      }, {"params":[[x, 'object', 'x']]});}, {"module":"sdk.Data","line":341,"column":29}, {"params":["object"]})));
    }, {"params":[[r, 'array<object>', 'r']]});}, {"module":"sdk.Data","line":340,"column":16}, {"params":["array<object>"]}));
  }, {"params":[[item, 'object', 'item'], [mqueries, 'object', 'mqueries']]});}, {"module":"sdk.Data","line":322,"column":20}, {"params":["object","object"]}),

  timer: -1,
  queue: []
};

module.exports = Data;


}, {"module":"sdk.Data","line":7,"column":99}),null);


__d("legacy:fb.data",["FB","sdk.Data"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,Data) {require.__markCompiled && require.__markCompiled();
   
   
FB.provide('Data', Data);


}, {"module":"fb.data","line":4,"column":39}),3);


__d("legacy:fb.event",["FB","sdk.Event","sdk.Runtime","sdk.Scribe","sdk.feature"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,Event,Runtime,Scribe,feature) {require.__markCompiled && require.__markCompiled();
   
   
   
   

   

var eventsToLog = [];
var logScheduleId = null;
var logTimeout = feature('event_subscriptions_log', false);

FB.provide('Event', {
  subscribe:__annotator(function(/*string*/ name, /*function*/ cb) {
    if (logTimeout) {
      eventsToLog.push(name);

      
      
      if (!logScheduleId) {
        logScheduleId = setTimeout(__annotator(function()  {

          Scribe.log('jssdk_error', {
            appId: Runtime.getClientID(),
            error: 'EVENT_SUBSCRIPTIONS_LOG',
            extra: {
              line: 0,
              name: 'EVENT_SUBSCRIPTIONS_LOG',
              script: 'N/A',
              stack: 'N/A',
              message: eventsToLog.sort().join(',')
            }
          });

          eventsToLog.length = 0;
          logScheduleId = null;

        }, {"module":"fb.event","line":24,"column":35}), logTimeout);
      }
    }
    return Event.subscribe(name, cb);
  }, {"module":"fb.event","line":17,"column":12}),

  unsubscribe: ES(Event.unsubscribe, 'bind', true,Event)
});


}, {"module":"fb.event","line":4,"column":82}),3);


__d("legacy:fb.event-legacy",["FB","sdk.Event"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,Event) {require.__markCompiled && require.__markCompiled();
   
   

FB.provide('Event', {
  clear: ES(Event.clear, 'bind', true,Event),
  fire: ES(Event.fire, 'bind', true,Event),
  monitor: ES(Event.monitor, 'bind', true,Event)
});

FB.provide('EventProvider', Event);


}, {"module":"fb.event-legacy","line":4,"column":48}),3);


__d("legacy:fb.frictionless",["FB","sdk.Frictionless"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,Frictionless) {require.__markCompiled && require.__markCompiled();
   
   
FB.provide('Frictionless', Frictionless);


}, {"module":"fb.frictionless","line":4,"column":55}),3);


__d("sdk.init",["sdk.Cookie","sdk.ErrorHandling","sdk.Event","Log","ManagedError","sdk.PlatformVersioning","QueryString","sdk.Runtime","sdk.URI","createArrayFromMixed"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Cookie,ErrorHandling,Event,Log,ManagedError,PlatformVersioning,QueryString,Runtime,URI,createArrayFromMixed) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   

   



// It checks that it's either a positive integer, or an alphanumeric api key,
// and returns null if it's invalid, or the id as a string otherwise.
function parseAppId(/*string|number*/ appId) /*?string*/ {return __bodyWrapper(this, arguments, function() {
  var looksValid =
    (typeof appId == 'number' && appId > 0) ||
    (typeof appId == 'string' && /^[0-9a-f]{21,}$|^[0-9]{1,21}$/.test(appId));
  if (looksValid) {
    return appId.toString();
  }
  Log.warn('Invalid App Id: Must be a number or numeric string representing ' +
      'the application id.');
  return null;
}, {"params":[[appId, 'string|number', 'appId']],"returns":'?string'});}__annotator(parseAppId, {"module":"sdk.init","line":24,"column":0,"name":"parseAppId"}, {"params":["string|number"],"returns":"?string"});


function init(/*object|number|string*/ options) {return __bodyWrapper(this, arguments, function() {
  if (Runtime.getInitialized()) {
    Log.warn(
      'FB.init has already been called - this could indicate a problem');
  }

  
  if (Runtime.getIsVersioned()) {
    
    if (Object.prototype.toString.call(options) !== '[object Object]') {
      throw new ManagedError('Invalid argument');
    }

    if (options.authResponse) {
      Log.warn('Setting authResponse is not supported');
    }

    if (!options.version)  {
      
      options.version = URI(location.href).getQueryData().sdk_version;
    }
    // Enforce that there's a version specified
    PlatformVersioning.assertValidVersion(options.version);
    Runtime.setVersion(options.version);
  } else {
    
    if (/number|string/.test(typeof options)) {
      Log.warn('FB.init called with invalid parameters');
      options = {apiKey: options};
    }

    options = ES('Object', 'assign', false,{
      status: true
    }, options || {});

  }

  var appId = parseAppId(options.appId || options.apiKey);
  if (appId !== null) {
    Runtime.setClientID(appId);
  }

  if ('scope' in options) {
    Runtime.setScope(options.scope);
  }

  if (options.cookie) {
    Runtime.setUseCookie(true);
    if (typeof options.cookie === 'string') {
      Cookie.setDomain(options.cookie);
    }
  }

  if (options.kidDirectedSite) {
    Runtime.setKidDirectedSite(true);
  }

  Runtime.setInitialized(true);
  Event.fire('init:post', options);
}, {"params":[[options, 'object|number|string', 'options']]});}__annotator(init, {"module":"sdk.init","line":52,"column":0,"name":"init"}, {"params":["object|number|string"]});




setTimeout(__annotator(function() {
  
  
  var pattern = /(connect\.facebook\.net|\.facebook\.com\/assets.php).*?#(.*)/;
  ES(createArrayFromMixed(document.getElementsByTagName('script')), 'forEach', true,__annotator(function(script) {
    if (script.src) {
      var match = pattern.exec(script.src);
      if (match) {
        var opts = QueryString.decode(match[2]);
        for (var key in opts) {
          if (opts.hasOwnProperty(key)) {
            var val = opts[key];
            if (val == '0') {
              opts[key] = 0;
            }
          }
        }

        init(opts);
      }
    }
  }, {"module":"sdk.init","line":121,"column":15}));

  
  if (window.fbAsyncInit && !window.fbAsyncInit.hasRun) {
    window.fbAsyncInit.hasRun = true;
    ErrorHandling.unguard(window.fbAsyncInit)();
  }
}, {"module":"sdk.init","line":116,"column":11}), 0);

module.exports = init;


}, {"module":"sdk.init","line":7,"column":169}),null);


__d("legacy:fb.init",["FB","sdk.init"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,init) {require.__markCompiled && require.__markCompiled();
   
   

FB.provide('', {
  init: init
});


}, {"module":"fb.init","line":4,"column":39}),3);


__d("legacy:fb.json",["FB","ManagedError"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,ManagedError) {require.__markCompiled && require.__markCompiled();
   
   




FB.provide('JSON', {
  stringify: __annotator(function(obj) {
    try {
      return ES('JSON', 'stringify', false,obj);
    } catch(e) {
      throw new ManagedError(e.message, e);
    }
  }, {"module":"fb.json","line":12,"column":13}),
  parse: __annotator(function(str) {
    try {
      return ES('JSON', 'parse', false,str);
    } catch(e) {
      throw new ManagedError(e.message, e);
    }
  }, {"module":"fb.json","line":19,"column":9})
});


}, {"module":"fb.json","line":4,"column":43}),3);


__d("legacy:fb.ua",["FB","sdk.UA"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,UA) {require.__markCompiled && require.__markCompiled();
   
   
FB.provide('UA', {
  nativeApp: UA.nativeApp
});


}, {"module":"fb.ua","line":4,"column":35}),3);


__d("legacy:fb.ui",["FB","sdk.ui"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,FB,ui) {require.__markCompiled && require.__markCompiled();
   
   

FB.provide('', {
  ui: ui
});



}, {"module":"fb.ui","line":4,"column":35}),3);


__d("runOnce",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
function runOnce(func) {
  var run, ret;
  return __annotator(function() {
    if (!run) {
      run = true;
      ret = func();
    }
    return ret;
  }, {"module":"runOnce","line":9,"column":9});
}__annotator(runOnce, {"module":"runOnce","line":7,"column":0,"name":"runOnce"});

module.exports = runOnce;


}, {"module":"runOnce","line":6,"column":17}),null);


__d("XFBML",["Assert","sdk.DOM","Log","ObservableMixin","sdk.UA","createArrayFromMixed","runOnce"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Assert,DOM,Log,ObservableMixin,UA,createArrayFromMixed,runOnce) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   

   
   


var xfbml = {}; 
var html5 = {}; 

var parseCount = 0;

var XFBML = new ObservableMixin();

function propStr(object, /*string*/ property) /*string*/ {return __bodyWrapper(this, arguments, function() {
  return object[property] + '';
}, {"params":[[property, 'string', 'property']],"returns":'string'});}__annotator(propStr, {"module":"XFBML","line":30,"column":0,"name":"propStr"}, {"params":["string"],"returns":"string"});

function nodeNameIE(/*DOMElement*/ element) /*string*/ {return __bodyWrapper(this, arguments, function() {
  // In old IE (< 9), element.nodeName doesn't include the namespace so we use
  
  return element.scopeName
    ? (element.scopeName + ':' + element.nodeName)
    : '';
}, {"params":[[element, 'HTMLElement', 'element']],"returns":'string'});}__annotator(nodeNameIE, {"module":"XFBML","line":34,"column":0,"name":"nodeNameIE"}, {"params":["DOMElement"],"returns":"string"});

function xfbmlInfo(/*DOMElement*/ element) /*?object*/ {return __bodyWrapper(this, arguments, function() {
  return xfbml[propStr(element, 'nodeName').toLowerCase()]
    || xfbml[nodeNameIE(element).toLowerCase()];
}, {"params":[[element, 'HTMLElement', 'element']],"returns":'?object'});}__annotator(xfbmlInfo, {"module":"XFBML","line":42,"column":0,"name":"xfbmlInfo"}, {"params":["DOMElement"],"returns":"?object"});

function html5Info(/*DOMElement*/ element) /*?object*/ {return __bodyWrapper(this, arguments, function() {
  var classNames = ES(ES(propStr(element, 'className'),'trim', true).split(/\s+/), 'filter', true,
    __annotator(function(className) { return html5.hasOwnProperty(className); }, {"module":"XFBML","line":49,"column":4}));

  if (classNames.length === 0) {
    return (void 0);
  }

  
  // like <div class="fb-like"><fb:like></fb:like></div>;
  
  
  
  
  //    eg. <div class="fb-login-button">Log In with Facebook</div>
  // - it's contains a specially marked container 'fb-xfbml-parse-ignore'
  //    eg. <div class="fb-post">
  //          <div class="fb-xfbml-parse-ignore">
  
  
  
  if (
    element.getAttribute('fb-xfbml-state') ||
    !element.childNodes ||
    element.childNodes.length === 0 ||
    (element.childNodes.length === 1 &&
      element.childNodes[0].nodeType === 3 /*Node.TEXT_NODE*/) ||
    (element.children.length === 1 &&
      propStr(element.children[0], 'className') === 'fb-xfbml-parse-ignore')
  ) {
    return html5[classNames[0]];
  }
}, {"params":[[element, 'HTMLElement', 'element']],"returns":'?object'});}__annotator(html5Info, {"module":"XFBML","line":47,"column":0,"name":"html5Info"}, {"params":["DOMElement"],"returns":"?object"});

function attr(/*DOMElement*/ element) /*object*/ {return __bodyWrapper(this, arguments, function() {
  var attrs = {};
  ES(createArrayFromMixed(element.attributes), 'forEach', true,__annotator(function(at) {
    attrs[propStr(at, 'name')] = propStr(at, 'value');
  }, {"module":"XFBML","line":83,"column":51}));
  return attrs;
}, {"params":[[element, 'HTMLElement', 'element']],"returns":'object'});}__annotator(attr, {"module":"XFBML","line":81,"column":0,"name":"attr"}, {"params":["DOMElement"],"returns":"object"});

function convertSyntax(
  /*DOMElement*/ element, /*string*/ ns, /*string*/ ln) /*DOMElement*/ {return __bodyWrapper(this, arguments, function() {
  var replacement = document.createElement('div');
  DOM.addCss(element, ns + '-' + ln);
  ES(createArrayFromMixed(element.childNodes), 'forEach', true,__annotator(function(child) {
    replacement.appendChild(child);
  }, {"module":"XFBML","line":93,"column":51}));
  ES(createArrayFromMixed(element.attributes), 'forEach', true,__annotator(function(attribute) {
    replacement.setAttribute(attribute.name, attribute.value);
  }, {"module":"XFBML","line":96,"column":51}));
  element.parentNode.replaceChild(replacement, element);
  return replacement;
}, {"params":[[element, 'HTMLElement', 'element'], [ns, 'string', 'ns'], [ln, 'string', 'ln']],"returns":'HTMLElement'});}__annotator(convertSyntax, {"module":"XFBML","line":89,"column":0,"name":"convertSyntax"}, {"params":["DOMElement","string","string"],"returns":"DOMElement"});

function parse(/*DOMElement*/ dom, /*function*/ callback, /*boolean*/ reparse) {return __bodyWrapper(this, arguments, function() {
  Assert.isTrue(
    dom && dom.nodeType && dom.nodeType === 1 && !!dom.getElementsByTagName,
    'Invalid DOM node passed to FB.XFBML.parse()');
  Assert.isFunction(callback, 'Invalid callback passed to FB.XFBML.parse()');

  var pc = ++parseCount;
  Log.info('XFBML Parsing Start %s', pc);

  
  
  // ensure that we don't hit 0 until we have finished queuing up all the tags.
  
  var count = 1;
  var tags = 0;
  var onrender = __annotator(function() {
    count--;
    if (count === 0) {
      Log.info('XFBML Parsing Finish %s, %s tags found', pc, tags);
      callback();
      XFBML.inform('render', pc, tags);
    }
    Assert.isTrue(count >= 0, 'onrender() has been called too many times');
  }, {"module":"XFBML","line":118,"column":17});

  ES(createArrayFromMixed(dom.getElementsByTagName('*')), 'forEach', true,__annotator(function(element) {
    if (!reparse && element.getAttribute('fb-xfbml-state')) {
      
      return;
    }
    if (element.nodeType !== 1) {
      
      return;
    }

    var info = xfbmlInfo(element) || html5Info(element);
    if (!info) {
      return;
    }

    if (UA.ie() < 9 && element.scopeName) {
      // Touching innerHTML on custom XML elements in IE<9 can cause an 'Unknown
      // runtime error', so we switch to the HTML5 syntax in this case.
      element = convertSyntax(element, info.xmlns, info.localName);
    }

    count++;
    tags++;
    var renderer =
      new info.ctor(element, info.xmlns, info.localName, attr(element));
    
    
    
    renderer.subscribe('render', runOnce(__annotator(function() {
      
      
      
      
      element.setAttribute('fb-xfbml-state', 'rendered');
      onrender();
    }, {"module":"XFBML","line":157,"column":41})));

    var render = __annotator(function() {
      
      
      if (element.getAttribute('fb-xfbml-state') == 'parsed') {
        // We can't render a tag if it's in the parsed-but-not-rendered state
        
        XFBML.subscribe('render.queue', render);
      } else {
        element.setAttribute('fb-xfbml-state', 'parsed');
        renderer.process(); 
      }
    }, {"module":"XFBML","line":166,"column":17});

    render();
  }, {"module":"XFBML","line":129,"column":13}));

  XFBML.inform('parse', pc, tags);

  var timeout = 30000; 
  setTimeout(__annotator(function() {
    if (count > 0) {
      Log.warn('%s tags failed to render in %s ms', count, timeout);
    }
  }, {"module":"XFBML","line":185,"column":13}), timeout);

  onrender(); 
}, {"params":[[dom, 'HTMLElement', 'dom'], [callback, 'function', 'callback'], [reparse, 'boolean', 'reparse']]});}__annotator(parse, {"module":"XFBML","line":103,"column":0,"name":"parse"}, {"params":["DOMElement","function","boolean"]});

XFBML.subscribe('render', __annotator(function() {
  var q = XFBML.getSubscribers('render.queue');
  XFBML.clearSubscribers('render.queue');
  ES(q, 'forEach', true,__annotator(function(r) { r(); }, {"module":"XFBML","line":197,"column":12}));
  
  
}, {"module":"XFBML","line":194,"column":26}));

ES('Object', 'assign', false,XFBML, {

  registerTag: __annotator(function(/*object*/ info) {return __bodyWrapper(this, arguments, function() {
    var fqn = info.xmlns + ':' + info.localName;
    Assert.isUndefined(xfbml[fqn], fqn + ' already registered');

    xfbml[fqn] = info;

    
    
    html5[info.xmlns + '-' + info.localName] = info;
  }, {"params":[[info, 'object', 'info']]});}, {"module":"XFBML","line":204,"column":15}, {"params":["object"]}),

  parse: __annotator(function(/*?DOMElement*/ dom, /*?function*/ cb) {return __bodyWrapper(this, arguments, function() {
    parse(dom || document.body, cb || __annotator(function(){}, {"module":"XFBML","line":216,"column":38}),  true);
  }, {"params":[[dom, '?HTMLElement', 'dom'], [cb, '?function', 'cb']]});}, {"module":"XFBML","line":215,"column":9}, {"params":["?DOMElement","?function"]}),

  parseNew: __annotator(function() {
    parse(document.body, __annotator(function(){}, {"module":"XFBML","line":220,"column":25}),  false);
  }, {"module":"XFBML","line":219,"column":12})
});

module.exports = XFBML;


}, {"module":"XFBML","line":12,"column":99}),null);

__d("PluginPipe",["sdk.Content","sdk.feature","guid","insertIframe","Miny","ObservableMixin","JSSDKPluginPipeConfig","sdk.Runtime","sdk.UA","UrlMap","XFBML"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Content,feature,guid,insertIframe,Miny,ObservableMixin,PluginPipeConfig,Runtime,UA,UrlMap,XFBML) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   
   
   

var PluginPipe = new ObservableMixin();

var threshold = PluginPipeConfig.threshold;
var queued = [];

function isEnabled() /*boolean*/ {return __bodyWrapper(this, arguments, function() {
  return !!(feature('plugin_pipe', false) &&
         Runtime.getSecure() !== (void 0) &&
         (UA.chrome() || UA.firefox()) &&
         PluginPipeConfig.enabledApps[Runtime.getClientID()]);
}, {"returns":'boolean'});}__annotator(isEnabled, {"module":"PluginPipe","line":25,"column":0,"name":"isEnabled"}, {"returns":"boolean"});

function insertPlugins() {
  var q = queued;
  queued = [];

  if (q.length <= threshold) {
    ES(q, 'forEach', true,__annotator(function(/*object*/ plugin) {return __bodyWrapper(this, arguments, function() {
      insertIframe(plugin.config);
    }, {"params":[[plugin, 'object', 'plugin']]});}, {"module":"PluginPipe","line":37,"column":14}, {"params":["object"]}));
    return;
  }

  var count = q.length + 1;
  function onrender() {
    count--;
    if (count === 0) {
      insertPipe(q);
    }
  }__annotator(onrender, {"module":"PluginPipe","line":44,"column":2,"name":"onrender"});

  ES(q, 'forEach', true,__annotator(function(/*object*/ plugin) {return __bodyWrapper(this, arguments, function() {
    var config = {};
    for (var key in plugin.config) {
      config[key] = plugin.config[key];
    }
    config.url = UrlMap.resolve('www', Runtime.getSecure()) +
      '/plugins/plugin_pipe_shell.php';
    config.onload = onrender;
    insertIframe(config);
  }, {"params":[[plugin, 'object', 'plugin']]});}, {"module":"PluginPipe","line":51,"column":12}, {"params":["object"]}));

  onrender();
}__annotator(insertPlugins, {"module":"PluginPipe","line":32,"column":0,"name":"insertPlugins"});

XFBML.subscribe('parse', insertPlugins);

function insertPipe(/*array<object>*/ plugins) {return __bodyWrapper(this, arguments, function() {
  var root = document.createElement('span');
  Content.appendHidden(root);

  var params = {};
  ES(plugins, 'forEach', true,__annotator(function(/*object*/ plugin){return __bodyWrapper(this, arguments, function() {
    params[plugin.config.name] = {
      plugin: plugin.tag,
      params: plugin.params
    };
  }, {"params":[[plugin, 'object', 'plugin']]});}, {"module":"PluginPipe","line":72,"column":18}, {"params":["object"]}));

  var raw = ES('JSON', 'stringify', false,params);
  var miny = Miny.encode(raw);

  ES(plugins, 'forEach', true,__annotator(function(/*object*/ plugin) {return __bodyWrapper(this, arguments, function() {
    var frame = document.getElementsByName(plugin.config.name)[0];
    frame.onload = plugin.config.onload;
  }, {"params":[[plugin, 'object', 'plugin']]});}, {"module":"PluginPipe","line":82,"column":18}, {"params":["object"]}));

  var url = UrlMap.resolve('www', Runtime.getSecure()) + '/plugins/pipe.php';
  var name = guid();

  insertIframe({
    url: 'about:blank',
    root: root,
    name: name,
    className: 'fb_hidden fb_invisible',
    onload: __annotator(function() {
      Content.submitToTarget({
        url: url,
        target: name,
        params: {
          plugins: miny.length < raw.length ? miny : raw
      }});
    }, {"module":"PluginPipe","line":95,"column":12})
  });
}, {"params":[[plugins, 'array<object>', 'plugins']]});}__annotator(insertPipe, {"module":"PluginPipe","line":67,"column":0,"name":"insertPipe"}, {"params":["array<object>"]});

ES('Object', 'assign', false,PluginPipe, {
  add: __annotator(function(/*object*/ plugin) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    var enabled = isEnabled();
    enabled && queued.push({
      config: plugin._config,
      tag: plugin._tag,
      params: plugin._params
    });
    return enabled;
  }, {"params":[[plugin, 'object', 'plugin']],"returns":'boolean'});}, {"module":"PluginPipe","line":107,"column":7}, {"params":["object"],"returns":"boolean"})
});

module.exports = PluginPipe;


}, {"module":"PluginPipe","line":7,"column":161}),null);


__d("IframePlugin",["sdk.Auth","sdk.DOM","sdk.Event","Log","ObservableMixin","sdk.PlatformVersioning","PluginPipe","QueryString","sdk.Runtime","Type","sdk.UA","sdk.URI","UrlMap","sdk.XD","sdk.createIframe","sdk.feature","guid","resolveURI"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Auth,DOM,Event,Log,ObservableMixin,PlatformVersioning,PluginPipe,QueryString,Runtime,Type,UA,URI,UrlMap,XD,createIframe,feature,guid,resolveURI) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   
   
   
   
   
   

   
   
   
   

var baseParams = {
  skin: 'string',
  font: 'string',
  width: 'px',
  height: 'px',
  ref: 'string',
  color_scheme: 'string' 
};

function resize(/*DOMElement*/ elem, /*?number*/ width, /*?number*/ height) {return __bodyWrapper(this, arguments, function() {
  if (width || width === 0) {
    elem.style.width = width + 'px';
  }

  if (height || height === 0) {
    elem.style.height = height + 'px';
  }
}, {"params":[[elem, 'HTMLElement', 'elem'], [width, '?number', 'width'], [height, '?number', 'height']]});}__annotator(resize, {"module":"IframePlugin","line":43,"column":0,"name":"resize"}, {"params":["DOMElement","?number","?number"]});

function resizeBubbler(/*?string*/ pluginID) /*function*/ {return __bodyWrapper(this, arguments, function() {
  return __annotator(function(/*object*/ msg) {return __bodyWrapper(this, arguments, function() {
    var message = { width: msg.width, height: msg.height, pluginID: pluginID };
    Event.fire('xfbml.resize', message);
  }, {"params":[[msg, 'object', 'msg']]});}, {"module":"IframePlugin","line":54,"column":9}, {"params":["object"]});
}, {"params":[[pluginID, '?string', 'pluginID']],"returns":'function'});}__annotator(resizeBubbler, {"module":"IframePlugin","line":53,"column":0,"name":"resizeBubbler"}, {"params":["?string"],"returns":"function"});

var types = {
  // TODO: Move the 'bool' and 'px' parsing to the server?
  string: __annotator(function(/*?string*/ value) /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return value;
  }, {"params":[[value, '?string', 'value']],"returns":'?string'});}, {"module":"IframePlugin","line":62,"column":10}, {"params":["?string"],"returns":"?string"}),
  bool: __annotator(function(/*?string*/ value) /*?boolean*/ {return __bodyWrapper(this, arguments, function() {
    return value ? (/^(?:true|1|yes|on)$/i).test(value) : (void 0);
  }, {"params":[[value, '?string', 'value']],"returns":'?boolean'});}, {"module":"IframePlugin","line":65,"column":8}, {"params":["?string"],"returns":"?boolean"}),
  url: __annotator(function(/*?string*/ value) /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return resolveURI(value);
  }, {"params":[[value, '?string', 'value']],"returns":'?string'});}, {"module":"IframePlugin","line":68,"column":7}, {"params":["?string"],"returns":"?string"}),
  url_maybe: __annotator(function(/*?string*/ value) /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return value ? resolveURI(value) : value;
  }, {"params":[[value, '?string', 'value']],"returns":'?string'});}, {"module":"IframePlugin","line":71,"column":13}, {"params":["?string"],"returns":"?string"}),
  hostname: __annotator(function(/*?string*/ value) /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return value || window.location.hostname;
  }, {"params":[[value, '?string', 'value']],"returns":'?string'});}, {"module":"IframePlugin","line":74,"column":12}, {"params":["?string"],"returns":"?string"}),
  px: __annotator(function(/*?string*/ value) /*?number*/ {return __bodyWrapper(this, arguments, function() {
    return (/^(\d+)(?:px)?$/).test(value) ? parseInt(RegExp.$1, 10) : (void 0);
  }, {"params":[[value, '?string', 'value']],"returns":'?number'});}, {"module":"IframePlugin","line":77,"column":6}, {"params":["?string"],"returns":"?number"}),
  text: __annotator(function(/*?string*/ value) /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return value;
  }, {"params":[[value, '?string', 'value']],"returns":'?string'});}, {"module":"IframePlugin","line":80,"column":8}, {"params":["?string"],"returns":"?string"})
};

function getVal(/*object*/ attr, /*string*/ key) {return __bodyWrapper(this, arguments, function() {
  var val =
    attr[key] ||
    attr[key.replace(/_/g, '-')] ||
    attr[key.replace(/_/g, '')] ||
    attr['data-' + key] ||
    attr['data-' + key.replace(/_/g, '-')] ||
    attr['data-' + key.replace(/_/g, '')] ||
    (void 0);
  return val;
}, {"params":[[attr, 'object', 'attr'], [key, 'string', 'key']]});}__annotator(getVal, {"module":"IframePlugin","line":85,"column":0,"name":"getVal"}, {"params":["object","string"]});

function validate(/*object*/ defn, /*DOMElement*/ elem, /*object*/ attr,
    /*object*/ params) {return __bodyWrapper(this, arguments, function() {
  ES(ES('Object', 'keys', false,defn), 'forEach', true,__annotator(function(key) {
    if (defn[key] == 'text' && !attr[key]) {
      attr[key] = elem.textContent || elem.innerText || ''; 
      elem.setAttribute(key, attr[key]); 
    }
    params[key] = types[defn[key]](getVal(attr, key));
  }, {"module":"IframePlugin","line":99,"column":28}));
}, {"params":[[defn, 'object', 'defn'], [elem, 'HTMLElement', 'elem'], [attr, 'object', 'attr'], [params, 'object', 'params']]});}__annotator(validate, {"module":"IframePlugin","line":97,"column":0,"name":"validate"}, {"params":["object","DOMElement","object","object"]});



function parse(dim) {
  return dim || dim === '0' || dim === 0 ? parseInt(dim, 10) : (void 0);
}__annotator(parse, {"module":"IframePlugin","line":110,"column":0,"name":"parse"});

function collapseIframe(iframe) {
  if (iframe) {
    resize(iframe, 0, 0);
  }
}__annotator(collapseIframe, {"module":"IframePlugin","line":114,"column":0,"name":"collapseIframe"});


var IframePlugin = Type.extend({
  constructor:__annotator(function(
    /*DOMElement*/ elem,
    /*string*/ ns,
    /*string*/ tag,
    /*object*/ attr
  ) {return __bodyWrapper(this, arguments, function() {
    this.parent();
    tag = tag.replace(/-/g, '_');

    var pluginId = getVal(attr, 'plugin_id');
    this.subscribe('xd.resize', resizeBubbler(pluginId));
    this.subscribe('xd.resize.flow', resizeBubbler(pluginId));

    this.subscribe('xd.resize.flow', ES(__annotator(function(/*object*/ message)  {return __bodyWrapper(this, arguments, function() {
      ES('Object', 'assign', false,this._iframeOptions.root.style, {
        verticalAlign: 'bottom',
        overflow: ''
      });
      resize(
        this._iframeOptions.root,
        parse(message.width),
        parse(message.height)
      );
      this.updateLift();
      clearTimeout(this._timeoutID);
    }, {"params":[[message, 'object', 'message']]});}, {"module":"IframePlugin","line":135,"column":37}, {"params":["object"]}), 'bind', true,this));

    this.subscribe('xd.resize', ES(__annotator(function(/*object*/ message)  {return __bodyWrapper(this, arguments, function() {
      ES('Object', 'assign', false,this._iframeOptions.root.style, {
        verticalAlign: 'bottom',
        overflow: ''
      });
      resize(
        this._iframeOptions.root,
        parse(message.width),
        parse(message.height)
      );
      resize(this._iframe, parse(message.width), parse(message.height));
      this._isIframeResized = true;
      this.updateLift();
      clearTimeout(this._timeoutID);
    }, {"params":[[message, 'object', 'message']]});}, {"module":"IframePlugin","line":149,"column":32}, {"params":["object"]}), 'bind', true,this));

    this.subscribe('xd.resize.iframe', ES(__annotator(function(/*object*/ message)  {return __bodyWrapper(this, arguments, function() {
      if (
          message.reposition === 'true' &&
          feature('reposition_iframe', false)
      ) {
        this.reposition(parse(message.width));
      }

      resize(this._iframe, parse(message.width), parse(message.height));
      this._isIframeResized = true;
      this.updateLift();
      clearTimeout(this._timeoutID);
    }, {"params":[[message, 'object', 'message']]});}, {"module":"IframePlugin","line":165,"column":39}, {"params":["object"]}), 'bind', true,this));

    this.subscribe('xd.sdk_event', __annotator(function(/*object*/ message)  {return __bodyWrapper(this, arguments, function() {
      var data = ES('JSON', 'parse', false,message.data);
      data.pluginID = pluginId;
      Event.fire(message.event, data, elem);
    }, {"params":[[message, 'object', 'message']]});}, {"module":"IframePlugin","line":179,"column":35}, {"params":["object"]}));

    var secure = Runtime.getSecure() || window.location.protocol == 'https:';
    
    var url = UrlMap.resolve('www', secure) + '/plugins/' + tag + '.php?';
    var params = {};
    validate(this.getParams(), elem, attr, params);
    validate(baseParams, elem, attr, params);

    ES('Object', 'assign', false,params, {
      app_id: Runtime.getClientID(),
      locale: Runtime.getLocale(),
      sdk: 'joey',
      kid_directed_site: Runtime.getKidDirectedSite(),
      channel: XD.handler(
        ES(__annotator(function(msg)  {return this.inform('xd.' + msg.type, msg);}, {"module":"IframePlugin","line":198,"column":8}), 'bind', true,this),
        'parent.parent',
        /*forever=*/true
      )
    });

    params.container_width = elem.offsetWidth;

    DOM.addCss(elem, 'fb_iframe_widget');
    var name = guid();
    this.subscribe('xd.verify', __annotator(function(/*object*/ msg)  {return __bodyWrapper(this, arguments, function() {
      XD.sendToFacebook(
        name, { method: 'xd/verify', params: ES('JSON', 'stringify', false,msg.token) });
    }, {"params":[[msg, 'object', 'msg']]});}, {"module":"IframePlugin","line":208,"column":32}, {"params":["object"]}));

    this.subscribe(
      'xd.refreshLoginStatus', ES(Auth.getLoginStatus, 'bind', true,
        Auth, ES(this.inform, 'bind', true,this, 'login.status'), /*force*/true));

    var flow = document.createElement('span');
    // We want to use 'vertical-align: bottom' to match the default browser
    // layout of inline blocks, but that results in a 'jumping' effect during
    // rendering, so we use 'top' initially and set 'bottom' when resizing.
    ES('Object', 'assign', false,flow.style, {
      verticalAlign: 'top',
      width: '0px',
      height: '0px',
      overflow: 'hidden'
    });

    this._element = elem;
    this._ns = ns;
    this._tag = tag;
    this._params = params;
    this._config = this.getConfig();
    this._iframeOptions = {
      root: flow,
      url: url + QueryString.encode(params),
      name: name,
      
      
      
      
      
      width: this._config.mobile_fullsize && UA.mobile()
        ? void 0
        : params.width || 1000,
      height: params.height || 1000,
      style: {
        border: 'none',
        visibility: 'hidden'
      },
      title: this._ns + ':' + this._tag + ' Facebook Social Plugin',
      onload: ES(__annotator(function()  {return this.inform('render');}, {"module":"IframePlugin","line":251,"column":14}), 'bind', true,this),
      onerror: ES(__annotator(function()  {return collapseIframe(this._iframe);}, {"module":"IframePlugin","line":252,"column":15}), 'bind', true,this)
    };

    
    if (params.allowfullscreen) {
      this._iframeOptions.allowfullscreen = true;
    }

    if (this.isFluid()) {
      DOM.addCss(this._element, 'fb_iframe_widget_fluid_desktop');
      if (!params.width && this._config.full_width) {
        this._element.style.width = '100%';
        this._iframeOptions.root.style.width = '100%';
        this._iframeOptions.style.width = '100%';
        this._params.container_width = this._element.offsetWidth;
        this._iframeOptions.url = url + QueryString.encode(this._params);
      }
    }

  }, {"params":[[elem, 'HTMLElement', 'elem'], [ns, 'string', 'ns'], [tag, 'string', 'tag'], [attr, 'object', 'attr']]});}, {"module":"IframePlugin","line":122,"column":14}, {"params":["DOMElement","string","string","object"]}),

  process:__annotator(function() {
    if (Runtime.getIsVersioned()) {
      PlatformVersioning.assertVersionIsSet();
      var uri = URI(this._iframeOptions.url);
      this._iframeOptions.url =
        uri.setPath('/' + Runtime.getVersion() + uri.getPath()).toString();
    }
    // This implements an optimization to skip rendering if we've already
    
    var params = ES('Object', 'assign', false,{}, this._params);
    delete params.channel; // Unique per-plugin, doesn't change rendering
    var query = QueryString.encode(params);
    if (this._element.getAttribute('fb-iframe-plugin-query') == query) {
      Log.info('Skipping render: %s:%s %s', this._ns, this._tag, query);
      this.inform('render');
      return;
    }
    this._element.setAttribute('fb-iframe-plugin-query', query);

    this.subscribe('render', ES(__annotator(function()  {
      this._iframe.style.visibility = 'visible';
      
      // of network issues), and the main resize event wasn't
      
      
      if (!this._isIframeResized) {
        collapseIframe(this._iframe);
      }
    }, {"module":"IframePlugin","line":292,"column":29}), 'bind', true,this));

    while (this._element.firstChild) {
      this._element.removeChild(this._element.firstChild);
    }
    this._element.appendChild(this._iframeOptions.root);
    var timeout = UA.mobile() ? 120 : 45;
    this._timeoutID = setTimeout(ES(__annotator(function()  {
      collapseIframe(this._iframe);
      Log.warn(
        '%s:%s failed to resize in %ss',
        this._ns,
        this._tag,
        timeout
      );
    }, {"module":"IframePlugin","line":308,"column":33}), 'bind', true,this), timeout * 1000);
    
    
    

    
    
    if (!PluginPipe.add(this)) {
      this._iframe = createIframe(this._iframeOptions);
    }
    if (UA.mobile()) {
      DOM.addCss(this._element, 'fb_iframe_widget_fluid');

      if (!this._iframeOptions.width) {
        ES('Object', 'assign', false,this._element.style, {
          display: 'block',
          width: '100%',
          height: 'auto'
        });

        ES('Object', 'assign', false,this._iframeOptions.root.style, {
          width: '100%',
          height: 'auto'
        });

        var iframeStyle = {
          height: 'auto',
          position: 'static',
          width: '100%'
        };

        if (UA.iphone() || UA.ipad()) {
          // Alright...what's going on here? Well, since iOS4, Mobile Safari
          
          
          
          
          // anything bigger and, well, it'll be too big. However, we need to
          // set a width because without it, min-width doesn't mean anything.
          // Further, setting an explicit width means that Safari won't
          
          
          
          
          ES('Object', 'assign', false,iframeStyle, {
            width: '220px',
            'min-width': '100%'
          });
        }

        ES('Object', 'assign', false,this._iframe.style, iframeStyle);
      }
    }
  }, {"module":"IframePlugin","line":273,"column":10}),

  
  getConfig:__annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    return {};
  }, {"returns":'object'});}, {"module":"IframePlugin","line":374,"column":12}, {"returns":"object"}),

  isFluid:__annotator(function() {
    var config = this.getConfig();
    return config.fluid;
  }, {"module":"IframePlugin","line":378,"column":10}),

  reposition:__annotator(function(newWidth) {
    var leftPosition = DOM.getPosition(this._iframe).x;
    var screenWidth = DOM.getViewportInfo().width;

    var oldWidth = parseInt(DOM.getStyle(this._iframe, 'width'), 10);

    var params = {};
    if (
        (leftPosition + newWidth) > screenWidth &&
        leftPosition > newWidth
    ) {
     this._iframe.style.left =
        parseInt(DOM.getStyle(this._iframe, 'width'), 10) - newWidth + 'px';

      this._isRepositioned = true;
      params.type = 'reposition';

    } else if (this._isRepositioned && (oldWidth - newWidth) !== 0) {
      
      this._iframe.style.left = '0px';
      this._isRepositioned = false;
      params.type = 'restore';

    } else {
      // Don't reposition OR send a message to the iframe
      return;
    }

    XD.sendToFacebook(
      this._iframe.name,
      {
        method: 'xd/reposition',
        params: ES('JSON', 'stringify', false,params)
      }
    );
  }, {"module":"IframePlugin","line":383,"column":13}),

  updateLift:__annotator(function() { 
    var same =
      this._iframe.style.width === this._iframeOptions.root.style.width &&
      this._iframe.style.height === this._iframeOptions.root.style.height;
    DOM[same ? 'removeCss' : 'addCss'](this._iframe, 'fb_iframe_widget_lift');
  }, {"module":"IframePlugin","line":420,"column":13})
}, ObservableMixin);

IframePlugin.getVal = getVal;

IframePlugin.withParams = __annotator(function(
  /*object*/ params,
  /*object*/ config
) /*function*/ {return __bodyWrapper(this, arguments, function() {
  return IframePlugin.extend({
    getParams:__annotator(function() {
      return params;
    }, {"module":"IframePlugin","line":435,"column":14}),

    getConfig:__annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
      return config ? config : {};
    }, {"returns":'object'});}, {"module":"IframePlugin","line":439,"column":14}, {"returns":"object"})
  });
}, {"params":[[params, 'object', 'params'], [config, 'object', 'config']],"returns":'function'});}, {"module":"IframePlugin","line":430,"column":26}, {"params":["object","object"],"returns":"function"});

module.exports = IframePlugin;


}, {"module":"IframePlugin","line":13,"column":241}),null);


__d("PluginConfig",["sdk.feature"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,feature) {require.__markCompiled && require.__markCompiled();
   

var PluginConfig = {
  post: {
    fluid: feature('fluid_embed', false),
    mobile_fullsize: true
  },
  video: {
    fluid: true,
    full_width: true
  }
};

module.exports = PluginConfig;


}, {"module":"PluginConfig","line":11,"column":35}),null);


__d("PluginTags",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var PluginTags = {
  activity: {
    filter: 'string',
    action: 'string',
    max_age: 'string',
    linktarget: 'string',
    header: 'bool',
    recommendations: 'bool',
    site: 'hostname'
  },

  composer: {
    action_type: 'string',
    action_properties: 'string'
  },

  create_event_button: {
  },

  degrees: {
    href: 'url'
  },

  facepile: {
    href: 'string',
    action: 'string',
    size: 'string',
    max_rows: 'string',
    show_count: 'bool'
  },

  follow: {
    href:       'url',
    layout:     'string',
    show_faces: 'bool'
  },

  like: {
    href: 'url',
    layout: 'string',
    show_faces: 'bool',
    share: 'bool',
    action: 'string',
    
    send: 'bool'
  },

  like_box: {
    href: 'string',
    show_faces: 'bool',
    header: 'bool',
    stream: 'bool',
    force_wall: 'bool',
    show_border: 'bool',
    
    id: 'string',
    connections: 'string',
    profile_id: 'string',
    name: 'string'
  },

  page: {
    href: 'url',
    hide_cover: 'bool',
    show_facepile: 'bool',
    show_about: 'bool',
    show_posts: 'bool'
  },

  open_graph: {
    href: 'url',
    layout: 'string',
    show_faces: 'bool',
    action_type: 'string',
    action_properties: 'string'
  },

  open_graph_preview: {
    action_type: 'string',
    action_properties: 'string'
  },

  page_events: {
    href: 'url'
  },

  post: {
    href: 'url',
    show_border: 'bool'
  },

  privacy_selector: {
  },

  profile_pic: {
    uid: 'string',
    linked: 'bool',
    href: 'string',
    size: 'string',
    facebook_logo: 'bool'
  },

  recommendations: {
    filter: 'string',
    action: 'string',
    max_age: 'string',
    linktarget: 'string',
    header: 'bool',
    site: 'hostname'
  },

  share_button: {
    href: 'url',
    layout: 'string',
    
    type: 'string'
  },

  shared_activity: {
    header: 'bool'
  },

  send: {
    href: 'url'
  },

  send_to_mobile: {
    max_rows:   'string',
    show_faces: 'bool',
    size:       'string'
  },

  story: {
    href: 'url',
    show_border: 'bool'
  },

  topic: {
    topic_name: 'string',
    topic_id: 'string'
  },

  video: {
    allowfullscreen: 'bool',
    href: 'url'
  },

  want: {
    href:       'url',
    layout:     'string',
    show_faces: 'bool'
  }

};

var aliases = {
  subscribe: 'follow',
  fan: 'like_box',
  likebox: 'like_box',
  friendpile: 'facepile'
};

ES(ES('Object', 'keys', false,aliases), 'forEach', true,__annotator(function(key) {
  PluginTags[key] = PluginTags[aliases[key]];
}, {"module":"PluginTags","line":194,"column":29}));

module.exports = PluginTags;


}, {"module":"PluginTags","line":31,"column":20}),null);


__d("sdk.Arbiter",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var Arbiter = {
  BEHAVIOR_EVENT: 'e',
  BEHAVIOR_PERSISTENT: 'p',
  BEHAVIOR_STATE: 's'
};
module.exports = Arbiter;


}, {"module":"sdk.Arbiter","line":6,"column":21}),null);


__d("sdk.XFBML.Element",["sdk.DOM","Type","ObservableMixin"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,DOM,Type,ObservableMixin) {require.__markCompiled && require.__markCompiled();
   
   
   


var Element = Type.extend({
  
  constructor: __annotator(function(/*DOMElement*/ dom) {return __bodyWrapper(this, arguments, function() {
    this.parent();
    this.dom = dom;
  }, {"params":[[dom, 'HTMLElement', 'dom']]});}, {"module":"sdk.XFBML.Element","line":23,"column":15}, {"params":["DOMElement"]}),

  fire: __annotator(function() {
    this.inform.apply(this, arguments);
  }, {"module":"sdk.XFBML.Element","line":28,"column":8}),

  
  getAttribute: __annotator(function(/*string*/ name, defaultValue,
      /*?function*/ transform) {return __bodyWrapper(this, arguments, function() {
    var value = DOM.getAttr(this.dom, name);
    return value
      ? transform
        ? transform(value)
        : value
      : defaultValue;
  }, {"params":[[name, 'string', 'name'], [transform, '?function', 'transform']]});}, {"module":"sdk.XFBML.Element","line":43,"column":16}, {"params":["string","?function"]}),

  
  _getBoolAttribute: __annotator(function(/*string*/ name, /*?boolean*/ defaultValue)
      /*?boolean*/ {return __bodyWrapper(this, arguments, function() {
    var value = DOM.getBoolAttr(this.dom, name);
    return value === null
      ? defaultValue
      : value;
  }, {"params":[[name, 'string', 'name'], [defaultValue, '?boolean', 'defaultValue']],"returns":'?boolean'});}, {"module":"sdk.XFBML.Element","line":59,"column":21}, {"params":["string","?boolean"],"returns":"?boolean"}),

  
  _getPxAttribute: __annotator(function(/*string*/ name, /*?number*/ defaultValue)
      /*?number*/ {return __bodyWrapper(this, arguments, function() {
    return this.getAttribute(name, defaultValue, __annotator(function(/*string*/ s) {return __bodyWrapper(this, arguments, function() {
      var value = parseInt(s, 10);
      return isNaN(value) ? defaultValue : value;
    }, {"params":[[s, 'string', 's']]});}, {"module":"sdk.XFBML.Element","line":75,"column":49}, {"params":["string"]}));
  }, {"params":[[name, 'string', 'name'], [defaultValue, '?number', 'defaultValue']],"returns":'?number'});}, {"module":"sdk.XFBML.Element","line":73,"column":19}, {"params":["string","?number"],"returns":"?number"}),

  
  _getLengthAttribute: __annotator(function(/*string*/ name, /*?number*/ defaultValue) {return __bodyWrapper(this, arguments, function() {
    return this.getAttribute(name, defaultValue, __annotator(function(/*string*/ s) {return __bodyWrapper(this, arguments, function() {
      if (s === '100%') {
        return s;
      }
      var value = parseInt(s, 10);
      return isNaN(value) ? defaultValue : value;
    }, {"params":[[s, 'string', 's']]});}, {"module":"sdk.XFBML.Element","line":88,"column":49}, {"params":["string"]}));
  }, {"params":[[name, 'string', 'name'], [defaultValue, '?number', 'defaultValue']]});}, {"module":"sdk.XFBML.Element","line":87,"column":23}, {"params":["string","?number"]}),

  
  _getAttributeFromList: __annotator(function(/*string*/ name, /*string*/ defaultValue,
      /*array<string>*/ allowed) /*string*/ {return __bodyWrapper(this, arguments, function() {
    return this.getAttribute(name, defaultValue, __annotator(function(/*string*/ s)
        /*string*/ {return __bodyWrapper(this, arguments, function() {
      s = s.toLowerCase();
      return (ES(allowed, 'indexOf', true,s) > -1)
        ? s
        : defaultValue;
    }, {"params":[[s, 'string', 's']],"returns":'string'});}, {"module":"sdk.XFBML.Element","line":108,"column":49}, {"params":["string"],"returns":"string"}));
  }, {"params":[[name, 'string', 'name'], [defaultValue, 'string', 'defaultValue'], [allowed, 'array<string>', 'allowed']],"returns":'string'});}, {"module":"sdk.XFBML.Element","line":106,"column":25}, {"params":["string","string","array<string>"],"returns":"string"}),

  
  isValid: __annotator(function() /*?boolean*/ {return __bodyWrapper(this, arguments, function() {
    for (var dom = this.dom; dom; dom = dom.parentNode) {
      if (dom == document.body) {
        return true;
      }
    }
  }, {"returns":'?boolean'});}, {"module":"sdk.XFBML.Element","line":122,"column":11}, {"returns":"?boolean"}),

  
  clear: __annotator(function() {
    DOM.html(this.dom, '');
  }, {"module":"sdk.XFBML.Element","line":134,"column":9})

}, ObservableMixin);

module.exports = Element;


}, {"module":"sdk.XFBML.Element","line":7,"column":61}),null);


__d("sdk.XFBML.IframeWidget",["sdk.Arbiter","sdk.Auth","sdk.Content","sdk.DOM","sdk.Event","sdk.XFBML.Element","guid","insertIframe","QueryString","sdk.Runtime","sdk.ui","UrlMap","sdk.XD"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Arbiter,Auth,Content,DOM,Event,Element,guid,insertIframe,QueryString,Runtime,ui,UrlMap,XD) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   
   
   
   
   
   
   


var IframeWidget = Element.extend({
  
  _iframeName: null,

  
  _showLoader: true,

  
  _refreshOnAuthChange: false,

  
  _allowReProcess: false,

  
  _fetchPreCachedLoader: false,

  
  _visibleAfter: 'load',

  
  _widgetPipeEnabled: false,

  
  _borderReset: false,

  
  _repositioned: false,


  
  
  

  
  getUrlBits: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    throw new Error('Inheriting class needs to implement getUrlBits().');
  }, {"returns":'object'});}, {"module":"sdk.XFBML.IframeWidget","line":107,"column":14}, {"returns":"object"}),

  
  
  

  
  setupAndValidate: __annotator(function() /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    return true;
  }, {"returns":'boolean'});}, {"module":"sdk.XFBML.IframeWidget","line":125,"column":20}, {"returns":"boolean"}),

  
  oneTimeSetup: __annotator(function() {}, {"module":"sdk.XFBML.IframeWidget","line":133,"column":16}),

  
  getSize: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {}, {"returns":'object'});}, {"module":"sdk.XFBML.IframeWidget","line":143,"column":11}, {"returns":"object"}),

  
  getIframeName: __annotator(function() /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return this._iframeName;
  }, {"returns":'?string'});}, {"module":"sdk.XFBML.IframeWidget","line":156,"column":17}, {"returns":"?string"}),

  
  getIframeTitle: __annotator(function() /*?string*/ {return __bodyWrapper(this, arguments, function() {
    return 'Facebook Social Plugin';
  }, {"returns":'?string'});}, {"module":"sdk.XFBML.IframeWidget","line":164,"column":18}, {"returns":"?string"}),

  
  
  

  
  getChannelUrl: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    if (!this._channelUrl) {
      
      
      var self = this;
      this._channelUrl = XD.handler(__annotator(function(message) {
        self.fire('xd.' + message.type, message);
      }, {"module":"sdk.XFBML.IframeWidget","line":182,"column":36}), 'parent.parent', true);
    }
    return this._channelUrl;
  }, {"returns":'string'});}, {"module":"sdk.XFBML.IframeWidget","line":177,"column":17}, {"returns":"string"}),

  
  getIframeNode: __annotator(function() /*?DOMElement*/ {return __bodyWrapper(this, arguments, function() {
    
    
    return this.dom.getElementsByTagName('iframe')[0];
  }, {"returns":'?HTMLElement'});}, {"module":"sdk.XFBML.IframeWidget","line":194,"column":17}, {"returns":"?DOMElement"}),

  
  arbiterInform: __annotator(function(/*string*/ event, /*?object*/ message,
      /*?string*/ behavior) {return __bodyWrapper(this, arguments, function() {
    XD.sendToFacebook(
      this.getIframeName(), {
        method: event,
        params: ES('JSON', 'stringify', false,message || {}),
        behavior: behavior || Arbiter.BEHAVIOR_PERSISTENT
      });
  }, {"params":[[event, 'string', 'event'], [message, '?object', 'message'], [behavior, '?string', 'behavior']]});}, {"module":"sdk.XFBML.IframeWidget","line":203,"column":17}, {"params":["string","?object","?string"]}),

  _arbiterInform: __annotator(function(/*string*/ event, /*object*/  message,
      /*?string*/ behavior) {return __bodyWrapper(this, arguments, function() {
    var relation = 'parent.frames["' + this.getIframeNode().name + '"]';
    XD.inform(event, message, relation, behavior);
  }, {"params":[[event, 'string', 'event'], [behavior, '?string', 'behavior']]});}, {"module":"sdk.XFBML.IframeWidget","line":213,"column":18}, {"params":["string","?string"]}),

  
  getDefaultWebDomain: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    return UrlMap.resolve('www');
  }, {"returns":'string'});}, {"module":"sdk.XFBML.IframeWidget","line":223,"column":23}, {"returns":"string"}),

  
  
  

  
  process: __annotator(function(/*?boolean*/ force) {return __bodyWrapper(this, arguments, function() {
    
    if (this._done) {
      if (!this._allowReProcess && !force) {
        return;
      }
      this.clear();
    } else {
      this._oneTimeSetup();
    }
    this._done = true;

    this._iframeName = this.getIframeName() || this._iframeName || guid();
    if (!this.setupAndValidate()) {
      // failure to validate means we're done rendering what we can
      this.fire('render');
      return;
    }

    
    if (this._showLoader) {
      this._addLoader();
    }

    // it's always hidden by default
    DOM.addCss(this.dom, 'fb_iframe_widget');
    if (this._visibleAfter != 'immediate') {
      DOM.addCss(this.dom, 'fb_hide_iframes');
    } else {
      this.subscribe('iframe.onload', ES(this.fire, 'bind', true,this, 'render'));
    }

    
    var size = this.getSize() || {};
    var url = this.getFullyQualifiedURL();

    if (size.width == '100%') {
      DOM.addCss(this.dom, 'fb_iframe_widget_fluid');
    }

    this.clear();
    insertIframe({
      url       : url,
      root      : this.dom.appendChild(document.createElement('span')),
      name      : this._iframeName,
      title     : this.getIframeTitle(),
      className : Runtime.getRtl() ? 'fb_rtl' : 'fb_ltr',
      height    : size.height,
      width     : size.width,
      onload    : ES(this.fire, 'bind', true,this, 'iframe.onload')
    });

    this._resizeFlow(size);

    this.loaded = false;
    this.subscribe('iframe.onload', ES(__annotator(function()  {
      this.loaded = true;
      
      
      if (!this._isResizeHandled) {
        DOM.addCss(this.dom, 'fb_hide_iframes');
      }
    }, {"module":"sdk.XFBML.IframeWidget","line":292,"column":36}), 'bind', true,this));
  }, {"params":[[force, '?boolean', 'force']]});}, {"module":"sdk.XFBML.IframeWidget","line":237,"column":11}, {"params":["?boolean"]}),

  
  generateWidgetPipeIframeName: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    widgetPipeIframeCount++;
    return 'fb_iframe_' + widgetPipeIframeCount;
  }, {"returns":'string'});}, {"module":"sdk.XFBML.IframeWidget","line":310,"column":32}, {"returns":"string"}),

  
  getFullyQualifiedURL: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    
    // a <form> POST. we prefer a GET because it prevents the "POST resend"
    
    var url = this._getURL();
    url += '?' + QueryString.encode(this._getQS());

    if (url.length > 2000) {
      
      url = 'about:blank';
      var onload = ES(__annotator(function() {
        this._postRequest();
        this.unsubscribe('iframe.onload', onload);
      }, {"module":"sdk.XFBML.IframeWidget","line":335,"column":19}), 'bind', true,this);
      this.subscribe('iframe.onload', onload);
    }

    return url;
  }, {"returns":'string'});}, {"module":"sdk.XFBML.IframeWidget","line":325,"column":24}, {"returns":"string"}),

   

  _getWidgetPipeShell: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    return UrlMap.resolve('www') + '/common/widget_pipe_shell.php';
  }, {"returns":'string'});}, {"module":"sdk.XFBML.IframeWidget","line":356,"column":23}, {"returns":"string"}),

  
  _oneTimeSetup: __annotator(function() {
    
    
    this.subscribe('xd.resize', ES(this._handleResizeMsg, 'bind', true,this));
    this.subscribe('xd.resize', ES(this._bubbleResizeEvent, 'bind', true,this));

    this.subscribe('xd.resize.iframe', ES(this._resizeIframe, 'bind', true,this));
    this.subscribe('xd.resize.flow', ES(this._resizeFlow, 'bind', true,this));
    this.subscribe('xd.resize.flow', ES(this._bubbleResizeEvent, 'bind', true,this));

    this.subscribe('xd.refreshLoginStatus', __annotator(function() {
      Auth.getLoginStatus(__annotator(function(){}, {"module":"sdk.XFBML.IframeWidget","line":374,"column":26}), true);
    }, {"module":"sdk.XFBML.IframeWidget","line":373,"column":44}));
    this.subscribe('xd.logout', __annotator(function() {
      ui({ method: 'auth.logout', display: 'hidden' }, __annotator(function() {}, {"module":"sdk.XFBML.IframeWidget","line":377,"column":55}));
    }, {"module":"sdk.XFBML.IframeWidget","line":376,"column":32}));

    
    if (this._refreshOnAuthChange) {
      this._setupAuthRefresh();
    }

    
    if (this._visibleAfter == 'load') {
      this.subscribe('iframe.onload', ES(this._makeVisible, 'bind', true,this));
    }

    this.subscribe(
      'xd.verify', ES(__annotator(function(message) {
          this.arbiterInform('xd/verify', message.token);
        }, {"module":"sdk.XFBML.IframeWidget","line":391,"column":19}), 'bind', true,this));

    
    this.oneTimeSetup();
  }, {"module":"sdk.XFBML.IframeWidget","line":363,"column":17}),

  
  _makeVisible: __annotator(function() {
    this._removeLoader();
    DOM.removeCss(this.dom, 'fb_hide_iframes');
    this.fire('render');
  }, {"module":"sdk.XFBML.IframeWidget","line":402,"column":16}),

  
  _setupAuthRefresh: __annotator(function() {
    Auth.getLoginStatus(ES(__annotator(function(/*object*/ response) {return __bodyWrapper(this, arguments, function() {
      var lastStatus = response.status;
      Event.subscribe('auth.statusChange', ES(__annotator(function(/*object*/ response) {return __bodyWrapper(this, arguments, function() {
        if (!this.isValid()) {
          return;
        }
        
        if (lastStatus == 'unknown' || response.status == 'unknown') {
          this.process(true);
        }
        lastStatus = response.status;
      }, {"params":[[response, 'object', 'response']]});}, {"module":"sdk.XFBML.IframeWidget","line":420,"column":43}, {"params":["object"]}), 'bind', true,this));
    }, {"params":[[response, 'object', 'response']]});}, {"module":"sdk.XFBML.IframeWidget","line":418,"column":24}, {"params":["object"]}), 'bind', true,this));
  }, {"module":"sdk.XFBML.IframeWidget","line":417,"column":21}),

  
  _handleResizeMsg: __annotator(function(/*object*/ message) {return __bodyWrapper(this, arguments, function() {
    if (!this.isValid()) {
      return;
    }
    this._resizeIframe(message);
    this._resizeFlow(message);

    if (!this._borderReset) {
      this.getIframeNode().style.border = 'none';
      this._borderReset = true;
    }

    this._isResizeHandled = true;
    this._makeVisible();
  }, {"params":[[message, 'object', 'message']]});}, {"module":"sdk.XFBML.IframeWidget","line":436,"column":20}, {"params":["object"]}),

  
  _bubbleResizeEvent: __annotator(function(/*object*/ message) {return __bodyWrapper(this, arguments, function() {
    var filtered_message = {
      height: message.height,
      width: message.width,
      pluginID: this.getAttribute('plugin-id')
    };

    Event.fire('xfbml.resize', filtered_message);
  }, {"params":[[message, 'object', 'message']]});}, {"module":"sdk.XFBML.IframeWidget","line":455,"column":22}, {"params":["object"]}),

  _resizeIframe: __annotator(function(/*object*/ message) {return __bodyWrapper(this, arguments, function() {
    var iframe = this.getIframeNode();
    if (message.reposition === "true") {
      this._repositionIframe(message);
    }
    message.height && (iframe.style.height = message.height + 'px');
    message.width && (iframe.style.width = message.width + 'px');
    this._updateIframeZIndex();
  }, {"params":[[message, 'object', 'message']]});}, {"module":"sdk.XFBML.IframeWidget","line":465,"column":17}, {"params":["object"]}),

  _resizeFlow: __annotator(function(/*object*/ message) {return __bodyWrapper(this, arguments, function() {
    var span = this.dom.getElementsByTagName('span')[0];
    message.height && (span.style.height = message.height + 'px');
    message.width && (span.style.width = message.width + 'px');
    this._updateIframeZIndex();
  }, {"params":[[message, 'object', 'message']]});}, {"module":"sdk.XFBML.IframeWidget","line":475,"column":15}, {"params":["object"]}),

  _updateIframeZIndex: __annotator(function() {
    var span = this.dom.getElementsByTagName('span')[0];
    var iframe = this.getIframeNode();
    var identical = iframe.style.height === span.style.height &&
      iframe.style.width === span.style.width;
    var method = identical ? 'removeCss' : 'addCss';
    DOM[method](iframe, 'fb_iframe_widget_lift');
  }, {"module":"sdk.XFBML.IframeWidget","line":482,"column":23}),

  _repositionIframe: __annotator(function(/*object*/ message) {return __bodyWrapper(this, arguments, function() {
    var iframe = this.getIframeNode();
    var iframe_width = parseInt(DOM.getStyle(iframe, 'width'), 10);
    var left = DOM.getPosition(iframe).x;
    var screen_width = DOM.getViewportInfo().width;
    var comment_width = parseInt(message.width, 10);
    if (left + comment_width > screen_width &&
        left > comment_width) {
      iframe.style.left = iframe_width - comment_width + 'px';
      this.arbiterInform('xd/reposition', {type: 'horizontal'});
      this._repositioned = true;
    } else if (this._repositioned) {
      iframe.style.left = '0px';
      this.arbiterInform('xd/reposition', {type: 'restore'});
      this._repositioned = false;
    }
  }, {"params":[[message, 'object', 'message']]});}, {"module":"sdk.XFBML.IframeWidget","line":491,"column":21}, {"params":["object"]}),

  
  _addLoader: __annotator(function() {
    if (!this._loaderDiv) {
      DOM.addCss(this.dom, 'fb_iframe_widget_loader');
      this._loaderDiv = document.createElement('div');
      this._loaderDiv.className = 'FB_Loader';
      this.dom.appendChild(this._loaderDiv);
    }
  }, {"module":"sdk.XFBML.IframeWidget","line":512,"column":14}),

  
  _removeLoader: __annotator(function() {
    if (this._loaderDiv) {
      DOM.removeCss(this.dom, 'fb_iframe_widget_loader');
      if (this._loaderDiv.parentNode) {
        this._loaderDiv.parentNode.removeChild(this._loaderDiv);
      }
      this._loaderDiv = null;
    }
  }, {"module":"sdk.XFBML.IframeWidget","line":524,"column":17}),

  
  _getQS: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    return ES('Object', 'assign', false,{
      api_key      : Runtime.getClientID(),
      locale       : Runtime.getLocale(),
      sdk          : 'joey',
      kid_directed_site: Runtime.getKidDirectedSite(),
      ref          : this.getAttribute('ref')
    }, this.getUrlBits().params);
  }, {"returns":'object'});}, {"module":"sdk.XFBML.IframeWidget","line":540,"column":10}, {"returns":"object"}),

  
  _getURL: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    var
      domain = this.getDefaultWebDomain(),
      static_path = '';

    return domain + '/plugins/' + static_path +
           this.getUrlBits().name + '.php';
  }, {"returns":'string'});}, {"module":"sdk.XFBML.IframeWidget","line":555,"column":11}, {"returns":"string"}),

  
  _postRequest: __annotator(function() {
    Content.submitToTarget({
      url    : this._getURL(),
      target : this.getIframeNode().name,
      params : this._getQS()
    });
  }, {"module":"sdk.XFBML.IframeWidget","line":567,"column":16})
});

var widgetPipeIframeCount = 0;
var allWidgetPipeIframes = {};

function groupWidgetPipeDescriptions() /*object*/ {return __bodyWrapper(this, arguments, function() {
  var widgetPipeDescriptions = {};
  for (var key in allWidgetPipeIframes) {
    var controller = allWidgetPipeIframes[key];

    widgetPipeDescriptions[key] = {
      widget: controller.getUrlBits().name,
      params: controller._getQS()
    };
  }

  return widgetPipeDescriptions;
}, {"returns":'object'});}__annotator(groupWidgetPipeDescriptions, {"module":"sdk.XFBML.IframeWidget","line":579,"column":0,"name":"groupWidgetPipeDescriptions"}, {"returns":"object"});

module.exports = IframeWidget;


}, {"module":"sdk.XFBML.IframeWidget","line":8,"column":189}),null);


__d("sdk.XFBML.Comments",["sdk.Event","sdk.XFBML.IframeWidget","QueryString","sdk.Runtime","JSSDKConfig","sdk.UA","UrlMap","sdk.feature"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Event,IframeWidget,QueryString,Runtime,SDKConfig,UA,UrlMap,feature) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   

   

var Comments = IframeWidget.extend({
  _visibleAfter: 'immediate',

  
  _refreshOnAuthChange: true,

  
  setupAndValidate: __annotator(function() /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    
    var attr = {
      channel_url : this.getChannelUrl(),
      colorscheme : this.getAttribute('colorscheme'),
      skin        : this.getAttribute('skin'),
      numposts    : this.getAttribute('num-posts', 10),
      width       : this._getLengthAttribute('width'),
      href        : this.getAttribute('href'),
      permalink   : this.getAttribute('permalink'),
      publish_feed : this.getAttribute('publish_feed'),
      order_by    : this.getAttribute('order_by'),
      mobile      : this._getBoolAttribute('mobile'),
      version     : this.getAttribute('version')
    };

    if (!attr.width && !attr.permalink) {
      attr.width = 550;
    }

    if (SDKConfig.initSitevars.enableMobileComments &&
        UA.mobile() &&
        attr.mobile !== false) {
      attr.mobile = true;
      delete attr.width;
    }
    if (!attr.skin) {
      attr.skin = attr.colorscheme;
    }

    
    if (!attr.href) {
      attr.migrated    = this.getAttribute('migrated');
      attr.xid         = this.getAttribute('xid');
      attr.title       = this.getAttribute('title', document.title);
      attr.url         = this.getAttribute('url', document.URL);
      attr.quiet       = this.getAttribute('quiet');
      attr.reverse     = this.getAttribute('reverse');
      attr.simple      = this.getAttribute('simple');
      attr.css         = this.getAttribute('css');
      attr.notify      = this.getAttribute('notify');

      
      if (!attr.xid) {
        // We always want the URL minus the hash "#" also note the encoding here
        
        
        var index = ES(document.URL, 'indexOf', true,'#');
        if (index > 0) {
          attr.xid = encodeURIComponent(document.URL.substring(0, index));
        }
        else {
          attr.xid = encodeURIComponent(document.URL);
        }
      }

      if (attr.migrated) {
        attr.href =
          UrlMap.resolve('www') + '/plugins/comments_v1.php?' +
          'app_id=' + Runtime.getClientID() +
          '&xid=' + encodeURIComponent(attr.xid) +
          '&url=' + encodeURIComponent(attr.url);
      }
    } else {
      
      var fb_comment_id = this.getAttribute('fb_comment_id');
      if (!fb_comment_id) {
        fb_comment_id =
          QueryString.decode(
            document.URL.substring(
              ES(document.URL, 'indexOf', true,'?') + 1)).fb_comment_id;
        if (fb_comment_id && ES(fb_comment_id, 'indexOf', true,'#') > 0) {
          
          fb_comment_id =
            fb_comment_id.substring(0,
                                    ES(fb_comment_id, 'indexOf', true,'#'));
        }
      }

      if (fb_comment_id) {
        attr.fb_comment_id = fb_comment_id;
        this.subscribe('render',
                       ES(__annotator(function() {
                           // don't nuke the hash if it currently
                           
                           
                           if (!window.location.hash) {
                             window.location.hash = this.getIframeNode().id;
                           }
                         }, {"module":"sdk.XFBML.Comments","line":113,"column":23}), 'bind', true,this));
      }
    }

    if (!attr.version) {
      attr.version = Runtime.getVersion();
    }

    this._attr = attr;
    return true;
  }, {"returns":'boolean'});}, {"module":"sdk.XFBML.Comments","line":31,"column":20}, {"returns":"boolean"}),

  
  oneTimeSetup: __annotator(function() {
    this.subscribe('xd.commentCreated',
                   ES(this._handleCommentCreatedMsg, 'bind', true,this));
    this.subscribe('xd.commentRemoved',
                   ES(this._handleCommentRemovedMsg, 'bind', true,this));
  }, {"module":"sdk.XFBML.Comments","line":135,"column":16}),

  
  getSize: __annotator(function() /*?object*/ {return __bodyWrapper(this, arguments, function() {
    if (!this._attr.permalink) {
      return {
        width: this._attr.mobile ? '100%' : this._attr.width,
        
        // loaded, but initially we don't want to take more space than we need
        height: 100
      };
    }
  }, {"returns":'?object'});}, {"module":"sdk.XFBML.Comments","line":147,"column":11}, {"returns":"?object"}),

  
  getUrlBits: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    return { name: 'comments', params: this._attr };
  }, {"returns":'object'});}, {"module":"sdk.XFBML.Comments","line":163,"column":14}, {"returns":"object"}),

  
  getDefaultWebDomain: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    if (this._attr.mobile
        && !feature('one_comment_controller', false)
        && this._attr.version !== 'v2.3') {
      return UrlMap.resolve('m', true);
    }

    return UrlMap.resolve('www', true);
  }, {"returns":'string'});}, {"module":"sdk.XFBML.Comments","line":175,"column":23}, {"returns":"string"}),

  _handleCommentCreatedMsg: __annotator(function(/*object*/ message) {return __bodyWrapper(this, arguments, function() {
    if (!this.isValid()) {
      return;
    }

    var eventArgs = {
      href: message.href,
      commentID: message.commentID,
      parentCommentID: message.parentCommentID,
      message: message.message
    };

    Event.fire('comment.create', eventArgs);
  }, {"params":[[message, 'object', 'message']]});}, {"module":"sdk.XFBML.Comments","line":185,"column":28}, {"params":["object"]}),

  _handleCommentRemovedMsg: __annotator(function(/*object*/ message) {return __bodyWrapper(this, arguments, function() {
    if (!this.isValid()) {
      return;
    }

    var eventArgs = {
      href: message.href,
      commentID: message.commentID
    };

    Event.fire('comment.remove', eventArgs);
  }, {"params":[[message, 'object', 'message']]});}, {"module":"sdk.XFBML.Comments","line":200,"column":28}, {"params":["object"]})
});
module.exports = Comments;


}, {"module":"sdk.XFBML.Comments","line":9,"column":138}),null);


__d("sdk.XFBML.CommentsCount",["ApiClient","sdk.DOM","sdk.XFBML.Element","sprintf"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ApiClient,DOM,Element,sprintf) {require.__markCompiled && require.__markCompiled();
   
   
   
   

var CommentsCount = Element.extend({

  process:__annotator(function() {
    DOM.addCss(this.dom, 'fb_comments_count_zero');

    var href = this.getAttribute('href', window.location.href);

    ApiClient.scheduleBatchCall(
      '/v2.1/' + encodeURIComponent(href),
      {fields: 'share'},
      ES(__annotator(function(value)  {
        var c = (value.share && value.share.comment_count) || 0;
        DOM.html(
          this.dom,
          sprintf('<span class="fb_comments_count">%s</span>', c)
        );

        if (c > 0) {
          DOM.removeCss(this.dom, 'fb_comments_count_zero');
        }

        this.fire('render');
      }, {"module":"sdk.XFBML.CommentsCount","line":23,"column":6}), 'bind', true,this)
    );
  }, {"module":"sdk.XFBML.CommentsCount","line":15,"column":10})

});

module.exports = CommentsCount;


}, {"module":"sdk.XFBML.CommentsCount","line":7,"column":84}),null);


__d("sdk.Helper",["sdk.ErrorHandling","sdk.Event","UrlMap","safeEval","sprintf"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ErrorHandling,Event,UrlMap,safeEval,sprintf) {require.__markCompiled && require.__markCompiled();
   
   
   

   
   

var Helper = {
  
  isUser: __annotator(function(id) /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    return id < 2200000000 ||
      (id >= 100000000000000 &&  
       id <= 100099999989999) || 
      (id >= 89000000000000 &&   
       id <= 89999999999999) ||  
      (id >= 60000010000000 &&   // DBTYPE_SECOND_SEV: just don't ask
       id <= 60000019999999);
  }, {"returns":'boolean'});}, {"module":"sdk.Helper","line":25,"column":10}, {"returns":"boolean"}),

  
  upperCaseFirstChar: __annotator(function(/*string*/ s) /*string*/ {return __bodyWrapper(this, arguments, function() {
    if (s.length > 0) {
      return s.substr(0, 1).toUpperCase() + s.substr(1);
    }
    else {
      return s;
    }
  }, {"params":[[s, 'string', 's']],"returns":'string'});}, {"module":"sdk.Helper","line":41,"column":22}, {"params":["string"],"returns":"string"}),

  
  getProfileLink: __annotator(function(
    /*?object*/ userInfo,
    /*string*/ html,
    /*?string*/ href
  ) /*string*/ {return __bodyWrapper(this, arguments, function() {
    if (!href && userInfo) {
      href = sprintf(
        '%s/profile.php?id=%s',
        UrlMap.resolve('www'),
        userInfo.uid || userInfo.id
      );
    }
    if (href) {
      html = sprintf('<a class="fb_link" href="%s">%s</a>', href, html);
    }
    return html;
  }, {"params":[[userInfo, '?object', 'userInfo'], [html, 'string', 'html'], [href, '?string', 'href']],"returns":'string'});}, {"module":"sdk.Helper","line":58,"column":18}, {"params":["?object","string","?string"],"returns":"string"}),

  
  invokeHandler: __annotator(function(handler, /*?object*/ scope, /*?array*/ args) {return __bodyWrapper(this, arguments, function() {
    if (handler) {
      if (typeof handler === 'string') {
        ErrorHandling.unguard(safeEval)(handler, args);
      } else if (handler.apply) {
        ErrorHandling.unguard(handler).apply(scope, args || []);
      }
    }
  }, {"params":[[scope, '?object', 'scope'], [args, '?array', 'args']]});}, {"module":"sdk.Helper","line":84,"column":17}, {"params":["?object","?array"]}),

  
  fireEvent: __annotator(function(/*string*/ eventName, /*object*/ eventSource) {return __bodyWrapper(this, arguments, function() {
    var href = eventSource._attr.href;
    eventSource.fire(eventName, href); 
    Event.fire(eventName, href, eventSource); 
  }, {"params":[[eventName, 'string', 'eventName'], [eventSource, 'object', 'eventSource']]});}, {"module":"sdk.Helper","line":102,"column":13}, {"params":["string","object"]}),

  
  executeFunctionByName: __annotator(function(/*string*/ functionName ) {return __bodyWrapper(this, arguments, function() {
    var args = Array.prototype.slice.call(arguments, 1);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    var context = window;
    for (var i = 0; i < namespaces.length; i++) {
      context = context[namespaces[i]];
    }
    return context[func].apply(this, args);
  }, {"params":[[functionName, 'string', 'functionName']]});}, {"module":"sdk.Helper","line":113,"column":25}, {"params":["string"]})

};

module.exports = Helper;


}, {"module":"sdk.Helper","line":7,"column":81}),null);


__d("sdk.XFBML.LoginButton",["sdk.Helper","IframePlugin"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Helper,IframePlugin) {require.__markCompiled && require.__markCompiled();
   
   

var LoginButton = IframePlugin.extend({
  constructor: __annotator(function(/*DOMElement*/ elem, /*string*/ ns, /*string*/ tag,
      /*object*/ attr) {return __bodyWrapper(this, arguments, function() {
    this.parent(elem, ns, tag, attr);
    var onlogin = IframePlugin.getVal(attr, 'on_login');
    if (onlogin) {
      this.subscribe('login.status', __annotator(function(/*object*/ response) {return __bodyWrapper(this, arguments, function() {
        Helper.invokeHandler(onlogin, null, [response]);
      }, {"params":[[response, 'object', 'response']]});}, {"module":"sdk.XFBML.LoginButton","line":17,"column":37}, {"params":["object"]}));
    }
  }, {"params":[[elem, 'HTMLElement', 'elem'], [ns, 'string', 'ns'], [tag, 'string', 'tag'], [attr, 'object', 'attr']]});}, {"module":"sdk.XFBML.LoginButton","line":12,"column":15}, {"params":["DOMElement","string","string","object"]}),

  getParams: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    return {
      scope: 'string',
      perms: 'string', 
      size: 'string',
      login_text: 'text',
      show_faces: 'bool',
      max_rows: 'string',
      show_login_face: 'bool',
      registration_url: 'url_maybe',
      auto_logout_link: 'bool',
      one_click: 'bool',
      show_banner: 'bool',
      auth_type: 'string',
      default_audience: 'string'
    };
  }, {"returns":'object'});}, {"module":"sdk.XFBML.LoginButton","line":23,"column":13}, {"returns":"object"})
});

module.exports = LoginButton;


}, {"module":"sdk.XFBML.LoginButton","line":7,"column":58}),null);


__d("escapeHTML",[],__annotator(function(global,require,requireDynamic,requireLazy,module,exports) {require.__markCompiled && require.__markCompiled();
var re = /[&<>"'\/]/g;
var map = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
  '/': '&#x2F;'
};

function escapeHTML(/*string*/ value) /*string*/ {return __bodyWrapper(this, arguments, function() {
  return value.replace(re, __annotator(function(m) {
    return map[m];
  }, {"module":"escapeHTML","line":34,"column":27}));
}, {"params":[[value, 'string', 'value']],"returns":'string'});}__annotator(escapeHTML, {"module":"escapeHTML","line":33,"column":0,"name":"escapeHTML"}, {"params":["string"],"returns":"string"});
module.exports = escapeHTML;


}, {"module":"escapeHTML","line":22,"column":20}),null);


__d("sdk.XFBML.Name",["ApiClient","escapeHTML","sdk.Event","sdk.XFBML.Element","sdk.Helper","Log","sdk.Runtime"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,ApiClient,escapeHTML,Event,Element,Helper,Log,Runtime) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   

var hasOwnProperty = ({}).hasOwnProperty;

var Name = Element.extend({
  
  process: __annotator(function() {
    ES('Object', 'assign', false,this, {
      _uid           : this.getAttribute('uid'),
      _firstnameonly : this._getBoolAttribute('first-name-only'),
      _lastnameonly  : this._getBoolAttribute('last-name-only'),
      _possessive    : this._getBoolAttribute('possessive'),
      _reflexive     : this._getBoolAttribute('reflexive'),
      _objective     : this._getBoolAttribute('objective'),
      _linked        : this._getBoolAttribute('linked', true),
      _subjectId     : this.getAttribute('subject-id')
    });

    if (!this._uid) {
      Log.error('"uid" is a required attribute for <fb:name>');
      this.fire('render');
      return;
    }

    var fields = [];
    if (this._firstnameonly) {
      fields.push('first_name');
    } else if (this._lastnameonly) {
      fields.push('last_name');
    } else {
      fields.push('name');
    }

    if (this._subjectId) {
      fields.push('gender');

      if (this._subjectId == Runtime.getUserID()) {
        this._reflexive = true;
      }
    }

    
    Event.monitor('auth.statusChange', ES(__annotator(function()  {
      
      if (!this.isValid()) {
        this.fire('render');
        return true; 
      }

      if (!this._uid || this._uid == 'loggedinuser') {
        this._uid = Runtime.getUserID();
      }

      if (!this._uid) {
        return; // don't do anything yet
      }

      ApiClient.scheduleBatchCall(
        
        // which will work till Apr, 2015. It's done to support
        
        '/v1.0/' + this._uid,
        {fields: fields.join(',')},
        ES(__annotator(function(data)  {
          if (hasOwnProperty.call(data, 'error')) {
            Log.warn('The name is not found for ID: ' + this._uid);
            return;
          }
          if (this._subjectId == this._uid) {
            this._renderPronoun(data);
          } else {
            this._renderOther(data);
          }
          this.fire('render');
        }, {"module":"sdk.XFBML.Name","line":79,"column":8}), 'bind', true,this)
      );
    }, {"module":"sdk.XFBML.Name","line":58,"column":39}), 'bind', true,this));
  }, {"module":"sdk.XFBML.Name","line":22,"column":11}),

  
  _renderPronoun: __annotator(function(/*object*/ userInfo) {return __bodyWrapper(this, arguments, function() {
    var
      word = '',
      objective = this._objective;
    if (this._subjectId) {
      objective = true;
      if (this._subjectId === this._uid) {
        this._reflexive = true;
      }
    }
    if (this._uid == Runtime.getUserID() &&
        this._getBoolAttribute('use-you', true)) {
      if (this._possessive) {
        if (this._reflexive) {
          word = 'your own';
        } else {
          word = 'your';
        }
      } else {
        if (this._reflexive) {
          word = 'yourself';
        } else {
          word = 'you';
        }
      }
    }
    else {
      switch (userInfo.gender) {
        case 'male':
          if (this._possessive) {
            word = this._reflexive ? 'his own' : 'his';
          } else {
            if (this._reflexive) {
              word = 'himself';
            } else if (objective) {
              word = 'him';
            } else {
              word = 'he';
            }
          }
          break;
        case 'female':
          if (this._possessive) {
            word = this._reflexive ? 'her own' : 'her';
          } else {
            if (this._reflexive) {
              word = 'herself';
            } else if (objective) {
              word = 'her';
            } else {
              word = 'she';
            }
          }
          break;
        default:
          if (this._getBoolAttribute('use-they', true)) {
            if (this._possessive) {
              if (this._reflexive) {
                word = 'their own';
              } else {
                word = 'their';
              }
            } else {
              if (this._reflexive) {
                word = 'themselves';
              } else if (objective) {
                word = 'them';
              } else {
                word = 'they';
              }
            }
          }
          else {
            if (this._possessive) {
              if (this._reflexive) {
                word = 'his/her own';
              } else {
                word = 'his/her';
              }
            } else {
              if (this._reflexive) {
                word = 'himself/herself';
              } else if (objective) {
                word = 'him/her';
              } else {
                word = 'he/she';
              }
            }
          }
          break;
      }
    }
    if (this._getBoolAttribute('capitalize', false)) {
      word = Helper.upperCaseFirstChar(word);
    }
    this.dom.innerHTML = word;
  }, {"params":[[userInfo, 'object', 'userInfo']]});}, {"module":"sdk.XFBML.Name","line":98,"column":18}, {"params":["object"]}),

  
  _renderOther: __annotator(function(/*object*/ userInfo) {return __bodyWrapper(this, arguments, function() {
    var
      name = '',
      html = '';
    if (this._uid == Runtime.getUserID() &&
        this._getBoolAttribute('use-you', true)) {
      if (this._reflexive) {
        if (this._possessive) {
          name = 'your own';
        } else {
          name = 'yourself';
        }
      } else {
        
        if (this._possessive) {
          name = 'your';
        } else {
          name = 'you';
        }
      }
    }
    else if (userInfo) {
      
      if (null === userInfo.first_name) {
        userInfo.first_name = '';
      }
      if (null === userInfo.last_name) {
        userInfo.last_name = '';
      }
      // Structures that don't exist will return undefined
      
      
      
      if (this._firstnameonly && userInfo.first_name !== (void 0)) {
        name = escapeHTML(userInfo.first_name);
      } else if (this._lastnameonly && userInfo.last_name !== (void 0)) {
        name = escapeHTML(userInfo.last_name);
      }

      if (!name) {
        name = escapeHTML(userInfo.name);
      }

      if (name !== '' && this._possessive) {
        name += '\'s';
      }
    }

    if (!name) {
      name = escapeHTML(
        this.getAttribute('if-cant-see', 'Facebook User'));
    }
    if (name) {
      if (this._getBoolAttribute('capitalize', false)) {
        name = Helper.upperCaseFirstChar(name);
      }
      if (userInfo && this._linked) {
        html = Helper.getProfileLink(userInfo, name,
          this.getAttribute('href', null));
      } else {
        html = name;
      }
    }
    this.dom.innerHTML = html;
  }, {"params":[[userInfo, 'object', 'userInfo']]});}, {"module":"sdk.XFBML.Name","line":200,"column":16}, {"params":["object"]})
});

module.exports = Name;


}, {"module":"sdk.XFBML.Name","line":7,"column":113}),null);


__d("sdk.XFBML.Registration",["sdk.Auth","sdk.Helper","sdk.XFBML.IframeWidget","sdk.Runtime","UrlMap"],__annotator(function(global,require,requireDynamic,requireLazy,module,exports,Auth,Helper,IframeWidget,Runtime,UrlMap) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   

var Registration = IframeWidget.extend({
  _visibleAfter: 'immediate',

  
  
  
  _baseHeight: 167,
  
  _fieldHeight: 28,

  
  _skinnyWidth: 520,
  
  
  _skinnyBaseHeight: 173,
  
  _skinnyFieldHeight: 52,

  
  setupAndValidate: __annotator(function() /*boolean*/ {return __bodyWrapper(this, arguments, function() {
    this._attr = {
      action       : this.getAttribute('action'),
      border_color : this.getAttribute('border-color'),
      channel_url  : this.getChannelUrl(),
      client_id    : Runtime.getClientID(),
      fb_only      : this._getBoolAttribute('fb-only', false),
      fb_register  : this._getBoolAttribute('fb-register', false),
      fields       : this.getAttribute('fields'),
      height       : this._getPxAttribute('height'),
      redirect_uri : this.getAttribute('redirect-uri', window.location.href),
      no_footer    : this._getBoolAttribute('no-footer'),
      no_header    : this._getBoolAttribute('no-header'),
      onvalidate   : this.getAttribute('onvalidate'),
      width        : this._getPxAttribute('width', 600),
      target       : this.getAttribute('target')
    };
    
    

    if (this._attr.onvalidate) {
      this.subscribe('xd.validate', ES(__annotator(function(/*object*/ message) {return __bodyWrapper(this, arguments, function() {
        var value = ES('JSON', 'parse', false,message.value);
        var callback = ES(__annotator(function(errors) {
          this.arbiterInform('Registration.Validation',
                             { errors: errors, id: message.id });
        }, {"module":"sdk.XFBML.Registration","line":60,"column":23}), 'bind', true,this);

        
        var response = Helper.executeFunctionByName(this._attr.onvalidate,
                                                       value, callback);

        
        if (response) {
          callback(response);
        }
      }, {"params":[[message, 'object', 'message']]});}, {"module":"sdk.XFBML.Registration","line":58,"column":36}, {"params":["object"]}), 'bind', true,this));
    }

    this.subscribe('xd.authLogin', ES(this._onAuthLogin, 'bind', true,this));
    this.subscribe('xd.authLogout', ES(this._onAuthLogout, 'bind', true,this));

    return true;
  }, {"returns":'boolean'});}, {"module":"sdk.XFBML.Registration","line":37,"column":20}, {"returns":"boolean"}),

  
  getSize: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    return { width: this._attr.width, height: this._getHeight() };
  }, {"returns":'object'});}, {"module":"sdk.XFBML.Registration","line":87,"column":11}, {"returns":"object"}),

  _getHeight: __annotator(function() /*number*/ {return __bodyWrapper(this, arguments, function() {
    if (this._attr.height) {
      return this._attr.height;
    }
    var fields;
    if (!this._attr.fields) {
      
      fields = ['name'];
    } else {
      try {
        
        fields = ES('JSON', 'parse', false,this._attr.fields);
      } catch (e) {
        
        fields = this._attr.fields.split(/,/);
      }
    }

    if (this._attr.width < this._skinnyWidth) {
      return this._skinnyBaseHeight + fields.length * this._skinnyFieldHeight;
    } else {
      return this._baseHeight + fields.length * this._fieldHeight;
    }
  }, {"returns":'number'});}, {"module":"sdk.XFBML.Registration","line":91,"column":14}, {"returns":"number"}),

  
  getUrlBits: __annotator(function() /*object*/ {return __bodyWrapper(this, arguments, function() {
    return { name: 'registration', params: this._attr };
  }, {"returns":'object'});}, {"module":"sdk.XFBML.Registration","line":121,"column":14}, {"returns":"object"}),

  
  getDefaultWebDomain: __annotator(function() /*string*/ {return __bodyWrapper(this, arguments, function() {
    return UrlMap.resolve('www', true);
  }, {"returns":'string'});}, {"module":"sdk.XFBML.Registration","line":137,"column":23}, {"returns":"string"}),

  
  _onAuthLogin: __annotator(function() {
    if (!Auth.getAuthResponse()) {
      Auth.getLoginStatus();
    }
    Helper.fireEvent('auth.login', this);
  }, {"module":"sdk.XFBML.Registration","line":144,"column":16}),

  
  _onAuthLogout: __annotator(function() {
    if (!Auth.getAuthResponse()) {
      Auth.getLoginStatus();
    }
    Helper.fireEvent('auth.logout', this);
  }, {"module":"sdk.XFBML.Registration","line":154,"column":17})

});

module.exports = Registration;


}, {"module":"sdk.XFBML.Registration","line":9,"column":103}),null);


__d("legacy:fb.xfbml",["Assert","sdk.Event","FB","IframePlugin","PluginConfig","PluginTags","XFBML","sdk.domReady","sdk.feature","wrapFunction","sdk.XFBML.Comments","sdk.XFBML.CommentsCount","sdk.XFBML.LoginButton","sdk.XFBML.Name","sdk.XFBML.Registration"],__annotator(function(global,require,requireDynamic,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports,Assert,Event,FB,IframePlugin,PluginConfig,PluginTags,XFBML,domReady,feature,wrapFunction) {require.__markCompiled && require.__markCompiled();
   
   
   
   
   
   
   

   
   
   

var customTags = {
  comments: require('sdk.XFBML.Comments'),
  comments_count: require('sdk.XFBML.CommentsCount'),
  login_button: require('sdk.XFBML.LoginButton'),
  name: require('sdk.XFBML.Name'),
  registration: require('sdk.XFBML.Registration')
};

var blacklist = feature('plugin_tags_blacklist', []);


ES(ES('Object', 'keys', false,PluginTags), 'forEach', true,__annotator(function(tag) {
  if (ES(blacklist, 'indexOf', true,tag) !== -1) {
    return;
  }
  XFBML.registerTag({
    xmlns: 'fb',
    localName: tag.replace(/_/g, '-'),
    ctor: IframePlugin.withParams(PluginTags[tag], PluginConfig[tag])
  });
}, {"module":"fb.xfbml","line":30,"column":32}));


ES(ES('Object', 'keys', false,customTags), 'forEach', true,__annotator(function(tag) {
  if (ES(blacklist, 'indexOf', true,tag) !== -1) {
    return;
  }
  XFBML.registerTag({
    xmlns: 'fb',
    localName: tag.replace(/_/g, '-'),
    ctor: customTags[tag]
  });
}, {"module":"fb.xfbml","line":42,"column":32}));

FB.provide('XFBML', {
  parse: __annotator(function(dom) {
    Assert.maybeXfbml(dom, 'Invalid argument');

    
    if (dom && dom.nodeType === 9) {
      dom = dom.body;
    }
    return XFBML.parse.apply(null, arguments);
  }, {"module":"fb.xfbml","line":54,"column":9})
});

XFBML.subscribe('parse', ES(Event.fire, 'bind', true,Event, 'xfbml.parse'));
XFBML.subscribe('render', ES(Event.fire, 'bind', true,Event, 'xfbml.render'));

Event.subscribe('init:post', __annotator(function(options) {
  if (options.xfbml) {
    
    setTimeout(
      wrapFunction(
        ES(domReady, 'bind', true,null, XFBML.parse),
        'entry',
        'init:post:xfbml.parse'
      ),
      0
    );
  }
}, {"module":"fb.xfbml","line":68,"column":29}));

Assert.define('Xfbml', __annotator(function(element) {
  return (element.nodeType === 1 || element.nodeType === 9) &&
         typeof element.nodeName === 'string';
}, {"module":"fb.xfbml","line":82,"column":23}));




try {
  if (document.namespaces && !document.namespaces.item.fb) {
     document.namespaces.add('fb');
  }
} catch(e) {
  // introspection doesn't yield any identifiable information to scope
}


}, {"module":"fb.xfbml","line":6,"column":258}),3);




}).call({}, window.inDapIF ? parent.window : window);
} catch (e) {new Image().src="http:\/\/www.facebook.com\/" + 'common/scribe_endpoint.php?c=jssdk_error&m='+encodeURIComponent('{"error":"LOAD", "extra": {"name":"'+e.name+'","line":"'+(e.lineNumber||e.line)+'","script":"'+(e.fileName||e.sourceURL||e.script)+'","stack":"'+(e.stackTrace||e.stack)+'","revision":"1666213","message":"'+e.message+'"}}');}