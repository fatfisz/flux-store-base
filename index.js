'use strict';

var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');


/**
 * Events
 */

function getNameFromEvent(name) {
  return name.substring(0, 1).toUpperCase() + name.substring(1);
}

function registerEventsHandlers(store, config) {
  var events = config.events;
  var maxListeners = config.maxListeners;

  if (!Array.isArray(events) || !events.length) {
    return null;
  }

  var eventEmitter = new EventEmitter();
  if (maxListeners) {
    eventEmitter.setMaxListeners(maxListeners);
  }

  events.forEach(function (event) {
    var name = getNameFromEvent(event);

    store['emit' + name] = function () {
      eventEmitter.emit(event);
    };

    store['add' + name + 'Listener'] = function (fn) {
      eventEmitter.on(event, fn);
    };

    store['remove' + name + 'Listener'] = function (fn) {
      eventEmitter.removeListener(event, fn);
    };
  });
}

/**
 * Actions
 */

var VALID_ACTION_NAME = /^on[A-Z]/;
var NAME_PARTS_SELECTOR = /[A-Z][^A-Z]*/g;
function getActionFromName(name) {

  function mapPart(part) {
    return part.toUpperCase();
  }

  return name.match(NAME_PARTS_SELECTOR).map(mapPart).join('_');
}

function getActionMapping(actionTypes, config) {
  // It's better to create a new object only when it's needed.
  var mapping = null;
  var somethingAdded = false;

  Object.keys(config).forEach(function (methodName) {
    if (!VALID_ACTION_NAME.test(methodName)) {
      return;
    }

    var action = getActionFromName(methodName);

    if (process.env.NODE_ENV !== 'production' && !(action in actionTypes)) {
      throw new Error('Unknown action type: ' + action + ' (from method ' + methodName + ')');
    }

    if (!somethingAdded) {
      mapping = {};
      somethingAdded = true;
    }
    mapping[actionTypes[action]] = config[methodName];
  });

  return mapping;
}

function registerStoreInDispatcher(store, dispatcher, actionMapping) {
  store.dispatchToken = dispatcher.register(function (action) {
    var actionHandler = actionMapping[action.type];
    if (actionHandler) {
      actionHandler.call(store, action);
    }
  });
}

/**
 * Store
 */

function Store(dispatcher, actionTypes, config) {
  registerEventsHandlers(this, config);

  var actionMapping = getActionMapping(actionTypes, config);
  if (actionMapping) {
    registerStoreInDispatcher(this, dispatcher, actionMapping);
  }

  assign(this, config);
}

function inject(dispatcher, actionTypes) {
  return function (config) {
    return Store.call(this, dispatcher, actionTypes, config);
  };
}

module.exports.Store = Store;

module.exports.inject = inject;
