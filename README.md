# alphaville-express

Wrapper around express, with default setup for Alphaville 2 projects. It includes default middlewares, templating setup with handlebars, default layout and template variables for templates, routes for assets (in-project and bower) with support for fingerprints and caching.


## How to use it

Install it using npm:

```
npm install Financial-Times/alphaville-express
```

### JS

In your main file, require it and call the default function with the appropriate parameters:

```js
const alphavilleExpress = require('alphaville-express');
const fingerprint = require('./build_config/js/fingerprint');

const app = alphavilleExpress({
    directory: __dirname,
    appBasePath: 'longroom',
    navSelected: 'Longroom',
    fingerprint: fingerprint
});
```


#### Configuration

 - directory: directory of the project, usually `__dirname`.
 - appBasePath: which one is the base path of the application. Usually `/`, but if you have everything under a `/path/`, then you should pass `path`
 - navSelected: name of the item in the nav that should be selected as active
 - fingerprint: hash of fingerprint


### Template

The templating engine is `handlebars` (https://github.com/ericf/express-handlebars).

The default layout includes CTM logic (exposing a JavaScript function `ctmLoadScript`), polyfill service, header and footer, and exposes a block named `head`.

By calling res.render, the template will be used.
The defaults can be overriden, for more information see: https://github.com/ericf/express-handlebars#renderviewviewpath-optionscallback-callback

Templates should be named with the file extension: `.handlebars`

#### CTM

In order to load a script uses the `ctmLoadScript`, do the following:

```js
ctmLoadScript({
    src: "http://...",
    async: true
}, function (err) {
    if (err) {
        //error
        return;
    }

    //success
});
```

#### Template blocks

In order to populate a block, do the following:

```mustache
{{#contentFor "blockName"}}
    html code
{{/contentFor}}
```

