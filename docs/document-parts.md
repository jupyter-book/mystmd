---
title: Document Parts
description: Parts allow you to specify special parts of your document, like abstract, key points, and acknowledgements.
---

Document *parts* allow you to add content and metadata for specific components of your page or project, including `example`, `abstract`, `dedication`, and `acknowledgment`. [Templates](./documents-exports.md) may use the parts and their metadata, and render such content in various locations.

## Add document parts

There are several ways you can define parts of a document, each described below:

1. [In site configuration](#parts:site)
2. [In project-level configuration](#parts:project)
3. [In page frontmatter](#parts:frontmatter)
4. [With specific section headings](#parts:implicit)
5. [With a content block](#parts:blocks)
6. [With Jupyter Notebook cell tags](#parts:cell-tags)

(parts:frontmatter)=

### Parts in Frontmatter

On any page, you can add a part to your document directly in the frontmatter, for example, the `abstract`:

```yaml
---
title: My document
abstract: |
  This is a multi-line
  abstract, with _markdown_!
---
```

You may also write your part in a separate file, and point to that file from the frontmatter, for example:

```yaml
---
title: My document
abstract: ../abstract.md
---
```

(parts:project)=

### Parts in `myst.yml` Project configuration

You may also specify `parts` in the project configuration of your `myst.yml` file. These are defined exactly the same as [`parts` defined in page frontmatter](#parts:frontmatter).

```yaml
version: 1
project:
  abstract:  |
    This is a multi-line
    abstract, with _markdown_!
  parts:
    special_part: |
      This is another _special_ part!
```

Project-level `parts` are useful, for example, if you have an abstract, acknowledgments, or other part that applies to your entire project and doesn't make sense attached to an individual page.

```{caution}
Project-level `parts` are a new feature and may not yet be respected by your chosen MyST template or export format. If the project `part` is not behaving as you expect, try moving it to page frontmatter for now.
```

(parts:implicit)=

### Parts with specific header titles

If you are rendering your project in other places, it can be helpful to leave these sections directly in the document.
Complete this using a header as usual:

```
# Abstract

This is my abstract!
```

Note that frontmatter parts and explicitly tagged cells/blocks will take precedence over this method. Themes may choose to only pick up a subset of implicit parts, for example, only an `Abstract` and not `Summary` as summary section can be used in other contexts.

(parts:blocks)=

### Parts with content blocks

You can use [content blocks](./blocks.md) in a page to define a part. This will be parsed differently from the other content on the page for re-use in templates and websites.

The following example shows how to define an _abstract_ part in a content block on a page.

```{code} markdown
:filename: mypage.md

# Page title

+++ { "part": "abstract" }

This is my abstract block.

+++

Page content

```

(parts:cell-tags)=

### Parts with Jupyter cell tags

When using a Jupyter Notebook, you can add a `tag` to the cell with the part name. If multiple cells share that tag, they will be extracted and merged. 


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
    This is another _special_ part!
---
```

The advantage of this method is that the content is not rendered in your document.

(parts:site)=

## Add parts to your website

[Website themes](./website-templates.md) have additional parts because they render user interface elements that are not part of a standard "document" structure. These are theme-dependent: for example, the [default myst themes](#default-web-themes) support a [`footer` part](#navigation:footer).

Specify the content of a site `part` in the `site.parts` key of the `myst.yml` configuration file:

```{code} yaml
:filename: myst.yml
version: 1
site:
  template: ...
  parts:
    footer: |
      (c) MyST Markdown
  ...
```

Alternatively, you may specify a path to a file that contains the part content:

```{code} yaml
:filename: myst.yml
version: 1
site:
  template: ...
  parts:
    footer: parts/myfooter.md
  ...
```

Content in parts will generally be parsed similarly to other MyST content (though some functionality like code execution will not work).

### Share the same part across multiple sites

If you wish to share the same part across multiple sites, use the [`extends:` key to compose multiple configuration files](#composing-myst-yml). This lets you define the part in one location, and re-use it in several others. It is useful if you want to standardize website components like a footer across many websites.

For example, in one file:

```{code} yaml
:filename: parts.yml
site:
  parts:
    footer: |
      My nifty footer!
  ...
```

And in another:

```{code} yaml
:filename: myst.yml
version: 1
extends: parts.yml
site:
  template: ...
```

**If you're extending configuration from a remote source**, make sure that you use absolute URLs if you must refer to an image or other asset in your part content. Relative paths that are defined inside the part content will generally break.

