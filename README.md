# flux-store-base

> Yet another store utility for flux.

# Deprecation notice

flux-store-base is superseded by [floox](https://github.com/fatfisz/floox) which, apart form the shorter name, introduces a few new boilerplate reductions and a simple solution for circular dependency of stores.

It won't be maintained anymore.

## Getting Started

Install the package with this command:
```shell
npm install flux-store-base --save
```

Then you can require the package with `require('flux-store-base')`. Once you do that, you get two functions:

### FluxStoreBase.Store

`Store(dispatcher, config)` constructor configures the store using the provided [flux](https://github.com/facebook/flux) dispatcher and `config`, which is an object whose methods and properties will be assigned to the resulting store.
There are also some things going under the hood, but more about that below (see: Features).

### FluxStoreBase.inject

`inject(dispatcher)` returns a constructor which can be used to create stores without passing `dispatcher` every time. The resulting function has only one argument - `config`.

## Example

Action creator:
```js
function createSomeAction(someData) {
  AppDispatcher.dispatchSomeAction(someData);
}
```

Store:
```js
var Store = require('flux-store-base').Store;

var AppDispatcher = require('../dispatcher');


var MyFunkyStore = new Store(AppDispatcher, {

  displayName: 'MyFunkyStore',
  events: ['theChange'],

  getSomething() {
    return this.something;
  },

  onSomeAction(someData) {
    this.something = someData;
    this.emit('theChange');
  },

});

```

Component:
```js
var React = require('react');

var MyFunkyStore = require('./path-to-my-funky-store');


var MyFunkyComponent = React.createClass({

  componentDidMount() {
    MyFunkyStore.on('theChange', this.doSomething);
  },

  componentWillUnmount() {
    MyFunkyStore.off('theChange', this.doSomething);
  },

  doSomething() {
    // Set state or whatever. You know what to do.
  },

});
```

## Pro Tip: Inject the Dispatcher

Create a file (suggested name: `base.js`, contained in the store directory):
```js
var fluxStoreBase = require('flux-store-base');

var AppDispatcher = require('../dispatcher');


var Store = fluxStoreBase.inject(AppDispatcher);

module.exports = Store;
```

Now you can use the module like this, without requiring the dispatcher for each store:
```js
var Store = require('./base');


var MyFunkyStore = new Store({

  ...

});
```

## Features

### Display Name

The property `displayName` is used for errors. If it is absent, `displayName` will be `'anonymous'`.

### Actions

Each method in the `config` which starts with "on" and a capital letter, e. g. "onSomeAction" will be treated as an action handler.
That means:

* The dispatcher will have a new function added for dispatching (in this case "dispatchSomeAction"). The function will have one argument, which will be then passed to the matching "on-" action handlers as a sole argument.

### Dispatch Token

If any action handlers are detected ("on-" methods), the store will be registered in the dispatcher and will have a `dispatchToken` property added. It can be then used like this:

```js
AppDispatcher.waitFor([VeryFineStore.dispatchToken]);
```

### Events

There are two properties on `config` that can be used to configure events to which components can subscribe: `events` and `maxListeners`.
`events` is expected to be an array of strings (but can be left undefined).

Each of those strings is then used to construct three methods for the resulting store: emitter, subscriber and unsubscriber.
For event name `'theChange'` we will get emitter `emitTheChange`, subscriber `addTheChangeListener` and
unsubscriber `removeTheChangeListener`. As you can see, the name of the event is capitalized and incorporated into the new methods' names.

The emitter has no arguments - you should retrieve the data only from the store.
Subscriber and unsubscriber have one argument - event handler.

Also, methods `emit(event)`, `on(event, fn)` and `off(event, fn)` will be added to the store.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.

## License
Copyright (c) 2015 FatFisz. Licensed under the MIT license.
