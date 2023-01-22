---
title: Working with MyST Documents
subject: MyST Quickstart
subtitle: Export to PDF, Word and LaTeX
short_title: MyST Documents
description: Get up and running with the MyST (Markedly Structured Text) command line interface. MyST is designed to create publication-quality documents written entirely in Markdown.
---

::::{important}
**Objective**

The goal of this quickstart is to get you up and running on your local computer 👩‍💻, improve a markdown document to add MyST features, and then export to Microsoft Word 📄 and (if you have LaTeX installed) a scientific PDF template 📜.

The tutorial will be brief on explaining MyST syntax, we provide an [overview on MyST Markdown](./quickstart-myst-markdown.md) that provides more depth on syntax and pointers to other pages.
::::

## Installing the MyST CLI 📦

> 🛠 Throughout the guide, whenever you're supposed to _do_ something you will see a 🛠

:::{card} See MyST Installation Quickstart
:link: ./quickstart.md
See the first quickstart guide for installation walk-through and installation prerequisites.
:::

🛠 Install the MyST command line tools:

```bash
npm install -g myst-cli
```

If you have any problems, see [installing MyST](./installing.md) and or [open an issue here](https://github.com/executablebooks/mystjs/issues/new?assignees=&labels=bug&template=bug_report.yml). 🐛

## Download example content

We are going to download an example project that includes a few simple markdown files and some Jupyter Notebooks.
Our goal will be to try out some of the main features of `myst`, improve the structure of the document, learn the basics of MyST Markdown for figures, citations, and cross-references, and export to a Word document, PDF and $\LaTeX$.

🛠 Download the example content, and navigate into the folder:

```bash
git clone https://github.com/executablebooks/mystjs-quickstart.git
cd mystjs-quickstart
```

## Initialize MyST 🚀

Next we will create `myst.yml` configuration files that is required to render your project.

🛠 Run `myst`

The `myst` command is a shortcut for `myst init`, which has a few more options for writing specific parts of the configuration file and a table of contents for your site.

```text
> myst

Welcome to the MyST CLI!! 🎉 🚀

myst init walks you through creating a myst.yml file.

You can use myst to:

 - create interactive websites from markdown and Jupyter Notebooks 📈
 - build & export professional PDFs and Word documents 📄

Learn more about this CLI and MyST Markdown at: https://myst.tools

💾 Writing new project and site config file: myst.yml
```

🛠 When prompted, type `No`

```bash
? Would you like to run "myst start" now? No
```

:::{seealso}
To explore `myst start` see the quickstart guide on [](./quickstart-myst-websites.md)!

In this quickstart guide we will focus on creating printed documents!
:::

## Use MyST Markdown! 🎉

Next we will improve the contents of the `01-paper.md`, including the frontmatter, creating a "part" for the abstract, adding citations, figures, and cross-references.

### Improve the frontmatter

🛠 Open `01-paper.md` in a text editor

The start of the file includes information about the title, subtitle, author, affiliations and license.
Unfortunately, this way of including this information is not easily machine-readable[^fair], and focuses more on style/typography than on metadata.

[^fair]: [FAIR principles](https://www.go-fair.org/fair-principles/) are at the heart of open-science, and aim to **F**indability, **A**ccessibility, **I**nteroperability, and **R**euse of digital assets. For a resource to be finable, it must be machine-readable!

```markdown
# How to MyST, without being mystified 🧙

A tutorial to evolve markdown documents and notebooks into structured data

**Authors:** Rowan Cockett<sup>1,2</sup> \
**Affiliations:** <sup>1</sup>Executable Books, <sup>2</sup> Curvenote \
**License:** CC-BY
```

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
Once these are added, the `book-theme` template can make it look pretty, this can also be customized by other themes, including $\LaTeX$ and Microsoft Word templates!

:::{figure} ./images/frontmatter-after.png
:width: 80%
:name: frontmatter-after

The myst theme for the `01-paper.md` page after the frontmatter changes are added. Compare this to what it looked like before in [](#frontmatter-before). The structure of the HTML page has also been improved, including meta tags that are available to search engines and other programmatic indexers.
:::

### Add an abstract block

We will also add data about the "parts" of our document, for example, the abstract. This will be important when we export to PDF and also visually changes the `book-theme`.

🛠 In `01-paper.md`: surround the abstract in a block `+++ {"part": "abstract"}`

```{code-block} markdown
:linenos:
:emphasize-lines: 1,5
+++ {"part": "abstract"}

We introduce, a set of open-source, community-driven ...

+++
```

You can make other blocks, like `data-availability` or `acknowledgements` or `key-points`, templates will treat these differently and may require specific parts to fully render.

### Add a citation

🛠 In `01-paper.md`: find the text citation for Bourne _et al._, 2012, and change it to [](doi:10.4230/DAGMAN.1.1.41)

```diff
- ... follow the FORCE11 recommendations (Bourne _et al._, 2012). Specifically:
+ ... follow the FORCE11 recommendations [](doi:10.4230/DAGMAN.1.1.41). Specifically:

1. rethink the unit and form of scholarly publication;
2. develop tools and technologies to better support the scholarly lifecycle; and
3. add data, software, and workflows as first-class research objects.
```

🛠 In `01-paper.md`: find the text citation for Head _et al._ (2021), and change it to [](doi:10.1145/3411764.3445648)

If you have replaced both of these citations, you can now safely remove the text-only, poorly formatted references section, as that is now auto generated for you!

🛠 In `01-paper.md`: Remove the `## References` section with the two references (leave the links!)

This will have created a **References** section at the bottom of the page automatically!

:::{figure} ./images/references.png
:name: references
The references are shown automatically at the bottom of the page, and linked to the correct DOI source!
:::

:::{seealso}
See [](./citations.md) for more information about using citations and references sections, and how to have control over the bibliography sources or styles.
:::

### Add a figure directive

🛠 In `01-paper.md`: replace the image and paragraph with a figure directive

```markdown
![](./images/citations.png)
**Figure 1**: Citations are rendered with a popup directly inline.
```

```markdown
:::{figure} ./images/citations.png
:name: citations
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
:name: figure-hover
:width: 60%
When you cross-reference content in MyST, they become hover-references, allowing you to stay in context when you are reading.
Checkout the [phd thesis written in MyST](https://phd.row1.ca), with demos of references to math, figures, tables, code, and equations.
:::

:::{seealso}
See [cross-references](./cross-references.md) to learn about adding enumeration or overriding the link text. You can cross-reference anything in MyST -- including math, figures, tables, code, sections, paragraphs, demos and equations.
:::

## Export Documents 📜

Next we will start to add information to be able to export to both PDF and Word documents!

::::{warning}
:class: dropdown

# Exporting to Word & PDF destroys metadata! 😵‍💫

MyST has _excellent_ support for many different journal types and pre-prints.
See [](./creating-pdf-documents.md) for a list of the templates!
We have put years of work into making this great and work for you! 👍

_However_, when you export to $\LaTeX$ or Microsoft Word, these programs are designed for static, print documents.
$\LaTeX$, for example, is heavily focused on typographic **style**
rather than preserving metadata -- how the page **looks** is more important than the data.

These choices lead to many challenges of post-processing PDF documents to get out the actual data:
_content, authors, citations, cross-references, equations_. \
This data is critically important for modern, networked science, and powering meta-research of scientific fields!

MyST can also export to other formats directly, such as [JATS](./creating-jats-xml.md) ([Journal Article Tag Suite](https://jats.nlm.nih.gov/)), which is what most scientific documents end up as when they are published.

```{mermaid}
flowchart LR
  A{MyST} --> |destroy data|B(PDF) --> C(JOURNAL) --> |recreate data|D{JATS}
  A --> D
```

By writing in MyST, you can export directly to these formats.
Using MyST will also allow you to support interactive, computational media -- things that will **never** make it to the PDF!!
::::

### Microsoft Word Documents

🛠 In the `01-paper.md` frontmatter: add `export: docx`

```yaml
---
export: docx
---
```

🛠 Run `myst build --docx`

The export process will run for any known files with `docx`, an equivalent command for this specific file is:\
`myst build 01-paper.md`\
By default, the build command only builds the site content, to build all exports for the project, use:\
`myst build --all`

```text
📬 Performing exports:
   01-paper.md -> _build/exports/paper.docx
📖 Built 01-paper.md in 247 ms.
🔍 Querying template metadata from https://api.myst.tools/templates/docx/myst/default
🐕 Fetching template from https://github.com/myst-templates/docx_default/archive/refs/heads/main.zip
💾 Saved template to path _build/templates/docx/myst/default
📄 Exported DOCX in 166 ms, copying to _build/exports/paper.docx
```

In this case, the default word template was used, we will see in working with $\LaTeX$ next, how to add additional exports as well as change the template!

:::{figure} ./images/export-docx.png
:name: export-docx
:width: 80%
Exporting your article to `docx` using `myst export --docx`.
:::

:::{seealso}
See [](./creating-word-documents.md) to learn about exporting to `*.docx`, for example some intricacies around equations!
:::

### Exporting to PDF

To export to PDF, MyST currently requires $\LaTeX$ to be installed. See [](./creating-pdf-documents.md) for more information about how to install $\LaTeX$.
First, we need to know which template to export to, for this, we will use the `myst templates` command, and for example listing all the two-column, PDF templates.

🛠 List all two column PDF templates with: `myst templates list --pdf --tag two-column`

```text
arXiv (Two Column)       arxiv_two_column
Description: A two column arXiv compatible template
Tags: paper, two-column, preprint, arxiv, bioarxiv, eartharxiv

Volcanica                volcanica
Description: A template for submissions to the Volcanica journal
Tags: paper, journal, two-column, geoscience, earthscience
```

🛠 List the specific information needed for a template: `myst templates list volcanica --pdf`

```text
Volcanica                volcanica
ID: tex/myst/volcanica
Version: 1.0.0
Authors: Volcanica
Description: A template for submissions to the Volcanica journal
Tags: paper, journal, two-column, geoscience, earthscience

Parts:
abstract (required) - No description
acknowledgments - No description
author_contributions - No description
data_availability - Links to data repositories, and/or a statement...

Options:
article_type (choice) - Details about different article types...
```

🛠 In `01-paper.md`: replace `export: docx` with a list:

```yaml
---
exports:
  - format: docx
  - format: pdf
    template: volcanica
    article_type: Report
---
```

We have added additional information to the second PDF export, to specify the template as well as add additional information about the `article_type`, which is information we discovered when listing the template above!
You can now build the PDF with the `myst build` command:

🛠 Run `myst build 01-paper.md`

```text
📬 Performing exports:
   01-paper.md -> _build/exports/paper.docx
   01-paper.md -> _build/exports/paper.pdf
🌠 Converting 3 GIF images to PNG using imagemagick
📖 Built 01-paper.md in 257 ms.
📄 Exported DOCX in 205 ms, copying to _build/exports/paper.docx
📑 Exported TeX in 5.11 ms, copying to _build/temp/myst8BVu1k/paper.tex
🖨 Rendering PDF to _build/temp/mystvUibhD/paper.pdf
📄 Exported PDF in 9.3 s, copying to _build/exports/paper.pdf
```

You can now see your two-column PDF in a submission ready format for the journal. It is very easy to change the template to a different format -- just change the `template:`!
Notice also that the PDF has converted dynamic images to a static alternative (e.g. GIFs are now PNGs).

:::{figure} ./images/export-pdf.png
:name: export-pdf
:width: 80%
Exporting the article to a two column PDF with appropriate metadata to submit to a Journal.
:::

:::{seealso}
See [](./creating-pdf-documents.md) to learn about exporting to PDF, installing $\LaTeX$, and working with local templates.
:::

### Exporting to $\LaTeX$

If you would like to see the $\LaTeX$ source, you can look in the `_build/temp` directory, or you can update the

🛠 In `01-paper.md`: replace `format: pdf` with `format: tex`. Specify the output location as a zip file.

```{code-block} yaml
:linenos:
:emphasize-lines: 4,7
---
exports:
  - format: docx
  - format: tex
    template: volcanica
    article_type: Report
    output: arxiv.zip
---
```

🛠 Run `myst build 01-paper.md`

You should see these two additional lines:

```text
📑 Exported TeX in 4.87 ms, copying to _build/exports/paper_tex/paper.tex
🤐 Zipping tex outputs to arxiv.zip
```

Without specifying the `output:` location, this will copy the unzipped contents into the `_build/exports` folder along with all other exports.
Creating a zip file can be helpful when directly submitted to the arXiv or a journal!

## Conclusion 🥳

That's it for this quickstart guide!! In the next tutorial we will have more information about working with Jupyter Notebooks, and sharing outputs and cells between your documents!
As next steps for working with documents, we recommend looking at:

:::{card} MyST Markdown Overview
:link: ./quickstart-myst-markdown.md
A high-level of all of the syntax available to your for working with the MyST Markdown language.
:::
