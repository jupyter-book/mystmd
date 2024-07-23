---
title: Writing in LaTeX
description: MyST supports the parsing and rendering of LaTeX documents and included snippets.
---

The majority of our authoring documentation is on the MyST markup language, however, the `mystmd` CLI _also_ supports the parsing and rendering of LaTeX documents and included snippets. Supporting LaTeX streamline the transition for authors who are familiar with LaTeX and allows them to publish their work in web-based formats.

Authors can write and edit in LaTeX, then utilize MyST to generate dynamic web content or structured outputs without altering the original LaTeX source. This MyST parsing of LaTeX is **fast** compared to traditional LaTeX compilers[^speed] and this speed of rendering means instant previews and fast feedback to what you are writing. Additionally, as MyST is developed entirely in JavaScript, MyST's LaTeX parser and renderer can operate client-side, opening new possibilities for web-based LaTeX editing and rendering applications.

[^speed]: The entire rendering process can run in a few hundred milliseconds from start to finish rather than around 3-10 seconds for small documents using common renderers. The papers we were testing while writing these docs are about ⚡️ 16 times faster ⚡️ - which is **significant**, and there is lots of room for improvement in MyST as well!

## Getting Started

To begin rendering LaTeX documents with MyST, first [install the MyST CLI](./installing.md). Navigate to your project directory containing LaTeX (`*.tex`) files and execute the commands `myst init` followed by `myst start`. This launches a dynamic web server that renders your LaTeX content in near real-time, with comprehensive error reporting for issues such as unrecognized macros or any other math rendering problems.

:::{figure} ./images/latex-preview.png
:label: fig:latex-preview
:class: framed
The MyST server will serve the preview of your document and show live changes.
:::

## Approach

To understand the limitations of using LaTeX with MyST, here we spend some time explaining the approach. MyST is a stand-alone $\LaTeX$ parser and renderer. The [`@unified-latex`](https://github.com/siefkenj/unified-latex) library is used for parsing `*.tex` files, and includes rich information about source-code positions which are used in the [error messages](#latex-error-reporting). This token stream has some information about basic commands, but is primarily focused on the structure of the markup — arguments, brackets, nesting, whitespace. The `parse` step uses `tex-to-myst` to convert this token stream into an abstract syntax tree (AST), which is transformed as usual.

````{figure}
:label: fig:latex-pipe
```{mermaid}
flowchart LR
  TEX(LaTeX) --> parse
  parse[tex-to-myst] --> AST
  AST{AST} --> React
  React[myst-to-react] --> W[Interactive HTML]
  AST --> H[Typst] --> pdf[PDF]
  AST --> jats[JATS XML]
```
The process of parsing and rendering LaTeX with MyST. The LaTeX content can be transformed into other modern PDF renders such as Typst or rendered online with the current MyST content.
````

### Limitations

While MyST effectively handles a wide range of LaTeX documents, particularly scientific articles, it is not a full LaTeX renderer and is not aspiring to be one. As such, there will always be limitations on this approach, however, we believe supporting LaTeX is effective as a transition towards semantic and web-first authoring approaches like MyST Markdown.

## Supported Environments and Macros

The following packages are supported and includes common typography, figures, tables, code and algorithms.
The MyST team will extend functionality for highly-used packages and conventions,
if you have a package that you think we should support, please [open an issue](https://github.com/jupyter-book/mystmd/issues).

:::{myst:tex-list}
:::

(latex-error-reporting)=

## Error Reporting

MyST improves upon traditional LaTeX error messaging by providing specific, actionable feedback. Error messages include line and column numbers for direct navigation to issues, significantly reducing troubleshooting time. This feature, coupled with the ability to render partial documents despite errors, can ensures a smoother writing and revision process.

:::{figure} ./images/latex-errors.png
:label: fig:latex-errors
Error messages and warnings are specific and actionable using MyST.
:::
