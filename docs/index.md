---
title: MyST Markdown Tools
description: MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown.
---

MyST is an ecosystem of open-source, community-driven tools designed for scientific communication, including a powerful authoring framework that supports blogs, online books, scientific papers, reports and journals articles. Get up and running with MyST with the following **quickstart tutorials**:

:::{card} Install MyST 👩‍💻
:link: ./quickstart.md
Start here to get up and running with the `myst` command-line tools.
:::

:::{card} Create a website like this one 🌎
:link: ./quickstart-myst-websites.md
Learn the basics of customizing a MyST Website, including sharing frontmatter between pages.
:::

:::{card} Create Scientific Publications 📑
:link: ./quickstart-myst-documents.md
Learn the basics of MyST Markdown, and export to a Word document, PDF, and $\LaTeX$!
:::

:::{card} MyST Markdown Guide 📖
:link: ./quickstart-myst-markdown.md
See an overview of MyST Markdown syntax with inline demos and examples.
:::

:::{seealso}
:class: dropdown

# Coming from JupyterBook or Sphinx?

👋 We are glad you are here! 💚

There are many ways that `mystjs` can be used with JupyterBook and Sphinx. We recommend that you read [background on `mystjs`](./background.md), which goes over how these projects overlap and work together!

TL;DR
: **Yes**, you can use `mystjs` with your JupyterBook! `mystjs` can create [scientific PDFs](./creating-pdf-documents.md) and can natively read the [`_toc.yml`](./table-of-contents.md) as well as all of your existing MyST Markdown content and [Jupyter Notebooks](./interactive-notebooks.ipynb).
: **Yes**, `mystjs` is compatible with [intersphinx](#intersphinx) even though it is written in Javascript not Python!
: JupyterBook and `mystjs` have **overlap** in the ability to create online books like this one. `mystjs` has some extra capabilities for [cross-references](./cross-references.md), interactivity and [performance](./accessibility-and-performance.md).
:::

## Project Goals

`mystjs` is part of the [Executable Books](https://executablebooks.org/) organization, and is an open-source, community-driven project to improve scientific communication, including integrations into Jupyter Notebooks and computational results.

::::{grid} 1 1 2 3

:::{card}
:link: ./citations.md

**Built for Science** 👩‍🔬
^^^

Extend Markdown with equations, cross-references, citations, and export to a preprint or rich, interactive website or book.
+++
MyST for Science »
:::

:::{card}
:link: ./interactive-notebooks.ipynb

**Dynamic Documents** 📈
^^^

Make your pages interactive by connecting to custom JupyterHubs, public Binders or even Python running directly in your browser.
+++
Bring your pages to life »
:::

:::{card}
:link: ./accessibility-and-performance.md

**Fast & Accessible** ⚡️
^^^
Publish next-generation articles and books that are beautifully designed, without compromising on accessibility or performance.
+++
Read about performance »
:::

::::

**Technical Goals**

- `mystjs` is a Javascript parser and command line tool for working with MyST Markdown
- Parse MyST into a standardized [AST](wiki:Abstract_Syntax_Tree), that follows [the MyST Spec](https://myst-tools.org/docs/spec)
- Translate and render MyST into:
  - Modern [interactive websites](./quickstart-myst-websites.md), using React (like this website!)
  - PDFs and $\LaTeX$ documents, with [specific templates for over 400 journals](./creating-pdf-documents.md)
  - Microsoft Word [export](./creating-word-documents.md)
- Provide functionality for [cross-referencing](./cross-references.md), [external structured links](./external-references.md), and [scientific citations](./citations.md)

**Architecture**

The `mystjs` command line tool can be used to parse MyST Markdown and Jupyter Notebooks into an AST. This data can be saved as JSON, or rendered to a website (like this one!) or any number of formats including [PDF & $\LaTeX$](./creating-pdf-documents.md), [Word](./creating-word-documents.md), [React](./quickstart-myst-websites.md), or [JATS](./creating-jats-xml.md).

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

```{important}
:class: dropdown
**Using Sphinx or Python?**

For integration with **Sphinx**, use the Python implementation for MyST or JupyterBook, which can be found at:

- [MyST Python Parser for Sphinx](https://myst-parser.readthedocs.io/en/latest/)
- [JupyterBook](https://jupyterbook.org/)

Although many tools in the [MyST Ecosystem](https://myst-tools.org) follow the same conventions and [specification](https://myst-tools.org/docs/spec), the following documentation refers only to the **Javascript** MyST CLI.
```
