---
title: History and background
description: High-level discussion of the MyST Markdown ecosystem, history of mystmd, other implementations like Jupyter Book and Sphinx, and explains past decisions.
---

This page discusses high-level questions about the MyST Markdown ecosystem, history of `mystmd`, various ecosystem implementations, and explains a few decisions made in the project.

## History of MyST Markdown and `mystmd`

MyST Markdown (Markedly Structured Text) is a markup language that builds on standard markdown and is designed to create publication-quality documents, books, presentations, and websites written entirely in Markdown. The [ExecutableBooks] team received a grant from the [Sloan Foundation](https://sloan.org) to build, enhance, and promote a new path to document creation and publishing for next-generation scientific textbooks and lectures ([Grant #9231](https://sloan.org/grant-detail/9231)).

The initial use case driving the development and design of MyST Markdown has been [Jupyter Book], which allows you to create educational online textbooks and tutorials with Jupyter Notebooks and narrative content written in MyST. The extensions and design of MyST is inspired by the [Sphinx] and [reStructuredText](https://docutils.sourceforge.io/rst.html) (RST) ecosystems. Jupyter Book is considered a [distribution of Sphinx](xref:jupyterbook#explain/sphinx), and builds on the Sphinx and [Docutils] Python packages.

MyST Markdown enables rich content generation and is a powerful textual format for scientific and technical communication with potential for broad adoption in modern publishing workflows. In 2022, the Executable Books team started work to document the specification behind the markup language, called [myst-spec](https://github.com/jupyter-book/myst-spec), this work has enabled other tools and implementations in the scientific ecosystem to build on MyST Markdown (e.g. [scientific authoring tools](https://curvenote.com/for/writing), and [documentation systems](https://blog.readthedocs.com/jupyter-book-read-the-docs/)).

The `mystmd`[^naming] command line tools were developed as a collaboration between [Curvenote], [2i2c] and the [ExecutableBooks] team. The initial version was release by [Curvenote] as the [Curvenote CLI](https://curvenote.com/docs/cli) under the MIT license, and later transferred to the [ExecutableBooks] team. The goal of the project is to enable the same rich content and authoring experiences that Sphinx allows for software documentation, with a focus on web-first technologies (Javascript), interactivity, accessibility, scientific references (e.g. DOIs and other PIDs), and professional PDF outputs.

In June, 2024 the `mystmd` project became an official Jupyter project [See #123](https://github.com/jupyter/enhancement-proposals/pull/123).

[^naming]: Originally `mystmd` was called `mystjs`, but was changed as we matured the command-line interfaces.

## How do Jupyter Book and `mystmd` relate?

The current toolchain used by [Jupyter Book] is based on [Sphinx], which is an open-source documentation system used in many software projects, especially in the Python ecosystem. `mystmd` is a similar tool to [Sphinx], however, designed for scientific and technical content. In addition to building websites, `mystmd` can also help you create scientific PDFs, Microsoft Word documents, and presentations.

`mystmd` uses existing, modern web-frameworks in place of the [Sphinx] build system. These tools come out-of-the-box with prefetching for faster navigation, smaller network payloads through modern web-bundlers, image optimization, partial-page refresh through single-page application. Many of these features and performance improvements are difficult (if not impossible) to create inside of the [Sphinx] build system.

The javascript packages in the `mystmd` ecosystem also help power web-native extensions, such as [JupyterLab-myst], which renders MyST markup directly in JupyterLab.

`mystmd` can render [Jupyter Book] content, however, it cannot work with custom extensions or themes developed for Sphinx. As `mystmd` continues to improve, we will ensure smooth paths for content authors to choose between these different rendering engines.

## Can I use Jupyter Book and `mystmd` together?

Yes! There **is** overlap in functionality for creating websites, however, you can also use `mystmd` with your Jupyter Book content to:

- Create a [professional PDF](./creating-pdf-documents.md)
- Export to [Microsoft Word](./creating-word-documents.md)
- Create a presentation
- Write in JupyterLab, using [JupyterLab-myst]

If you want, you can also try a `mystmd` website to view your Jupyter Book (try the [online tool provided by Curvenote](https://try.curvenote.com), to test with your Jupyter Book), or run `myst` in your Jupyter Book directory. `mystmd` provides improved interactivity around [cross-linking content](./cross-references.md), [performance and accessibility](./accessibility-and-performance.md) improvements.

Jupyter Book and `mystmd` both use MyST Markdown for content and read Jupyter Notebooks, and we have made reasonable efforts to ensure that your content can be read by both renderers. However, no custom Sphinx extensions that you may have added to your Jupyter Books will work. If you find something that doesn't work with `mystmd` from your Jupyter Book content, please [let us know on GitHub](https://github.com/jupyter-book/mystmd/issues) and we will try to support it!

Jupyter Books are an excellent medium for tutorials, textbooks & software documentation but are currently less well suited to content such as blogs, lab-websites, and journal articles. Additionally, Jupyter Book cannot create scientific PDFs that are submission ready.

## How do `mystmd` and Sphinx relate?

[Sphinx] is an open-source documentation system used in many software projects, especially in the Python ecosystem. Like `mystmd`'s [spec](xref:spec/), it builds an internal representation of technical documents as a tree (see <https://docutils.org>). Whilst Sphinx partially defines a specification of-sorts for this AST[^docutils], `mystmd` explicitly publishes such a document. Furthermore, it is intended that `mystmd` ASTs can be generated and consumed by other projects, whereas this is not a stated goal of the Sphinx project.

The Sphinx ecosystem has excellent support for Python documentation, referencing content, as well as externally providing an inventory of references known as intersphinx. You can link to Sphinx documentation from your `mystmd` projects with [intersphinx references](#intersphinx), and `mystmd` automatically exposes (i.e. generates an `objects.inv`) the information required to allow Sphinx documentation to reference your project.

At this time `mystmd` does not support software documentation[^api-docs], as such, if your project is documenting Python software we suggest that you use Sphinx. If your project is primarily tutorials, educational textbooks (including with Jupyter Notebooks), a presentation, or scientific paper we hope that you find a better fit with `mystmd`!

Sphinx and `mystmd` take very different approaches to publishing to the web. In Sphinx, custom themes are templates that generate HTML and JavaScript. The sites built using these themes can be deployed as static sites e.g. on [ReadTheDocs](https://readthedocs.com/). Themes written for `mystmd` are actually _applications_, which consume the MyST AST and communicate its contents to your webbrowser. Although `mystmd` also supports static HTML outputs, implementing themes as applications means that it is easier to build more powerful and stateful customisations to the MyST viewing experience. 

[^api-docs]: In the future, `mystmd` may offer support for Python and Javascript documentation, and if you want to contribute please reach out!
[^docutils]: The Docutils source-code _is_ the specification.

[2i2c]: https://2i2c.org/
[curvenote]: https://curvenote.com
[docutils]: https://docutils.sourceforge.io/
[executablebooks]: https://executablebooks.org/
[jupyter]: https://jupyter.org
[jupyter book]: https://jupyterbook.org/
[jupyterlab-myst]: https://github.com/jupyter-book/jupyterlab-myst
[sphinx]: https://www.sphinx-doc.org/
