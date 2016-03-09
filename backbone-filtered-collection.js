(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("_"), require("Backbone"));
	else if(typeof define === 'function' && define.amd)
		define(["_", "Backbone"], factory);
	else if(typeof exports === 'object')
		exports["FilteredCollection"] = factory(require("_"), require("Backbone"));
	else
		root["FilteredCollection"] = factory(root["_"], root["Backbone"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(1);
	var Backbone = __webpack_require__(2);
	var proxyCollection = __webpack_require__(3);
	var backboneQuery = __webpack_require__(4);
	var Parser = __webpack_require__(5);
	var parse = new Parser();

	// Beware of `this`
	// All of the following functions are meant to be called in the context
	// of the FilteredCollection object, but are not public functions.

	function invalidateCache() {
	  this._filterResultCache = {};
	}

	function invalidateCacheForFilter(filterName) {
	  for (var cid in this._filterResultCache) {
	    if (this._filterResultCache.hasOwnProperty(cid)) {
	      delete this._filterResultCache[cid][filterName];
	    }
	  }
	}

	function addFilter(filterName, filterObj) {
	  // If we've already had a filter of this name, we need to invalidate
	  // any and all of the cached results
	  if (this._filters[filterName]) {
	    invalidateCacheForFilter.call(this, filterName);
	  }

	  this._filters[filterName] = filterObj;
	  this.trigger('filtered:add', filterName);
	}

	function removeFilter(filterName) {
	  delete this._filters[filterName];
	  invalidateCacheForFilter.call(this, filterName);
	  this.trigger('filtered:remove', filterName);
	}

	function execFilterOnModel(model) {
	  if (!this._filterResultCache[model.cid]) {
	    this._filterResultCache[model.cid] = {};
	  }

	  var cache = this._filterResultCache[model.cid];

	  for (var filterName in this._filters) {
	    if (this._filters.hasOwnProperty(filterName)) {
	      // if we haven't already calculated this, calculate it and cache
	      if (!cache.hasOwnProperty(filterName)) {
	        cache[filterName] = this._filters[filterName].fn(model, this._filters[filterName].tokens);
	      }
	      if (!cache[filterName]) {
	        return false;
	      }
	    }
	  }
	  return true;
	}

	function execFilter() {
	  var filtered = [];

	  // Filter the collection
	  if (this._superset) {
	    filtered = this._superset.filter(_.bind(execFilterOnModel, this));
	  }

	  this._collection.reset(filtered);
	  this.length = this._collection.length;
	}

	function onAddChange(model) {
	  // reset the cached results
	  this._filterResultCache[model.cid] = {};

	  if (execFilterOnModel.call(this, model)) {
	    if (!this._collection.get(model.cid)) {
	      var index = this.superset().indexOf(model);

	      // Find the index at which to insert the model in the
	      // filtered collection by finding the index of the
	      // previous non-filtered model in the filtered collection
	      var filteredIndex = null;
	      for (var i = index - 1; i >= 0; i -= 1) {
	        if (this.contains(this.superset().at(i))) {
	          filteredIndex = this.indexOf(this.superset().at(i)) + 1;
	          break;
	        }
	      }
	      filteredIndex = filteredIndex || 0;

	      this._collection.add(model, { at: filteredIndex });
	    }
	  } else {
	    if (this._collection.get(model.cid)) {
	      this._collection.remove(model);
	    }
	  }
	  this.length = this._collection.length;
	}

	// This fires on 'change:[attribute]' events. We only want to
	// remove this model if it fails the test, but not add it if
	// it does. If we remove it, it will prevent the 'change'
	// events from being forwarded, and if we add it, it will cause
	// an unneccesary 'change' event to be forwarded without the
	// 'change:[attribute]' that goes along with it.
	function onModelAttributeChange(model) {
	  // reset the cached results
	  this._filterResultCache[model.cid] = {};

	  if (!execFilterOnModel.call(this, model)) {
	    if (this._collection.get(model.cid)) {
	      this._collection.remove(model);
	    }
	  }
	}

	function onAll(eventName, model, value) {
	  if (eventName.slice(0, 7) === "change:") {
	    onModelAttributeChange.call(this, arguments[1]);
	  }
	}

	function onModelRemove(model) {
	  if (this.contains(model)) {
	    this._collection.remove(model);
	  }
	  this.length = this._collection.length;
	}

	function Filtered(superset) {
	  // Save a reference to the original collection
	  this._superset = superset;

	  // The idea is to keep an internal backbone collection with the filtered
	  // set, and expose limited functionality.
	  this._collection = new Backbone.Collection(superset.toArray());
	  proxyCollection(this._collection, this);

	  // Set up the filter data structures
	  this.resetFilters();

	  this.listenTo(this._superset, 'reset sort', execFilter);
	  this.listenTo(this._superset, 'add change', onAddChange);
	  this.listenTo(this._superset, 'remove', onModelRemove);
	  this.listenTo(this._superset, 'all', onAll);
	}

	var methods = {

	  defaultFilterName: '__default',

	  filterBy: function(filterName, filter) {
	    var filterObj;

	    // Allow the user to skip the filter name if they're only using one filter
	    if (!filter) {
	      filter = filterName;
	      filterName = this.defaultFilterName;
	    }

	    if (_.isFunction(filter)){
	      filterObj = { fn: filter };
	    } else {
	      filterObj = {
	        fn: backboneQuery,
	        tokens: this.parseFilter(filter)
	      }
	    }

	    addFilter.call(this, filterName, filterObj);

	    execFilter.call(this);
	    return this;
	  },

	  parseFilter: function(filter){
	    if (_.isArray(filter)) {
	      return filter;
	    }
	    if (_.isString(filter)) {
	      return parse(filter);
	    }
	    if (_.isObject(filter)) {
	      return _.reduce(filter, function(result, value, key){
	        result.push({
	          type: 'prefix',
	          prefix: key,
	          query: value
	        });
	        return result;
	      }, []);
	    }
	  },

	  removeFilter: function(filterName) {
	    if (!filterName) {
	      filterName = this.defaultFilterName;
	    }

	    removeFilter.call(this, filterName);

	    execFilter.call(this);
	    return this;
	  },

	  resetFilters: function() {
	    this._filters = {};
	    invalidateCache.call(this);

	    this.trigger('filtered:reset');

	    execFilter.call(this);
	    return this;
	  },

	  superset: function() {
	    return this._superset;
	  },

	  refilter: function(arg) {
	    if (typeof arg === "object" && arg.cid) {
	      // is backbone model, refilter that one
	      onAddChange.call(this, arg);
	    } else {
	      // refilter everything
	      invalidateCache.call(this);
	      execFilter.call(this);
	    }

	    return this;
	  },

	  getFilters: function() {
	    return  _.keys(this._filters);
	  },

	  hasFilter: function(name) {
	    return _.contains(this.getFilters(), name);
	  },

	  destroy: function() {
	    this.stopListening();
	    this._collection.reset([]);
	    this._superset = this._collection;
	    this.length = 0;

	    this.trigger('filtered:destroy');
	  }

	};

	// Build up the prototype
	_.extend(Filtered.prototype, methods, Backbone.Events);

	module.exports = Filtered;



/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	
	var _ = __webpack_require__(1);
	var Backbone = __webpack_require__(2);

	// Methods in the collection prototype that we won't expose
	var blacklistedMethods = [
	  "_onModelEvent", "_prepareModel", "_removeReference", "_reset", "add",
	  "initialize", "sync", "remove", "reset", "set", "push", "pop", "unshift",
	  "shift", "sort", "parse", "fetch", "create", "model", "off", "on",
	  "listenTo", "listenToOnce", "bind", "trigger", "once", "stopListening"
	];

	var eventWhiteList = [
	  'add', 'remove', 'reset', 'sort', 'destroy', 'sync', 'request', 'error'
	];

	function proxyCollection(from, target) {

	  function updateLength() {
	    target.length = from.length;
	  }

	  function pipeEvents(eventName) {
	    var args = _.toArray(arguments);
	    var isChangeEvent = eventName === 'change' ||
	                        eventName.slice(0, 7) === 'change:';

	    // In the case of a `reset` event, the Collection.models reference
	    // is updated to a new array, so we need to update our reference.
	    if (eventName === 'reset') {
	      target.models = from.models;
	    }

	    if (_.contains(eventWhiteList, eventName)) {
	      if (_.contains(['add', 'remove', 'destroy'], eventName)) {
	        args[2] = target;
	      } else if (_.contains(['reset', 'sort'], eventName)) {
	        args[1] = target;
	      }
	      target.trigger.apply(this, args);
	    } else if (isChangeEvent) {
	      // In some cases I was seeing change events fired after the model
	      // had already been removed from the collection.
	      if (target.contains(args[1])) {
	        target.trigger.apply(this, args);
	      }
	    }
	  }

	  var methods = {};

	  _.each(_.functions(Backbone.Collection.prototype), function(method) {
	    if (!_.contains(blacklistedMethods, method)) {
	      methods[method] = function() {
	        return from[method].apply(from, arguments);
	      };
	    }
	  });

	  _.extend(target, Backbone.Events, methods);

	  target.listenTo(from, 'all', updateLength);
	  target.listenTo(from, 'all', pipeEvents);
	  target.models = from.models;

	  updateLength();
	  return target;
	}

	module.exports = proxyCollection;



/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(1);

	function toType(obj) {
	  return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
	}

	/**
	 * Helper methods for matching tokens
	 */
	var methods = {

	  /**
	   * Token type `string`
	   * @return {Boolean}
	   */
	  string: function(token, model){
	    token = token || {};
	    if(!_.isString(token.query)){ return false; }

	    var attributes = _.chain(model.fields || ['title'])
	      .map(function(key){
	        return model.get(key); // allows nested get
	      })
	      .compact()
	      .value();

	    var self = this;
	    return _.some( attributes, function( attribute ) {
	      return self._partialString(attribute, token.query.toLowerCase());
	    });
	  },

	  /**
	   * Token type `prefix`
	   * @return {Boolean}
	   */
	  prefix: function(token, model){
	    token = token || {};
	    if(_.isFunction(token.query)){
	      return token.query(model.get(token.prefix));
	    }

	    if(!_.isString(token.query)){
	      token.query = token.query.toString();
	    }

	    var attr = model.get(token.prefix),
	        type = toType(attr);

	    // _boolean, _array etc
	    if(this.hasOwnProperty('_' + type)){
	      return this['_' + type](attr, token.query.toLowerCase());
	    }
	  },

	  /**
	   * Token type `or`
	   * @return {Boolean}
	   */
	  or: function(token, model){
	    var self = this;
	    return _.some(token.queries, function(t){
	      return self[t.type](t, model);
	    });
	  },

	  _string: function(str, value){
	    return str.toLowerCase() === value;
	  },

	  _partialString: function(str, value){
	    return str.toLowerCase().indexOf( value ) !== -1;
	  },

	  _number: function(number, value){
	    return number.toString() === value;
	  },

	  _partialNumber: function(number, value){
	    return number.toString().indexOf( value ) !== -1;
	  },

	  _boolean: function(bool, value){
	    if(value === 'true'){
	      return bool === true;
	    } else if (value === 'false'){
	      return bool === false;
	    }
	    return false;
	  },

	  _array: function(arr, value){
	    return _.some(arr, function(elem){
	      return elem.toLowerCase() === value;
	    });
	  }

	};

	module.exports = function(model, filterArray){
	  // match tokens
	  // todo: all = AND, any = OR
	  return _.every(filterArray, function(filter){
	    return methods[filter.type](filter, model);
	  });
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/* jshint -W071, -W074 */
	var _ = __webpack_require__(1);

	/**
	 *
	 * @param options
	 * @constructor
	 */
	function Parser(options){
	  this.options = options || {};
	  if (!this.options.instance) {
	    return this.parse.bind(this);
	  }
	}

	/**
	 * Regex for special characters
	 */
	var regex = {
	  QUOTES      : /['"`]/,       // quotes
	  SPACES      : /[ \t\r\n]/,   // spaces
	  FLAGS       : /[~\+#!\*\/]/, // flags
	  SCREEN      : /[\\]/,        // screen
	  GROUP_OPEN  : /\(/,          // group openers
	  GROUP_CLOSE : /\)/,          // group endings
	  OR          : /\|/,          // logical OR
	  PREFIX      : /:/,           // divider between prefix and value
	  RANGE       : /-/,           // divider between values in range
	  OR_OPEN     : /\[/,          // OR group openers
	  OR_CLOSE    : /]/            // OR group endings
	};

	/**
	 * Returns first regex match for given character
	 * note: order is important!
	 * @param character
	 */
	function matchRegex(character){
	  var match;

	  _.some([
	    'SCREEN',
	    'OR_OPEN',
	    'OR_CLOSE',
	    'GROUP_OPEN',
	    'GROUP_CLOSE',
	    'OR',
	    'PREFIX',
	    'RANGE',
	    'SPACES',
	    'QUOTES',
	    'FLAGS'
	  ], function(key){
	    if(regex[key].test(character)){
	      match = key;
	      return true;
	    } else {
	      match = undefined;
	      return false;
	    }
	  });

	  return match;
	}

	/**
	 *
	 */
	function logicalOr(parts){
	  var p2 = parts.pop(),
	      p1 = parts.pop();

	  parts.push({
	    type: 'or',
	    queries: [ p1, p2 ]
	  });
	}

	/**
	 *
	 * @param options
	 */
	function appendPart(opts){
	  var part = opts.part || {};

	  if(!opts.hasarg){ return; }

	  if (['range', 'prange'].indexOf(part.type) >= 0) {
	    if(opts.buffer && _.isNaN(parseFloat(opts.buffer))){
	      part = {};
	      part.type = 'string';
	      part.query = '-' + opts.buffer;
	    } else {
	      part.to = opts.buffer;
	    }
	  } else if (opts.buffer && opts.buffer.length) {
	    part.query = opts.buffer;
	  }

	  if (!part.type) {
	    part.type = part.prefix ? 'prefix' : 'string';
	  }

	  opts.parts.push(part);

	  if (opts.or_at_next_arg && (opts.or_at_next_arg + 1 === opts.parts.length)){
	    logicalOr(opts.parts);
	    opts.or_at_next_arg = 0;
	  }

	  opts.part = {};
	  opts.buffer = '';
	  opts.hasarg = false;

	}

	/**
	 *
	 * @param options
	 * @param quote
	 */
	function inQuote(opts, quote){
	  if(this._input.length === 0){
	    return;
	  }

	  opts.character = this._input.shift();

	  if (opts.character === quote) {
	    appendPart.call(this, opts);
	  } else {
	    opts.buffer += opts.character;
	    opts.hasarg = true;
	    inQuote.call(this, opts, quote);
	  }
	}

	/**
	 *
	 */
	var matches = {

	  screen: function(opts){
	    opts.screen = true;
	  },

	  or_open: function(opts){
	    if (opts.hasarg) {
	      opts.buffer += opts.character;
	    } else {
	      opts.part.type = 'or';
	      opts.part.queries = this.parse(this._input.join(''), true);
	      if (opts.part.queries && opts.part.queries.length) {
	        opts.hasarg = true;
	        appendPart.call(this, opts);
	      }
	    }
	  },

	  or_close: function(opts){
	    opts.close = true;
	  },

	  group_open: function(opts){
	    if (opts.hasarg) {
	      opts.buffer += opts.character;
	    } else {
	      opts.part.type = 'and';
	      opts.part.queries = this.parse(this._input.join(''), true);
	      if (opts.part.queries && opts.part.queries.length) {
	        opts.hasarg = true;
	        appendPart.call(this, opts);
	      }
	    }
	  },

	  group_close: function(opts){
	    if(opts.open){
	      opts.close = true;
	      opts.open = undefined;
	    } else {
	      opts.buffer += opts.character;
	    }
	  },

	  or: function(opts){
	    opts.or_at_next_arg = opts.parts.length;
	    if (opts.hasarg) {
	      opts.or_at_next_arg += 1;
	      appendPart.call(this, opts);
	    }
	  },

	  prefix: function(opts){
	    opts.part.prefix = opts.buffer;
	    opts.part.type = 'prefix';
	    opts.buffer = '';
	    opts.hasarg = true;
	  },

	  range: function(opts){
	    if(opts.buffer && _.isNaN(parseFloat(opts.buffer))){
	      opts.buffer += opts.character;
	      return;
	    }
	    if (opts.part.type && (opts.part.type === 'prefix')) {
	      opts.part.type = 'prange';
	    } else {
	      opts.part.type = 'range';
	    }
	    opts.part.from = opts.buffer;
	    opts.buffer = '';
	    opts.hasarg = true;
	  },

	  spaces: function(opts){
	    appendPart.call(this, opts);
	  },

	  quotes: function(opts){
	    if (opts.buffer.length) {
	      opts.buffer += opts.character;
	      opts.hasarg = true;
	    } else {
	      inQuote.call(this, opts, opts.character);
	    }
	  },

	  flags: function(opts){
	    if (!opts.buffer.length) {
	      if (!opts.part.flags) { opts.part.flags = []; }
	      opts.part.flags.push(opts.character);
	    } else {
	      opts.buffer += opts.character;
	    }
	  }
	};

	/**
	 *
	 * @param options
	 */
	function next(opts){
	  opts.character = this._input.shift();
	  var match = matchRegex.call(this, opts.character);
	  if(match && !opts.screen){
	    matches[match.toLowerCase()].call(this, opts);
	  } else {
	    opts.buffer += opts.character;
	    opts.hasarg = true;
	    opts.screen = false;
	  }
	  if(this._input.length > 0 && !opts.close){
	    next.call(this, opts);
	  } else {
	    opts.close = undefined;
	    return;
	  }
	}

	Parser.prototype.parse = function(input, open) {
	  var opts = {
	    parts   : [],
	    part    : {},
	    open    : open,
	    buffer  : '',
	    hasarg  : false
	  };

	  if (!input || !input.length || (typeof input !== 'string')) {
	    return opts.parts;
	  }

	  this._input = input.split('');
	  next.call(this, opts);
	  appendPart.call(this, opts);
	  return opts.parts;
	};

	module.exports = Parser;
	/* jshint +W071, +W074 */

/***/ }
/******/ ])
});
;