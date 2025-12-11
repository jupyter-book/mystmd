# myst-to-html

Convert a MyST AST to HTML.

```typescript
import { u } from 'unist-builder';
import { mystToHtml } from 'myst-to-html';

const html = mystToHtml(u('root', [u('paragraph', [u('text', 'hello world')])]));
// '<p>hello world</p>'
```
