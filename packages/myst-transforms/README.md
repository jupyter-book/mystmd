# myst-transforms

`unifiedjs` transforms for working with MyST Markdown documents.

## Overview

These transforms take AST from `mystmd` and turn it into usable forms, enforce document structure, or provide other utilities.

These utilities are available on npm:

```bash
npm install myst-transforms
```

You can use the plugins as follows:

```typescript
import { unified } from 'unified';
import { mathPlugin } from 'myst-transforms';

unified()
  .use(mathPlugin, { macros: {} }) // Add the plugin with any options
  .run(tree); // Run the AST through the set of plugins

// The AST has now been modified in place.
```
