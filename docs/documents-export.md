(exports)=
# Exporting documents

You may define desired static exports in page or project frontmatter. In the export object, you may specify a filename, format, and/or template, as well as the article(s) you wish to include in your export. You may also provide any additional options required by your template in the export object.

Below are supported export types and links to documentation for further reading:


```{list-table} Frontmatter download definitions
:header-rows: 1
:name: table-export-docs
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
```

```{seealso} The MyST templating engine drives document exports
You can also explore the [MyST templating](myst:jtex) documentation for a deeper dive into defining templates.
```

After defining `exports` in your frontmatter, you may build them with the `myst build` [CLI command](./quickstart-myst-documents.md).

The following table shows the available properties for each export. You must define at least one of `format`, `output`, or `template` for MyST to be able to perform your output. You may also specify a string instead of a full export object; this string will be inferred to be either the export format or the output filename.

See the table below from [](#frontmatter:exports).

![](#table-frontmatter-exports)

```{seealso} You can include exported documents as downloads in your site!
See [](#downloads).
```