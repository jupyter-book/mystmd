---
title: Diagrams
description: Include simple programatic mermaid diagrams in your documents.
thumbnail: ./thumbnails/diagrams.png
---

It is possible to add [mermaid diagrams](https://mermaid-js.github.io/mermaid) using the `{mermaid}` directive, for example:

````md
```{mermaid}
flowchart LR
  A[Jupyter Notebook] --> C
  B[MyST Markdown] --> C
  C(mystjs) --> D{AST}
  D <--> E[LaTeX]
  E --> F[PDF]
  D --> G[Word]
  D --> H[React]
  D --> I[HTML]
  D <--> J[JATS]
```
````

Will show:

```{mermaid}
flowchart LR
  A[Jupyter Notebook] --> C
  B[MyST Markdown] --> C
  C(mystjs) --> D{AST}
  D <--> E[LaTeX]
  E --> F[PDF]
  D --> G[Word]
  D --> H[React]
  D --> I[HTML]
  D <--> J[JATS]
```
