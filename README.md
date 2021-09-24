# `prosemirror-docx`

[![prosemirror-docx on npm](https://img.shields.io/npm/v/prosemirror-docx.svg)](https://www.npmjs.com/package/prosemirror-docx)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/curvenote/prosemirror-docx/blob/master/LICENSE)
![CI](https://github.com/curvenote/prosemirror-docx/workflows/CI/badge.svg)

Export a [prosemirror](https://prosemirror.net/) document to a Microsoft Word file, using [docx](https://docx.js.org/).

## Basic usage

```ts
import { defaultDocxSerializer, writeDocx } from 'prosemirror-docx';
import { EditorState } from 'prosemirror-state';
import { writeFileSync } from 'fs'; // Or some other way to write a file

// Set up your prosemirror state/document as you normally do
const state = EditorState.create({ schema: mySchema });

// If there are images, we will need to preload the buffers
const opts = {
  getImageBuffer(src: string) {
    return anImageBuffer;
  },
};

// Create a doc in memory, and then write it to disk
const wordDocument = defaultDocxSerializer.serialize(state.doc, opts);

writeDocx(wordDocument, (buffer) => {
  writeFileSync('HelloWorld.docx', buffer);
});
```

## Extended usage

Instead of using the `defaultDocxSerializer` you can override or provide cusome serializers.

```ts
import { DocxSerializer, defaultNodes, defaultMarks } from 'prosemirror-docx';

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

## Supported Nodes

- text
- paragraph
- heading (levels)
  - TODO: Support numbering of headings
- blockquote
  - TODO: No styles supported
- code_block
  - TODO: No styles supported
- horizontal_rule
- hard_break
- ordered_list
- unordered_list
- list_item
- image
- math
- equations (numbered & unnumbered)

Planned:

- Tables
- Internal References (e.g. see Table 1)

## Supported Marks

- em
- strong
- link
  - Note: this is actually treated as a node in docx, so ignored as a prosemirror mark, but supported.
- code
- subscript
- superscript
- strikethrough
- underline
- smallcaps
- allcaps

## Resources

- [Prosemirror Docs](https://prosemirror.net/docs/)
- [docx](https://docx.js.org/)
- [prosemirror-markdown](https://github.com/ProseMirror/prosemirror-markdown) - similar implementation for markdown!
