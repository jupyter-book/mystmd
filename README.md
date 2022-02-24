# mystjs

[![mystjs on npm](https://img.shields.io/npm/v/mystjs.svg)](https://www.npmjs.com/package/mystjs)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/executablebooks/mystjs/blob/master/LICENSE)
[![CI](https://github.com/executablebooks/mystjs/workflows/CI/badge.svg)](https://github.com/executablebooks/mystjs/actions)
[![docs](https://github.com/executablebooks/mystjs/workflows/docs/badge.svg)](https://executablebooks.github.io/mystjs)
[![demo](https://img.shields.io/badge/live-demo-blue)](https://executablebooks.github.io/mystjs/demo/index.html)

> :warning: **Note:** `mystjs` is alpha, expect changes! (January, 2021)

A javascript parser for [MyST](https://myst-parser.readthedocs.io) based on [markdown-it](https://github.com/markdown-it/markdown-it)

## Goals

- Provide a Javascript implementation of [MyST](https://myst-parser.readthedocs.io) markdown extensions
  - Uses standard html for all known roles and directives, with no styling enforced or provided
- Provide functionality for cross-referencing that is usually completed by Sphinx (e.g. in the [Python implementation](https://github.com/executablebooks/MyST-Parser))

## Usage

```bash
npm install mystjs
```

In a node environment:

```javascript
import { MyST } from 'mystjs';

const myst = MyST();
const html = myst.render('# Hello to the world!');

console.log(html);
>> "<h1>Hello to the world!</h1>"
```

In a browser:

```html
<html>
  <head>
    <script src="https://unpkg.com/mystjs"></script>
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

## `mystjs` Features

- CommonMark
- Admonitions
- Figures
- Images
- Math
  - role
  - directive (equations)
  - dollar
  - amsmath
- Tables
  - GFM
  - List Tables
- References
  - ref
  - numref
  - eq
  - links
  - Including numbering (single document)
- Citations (parse only)
- Code Directives
  - Code
  - Code blocks
  - Code cell
- Blocks
- Comments
- Targets
- HTML: sub, sup, abbr
- Definition List
- Footnotes

Not yet complete:

- div
- proof
- margin
- sidebar
- colon fence
- Bibliography
- Epigraph
- Glosary
- Terms
- Tabs
- Panels
- CSV Tables
- Multi-document

## Developer Install

For installing the package locally, you will need [node](https://nodejs.org/) and [npm](https://docs.npmjs.com/about-npm), both can use a global install on your system.

Once you have `npm` installed globally, navigate into this project folder and install the dependencies:

```bash
cd mystjs
npm install
npm run start  # Start a development server to play with the library! 🚀
```

The scripts for building, testing, and serving the project are in the [package.json](package.json), the main ones to use are
`npm run test`, `npm run build`, and `npm run start`.

### `npm run build`

Builds the library, including compiling the typescript and bundling/minification to create `index.umd.min.js`.
This outputs to the `dist` folder, and also includes all type definitions (`*.d.ts`).

### `npm run test`

Run the tests, these are mostly based on the [fixtures](fixtures) folder. You can also use `npm run test:watch` to run on any file changes.

### `npm run start`

Starts a server for manually testing and playing with `mystjs`, this uses a in-memory bundle of what would go in the `dist` folder.
Note that this does not actually build the library!
