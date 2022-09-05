---
title: myst-transforms
description: myst-transforms is library for converting MyST documents to LaTeX.
---

[![myst-transforms on npm](https://img.shields.io/npm/v/myst-transforms.svg)](https://www.npmjs.com/package/myst-transforms)

`myst-transforms` is a library for transforming `myst` markdown documents.

## Overview

These transforms take mdast from `mystjs` and turn it into usable forms, enforce document structure, or provide other utilities.

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
