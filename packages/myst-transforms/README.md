# myst-transforms

[![myst-transforms on npm](https://img.shields.io/npm/v/myst-transforms.svg)](https://www.npmjs.com/package/myst-transforms)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/curvenote/curvenote/blob/main/LICENSE)
[![CI](https://github.com/curvenote/curvenote/workflows/CI/badge.svg)](https://github.com/curvenote/curvenote/actions)

`unifiedjs` transforms for working with MyST Markdown documents.

## Overview

These transforms take MDAST from `mystjs` and turn it into usable forms, enforce document structure, or provide other utilities.

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
  .run(tree); // Run the mdast through the set of plugins

// The mdast tree has now been modified in place.
```
