---
title: Diagrams
description: Include simple programmatic mermaid diagrams in your documents.
thumbnail: ./thumbnails/diagrams.png
---

It is possible to add [mermaid diagrams](https://mermaid-js.github.io/mermaid) using the `{mermaid}` directive, for example:

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
