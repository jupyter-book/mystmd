# Getting Started

## Usage

`markdown-it-myst` combines a number of [markdown-it](https://markdown-it.github.io/)
extensions and configures them to parse MyST in both the browser or in a node environment.

### In a browser:

You can download the latest package

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

If you are building the project on your own, please follow the [](developer) and `yarn build` to create a bundle that you can include on your own.

### In a node environment:

```bash
npm install markdown-it-myst # or use yarn
```

You can now import (or `require`) the library.

```javascript
import MyST from 'markdown-it-myst';

const myst = MyST();
const html = myst.render('# Hello to the world!');

console.log(html);
>> "<h1>Hello to the world!</h1>"
```
