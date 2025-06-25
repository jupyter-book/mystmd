---
title: Document Parts
description: Parts allow you to specify special parts of your document, like abstract, key points, and acknowledgements.
---

Document parts allow you to add metadata to your documents with specific components of your page or project, for example, abstract, dedication, or acknowledgments. [Templates](./documents-exports.md) can use this information to put that content in various locations.

## Add document parts

There are several ways you can define parts of a document, each described below:

1. [In page frontmatter](#parts:frontmatter)
2. [In project-level configuration](#parts:project)
3. [With specific section headings](#parts:implicit)
4. [With a content block](#parts:blocks)
5. [With Jupyter Notebook cell tags](#parts:cell-tags)
6. [In site configuration](#parts:site)

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

(parts:site)=

## Add parts to your website

[Website themes](./website-templates.md) have their own configuration for parts because they often have extra user interface elements that are not part of a standard "document" structure. These are theme-dependent. For example, the [default myst themes](#default-web-themes) support [a website footer](#navigation:footer).

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

