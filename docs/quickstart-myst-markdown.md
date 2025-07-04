---
title: Working with MyST Markdown
subject: MyST Quickstart Guide
subtitle: An overview of syntax features
short_title: MyST Markdown Guide
description: MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown.
---

:::{important} Objective

The goal of this quickstart guide is to showcase the most used features of the MyST authoring experience. The MyST syntax can be used in Markdown files or Markdown cells in Jupyter Notebooks to add figures, tables, equations, cross-references, hover-links and citations.
:::

:::{tip}
During this how to guide, you can make changes and experiment with MyST syntax in the editors included directly on the page.
:::

## Overview

{abbr}`MyST (Markedly Structured Text)` is designed to create publication-quality documents written entirely in Markdown. The extensions and design of MyST is inspired by the [Sphinx](https://www.sphinx-doc.org/) and [reStructuredText](https://docutils.sourceforge.io/rst.html) (RST) ecosystems and is a superset of [CommonMark](./commonmark.md).

MyST allows you to directly create “directives” and “roles” that extend Markdown to support technical and scientific documents. Directives are block-level extension points, like [callout panels](./admonitions.md), [tabs](./dropdowns-cards-and-tabs.md), [figures](./figures.md) or [embedded charts](./interactive-notebooks.ipynb); and roles are inline extension points, for components like [cross-references](./cross-references.md), [external references](./external-references.md), [citations](./citations.md), or [inline math](./math.md). MyST also supports rich information about linking to other documents in common services (like Wikipedia or a DOI link), these allow for rich-previews of the links as well as easy ways to include citations.

## Typography

MyST is built on CommonMark Markdown, to learn more about that standard form of Markdown as well as a [tutorial](https://commonmark.org/help/tutorial/) visit [commonmark.org](https://commonmark.org/).
CommonMark allows for headings, bold, italic, lists, links, images, code, breaks and quotes ([see more](./commonmark.md)) -- but overall is designed to be very simple to read and write as text!
MyST adds various typography extensions to the markup including [footnotes](#footnotes), [inline math](#inline-math), and [definition lists](#definition-lists), try the demo below to get an idea of the markup.

```{myst}
### Heading Level 3

Try changing the number of `#`s to $n$[^math] to change the **depth** of the _heading_.

1. Learn about [Markdown](https://en.wikipedia.org/wiki/Markdown)
   - Go through a [tutorial](https://commonmark.org/help/tutorial/)

[^math]: Where $n \in \mathbb{N}$ with $n \leq 6$, or between an H1 and an H6!
```

:::{seealso}
See [](./typography.md) to learn in depth about all typographical elements. The [](./commonmark.md) page also includes demos and examples of all CommonMark syntax.
:::

## Directives and Roles

Directives are multi-line containers that include an identifier, arguments, options, and content. Examples include [admonitions](./admonitions.md), [figures](./figures.md), and [equations](./math.md). At its simplest, you can use directives using a "fence" (either [back-ticks or colons](#example-fence)) and the name of the directive enclosed in braces (`{name}`).

For example, try editing the following {myst:directive}`figure` directive, you can center the figure with an `:align: center` option or change the `colons` for `backticks`.

```{myst}

:::{figure} https://github.com/rowanc1/pics/blob/main/banff-tall.png?raw=true
:align: right
:width: 40%

The picture would look better if it is `:align: center`-ed!
:::
```

Roles are very similar to directives, but they are written entirely in one line. There are a number of roles included in MyST, including abbreviations, subscript, and superscript, as well as inline [](./math.md). The syntax of a role is:

```markdown
Some content {rolename}`and here is my role's content!`
```

Of course, roles will only work if `rolename` is a valid role name! The `abbr` role creates inline abbreviations, for example, `` {abbr}`MyST (Markedly Structured Text)` `` will become {abbr}`MyST (Markedly Structured Text)`! When you hover over[^1] the abbreviation you will see the `title` appear!

[^1]: Abbreviations are also great structured data for screen-readers!

:::{seealso}
See [](./syntax-overview.md) to learn in depth about directives and roles, including options, and how to nest directives.
:::

## Frontmatter

Frontmatter allows you to specify metadata about your page including the `title`, `thumbnail`, `authors`, and scientific identifiers like a `doi`.
Adding frontmatter ensures that these properties are available to downstream tools or build processes like building [](./creating-pdf-documents.md).
For example:

```yaml
---
title: My First Article
thumbnail: ./thumbnails/nice-image.png
date: 2022-05-11
authors:
  - name: Mason Moniker
    affiliations:
      - University of Europe
---
```

:::{seealso}
See [](./frontmatter.md) for all options, how to use frontmatter in various tools like JupyterLab, and how to reuse frontmatter across your pages in a project.
:::

## Links & Cross-References

As you have seen in the links in MyST (e.g. [](./frontmatter.md)), there is information that is pulled forward into your reading context on hover or click. We believe it is important to provide as much possible context when you are reading on elements like links to other pages, cross-references to figures, tables and equations as well as traditional academic citations[^contextual-information] (**👈 see the footnote!**). Additionally, all of these have fallbacks in static PDF or Word documents.

[^contextual-information]:
    For example, in [](doi:10.1145/3411764.3445648) the authors showed you can speed up comprehension of a paper by 26% when showing information in context, rather than requiring researchers to scroll back and forth to find figures and equations.

    Imagine if all of science was ⚡️ 26% faster ⚡️[^3]!! (**👈💥**)\
    Designing the user-experience of scientific communication is _really_ important.

[^3]:
    Just as an example of having lots of helpful information at your fingertips, it would be nice to see the video of that article, _right_? Well here it is:

    :::{iframe} https://www.youtube.com/embed/yYcQf-Yq8B0
    :::

    Can't do that in a PDF! [^4] (**👈💥**)

[^4]:
    I mean, now that you are down the rabbit-hole, we can get you back on track with a demo of [referencing equations](#example-equation-targets) (**👈💥**)

    Or maybe you want to explore an [💥 interactive figure 💥](#fig-altair-horsepower).

:::{figure} ./videos/links.mp4
:class: framed
Try clicking the footnote above, you can nest information and interactive figures for the interested reader! You can help with reading comprehension by around 26% by providing information when the reader needs it!!
:::

To link to a document, for example [](./frontmatter.md), is done through a simple Markdown link `[](./frontmatter.md)`, you can put your own content in between the square brackets, but if you leave it out the link contents will be filled in with the title of the page. If you define the frontmatter on that page (i.e. the description and tooltip), you will also see that information when you hover over the link. This also works for links to Wikipedia (e.g. [Ponies 🐴](https://en.wikipedia.org/wiki/New_Forest_pony)) as well as Github code (e.g. [](https://github.com/jupyter-book/mystmd/blob/main/README.md)).

To create a cross-reference, you need to label a "target", like a figure, section, equation or table (or anything!!). To be referenceable, these elements can add the `label` option in many directives. To then reference the figure, use the link syntax again pointing to the label as the target `[](#my-fig)`. If you leave the title blank the default will fill in with an enumerated "Figure 1".

````{myst}
```{figure} https://github.com/rowanc1/pics/blob/main/mountains.png?raw=true
:label: my-fig
:align: center

My **bold** mountain 🏔🚠.
```

Check out [](#my-fig)!!
````

:::{seealso}
See [](./cross-references.md) for in depth information for using links for internal and external references. For links to external sites like Wikipedia or GitHub, see [](./external-references.md).
:::

## Citations

Citations are at the heart of technical writing, and are well handled by MyST!

> If I have seen further it is by standing on the shoulders of Giants.
>
> - Newton making a [sarcastic remark](https://en.wikipedia.org/wiki/Standing_on_the_shoulders_of_giants#Early_modern_and_modern_references) directed at Hooke's appearance?!

The easiest way to create a citation is just link to a DOI as any other link! For example:\
`[](https://doi.org/10.5281/zenodo.6476040)` will create:\
[](https://doi.org/10.5281/zenodo.6476040).

If you already have a citation list locally as a BiBTeX file (`*.bib`), then you can reference the keys inside it using a similar syntax to LaTeX, but adapted to roles: `` {cite:p}`myst2023,jupyterbook2021` ``. The `cite:p` will create a parenthetical citation, or a textual citation using `cite:t`, the `cite` role can also be used, and will adapt to the citation style of the document. The citations will show up inline in your documents, and also automatically create a references section at the bottom of your page!

:::{seealso}
See [](./citations.md) for more information about using citations and references sections, and how to have control over the bibliography sources.
:::

## What's Next?

We hope the above sections in this overview should have given you a sense of the types of things that MyST can do! Once you write a document in MyST, you can use the command line tools to translate that into a [scientific PDF article](./creating-pdf-documents.md), or a [Word Document](./creating-word-documents.md) or a [website](./quickstart-myst-documents.md) like this site!

```{mermaid}
flowchart LR
  A[Jupyter Notebook] --> D
  B[Markdown] --> D
  D{MyST}
  D <--> E[LaTeX]
  E --> F[PDF]
  D --> G[Word]
  D --> H[React]
  D --> I[HTML]
  D <--> J[JATS]
```

:::{seealso}
You might also want to explore tools and extensions, like the [JupyterLab MyST extension](https://github.com/jupyter-book/jupyterlab-myst), [VSCode extension](https://marketplace.visualstudio.com/items?itemName=ExecutableBookProject.myst-highlight) or [Curvenote](https://curvenote.com/for/writing) to make your rendering and writing of MyST easier.
:::

![](#quickstart-cards)
