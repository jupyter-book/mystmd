---
title: Background
description: High-level discussion of the MyST ecosystem, history of mystjs, other implementations like JupyterBook and Sphinx, and explains a few decisions made in the project.
---

This page discusses high-level questions about the MyST ecosystem, history of `mystjs`, various ecosystem implementations, and explains a few decisions made in the project.

## History of MyST and `mystjs`

MyST (Markedly Structured Text) is a markup language that builds on standard markdown and is designed to create publication-quality documents, books, presentations, and websites written entirely in Markdown. The [ExecutableBooks] team recieved a grant from the [Sloan Foundation](https://sloan.org) to build, enhance, and promote a new path to document creation and publishing for next-generation scientific textbooks and lectures ([Grant #9231](https://sloan.org/grant-detail/9231)).

The initial use case driving the development and design of MyST has been [JupyterBook], which allows you to create educational online textbooks and tutorials with Jupyter Notebooks and narrative content written in MyST. The extensions and design of MyST is inspired by the [Sphinx] and [ReStructured Text](https://docutils.sourceforge.io/rst.html) (RST) ecosystems. Jupyter Book is considered a [distribution of Sphinx](myst:jupyterbook#explain/sphinx), and builds on the Sphinx and [Docutils] Python packages.

MyST enables rich content generation and is a powerful textual format for scientific and technical communication with potential for broad adoption in modern publishing workflows. In 2022, the Executable Books team started work to document the specification behind the markup language, called [myst-spec](https://github.com/executablebooks/myst-spec), this work has enabled other tools and implementations in the scientific ecosystem to build on MyST (e.g. [scientific authoring tools](https://curvenote.com/for/writing), and [documentation systems](https://blog.readthedocs.com/jupyter-book-read-the-docs/)).

The `mystjs` ecosystem was developed as a collaboration between [Curvenote], [2i2c] and the [ExecutableBooks] team. The initial version of `mystjs` was originally release by [Curvenote] as the [Curvenote CLI](https://curvenote.com/docs/cli) under the MIT license, and later transferred to the [ExecutableBooks] team. The goal of the project is to enable the same rich content and authoring experiences that Sphinx allows for software documentation, with a focus on web-first technologies (Javascript), interactivity, accessbility, scientific references (e.g. DOIs and other persistent IDs), and professional PDF outputs.

## How do Jupyter Book and `mystjs` relate?

The current toolchain used by [JupyterBook] is based on [Sphinx], which is an open-source documentation system used in many software projects, especially in the Python ecosystem. `mystjs` is a similar tool to [Sphinx], however, designed for scientific and technical content. In addition to building websites, `mystjs` can also help you create scientific PDFs, Microsoft Word documents, and presentations.

`mystjs` uses existing, modern web-frameworks in place of the [Sphinx] build system. These tools come out-of-the-box with prefetching for faster navigation, smaller network payloads through modern web-bundlers, image optimization, partial-page refresh through single-page application. Many of these features and performance improvements are difficult (if not impossible) to create inside of the [Sphinx] build system.

The packages in the `mystjs` ecosystem also help power web-native extensions, such as [JupyterLab-myst], which renders MyST markup directly in JupyterLab.

`mystjs` can render [JupyterBook] content, however, it can not work with custom extensions or themes developed for Sphinx. As `mystjs` continues to improve, we will ensure smooth paths for content authors to choose between these different rendering engines.

## Can I use JupyterBook and `mystjs` together?

Yes! There **is** overlap in functionality for creating websites, however, you can also use `mystjs` with your JupyterBook content to:

- Create a [professional PDF](./creating-pdf-documents.md)
- Export to [Microsoft Word](./creating-word-documents.md)
- Create a presentation
- Write in JupyterLab, using [JupyterLab-myst]

If you want, you can also try a `mystjs` website to view your JupyterBook. `mystjs` provides improved interactivity around cross-linking content, performance, and accessibility improvements.

JupyterBook and `mystjs` both use the MyST markup language for content and read Jupyter Notebooks, and we ensure that your content can be read equally by both renderers. However, no custom Sphinx extensions that you may have added to your JupyterBooks will work. If you find something that doesn't work with `mystjs` from your JupyterBook content, please [let us know on GitHub](https://github.com/executablebooks/mystjs/issues) and we will try to support it!

Jupyter Books are an excellent medium for tutorials, textbooks & software documentation but are currently less well suited to content such as blogs, lab-websites, and journal articles. Additionally, JupyterBook cannot create scientific PDFs that are submission ready.

## How do `mystjs` and Sphinx relate?

[Sphinx] is an open-source documentation system used in many software projects, especially in the Python ecosystem. The Sphinx ecosystem has excellent support for Python documentation, referencing content, as well as externally providing an inventory of references known as intersphinx. You can use your `mystjs` projects with [intersphinx references](#intersphinx), and also exposes information (i.e. an `objects.inv`) to allow Sphinx documentation to reference your project.

At this time `mystjs` does not support software documentation[^1], as such, if your project is documenting Python software we suggest that you use Sphinx. If your project is primarily tutorials, educational textbooks (including with Jupyter Notebooks), a presentation, or scientific paper we hope that you find a better fit with `mystjs`!

[^1]: In the future, `mystjs` may offer support for Python and Javascript documentation, and if you want to contribute please reach out!

[2i2c]: https://2i2c.org/
[curvenote]: https://curvenote.com
[docutils]: https://docutils.sourceforge.io/
[executablebooks]: https://executablebooks.org/
[jupyterbook]: https://jupyterbook.org/
[jupyterlab-myst]: https://github.com/executablebooks/jupyterlab-myst
[sphinx]: https://www.sphinx-doc.org/
