---
title: Scientific Articles
subject: MyST Quickstart Tutorial
subtitle: Write scientific articles using MyST Markdown with easy-to-use citations, scholarly metadata, cross-references, and advanced functionality.
description: Get up and running with the MyST (Markedly Structured Text) command line interface. MyST is designed to create publication-quality documents written entirely in Markdown.
---

:::{note} Goals and prerequisites
**Goals**: This tutorial covers how to take advantage of MyST features and customizability to create enriched, interactive scientific articles.

**Prerequisites**: This assumes you've completed [](./quickstart.md) and have MyST installed locally, as well as a local version of the [MyST quickstart content](https://github.com/jupyter-book/mystmd-quickstart).
:::

::::{note} See the video tutorial 📺
:class: dropdown
The following video covers this tutorial as well as [](./quickstart-static-exports.md).

```{iframe} https://www.youtube.com/embed/NxSNVt9XsCI
:width: 100%
```

::::

![](#lookout-for-tutorial-actions)

## Start MyST 🚀

From [the MyST quickstart tutorial](./quickstart.md), you should already have created a `myst.yml` configuration file that is required to render your project.
To confirm this, run a MyST server to serve the MyST quickstart content:

🛠 Run `myst start` to serve your quickstart content

```shell
cd mystmd-quickstart
myst start
```

```text
📖 Built README.md in 33 ms.
📖 Built 01-paper.md in 30 ms.
📖 Built 02-notebook.ipynb in 6.94 ms.
📚 Built 3 pages for myst in 76 ms.

      ✨✨✨  Starting Book Theme  ✨✨✨

⚡️ Compiled in 510ms.

🔌 Server started on port 3000!  🥳 🎉

      👉  http://localhost:3000  👈
```

🛠 Open your web browser to `http://localhost:3000`[^open-port]

[^open-port]: If port `3000` is in use on your machine, an open port will be used instead, follow the link provided in the terminal.

To fully explore `myst start` see [](./quickstart.md).

## Add MyST Markdown! 🎉

Next we will improve the contents of the `01-paper.md`, including:

- Adding and editing **frontmatter**
- Creating a "part" for the **abstract**
- Adding **citations**
- Adding **figures**
- Creating **cross-references**

### Improve the frontmatter

🛠 Open `01-paper.md` in a text editor

The start of the file includes information about the title, subtitle, author, affiliations and license.
Unfortunately, this way of including this information is not easily machine-readable[^fair], and focuses more on style/typography than on metadata.

[^fair]: [FAIR principles](https://www.go-fair.org/fair-principles/) are at the heart of open-science, and aim to **F**indability, **A**ccessibility, **I**nteroperability, and **R**euse of digital assets. For a resource to be finable, it must be machine-readable!

```markdown
# How to MyST, without being mystified 🧙

A tutorial to evolve markdown documents and notebooks into structured data

**Authors:** Rowan Cockett <sup>1,2</sup> \
**Affiliations:** <sup>1</sup> Executable Books, <sup>2</sup> Curvenote \
**License:** CC-BY
```

This will produce a document that looks like:

:::{figure} ./images/frontmatter-before.png
:width: 80%
:label: frontmatter-before-pdf
:class: framed

The myst theme for the `01-paper.md` page using inline document and author information.
:::

🛠 In `01-paper.md`: Change the page frontmatter into a yaml block of _data_:

```yaml
---
title: How to MyST, without being mystified 🧙
subject: Tutorial
subtitle: Evolve your markdown documents into structured data
short_title: How to MyST
authors:
  - name: Rowan Cockett
    affiliations:
      - Executable Books
      - Curvenote
    orcid: 0000-0002-7859-8394
    email: rowan@curvenote.com
license: CC-BY-4.0
keywords: myst, markdown, open-science
---
```

In this case, we are also adding additional metadata like an ORCID, as well as ensuring the license is an SPDX compatible code.
Once these are added, the myst theme (in this case the `book-theme` template) can make it look pretty, this can also be customized by other themes, including $\LaTeX$ and Microsoft Word templates!

:::{figure} ./images/frontmatter-after.png
:width: 80%
:label: frontmatter-after
:class: framed

The myst theme for the `01-paper.md` page after the frontmatter changes are added. Compare this to what it looked like before in [](#frontmatter-before-pdf). The structure of the HTML page has also been improved, including meta tags that are available to search engines and other programmatic indexers.
:::

### Add an abstract part

We will also add metadata about the "parts" of our document, for example, the abstract.
This will be important when we export to PDF and also visually changes the `book-theme`.

🛠 In `01-paper.md`: move the abstract into the frontmatter using a multiline YAML syntax `abstract: |`

```{code-block} markdown
:linenos:
:emphasize-lines: 4,5
---
title: How to MyST, without being mystified 🧙
...
abstract: |
  We introduce, a set of open-source, community-driven ...
---
```

You can make other parts, like `data_availability` or `acknowledgments` or `keypoints`, templates will treat these differently and may require specific parts to fully render. See [document parts](./document-parts.md) for additional information.

### Add a citation

🛠 In `01-paper.md`: find the text citation for Bourne _et al._, 2012 (shown in `red` below), and change it to a `doi` based citation, as shown in `green` below:

```diff
- ... follow the FORCE11 recommendations (Bourne _et al._, 2012). Specifically:
+ ... follow the FORCE11 recommendations [](doi:10.4230/DAGMAN.1.1.41). Specifically:

1. rethink the unit and form of scholarly publication;
2. develop tools and technologies to better support the scholarly lifecycle; and
3. add data, software, and workflows as first-class research objects.
```

This will result in correct rendering of the citation (such as [](doi:10.4230/DAGMAN.1.1.41)), and automatic insertion into the references section.

🛠 In `01-paper.md`: find the text citation for Head _et al._ (2021), and change it to:

```bash
[](doi:10.1145/3411764.3445648)
```

If you have replaced both of these citations, you can now safely remove the text-only, poorly formatted references section, as that is now auto generated for you!

🛠 In `01-paper.md`: Remove the `## References` section with the two references (leave the links!)

This will have created a **References** section at the bottom of the page automatically!

:::{figure} ./images/references.png
:label: references
:class: framed

The references are shown automatically at the bottom of the page, and linked to the correct DOI source!
:::

:::{seealso}
See [](./citations.md) for more information about using citations and references sections, and how to have control over the bibliography sources or styles.
:::

### Add a figure directive

🛠 In `01-paper.md`: replace the image and paragraph with a figure directive.

Replace:

```markdown
![](./images/citations.png)
**Figure 1**: Citations are rendered with a popup directly inline.
```

with:

```markdown
:::{figure} ./images/citations.png
:label: citations
Citations are rendered with a popup directly inline.
:::
```

🛠 If you are up for it, in `01-paper.md` replace the rest of the images with figure directives!

:::{seealso}
See [](./figures.md) for more information about adding and referencing figures and images.
:::

### Add a cross-reference

🛠 In `01-paper.md`: replace the text "`Figure 1`" with a local link to the figure

```diff
- ... (see Figure 1).
+ ... (see [](#citations)).
```

The "`Figure 1`" text will be automatically filled in, for example, [](#figure-hover).

:::{figure} ./images/figure-hover.gif
:label: figure-hover
:width: 60%
:class: framed
When you cross-reference content in MyST, they become hover-references, allowing you to stay in context when you are reading.
Checkout the [phd thesis written in MyST](https://phd.row1.ca), with demos of references to math, figures, tables, code, and equations.
:::

:::{seealso}
See [cross-references](./cross-references.md) to learn about adding enumeration or overriding the link text. You can cross-reference anything in MyST -- including math, figures, tables, code, sections, paragraphs, demos and equations.
:::

## Conclusion 🥳

That's it for this quickstart tutorial!
You've just learned how to enrich your document with advanced MyST features for interactivity and open scholarship!

![](#quickstart-cards)
