---
title: MyST Markdown Tools
description: MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown.
---

{abbr}`MyST (Markedly Structured Text)` is an ecosystem of open-source, community-driven tools designed to revolutionize scientific communication. Our powerful authoring framework supports blogs, online books, scientific papers, reports and journals articles.

:::{card} Get Started With MyST 👩‍💻
:link: ./quickstart.md
Start here to get up and running with the `myst` command-line tools.
:::

## Cool MyST Features 🪄

We think {abbr}`MyST (Markedly Structured Text)` is really cool, some of the features that we think stand out are highlighted below with links to places in the documentation where you can reproduce them!

---

🪄🐰 **Rabbit-hole links** allow you to get information to your reader as fast as possible, and they can deep-dive all the way to computations, code and interactive figures. You can play with this demo yourself in [](./quickstart-myst-markdown.md).

:::{figure} ./videos/links.mp4
:class: framed
:::

🪄📊 **Live graphs** can be embedded directly in your documentation or articles with computation backed by Jupyter or JupyterLite – running locally, on Binder, or directly in your browser. Get up and running with Thebe in [](./integrating-jupyter.md)

:::{figure} ./videos/thebe.mp4
:class: framed
:::

🪄🪐 **JupyterLab support** for MyST comes with inline computations, support for `ipywidgets`, matplotlib sparklines, editable task-lists, rich frontmatter, and beautiful typography and other elements like dropdowns, grids and cards. Install [`jupyterlab-myst`](./quickstart-jupyter-lab-myst.md) today!

:::{figure} ./videos/jupyterlab-myst.mp4
:class: framed
:::

🪄📜 **Export to PDF** is easy with MyST, and we support hundreds of different journals out of the box, see [myst-templates](https://github.com/myst-templates)! You can also export to Microsoft Word or even JATS, which is used in scientific publishing. See the [](./quickstart-myst-documents.md)!

:::{figure} ./images/myst-build.png
:class: framed
:::

---

## Quickstart Tutorials

![](#quickstart-cards)

:::{seealso}
:class: dropdown

# Coming from Jupyter Book or Sphinx?

👋 We are glad you are here! 💚

There are many ways that `mystmd` can be used with Jupyter Book and Sphinx. We recommend that you read [background on `mystmd`](./background.md), which goes over how these projects overlap and work together!

TL;DR
: **Yes**, you can use `mystmd` with your Jupyter Book! `mystmd` can create [scientific PDFs](./creating-pdf-documents.md) and can natively read the [`_toc.yml`](./table-of-contents.md) as well as all of your existing MyST Markdown content and [Jupyter Notebooks](./interactive-notebooks.ipynb).
: **Yes**, `mystmd` is compatible with [intersphinx](#intersphinx) even though it is written in Javascript not Python!
: Jupyter Book and `mystmd` have **overlap** in the ability to create online books like this one. `mystmd` has some extra capabilities for [cross-references](./cross-references.md), interactivity and [performance](./accessibility-and-performance.md).
:::

## Project Goals

MyST is part of the [Project Jupyter](https://jupyter.org/) organization, and is an open-source, community-driven project to improve scientific communication, including integrations into Jupyter Notebooks and computational results.

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

- `mystmd` is a Javascript parser and command line tool for working with MyST Markdown
- Parse MyST into a standardized [AST](wiki:Abstract_Syntax_Tree), that follows [the MyST Spec](https://mystmd.org/spec)
- Translate and render MyST into:
  - Modern [interactive websites](./quickstart-myst-documents.md), using React (like this website!)
  - PDFs and $\LaTeX$ documents, with [specific templates for over 400 journals](./creating-pdf-documents.md)
  - Microsoft Word [export](./creating-word-documents.md)
- Provide functionality for [cross-referencing](./cross-references.md), [external structured links](./external-references.md), and [scientific citations](./citations.md)

**Architecture**

The `mystmd` command line tool can be used to parse MyST Markdown and Jupyter Notebooks into an AST. This data can be saved as JSON, or rendered to a website (like this one!) or any number of formats including [PDF & $\LaTeX$](./creating-pdf-documents.md), [Word](./creating-word-documents.md), [React](./quickstart-myst-documents.md), or [JATS](./creating-jats-xml.md).

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

```{important}
:class: dropdown
**Using Sphinx or Python?**

For integration with **Sphinx**, use the Python implementation for MyST or Jupyter Book, which can be found at:

- [MyST Python Parser for Sphinx](https://myst-parser.readthedocs.io/en/latest/)
- [Jupyter Book](https://jupyterbook.org/)

Although many tools in the [MyST Ecosystem](https://mystmd.org) follow the same conventions and [specification](https://mystmd.org/spec), the following documentation refers only to the **Javascript** MyST Markdown CLI.
```
