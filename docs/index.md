---
title: MyST Javascript Tools
description: MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown.
---

`mystjs` is a set of open-source tools designed for scientific communication

## Goals

- `mystjs` is a Javascript implementation for MyST markdown
- Parse MyST into a standardized [AST](wiki:Abstract_Syntax_Tree), that follows [the MyST Spec](https://spec.myst.tools)
- Translate MyST into:
  - HTML for static websites
  - React for interactive websites
  - PDFs and $\LaTeX$ documents, with [specific templates for over 400 journals](./creating-pdf-documents.md)
  - Beamer $\LaTeX$ presentations
  - Microsoft Word [export](./creating-word-documents.md)
- Expose an opinionated set of transforms to improve document structure
- Expose extension points in MyST for new roles/directives
- Provide functionality for [cross-referencing](./cross-references.md), [external structured links](./external-references.md), and [scientific citations](./citations.md)

```{mermaid}
flowchart LR
  A[Jupyter Notebook] --> C
  B[MyST Markdown] --> C
  C(mystjs) --> D{AST}
  D --> E[LaTeX]
  E --> F[PDF]
  D --> G[Word]
  D --> H[React]
  D --> I[HTML]
```

```{important}
For integration with **Sphinx**, use the Python implementation for MyST or JupyterBook, which can be found at:

- [MyST Python Parser for Sphinx](https://myst-parser.readthedocs.io/en/latest/)
- [JupyterBook](https://jupyterbook.org/)

The following documentation refers only to the **Javascript** MyST parser.
```
