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

```ts
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

Caption
: Ensure that figure captions are in paragraphs

Code
: Audit code to ensure that languages are specified, or provide a default language
: Ensure that `python` as a language is replaced from `IPython3` or other kernal-like language specifiers.

CodeBlock
: Codeblocks can live inside of figures, have captions and be references. Transformation ensures that this information isn't lost from the original parsing of mdast.
: Note: this may move into the parser in the future.

Enumerate
: Add information about numbering and cross-referencing of content.
: There are two passes, `enumerateTargetsPlugin` and `resolveReferencesPlugin` these can be run at different times depending on if you are in a single-document or multi-document setup.
: The `resolveReferencesPlugin` has a number of transformations for (1) links, which identify document level links to other md files; (2) `crossReference` transforms which link references in the state and replace children with, for example, "Figure 1"; and (3) inserting caption numbers into containers.
: The enumeration transforms require state, and can instantiate a `ReferenceState` object or a `MultiPageReferenceState` for collections with multiple pages. The reference resolution is defined in those classes. To create your own reference management, use the `IReferenceState` interface to pass in.

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

MyST Cleanup
: A few utilities for lifting children and getting rid of some information about the parsed document from MyST. For example, the `mystDirective` and `mystRole` wrapper nodes are removed.

Targets
: Propagate targets (i.e. `(my-id)=`) to the following node
: Add HTML friendly identifiers to headings.

## Document Plugins

A few of the plugins are exposed for a `singleDocumentPlugin` and `multiDocumentPlugin` which only differ in that they resolve references. See the code for exactly which plugins are included. If you are depending on this, ideally use the individual plugins directly, which will always provide options. These collections are primarily to reduce code duplication in this monorepo and not explicitly intended for external use.

## Error Reporting

The package uses `vfile` error reporting messages, this allows you to collect

```ts
import { VFile } from 'vfile';

const file = new VFile();

unified()
  .use(mathPlugin, { macros: {} }) // Add the plugin with any options
  .run(tree, file); // Run the mdast through the set of plugins

// Check for errors in the messages:
file.messages;
```

You can also use `vfile-reporter` to pretty print the messages for the console.

```ts
import { fileWarn } from 'myst-utils';

fileWarn(file, 'Replacing \\begin{eqnarray} with \\begin{align*}', {
  node,
  note: 'Although the standard eqnarray environment is available in LaTeX, ...',
  source: 'myst-transforms:math', // colon separated
  url: 'http://anorien.csc.warwick.ac.uk/mirrors/CTAN/macros/latex/required/amsmath/amsldoc.pdf',
});
```
