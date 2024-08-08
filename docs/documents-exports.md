---
title: Exporting documents
description: Create an export for PDF, LaTeX, Typst, Docx, JATS, or CITATION.cff in your page or project frontmatter, and use `myst build` to build the export.
---

You may define desired static exports in page or project frontmatter. In the export object, you may specify a `filename`, `format`, and/or `template`, as well as the article(s) you wish to include in your export. You may also provide any additional options required by your template in the export object.

## Types of documents you can export

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
```

```{seealso} The MyST templating engine drives document exports
You can also explore the [MyST templating](xref:jtex) documentation for a deeper dive into defining templates.
```

## Building Exports

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
