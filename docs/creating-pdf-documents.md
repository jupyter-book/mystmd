---
title: Scientific PDFs
description: Export to over 400 journal templates from a MyST Markdown file, which uses LaTeX and can create print-ready, multi-column, professional PDF documents.
---

You can render your MyST documents as print-ready scientific papers, by converting to $\LaTeX$ and render to over 400 journal templates already available. Alternatively, you can also render your documents as Beamer presentations or as [Microsoft Word](./creating-word-documents.md) to share with other collaborators.

```{figure} ./images/pdf-exports.png
:name: fig-export-to-pdf
:width: 100%

Export to over 400 journal templates from a MyST Markdown file, which uses $\LaTeX$ and can create print-ready, multi-column, professional PDF documents.
```

## Exporting to PDF

To create a new `pdf` export type for your MyST document, in your document frontmatter, add an `exports` list:

(export-frontmatter-pdf)=

```yaml
---
title: My PDF
exports:
  - format: pdf
    template: arxiv_two_column
    output: exports/my-document.pdf
---
```

To build the exports, use the `myst build` command, which will work with your [project structure](./project-overview.md) if it exists and create a document in the output path that you specify.

```{danger}
This is currently exposed as `myst export pdf my-document.md`, and will be updated to `myst build` in the future.
```

```bash
myst build my-document.md
```

Based on the `output` field in the export list in the [frontmatter](#export-frontmatter-pdf), the PDF and a log file will be written to `exports/my-document.pdf` and any associated log files. If the output file is a folder, the document name will be used with a `.pdf` or `.tex` extension, as appropriate. Any necessary auxilary files (e.g. for example `*.png` or `*.bib`) will be added to the base folder (`exports/` above).

## Rendering PDFs with $\LaTeX$

```{danger}
:class: dropdown
# PDF exports require $\LaTeX$ to be installed

The default PDF renderer uses $\LaTeX$ to create PDFs, which means that to work locally you will need to [](#install-latex). `mystjs` will warn you if it cannot find a $\LaTeX$ environment, as well as forcing the build process and reporting any errors.
```

The rendering process for scientific PDFs uses $\LaTeX$ and makes use of the [`jtex`](myst:jtex) templating library, to convert to $\LaTeX$ the [`myst-to-tex`](myst:myst-to-tex) packages is used. The libraries work together with `mystjs` for sharing information about [frontmatter](./frontmatter.md) (e.g. title, keywords, authors, and affiliations).

```{mermaid}
flowchart LR
  A[Jupyter Notebook] --> C
  B[MyST Markdown] --> C
  C(mystjs) --> D{AST}
  D --> E[jtex] --> G[LaTeX]
  D --> F[myst-to-tex] --> G
  G --> H[PDF]
```

To include the $\LaTeX$ source code as well as the included images, change the `format` to:

`tex`
: create a folder containing the $\LaTeX$ source code, referenced images, citation files, and any class files required by the template.

`tex+pdf`
: create a folder containing all the same outputs as `tex` as well as run the build process for the `pdf`.

`pdf`
: Run the above processes in a temporary folder, and only copy in the PDF export and any log files if there are problems.

(install-latex)=

### Install $\LaTeX$

See the official documentation for installation instructions for $\LaTeX$ at:

- <https://www.latex-project.org/get/>

Ensure that you download a full distribution with appropriate libraries installed.

% Probably a note in the future about running this remotely?

## Choosing a Template

There are currently 422 journals supported[^journals] and it is straghtforward to add new personal templates, or contribute them back to the community.

[^journals]: As of September 15, 2022.

    This is the total number of _journals_ that can be created from MyST, which is a higher number than the number of _templates_, as some templates support many different journal exports. As we add more templates we will probably switch this number to templates, which is closer to 15, but that doesn't sound as impressive out of the gate. 🚀

To list all of the public tempaltes, use the `myst templates` command:

```bash
myst templates --format pdf --tag two-column

> arXiv (Two Column)       arxiv_two_column
> Description: A two column arXiv compatible template
> Tags: paper, two-column, preprint, arxiv, bioarxiv, eartharxiv
>
> ...
```

Once you have found a template, you can list detailed information about the parts and options that the template exposes using:

```
myst templates arxiv_two_column

> ID: public/arxiv_two_column
> Version: 1.0.0
> Author: Brenhin Keller
> Description: A two column arXiv compatible template
> Tags: paper, two-column, preprint, arxiv, bioarxiv, eartharxiv
>
> Parts
> abstract (required) - Keep it short — abstracts longer than 1920 characters will not be accepted ...
>
> Options
> line_numbers (boolean) - Turn line numbers on in the PDF
```

There are two ways to provide information to a template, through `parts` and `options`.

## Template `parts`

The `parts` of a template are things like `abstract`, `acknowledgments` or `data_availability`, they are usually written pieces of a document, but are placed specifically in a template. For example, an abstract usually has a place in templates, with a box or other typographic choices applied. These parts can be marked as `required`, and will raise error in the PDF export process, however, myst will always try to complete the build.

A `part` of a template is defined using metadata on a MyST [block](./blocks.md):

```markdown
+++ { "part": "abstract" }

MyST (Markedly Structured Text) is designed to create publication-quality documents
written entirely in Markdown. The markup and publishing build system is fantastic,
MyST seamlessly exports to any PDF template, while collecting metadata to make your
writing process as easy as possible.

+++

# Introduction
```

### Template `options`

Template authors should choose to use [standard frontmatter](./frontmatter.md) properties where possible, however, all templates can also expose custom options through their [](../packages/jtex/docs/template-yml.md). Include options for the build in the exports list. For example, to turn on `line_numbers` in the template, add the option to the dictionary.

```{code-block} yaml
:linenos:
:emphasize-lines: 7
---
title: My PDF
exports:
  - format: pdf
    template: arxiv_two_column
    output: exports/my-document.pdf
    line_numbers: true
---
```

Any unrecognized, or malformed entries will be logged as errors as well as required options that are not provided.

## Creating a Template

The export list can also point to local templates, for $\LaTeX$ these are built using [`jtex`](myst:jtex), and you can learn more about how to create a template for: [any $\LaTeX$ document](../packages/jtex/docs/create-a-latex-template.md) and [Beamer presentations](../packages/jtex/docs/create-a-beamer-template.md).

To make use of the template locally, validate it using `jtex check` and then point to the template folder in your export:

```{code-block} yaml
:linenos:
:emphasize-lines: 5
:caption: The template can be a path to a `jtex` template, which contains a `template.yml` and `template.tex` as well as any other `cls` or `def` files.
---
title: My PDF
exports:
  - format: pdf
    template: ../templates/my-template
    output: exports/my-document.pdf
---
```

Please consider [contributing your template](../packages/jtex/docs/contribute-a-template.md) to the growing list of templates so that other people can benefit and improve your work!
