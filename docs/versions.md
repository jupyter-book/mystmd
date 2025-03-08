---
title: MyST Content Versions
---

The following page describes changes to the MyST content that is served from the `.json` endpoint of a MyST Site. The `myst-compat` package can be used to translate between versions by upgrading and downgrading between versions.

The version is a string integer (i.e. `'1'` or `'2'`) and is incremented with every change to the content of a MyST page, which includes metadata as well as the MyST AST.

# MyST Versions

## Version 2 - 2025-03-05 - Block classes

Blocks could previously define class on `block.data?.class`, this has been explicitly moved to `block.class`.

## Version 1 - 2025-02-07 - Footnote Numbering

The footnotes have dropped backwards compatibility with `number`, instead using `enumerator` on both the `FootnoteReference` and `FootnoteDefinition` nodes.
Previous versions of the AST had both of these defined. The `enumerator` property is used in all other numberings of figures, sections, equations, etc.

## Version 0 - Pre 2025-02-01

This is the first version of MyST AST considered to be versioned, subsequent releases will have changes for migrating the content between versions.
