---
title: myst-to-tex
description: myst-to-tex is library for converting MyST documents to LaTeX.
---

[![myst-to-tex on npm](https://img.shields.io/npm/v/myst-to-tex.svg)](https://www.npmjs.com/package/myst-to-tex)

`myst-to-tex` is a library for converting MyST documents into LaTeX.

**Goals**

- Convert from `myst-spec` AST documents into $\LaTeX$ markup
- Work with [jtex](myst:jtex) to template documents
- Work as a `unifiedjs` plugin and in the `mystmd` ecosystem

**Not Goals**

- Read LaTeX, this package is for serialization only

## Installation

Install the package into your virtual environment using npm:

```bash
npm install myst-to-tex
```

## Simple example

Below we construct a AST tree using `unist-builder`, use the `mystToTex`
plugin in a `unified` pipeline and `stringify` the document into a $\LaTeX$ file.

```typescript
import { unified } from 'unified';
import { u } from 'unist-builder';
import mystToTex from 'myst-to-tex';

// Create a AST document, or parse using mystmd
const tree = u(
  'root',
  u('paragraph', [
    u('text', { value: 'This is a unicode “fraction”: ' }),
    u('inlineMath', { value: '½' }),
  ]),
);
// Use the plugin, and stringify the tree
const file = unified().use(mystToTex).stringify(tree);
// Log the results
console.log(file.result.value);
```

The document that we fed in was quite simple, and the `½` unicode characters as well as the quotes are nicely transformed into the appropriate $\LaTeX$:

```latex
This is a unicode ``fraction'': $\frac{1}{2}$
```

## Overview

The `myst-to-tex` library aims to translate all standard MyST syntax to sensible $\LaTeX$ syntax, as well as be extensible to other plugins.
