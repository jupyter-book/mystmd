---
title: Website Themes
description: Export to over 400 journal templates from a MyST Markdown file, which uses LaTeX and can create print-ready, multi-column, professional PDF documents.
---

There are currently two themes for MyST websites, a book-theme, which is the default and is based loosely on JupyterBook and an article-theme that is designed for scientific documents with supporting notebooks. The documentation for this site is using the `book-theme`, for a demonstration of the `article-theme`, you can see [an article on finite volume](https://simpeg.xyz/tle-finitevolume).

:::::{tab-set}
::::{tab} Article Theme
:::{figure} ./images/article-theme.png
Example of a banner in a site using the `article-theme`, ([online](https://simpeg.xyz/tle-finitevolume/), [source](https://github.com/simpeg/tle-finitevolume))
:::
::::

::::{tab} Book Theme
:::{figure} ./images/book-theme.png
Example of a site using the `book-theme`, ([online](https://mystmd.org), [source](https://github.com/executablebooks/mystmd/tree/main/docs))
:::
::::
:::::

## Changing Themes

To change your website theme from the default (`book-theme`), use the `site: theme:` property:

```{code} yaml
:filename: myst.yml
:emphasize-lines: 4
:caption: Change the `theme` property to `article-theme`.
:linenos:
project:
  ...
site:
  theme: article-theme
```

### Article Theme

The article theme is centered around a single article with supporting computational notebooks, which is how many scientific articles are written today: a narrative article with associated computational notebooks to reproduce a figure, data-cleaning step, or visualization. These are listed as "supporting documents" in this theme and can be pulled in as normal with your [](./table-of-contents.md). For information on how to import your figures into your documents, see [](./reuse-jupyter-outputs.md).

The frontmatter that is displayed at the top of the article is the contents of your project, including a project [thumbnail and banner](#thumbnail-and-banner). The affiliations for your authors, their ORCID, email, etc. are available by clicking directly on the author name.
