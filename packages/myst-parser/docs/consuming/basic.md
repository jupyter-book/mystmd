# Basic Usage

`myst-parser` allows you to parse and render MyST in both the browser or in a node environment. The parse creates an abstract syntax tree (AST)

### Using a Browser

You can download the latest package hosted off of npm (e.g. using unpkg) or include a specific version of the minified libraries in your repository. The simplest function is to `render` some MyST markdown to a DOM element in your page.

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

If you are building the project on your own, please follow the [](developer) and `npm run build` to create a bundle that you can include on your own.

### Using Node

```bash
npm install myst-parser
```

You can now import (or `require`) the library.

```javascript
import { mystParser } from 'myst-parser';
import { State, transform, mystToHast, formatHtml } from 'myst-to-html';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';

const pipe = unified()
  .use(mystParser)
  .use(transform, new State())
  .use(mystToHast)
  .use(formatHtml)
  .use(rehypeStringify);
const result = pipe.runSync('# Hello to the world!');
const html = pipe.stringify(result);

console.log(html);
>> "<h1>Hello to the world!</h1>"
```
