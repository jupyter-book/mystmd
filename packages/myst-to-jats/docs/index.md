---
title: myst-to-jats
description: myst-to-jats is library for converting MyST documents to JATS XML.
---

[![myst-to-jats on npm](https://img.shields.io/npm/v/myst-to-jats.svg)](https://www.npmjs.com/package/myst-to-jats)

`myst-to-jats` is a library for converting MyST documents into JATS.

**Goals**

- Convert from `myst-spec` AST documents into JATS XML

**Not Goals**

- Read JATS, this package is for serialization only - see `jats-to-myst`

## Installation

Install the package into your virtual environment using npm:

```bash
npm install myst-to-jats
```

## Simple example

Below we construct a AST tree using `unist-builder`, use the `mystToJats`
plugin in a `unified` pipeline and `stringify` the document into a $\LaTeX$ file.

```typescript
import { unified } from 'unified';
import { u } from 'unist-builder';
import mystToJats from 'myst-to-jats';

// Create a AST document, or parse using mystmd
const tree = u(
  'root',
  u('paragraph', [
    u('text', { value: 'This is a unicode “fraction”: ' }),
    u('inlineMath', { value: '½' }),
  ]),
);
// Use the plugin, and stringify the tree
const file = unified().use(mystToJats).stringify(tree);
// Log the results
console.log(file.result.value);
```

The document that we fed in was quite simple, and the `½` unicode characters as well as the quotes are nicely transformed into the appropriate $\LaTeX$:

```latex
This is a unicode ``fraction'': $\frac{1}{2}$
```

## Overview

The `myst-to-jats` library aims to translate all standard MyST syntax to sensible $\LaTeX$ syntax, as well as be extensible to other plugins.
