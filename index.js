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
  var displayName = config.displayName;

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

  store.emit = function (event) {
    if (process.env.NODE_ENV !== 'production' && events.indexOf(event) === -1) {
      throw new Error('Store ' + displayName + ' does not handle the event "' + event + '"');
    }

    eventEmitter.emit(event);
  };

  store.on = function (event, fn) {
    if (process.env.NODE_ENV !== 'production' && events.indexOf(event) === -1) {
      throw new Error('Store ' + displayName + ' does not handle the event "' + event + '"');
    }

    eventEmitter.on(event, fn);
  };

  store.off = function (event, fn) {
    if (process.env.NODE_ENV !== 'production' && events.indexOf(event) === -1) {
      throw new Error('Store ' + displayName + ' does not handle the event "' + event + '"');
    }

    eventEmitter.removeListener(event, fn);
  };
}

/**
 * Actions
 */

var VALID_ACTION_NAME = /^on[A-Z]/;
var NAME_PARTS_SELECTOR = /[A-Z][^A-Z]*/g;
function getActionTypeFromName(name) {

  function mapPart(part) {
    return part.toUpperCase();
  }

  return name.match(NAME_PARTS_SELECTOR).map(mapPart).join('_');
}

function getDispatcherMethodName(methodName) {
  // Substitute 'on' with 'dispatch'
  return 'dispatch' + methodName.substring(2);
}

function addDispatcherMethod(dispatcher, dispatcherMethodName, actionType) {
  dispatcher[dispatcherMethodName] = function (data) {
    dispatcher.dispatch({
      actionType: actionType,
      data: data,
    });
  };
}

function getActionMapping(dispatcher, config) {
  // It's better to create a new object only when it's needed.
  var mapping = null;
  var somethingAdded = false;

  Object.keys(config).forEach(function (methodName) {
    if (!VALID_ACTION_NAME.test(methodName)) {
      return;
    }

    var actionType = getActionTypeFromName(methodName);
    var dispatcherMethodName = getDispatcherMethodName(methodName);

    if (!dispatcher.hasOwnProperty(dispatcherMethodName)) {
      addDispatcherMethod(dispatcher, dispatcherMethodName, actionType);
    }

    if (!somethingAdded) {
      mapping = {};
      somethingAdded = true;
    }
    mapping[actionType] = config[methodName];
  });

  return mapping;
}

function registerStoreInDispatcher(store, dispatcher, actionMapping) {
  store.dispatchToken = dispatcher.register(function (action) {
    var actionHandler = actionMapping[action.actionType];
    if (actionHandler) {
      actionHandler.call(store, action.data);
    }
  });
}

/**
 * Store
 */

function Store(dispatcher, config) {
  if (!config.displayName) {
    config.displayName = 'anonymous';
  }

  registerEventsHandlers(this, config);

  var actionMapping = getActionMapping(dispatcher, config);
  if (actionMapping) {
    registerStoreInDispatcher(this, dispatcher, actionMapping);
  }

  assign(this, config);
}

function inject(dispatcher) {
  return function (config) {
    return Store.call(this, dispatcher, config);
  };
}

module.exports.Store = Store;

module.exports.inject = inject;
