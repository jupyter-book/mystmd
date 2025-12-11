---
title: myst-to-md
description: myst-to-md is library for converting MyST abstract syntax trees to markdown.
---

[![myst-to-md on npm](https://img.shields.io/npm/v/myst-to-md.svg)](https://www.npmjs.com/package/myst-to-md)

`myst-to-md` is a library for converting MyST abstract syntax trees to markdown.

**Goals**

- Convert from `myst-spec` AST documents into markdown
- Work as a `unifiedjs` plugin and in the `mystmd` ecosystem

**Not Goals**

- Read Markdown, this package is for serialization only

## Installation

Install the package into your virtual environment using npm:

```bash
npm install myst-to-md
```

## Simple example

Below we construct a AST tree using `unist-builder`, use the `mystToMd`
plugin in a `unified` pipeline and `stringify` the document into a Markdown file.

```typescript
import { unified } from 'unified';
import { u } from 'unist-builder';
import mystToMd from 'myst-to-md';

// Create a AST document, or parse using mystmd
const tree = u(
  'root',
  u('paragraph', [
    u('text', { value: 'This is a unicode “fraction”: ' }),
    u('inlineMath', { value: '½' }),
  ]),
);
// Use the plugin, and stringify the tree
const file = unified().use(mystToMd).stringify(tree);
// Log the results
console.log(file.result.value);
```

## Overview

The `myst-to-md` library aims to translate all standard MyST syntax to markdown, as well as be extensible to other plugins.
