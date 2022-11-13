# mystjs

MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown. The main use case driving the development and design of MyST is [JupyterBook](https://jupyterbook.org/), which helps you create educational online textbooks and tutorials with Jupyter Notebooks and narrative content written in MyST. `mystjs` is a javascript parser for MyST markdown that brings these capabilities into a web-native environment.

## Goals

- Provide a Javascript implementation of MyST markdown
- Parse MyST into a standardized AST, based on [mdast](https://github.com/syntax-tree/mdast).
- Serialize `mdast` into a default HTML for all known roles and directives
- Expose an opinionated set of `markdown-it` plugins, to be used in ecosystems that require `markdown-it` (e.g. vscode)
- Expose extension points in MyST for new roles/directives
- Provide functionality for cross-referencing that is usually completed by Sphinx (e.g. in the [Python implementation](https://github.com/executablebooks/MyST-Parser))

## Usage

```bash
npm install mystjs
```

In a node environment:

```javascript
import { MyST } from 'mystjs';

const myst = new MyST();
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
        const myst = new mystjs.MyST();
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
  - dollar math
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
- Code Directives
  - Code
  - Code blocks
  - Code cell
- Blocks
- Comments
- Targets
- HTML:
  - `sub`
  - `sup`
  - `abbr`
- Definition List
- Footnotes

Not yet complete:

- div
- proof
- margin
- sidebar
- colon fence
- Citations
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

Builds the library, including compiling the typescript and bundling/minification to create `myst.min.js` which can be used in the browser directly.
Additionally, `index.cjs.js` is created which bundles ESM dependencies like `unified`, which can be helpful for tooling (e.g. `jest`) that can struggle with ESM modules.
This outputs to the `dist` folder, and also includes all type definitions (`*.d.ts`) in the types folder.

### `npm run test`

Run the tests, these are mostly based on the [fixtures](fixtures) folder. You can also use `npm run test:watch` to run on any file changes.

### `npm run start`

Starts a server for manually testing and playing with `mystjs`, this uses a in-memory bundle of what would go in the `dist` folder.
Note that this does not actually build the library!
