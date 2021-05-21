# markdown-it-myst
[![markdown-it-myst on npm](https://img.shields.io/npm/v/markdown-it-myst.svg)](https://www.npmjs.com/package/markdown-it-myst)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/executablebooks/markdown-it-myst/blob/master/LICENSE)
[![CI](https://github.com/executablebooks/markdown-it-myst/workflows/CI/badge.svg)](https://github.com/executablebooks/markdown-it-myst/actions)
[![docs](https://github.com/executablebooks/markdown-it-myst/workflows/docs/badge.svg)](https://executablebooks.github.io/markdown-it-myst)
[![demo](https://img.shields.io/badge/live-demo-blue)](https://executablebooks.github.io/markdown-it-myst/demo/index.html)

> :warning: **Note:** `markdown-it-myst` is alpha, expect changes! (January, 2021)

A javascript parser for [MyST](https://myst-parser.readthedocs.io) based on [markdown-it](https://github.com/markdown-it/markdown-it)

## Goals
* Provide a Javascript implementation of [MyST](https://myst-parser.readthedocs.io) markdown extensions
  * Uses standard html for all known roles and directives, with no styling enforced or provided
* Provide functionality for cross-referencing that is usually completed by Sphinx (e.g. in the [Python implementation](https://github.com/executablebooks/MyST-Parser))

## Usage

```bash
npm install markdown-it-myst
```

In a node environment:
```javascript
import { MyST } from 'markdown-it-myst';

const myst = MyST();
const html = myst.render('# Hello to the world!');

console.log(html);
>> "<h1>Hello to the world!</h1>"
```

In a browser:
```html
<html>
<head>
  <script src="https://unpkg.com/markdown-it-myst"></script>
</head>
<body onload="init();">
  <div id="output"></div>
  <script>
    function init() {
      const myst = MyST();
      const html = myst.render('# Hello to the world!');
      document.getElementById('output').innerHTML = html;
    }
  </script>
</body>
</html>
```

## Developer Install

For installing the package locally, we suggest [Yarn](https://yarnpkg.com/), which can be installed using these [instructions](https://yarnpkg.com/getting-started/install), you will need [node](https://nodejs.org/), both can use a global install on your system.

Once you have `yarn` installed globally, navigate into this project folder and install the dependencies:

```bash
cd markdown-it-myst
yarn install
yarn start  # Start a development server to play with the library! 🚀
```

The scripts for building, testing, and serving the project are in the [package.json](package.json), the main ones to use are
`yarn test`, `yarn build`, and `yarn start`.

### `yarn build`
Builds the library, including compiling the typescript and bundling/minification to create `myst.min.js`.
This outputs to the `dist` folder, and also includes all type definitions (`*.d.ts`).

### `yarn test`
Run the tests, these are mostly based on the [fixtures](fixtures) folder. You can also use `yarn test:watch` to run on any file changes.

### `yarn start`
Starts a server for manually testing and playing with `markdown-it-myst`, this uses a in-memory bundle of what would go in the `dist` folder.
Note that this does not actually build the library!
