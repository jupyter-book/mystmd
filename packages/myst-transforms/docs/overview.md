---
title: Overview
description: List of transforms included in the myst-transforms package.
---

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

## List of Transforms

Admonitions
: Add headers to each admonition (callout), such as `Note` or `Important`.
: Optionally replace the header with the first paragraph of text if it is all bold.

Blocks
: Ensure that all blocks in a document are not nested.

Blockquotes
: Change attributed blockquotes, those that include a single list item to a figure of `kind` quote, and add the attribution as a figure caption.

Caption
: Ensure that figure captions are in paragraphs

Code
: Audit code to ensure that languages are specified, or provide a default language
: Ensure that `python` as a language is replaced from `IPython3` or other kernal-like language specifiers.

CodeBlock
: Codeblocks can live inside of figures, have captions and be references. Transformation ensures that this information isn't lost from the original parsing of mdast.
: Note: this should move into the parser in the future.

Footnotes
: Pull the footnote definitions into a reference object.

HTML
: Parse HTML nodes and replace their contents.

HTML Ids
: Ensure that referenceable nodes have proper HTML Ids (start with a letter, no spaces or fancy characters)
: HTML Ids are more strict than the internal labels used for cross-references, and this is up to the transform to provide, not the renderer.

Images
: Add alt text to images if it is not defined, from the captions.

Keys
: Add unique identifiers to each node, helpful for rendering as well as referring to a document in the wild. These are not aiming to be persisted across multiple builds of the document, for that you should use a label (and associated HTML Id).

Math
: Use KaTeX to create and provide errors/warnings about math rendering.

Math Label
: Parse latex to strip \label and simple equation environments from math, and put this in mdast directly.

MyST Cleanup
: A few utilities for lifting children and getting rid of some information about the parsed document from MyST. For example, the `mystDirective` and `mystRole` wrapper nodes are removed.

Targets
: Propagate targets (i.e. `(my-id)=`) to the following node
: Add HTML friendly identifiers to headings.

## Plugin Collections

A few of the plugins are exposed in a `basicTransformationsPlugin` does a number of the expected transformations without any user supplied options. See the code for exactly which plugins are included. If you are depending on this, ideally use the individual plugins directly, which will always provide options.
