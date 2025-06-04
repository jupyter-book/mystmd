---
title: History and background
description: High-level discussion of the MyST Markdown ecosystem, history of mystmd, other implementations like Jupyter Book and Sphinx, and explains past decisions.
---

This page discusses high-level questions about the MyST Markdown ecosystem, history of `mystmd`, various ecosystem implementations, and explains a few decisions made in the project.[^overview]

[^overview]: The [MyST ecosystem overview](./overview.md) is another excellent high-level source of information.

## History of MyST Markdown and `mystmd`

MyST Markdown (Markedly Structured Text) is a markup language that builds on standard markdown and is designed to create publication-quality documents, books, presentations, and websites written entirely in Markdown. The [ExecutableBooks] team received a grant from the [Sloan Foundation](https://sloan.org) to build, enhance, and promote a new path to document creation and publishing for next-generation scientific textbooks and lectures ([Grant #9231](https://sloan.org/grant-detail/9231)).

The initial use case driving the development and design of MyST Markdown has been [Jupyter Book], which allows you to create educational online textbooks and tutorials with Jupyter Notebooks and narrative content written in MyST. The extensions and design of MyST is inspired by the [Sphinx] and [reStructuredText](https://docutils.sourceforge.io/rst.html) (RST) ecosystems. Jupyter Book V1 is considered a [distribution of Sphinx](xref:jupyterbook#explain/sphinx), and builds on the Sphinx and [Docutils] Python packages.

MyST Markdown enables rich content generation and is a powerful textual format for scientific and technical communication with potential for broad adoption in modern publishing workflows. In 2022, the Executable Books team started work to document the specification behind the markup language, called [myst-spec](https://github.com/jupyter-book/myst-spec), this work has enabled other tools and implementations in the scientific ecosystem to build on MyST Markdown (e.g. [scientific authoring tools](https://curvenote.com/for/writing), and [documentation systems](https://blog.readthedocs.com/jupyter-book-read-the-docs/)).

## What is the MyST Document Engine and Myst Markdown?

The `mystmd`[^naming] document engine and its ecosystem of tools were developed as a collaboration between [Curvenote], [2i2c] and the [ExecutableBooks] team. In addition to building websites, `mystmd` can also help you create scientific PDFs, Microsoft Word documents, and presentations.

`mystmd` uses existing, modern web-frameworks in place of the [Sphinx] build system. These tools come out-of-the-box with prefetching for faster navigation, smaller network payloads through modern web-bundlers, image optimization, partial-page refresh through single-page application. Many of these features and performance improvements are difficult (if not impossible) to create inside of the [Sphinx] build system.

The JavaScript packages in the `mystmd` ecosystem also power web-native extensions, such as [JupyterLab-myst], which renders MyST markup directly in JupyterLab.

## How was the MyST Engine Developed?

The initial version was released by [Curvenote] as the [Curvenote CLI](https://curvenote.com/docs/cli) under the MIT license, and later transferred to the [ExecutableBooks] team. The goal of the project is to enable the same rich content and authoring experiences that Sphinx allows for software documentation, with a focus on web-first technologies (Javascript), interactivity, accessibility, scientific references (e.g. DOIs and other PIDs), and professional PDF outputs.

In June 2024, Jupyter Book was incorporated as a Jupyter sub-project, standardizing on using and stewarding the MyST document engine (`mystmd`). [See #123](https://github.com/jupyter/enhancement-proposals/pull/123).

[^naming]: Originally `mystmd` was called `mystjs`, but was changed as we matured the command-line interfaces.

[2i2c]: https://2i2c.org/
[curvenote]: https://curvenote.com
[executablebooks]: https://executablebooks.org/
[jupyter]: https://jupyter.org
[jupyter book]: https://jupyterbook.org/
[jupyterlab-myst]: https://github.com/jupyter-book/jupyterlab-myst
[sphinx]: https://www.sphinx-doc.org/
