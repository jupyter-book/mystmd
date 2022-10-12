---
title: Microsoft Word
description: Export to Microsoft Word directly from MyST Markdown.
---

You can render your MyST documents as Microsoft Word documents.

```{figure} ./images/word-export.png
:name: fig-export-to-word
:width: 50%

Export to a Microsoft Word document to easily share with your colleagues.
```

```{seealso}
# PDF and $\LaTeX$ export

You can also export your MyST documents as print-ready [scientific papers](./creating-pdf-documents.md) which use $\LaTeX$ and render to over [400 journal templates](./creating-pdf-documents.md).
```

## Exporting to Word

To create a new `docx` export type for your MyST document, in your document frontmatter, add an `exports` list:

(export-frontmatter-word)=

```yaml
---
title: My Document
exports:
  - format: docx
    output: exports/my-document.docx
---
```

To build the exports, use the `myst build` command, which will work with your [project structure](./project-overview.md) if it exists and create a document in the output path that you specify.

```{danger}
This is currently exposed as `myst export docx my-document.md`, and will be updated to `myst build` in the future.
```

```bash
myst build my-document.md
```

Based on the `output` field in the export list in the [frontmatter](#export-frontmatter-word), the PDF and a log file will be written to `exports/my-document.docx`.

````{warning}
:class: dropdown
# When opening, click **Yes** to "Accept Links"

The default export creates links for cross references and citations, and the first time this is opened Microsoft Word asks you if you would like to link these. **Click Yes**.

```{figure} ./images/export-word-link.png
:name: export-word-link
:width: 40%

Allow word to fix links for cross-references and citations.
```
````

## Math and Equations

Currently MyST export does not fully create math in Word's format, instead, $\LaTeX$ is used, which can easily be converted inside of Word.

1. Select any equation and open the equation toolbar
2. Click `LaTeX`
3. In the conver dropdown, select "All - Professional"
4. Click convert

```{figure} ./images/convert-word-equations.png
:name: convert-word-equations
:width: 100%

To fix equations in Word, use the equation toolbar to select `LaTeX` and from the dropdown select, all professional, then click convert.
```

## Rendering Word with `myst-to-docx`

The rendering process for word documents uses the [`myst-to-docx`](myst:myst-to-docx) package. The library works together with `mystjs` for sharing information about [frontmatter](./frontmatter.md) (e.g. title, keywords, authors, and affiliations).

```{mermaid}
flowchart LR
  A[Jupyter Notebook] --> C
  B[MyST Markdown] --> C
  C(mystjs) --> D{AST}
  D --> E[myst-to-docx]
  E --> G[docx]
```

## Word Templates

We are looking for contributions in this area to improve Microsoft Word export, please reach out if you want to help!
