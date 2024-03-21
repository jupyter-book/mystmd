---
title: Document Parts
description: Parts allow you to specify special parts of your document, like abstract, keypoints acknowledgements.
---

Document parts allow you to add metadata to your documents with specific components of your page, for example, abstract, dedication, or acknowledgments. Many templates put these in specific places.

There are three ways that you can define parts of a document: (1) in your page frontmatter; (2) implicitly using a section heading; and (3) on a block using a `part` or `tag` annotation.

## Parts in Frontmatter

On any page, you can add a part to your document directly in the frontmatter, for example, the `abstract`:

```yaml
---
title: My document
abstract: |
  This is a multi-line
  abstract, with _markdown_!
---
```

### Known Frontmatter Parts

The known parts that are recognized as _top-level_ document frontmatter keys are:

abstract
: A concise overview of the entire document, highlighting the main objectives, methods, results, and conclusions. It's meant to give readers a quick snapshot of what to expect without having to read the entire document.

summary
: Similar to an abstract, but can either be slightly longer and more detailed or used as a plain-language summary, depending on the context. It summarizes the document's content, including the background, purpose, methodology, results, and conclusions.
: Alias: `plain_language_summary`, `lay_summary`

keypoints
: A brief list that highlights the main findings, conclusions, or contributions of the document. Key points are often used to quickly convey the core message or most important aspects to the reader.

dedication
: A short section where the author dedicates the document to someone, often as a gesture of honor or respect.

epigraph
: A quote or poem that the author includes at the beginning of the document to set a tone or theme, or to hint at the document’s underlying message. It is often relevant to the content but not directly related to it.
: Alias: `quote`

data_availability
: A statement or section that details how readers can access the data sets and resources used in the document. This can include links to repositories, conditions for access, and any restrictions on the data. It's crucial for transparency and reproducibility in research documents.
: Alias: `availability`

acknowledgments
: A section where the author thanks individuals, organizations, or agencies that contributed to the completion of the document. This can include support in the form of funding, expertise, feedback, or moral support.
: Alias: `ack`, `acknowledgements`

### Custom Frontmatter Parts

If you have a custom part name for a template, you can nest it under `parts:`, which takes arbitrary keys.

```yaml
---
title: My document
parts:
  special_part: |
    This is a multi-line
    abstract, with _markdown_!
---
```

The advantage of this method is that the content is not rendered in your document.

## Implicit Parts using a Title

If you are rendering your project in other places, it can be helpful to leave these sections directly in the document.
Complete this using a header as usual:

```
# Abstract

This is my abstract!
```

Note that frontmatter parts and explicitly tagged cells/blocks will take precedence over this method.

## In a Jupyter Notebook cells and blocks

When using a Jupyter Notebook, you can add a `tag` to the cell with the part name, if multiple cells share that tag, they will be extracted and merged. This can also be represented in a [block](./blocks.md):

```markdown
+++ { "part": "abstract" }

This is my abstract block.

+++
```
