---
title: MyST Javascript Tools
description: MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown.
---

`mystjs` is a set of open-source, community-driven tools designed for scientific communication, including a powerful authoring framework that supports blogs, online books, scientific papers, reports and journals articles.

```{warning}
The `mystjs` project is in beta. It is being used to explore a MyST implementation in JavaScript and will change significantly and rapidly. It is being developed by a small team of people on the [Executable Books Project](https://executablebooks.org), and may make rapid decisions without fully public/inclusive discussion. We will continue to update this documentation as the project stabilizes.
```

---

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

```{seealso}
:class: dropdown
# Coming from JupyterBook or Sphinx?
👋 We are glad you are here! 💚

There are many ways that `mystjs` can be used with JupyterBook and Sphinx. We recommend that you read [background on `mystjs`](./background.md), which goes over how these projects overlap and work together!

TL;DR
: **Yes**, you can use `mystjs` with your JupyterBook! `mystjs` can create [scientific PDFs](./creating-pdf-documents.md) and can natively read the [`_toc.yml`](./table-of-contents.md) as well as all of your existing MyST Markdown content and [Jupyter Notebooks](./interactive-notebooks.ipynb).
: **Yes**, `mystjs` is compatible with [intersphinx](#intersphinx) even though it is written in Javascript not Python!
: JupyterBook and `mystjs` have **overlap** in the ability to create online books like this one. `mystjs` has some extra capabilities for [cross-references](./cross-references.md), interactivity and [performance](./accessibility-and-performance.md).
```

---

### Create Scientific Publications

Create interactive scientific publications for the web or export to PDF, LaTeX and Microsoft Word.

::::{grid} 1 1 2 3

:::{card}
:link: ./creating-pdf-documents.md
**Create Scientific PDFs** 📄
^^^
Create PDF print-ready scientific papers over 400 $\LaTeX$ journal templates.

+++
Create a PDF »
:::

:::{card}
:link: ./creating-word-documents.md
**Create Word Docs** 📃
^^^

Render your MyST documents as Microsoft Word documents.
+++
Export to Word »
:::

:::{card}
:link: ../packages/jtex/docs/create-a-latex-template.md
**Flexible Templating** 🧱
^^^
Easily create and contribute data-driven templates using $\LaTeX$.
+++
Create a Template »
:::

::::

## Project Goals

`mystjs` is part of the [Executable Books](https://executablebooks.org/) organization, and is an open-source, commuity-driven project to improve scientific communication, including integrations into Jupyter Notebooks and computational results.

**Technical Goals**

- `mystjs` is a Javascript parser and command line tool for working with MyST Markdown
- Parse MyST into a standardized [AST](wiki:Abstract_Syntax_Tree), that follows [the MyST Spec](https://spec.myst.tools)
- Translate and render MyST into:
  - HTML for static websites, and modern React for interactive websites (like this website!)
  - PDFs and $\LaTeX$ documents, with [specific templates for over 400 journals](./creating-pdf-documents.md)
  - Beamer $\LaTeX$ presentations
  - Microsoft Word [export](./creating-word-documents.md)
- Provide functionality for [cross-referencing](./cross-references.md), [external structured links](./external-references.md), and [scientific citations](./citations.md)

**Architecture**

The `mystjs` command line tool can be used to parse MyST Markdown and Jupyter Notebooks into an AST. This data can be saved as JSON, or rendered to a website (like this one!) or any number of formats including PDF, Word, React or HTML.

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

Although many tools in the [MyST Ecosystem](https://myst.tools) follow the same conventions and [specification](https://spec.myst.tools), the following documentation refers only to the **Javascript** MyST CLI.
```
