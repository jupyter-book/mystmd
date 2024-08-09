---
title: Export Static Documents
subject: MyST Quickstart Tutorial
subtitle: Export to Markdown, PDF, Word and LaTeX
description: Get up and running with the MyST (Markedly Structured Text) command line interface. MyST is designed to create publication-quality documents written entirely in Markdown.
---

This tutorial covers how to add metadata and export to both PDF and Word documents!

:::{note} Goals and prerequisites
**Goals**: This tutorial covers how to export MyST documents to static outputs like Microsoft Word 📄 and (if you have LaTeX installed) a scientific PDF template 📜.

**Prerequisites**: This assumes you've completed [](./quickstart.md) and have MyST installed locally, as well as a local version of the [MyST quickstart content](https://github.com/jupyter-book/mystmd-quickstart). We also recommend completing [](./quickstart-myst-documents.md).
:::


````{note} See the video tutorial 📺
:class: dropdown
This video covers [](./quickstart-myst-documents.md) as well as the material on this page.

```{iframe} https://www.youtube.com/embed/NxSNVt9XsCI
:width: 100%
```
````
![](#lookout-for-tutorial-actions)

::::{warning} Exporting to Word & PDF destroys metadata! 😵‍💫
:class: dropdown

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

Help support the transition to FAIR[^fair], open science by preferring web-based formats and publishing your own work on the web.

::::

## Export to Microsoft Word

🛠 In the `01-paper.md` add `export: docx` to the existing frontmatter section:

```yaml
---
export: docx
---
```

🛠 Run `myst build --docx`

```bash
myst build --docx
```

The export process will run for any known files with `docx` specified in the `export` frontmatter. An equivalent command to export only this specific file is:\
`myst build 01-paper.md`

```text
📬 Performing exports:
   01-paper.md -> _build/exports/paper.docx
📖 Built 01-paper.md in 247 ms.
🔍 Querying template metadata from https://api.mystmd.org/templates/docx/myst/default
🐕 Fetching template from https://github.com/myst-templates/docx_default/archive/refs/heads/main.zip
💾 Saved template to path _build/templates/docx/myst/default
📄 Exported DOCX in 166 ms, copying to _build/exports/paper.docx
```

In this case, the default word template was used, resulting in a document formatted like this:

:::{figure} ./images/export-docx.png
:label: export-docx
:width: 80%
Exporting your article to `docx` using `myst export --docx`.
:::

Next we will see how to change the template as well as how to add additional exports when working with $\LaTeX$ and PDF!

:::{seealso}
See [](./creating-word-documents.md) to learn about exporting to `*.docx`, for example some intricacies around equations!
:::

## Export to PDF with Latex

To export to PDF with $\LaTeX$, first ensure it is installed, see [](./creating-pdf-documents.md) for more information.

First, we need to decide which template to export to, for this, we will use the `myst templates` command, and for example list all the two-column, PDF templates available.

🛠 List all two column PDF templates with:\
`myst templates list --pdf --tag two-column`

```text
arXiv (Two Column)       arxiv_two_column
Description: A two column arXiv compatible template
Tags: paper, two-column, preprint, arxiv, bioarxiv, eartharxiv

Volcanica                volcanica
Description: A template for submissions to the Volcanica journal
Tags: paper, journal, two-column, geoscience, earthscience
```

🛠 Then, list the specific information needed for a template:\
`myst templates list volcanica --pdf`

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

In addition basic information on the template, the template's specific "parts" and "options" are shown. Some of these may be marked as `(required)` and be essential for the building the document correctly with the template.

🛠 In `01-paper.md` create an exports list with `docx` and `pdf` formats.

```yaml
---
exports:
  - format: docx
  - format: pdf
    template: volcanica
    article_type: Report
---
```

We have added a second export target for `pdf` and included additional information to specify the template, as well as set the `article_type` option, which is information we discovered when listing the template above! We also saw this template supports a number of "parts" including a required `abstract` part, but as we already added an `abstract` part earlier in this tutorial, we are good to go.

You can now build the exports with the following command:

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

````{warning}
:class: dropdown
**Install `imagemagick` to convert GIFs**

Animated images are not well supported by the PDF format, and MyST converts the first frame to a static image.
To do the conversion you need to [download and install `imagemagick`](https://imagemagick.org/), for example:

```bash
# on Mac OS
brew install imagemagick
# on Ubuntu
apt install imagemagick
```
````

```{warning}
:class: dropdown
**Emojis aren't rendered in PDF 😭**

We are tracking [emoji support](https://github.com/jupyter-book/mystmd/issues/217), if you think this feature is important and want to help out, we would love your help. 💚 🦺 🪚 🧱 🏗 🚀

In the screenshot below we have removed the 🧙 emoji, which ... also works.
```

You can now see your two-column PDF in a submission ready format for the journal (check the `_build/exports` folder). It is very easy to change the template to a different format -- just change the `template:` field in the frontmatter!
Notice also that the PDF has converted dynamic images to a static alternative (e.g. GIFs are now PNGs).

:::{figure} ./images/export-pdf.png
:label: export-pdf
:width: 80%
Exporting the article to a two column PDF with appropriate metadata to submit to a Journal.
:::

:::{seealso}
See [](./creating-pdf-documents.md) to learn about exporting to PDF, installing $\LaTeX$, and working with local templates.
:::

## Export to $\LaTeX$

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

## Export to Markdown

🛠 In `01-paper.md` create an exports list with `docx`, `pdf` and `md` formats.

```yaml
---
exports:
  - format: docx
  - format: pdf
    template: volcanica
    article_type: Report
  - format: md
---
```

You can now build the exports with the following command:

🛠 Run `myst build 01-paper.md`

```text
📬 Performing exports:
   01-paper.md -> _build/exports/paper.docx
   01-paper.md -> _build/exports/paper.pdf
   01-paper.md -> _build/exports/paper.md
🌠 Converting 3 GIF images to PNG using imagemagick
📖 Built 01-paper.md in 257 ms.
📄 Exported DOCX in 205 ms, copying to _build/exports/paper.docx
📑 Exported TeX in 5.11 ms, copying to _build/temp/myst8BVu1k/paper.tex
🖨 Rendering PDF to _build/temp/mystvUibhD/paper.pdf
📄 Exported PDF in 9.3 s, copying to _build/exports/paper.pdf
📄 Exported MD in 205 ms, copying to _build/exports/paper.md
```

## Conclusion 🥳

That's it for this quickstart tutorial!!

![](#quickstart-cards)