# backbone-filtered-collection

[![Build Status](https://secure.travis-ci.org/jmorrell/backbone-filtered-collection.png?branch=master)](http://travis-ci.org/user/backbone-filtered-collection)

Create a filtered version of a backbone collection that stays in sync.

```javascript

var superset = new Backbone.Collection(/* ... */);
var filtered = new FilteredCollection(superset);

// Filtered will now contain only models where model.get('foo') === "bar"
filtered.filterBy({ foo: "bar" });

// A new model to the superset will automatically show up in the filtered
// collection, firing an "add" event
superset.add({ foo: "bar", baz: "qux" });
```

## Usage with Bower

Install with [Bower](http://bower.io):

```
bower install backbone-filtered-collection
```

The component can be used as a Common JS module, an AMD module, or a global.

## Usage with Browserify

Install with npm, use with [Browserify](http://browserify.org/)

```
> npm install backbone-filtered-collection
```

and in your code

```javascript
var FilteredCollection = require('backbone-filtered-collection');
```

## Usage as browser global

You can include `backbone-filtered-collection.js` directly in a script tag. Make 
sure that it is loaded after underscore and backbone. It's exported as `FilteredCollection`
on the global object.

```HTML
<script src="underscore.js"></script>
<script src="backbone.js"></script>
<script src="backbone-filtered-collection.js"></script>
```

## API

### backbone-filtered-collection()


## Testing

Install [Node](http://nodejs.org) (comes with npm) and Bower.

From the repo root, install the project's development dependencies:

```
npm install
bower install
```

Testing relies on the Karma test-runner. If you'd like to use Karma to
automatically watch and re-run the test file during development, it's easiest
to globally install Karma and run it from the CLI.

```
npm install -g karma
karma start
```

To run the tests in Firefox, just once, as CI would:

```
npm test
```


## Browser support

* Google Chrome (latest)
* Opera (latest)
* Firefox 4+
* Safari 5+
* Internet Explorer 8+
