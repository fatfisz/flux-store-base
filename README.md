# flux-store-base

> Yet another store utility for flux.

## Getting Started

Install the package with this command:
```shell
npm install flux-store-base --save
```

Then you can require the package with `require('flux-store-base')`. Once you do that, you get two functions:

### FluxStoreBase.Store

`Store(dispatcher, actionTypes, config)` constructor configures the store using the provided [flux](https://github.com/facebook/flux) dispatcher, an object `actionTypes`, in which keys are equal to the values (use [keyMirror](https://github.com/STRML/keyMirror) for that) and designate the action names used with the dispatcher, and `config`, which is an object whose methods and properties will be assigned to the resulting store.
There are also some things going under the hood, but more about that below (see: Features).

### FluxStoreBase.inject

`inject(dispatcher, actionTypes)` returns a constructor which can be used to create stores without passing `dispatcher` and `actionTypes` every time. The resulting function has only one argument - `config`.

## Example

Action Types:
```js
var keyMirror = require('keymirror');

module.exports = keyMirror({
  SOME_ACTION: null,
});
```

Action creator:
```js
function createSomeAction(someData) {
  AppDispatcher.dispatch({
    type: ActionTypes.SOME_ACTION,
    someData,
  });
}
```

Store:
```js
var fluxStoreBase = require('flux-store-base');

var { ActionTypes } = require('../constants');
var AppDispatcher = require('../dispatcher');

var Store = fluxStoreBase.inject(AppDispatcher, ActionTypes);

var MyFunkyStore = new Store({

  events: ['theChange'],

  getSomething() {
    return this.something;
  },

  onSomeAction({ someData }) {
    this.something = someData;
    this.emitTheChange();
  },

});

```

Component:
```js
var React = require('react');

var MyFunkyStore = require('./path-to-my-funky-store');

var MyFunkyComponent = React.createClass({

  componentWillMount() {
    MyFunkyStore.addTheChangeListener(this.doSomething);
  },

  componentWillUnmount() {
    MyFunkyStore.removeTheChangeListener(this.doSomething);
  },

  doSomething() {
    // Set state or whatever. You know what to do.
  },

});
```

## Features

### Actions

Each method in the `config` which starts with "on" and a capital letter, e. g. "onSomeAction" will be treated as an action handler.
That means:

* An action name will be derived from the name of the method
  (for "onSomeAction" the result will be "SOME_ACTION").
  The action name will be then checked for presence in `actionTypes` when in development mode
  (`process.env.NODE_ENV !== 'production'`) and if not present, an error will be raised.
* The method will be fired with one argument passed: `action`,
  the same one that will be passed to the callback passed to `dispatcher.register`.
* If any action handlers are detected, the store will be registered in the dispatcher and
  a `dispatchToken` property containing the token returned from `dispatch.register` will be added to the resulting store.

### Events

There are two properties on `config` that can be used to configure events to which components can subscribe: `events` and `maxListeners`.
`events` is expected to be an array of strings (but can be left undefined).

Each of those strings is then used to construct three methods for the resulting store: emitter, subscriber and unsubscriber.
For event name `'theChange'` we will get emitter `emitTheChange`, subscriber `addTheChangeListener` and
unsubscriber `removeTheChangeListener`.
As you can see, the name of the event is capitalized and incorporated into the new methods' names.

The emitter has no arguments - you should retrieve the data only from the store.

Subscriber and unsubscriber have one argument - event handler.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.

## License
Copyright (c) 2015 FatFisz. Licensed under the MIT license.
