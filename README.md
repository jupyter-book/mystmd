# markdown-it-myst
[![markdown-it-myst on npm](https://img.shields.io/npm/v/markdown-it-myst.svg)](https://www.npmjs.com/package/markdown-it-myst)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/executablebooks/markdown-it-myst/blob/master/LICENSE)
[![CI](https://github.com/executablebooks/markdown-it-myst/workflows/CI/badge.svg)](https://github.com/executablebooks/markdown-it-myst/actions)

> :warning: **Note:** `markdown-it-myst` is pre-alpha, expect changes! (July, 2020)

A javascript parser for MyST based on [markdown-it](https://github.com/markdown-it/markdown-it)

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
import MyST from 'markdown-it-myst';

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
