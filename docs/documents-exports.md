---
title: Exporting overview
description: Create an export for PDF, LaTeX, Typst, Docx, JATS, or CITATION.cff in your page or project frontmatter, and use `myst build` to build the export.
---

You can export MyST content into one or more static documents, and optionally bundle them with a MyST website. This section gives an overview of the Exporting process and major configuration options.

(types-of-exports)=
## List of formats you can export

Below are supported export types and links to documentation for further reading:

```{list-table} Frontmatter Export Formats
:header-rows: 1
:label: table-export-docs
- * Export type
  * Learn more
- * `pdf`
  * [](./creating-pdf-documents.md)
- * `tex`
  * [](./creating-pdf-documents.md)
- * `typst`
  * [](./creating-pdf-documents.md)
- * `JATS`
  * [](./creating-jats-xml.md)
- * `Microsoft Word`
  * [](./creating-word-documents.md)
- * `CITATION.cff`
  * [](./creating-citation-cff.md)
- * `MyST Markdown`
  * [](#export:myst)
```

## Configuration options for exports

There are a few options you can use to configure exports:

```{list-table}
- - Option
  - Description
- - `format`
  - The type of export you'll create. For examples, see [](#types-of-exports).
- - `template`
  - The template to use for the export. For more information, see [](#export-templates).
- - `output`
  - The output file to be created.
- - `id`
  - A unique identified for the output, in case you want to [re-use exports later](#reuse-export-outputs).
- - `articles`
  - One or more source files to use in the export (you can [use `article` as well](#articles-or-article)). If using [page frontmatter](#exports-page-frontmatter), it will default to the current document.
- - `toc`
  - If exporting from a multi-page book, the [Table of Contents](./table-of-contents.md) that defines the book structure.
```

You can configure export options in two different places:

(exports-page-frontmatter)=
**In page frontmatter**:

```{code-block} yaml
:filename: my-markdown-file.md
---
title: My PDF
exports:
  - format: pdf
    template: arxiv_two_column
    output: exports/my-document.pdf
---
```

**In your `myst.yml` configuration**. In this case you will need to specify the `article` (or `articles`) that you are targeting. For example, here's how you'd configure an export from a single-page document.

```{code-block} yaml
:filename: myst.yml
version: 1
project:
  exports:
    - format: pdf
      template: arxiv_two_column
      article: my-markdown-file.md
      output: exports/my-document.pdf
```

(articles-or-article)=
:::{note} You can use either `article:` or `articles:`
MyST will let you use either one of these options, to make the `myst.yml` configuration more readable.
:::

(export-templates)=
## Choose a template

The exporting process uses a **MyST Template** [MyST Template](https://github.com/myst-templates) to transform the {term}`MyST AST` into an output format. MyST Templates are written for a specific export `format`. A MyST Renderer converts MyST AST into components that a template can use to export a final output.

You can choose the template for a given export format with the `template` argument.
There are several template names you can use out of the box[^api-server].
For a list of community templates you can use, see [the MyST Templates table](https://github.com/myst-templates#templates) in the [`myst-templates`] GitHub organization.

[^api-server]: These are resolved by the [MyST API server](#myst-api-server).

You can also use a URL that points directly to a template. For example:

```yaml
- format: typst
  id: typstpdf
  template: https://github.com/rowanc1/typst-book.git
  articles:
    - page1.md
    - page2.md
  output: ./_build/pdf/typst-report.pdf
```

### The `myst-templates` GitHub organization

The [`myst-templates` GitHub organization](https://github.com/myst-templates) has a collection of MyST templates that are contributed and maintained by the community. If you'd like to create your own template, this is a good starting point.

## Build one or more exports

After defining `exports` in your frontmatter, you may build them with the `myst build` command, by default this only builds the site.
You can configure the CLI command in a number of ways:

`myst build --all`
: Build all exports in the project

`myst build --pdf --docx`
: Build `pdf` (LaTeX or Typst) exports and `docx` in the project

`myst build my-paper.md`
: Build all exports in a specific page

`myst build my-paper.md --pdf`
: Build all `pdf` exports in a specific page

(reuse-export-outputs)=
## Re-use export outputs for download buttons

You can re-use exported artifacts by setting an `id:` in your export configuration.
Then, reference that ID in [your `downloads:` configuration](#download-link).

## Export Configuration

The following table shows the available properties for each export. You must define at least one of `format`, `output`, or `template` for MyST to be able to perform your output. You may also specify a string instead of a full export object; this string will be inferred to be either the export format or the output filename. The table below is from [](#frontmatter:exports).

![](#table-frontmatter-exports)

```{seealso} Exposing Exports as Downloads
You can also include exported documents as downloads in your site, see [](./website-downloads.md).
```

## Split your document across multiple content files

When writing longer documents like manuscripts, it's common to write your document in multiple parts and then stitch them together into a single narrative.
You can accomplish this in MyST with the {myst:directive}`include` directive.

See [](#docs:include) for more information.

(export:myst)=

## Export MyST Markdown from another document format

MyST can parse some non-MyST document formats as well.
This makes it possible to convert something _into MyST Markdown_.

For example, to convert LaTeX into MyST Markdown, use the following command:

```
myst build doc.tex --md
```
