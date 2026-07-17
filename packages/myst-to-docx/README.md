# `myst-to-docx`

Export a MyST document to a Microsoft Word file, using [docx](https://docx.js.org/).

## Overview

`myst-to-docx` has a `DocxSerializer` object that you write to as you walk the MyST document. It is a light wrapper around <https://docx.js.org/>, which actually does the export. `myst-to-docx` is write only (i.e. can export to, but can’t read from `*.docx`), and has all standard MyST nodes covered (see below).

`myst-to-docx` can be used in the browser or in node. This library currently only has dependence on `docx`, `myst-frontmatter` and `buffer-image-size` - and the serialization handlers can be edited externally (see `Extended Usage` below).

The AST should be transformed through `myst-transforms` to ensure that all nodes are enumerated.

## Basic usage in browser

The utility `fetchImagesAsBuffers` walks the AST and downloads images into buffers to be used by docx, it also figures out the size and returns an object with `getImageBuffer` and `getImageDimensions`, which need to be passed to the options. If your images are more complex (e.g. they are mermaid diagrams, or Jupyter Outputs), you will need to do more complex preprocessing to create these two functions.

A `Blob` is returned, which can be downloaded client side.

```typescript
import { unified } from 'unified';
import { mystToDocx, fetchImagesAsBuffers, DocxResult } from 'myst-to-docx';

const opts = await fetchImagesAsBuffers(tree);
const file = unified().use(mystToDocx, opts).stringify(tree);
const blob = await (file.result as DocxResult);
```

## Basic usage in node

In node, the image dimensions are discovered using a node-only package, and don't need to be provided. The result of the conversion in node is a `Buffer` as the `file.result`, which can be saved to disk.

```typescript
import { unified } from 'unified';
import { mystToDocx, DocxResult } from 'myst-to-docx';

const file = unified()
  .use(mystToDocx, {
    getImageBuffer(url) {
      return fs.readFileSync(url).buffer;
    };
  })
  .stringify(tree);
const buffer = await (file.result as DocxResult);
```

## Extended usage

Instead of using the `defaultDocxSerializer` you can override or provide cusome serializers.

```ts
import { DocxSerializer, defaultNodes, defaultMarks } from 'myst-to-docx';

const nodeSerializer = {
  ...defaultNodes,
  my_paragraph(state, node) {
    state.renderInline(node);
    state.closeBlock(node);
  },
};

export const myDocxSerializer = new DocxSerializer(nodeSerializer, defaultMarks);
```

The `state` is the `DocxSerializerState` and has helper methods to interact with `docx`.

## Supported Block Nodes

- text
- link
- paragraph
- heading (levels)
  - Including numbering of headings
- blockquote
- code
  - TODO: No styles supported
- thematicBreak
- break
- list
- listItem
- image
- math
  - Including numbering
- inlineMath
- crossReference
- abbreviation
- block
- definitionList
- definitionTerm
- definitionDescription
- container
- caption
- captionNumber
- tables

## Supported Style Nodes

- emphasis
- strong
- inlineCode
- subscript
- superscript
- delete (strikethrough)
- underline
- smallcaps

## Resources

- [docx](https://docx.js.org/)
- [myst-spec](https://github.com/jupyter-book/myst-spec)
