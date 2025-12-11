---
title: Diagrams
description: Include simple programmatic mermaid diagrams in your documents.
thumbnail: ./thumbnails/diagrams.png
---

It is possible to add [mermaid diagrams](https://mermaid-js.github.io/mermaid) using the {myst:directive}`mermaid` directive, for example:

````{myst}
```{mermaid}
flowchart LR
  A[Jupyter Notebook] --> C
  B[MyST Markdown] --> C
  C(mystmd) --> D{AST}
  D <--> E[LaTeX]
  E --> F[PDF]
  D --> G[Word]
  D --> H[React]
  D --> I[HTML]
  D <--> J[JATS]
```
````

:::{note}
Both GitHub and JupyterLab ([#101](https://github.com/jupyter/enhancement-proposals/pull/101)) support the translation of a code-block ` ```mermaid ` to a mermaid diagram directly, this can also be used by default in MyST.
:::

## Rendering for Static Exports

MyST supports static rendering of Mermaid diagrams for static export formats (PDF, Word, LaTeX, Typst). This feature converts Mermaid syntax to base64-encoded SVG or PNG images during the build process, ensuring consistent rendering across all static output formats.

:::{important} Prerequisites
To use static Mermaid rendering, you need the Mermaid CLI installed:

```bash
npm install -g @mermaid-js/mermaid-cli
```

:::
