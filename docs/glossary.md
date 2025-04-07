---
title: Glossary & Index
description: Glossary of terms used throughout the MyST ecosystem.
---

(glossary-page)=

## Glossary

:::{glossary}

[CommonMark](https://commonmark.org/)
: A standard syntax of Markdown that is used across many communities and projects.
It is the base flavour of Markdown for Jupyter Notebook, and the base flavour
for {term}`MyST Markdown <MyST>` and {term}`Jupyter Book`.

[Project Jupyter](https://jupyter.org)
: The project and [team](https://compass.jupyterbook.org/team) that supports {term}`Jupyter Book` and {term}`MyST Markdown <MyST>` and the tools and packages behind them.

[Executable Books Project](https://executablebooks.org)
: The project and [team](https://compass.executablebooks.org/en/latest/team/index.html) that used to support {term}`Jupyter Book` and {term}`MyST Markdown <MyST>`. The project is currently stewarded by {term}`Project Jupyter`.

[MyST](https://mystmd.org)
: MyST can either refer to {term}`MyST Markdown` or {term}`MyST-CLI`.

[MyST Markdown](https://mystmd.org)
: A flavour of Markdown that was designed for scientific and technical writing.
: Sometimes referred to simply as {term}`MyST`.

[MyST-CLI](https://mystmd.org/guide)
: The MyST Markdown CLI can be used to create a website, PDF documents, and generally structure and parse a MyST project. You can install across various package managers using `mystmd`.
: Sometimes referred to simply as {term}`MyST`.

[Sphinx](https://www.sphinx-doc.org)
: A documentation engine written in Python. Sphinx supports many features that are
necessary for scientific and scholarly publishing. It is currently used by {term}`Jupyter Book`.

[reStructuredText](https://docutils.sourceforge.io/rst.html)
: reStructuredText (RST) is a plain text markup syntax and parser system, the RST parser is a component of Docutils.

[Binder](https://mybinder.org)
: A free, public service for running reproducible interactive computing environments.
Binder is a 100% open source infrastructure that is run by members of the Jupyter
community. The underlying technology behind the Binder project is {term}`BinderHub`.

[BinderHub](https://binderhub.readthedocs.io)
: The underlying technology of <https://mybinder.org>, BinderHub is an open source tool that
runs on Kubernetes and utilizes a {term}`JupyterHub` in order to provide live, reproducible
interactive computing environments that users host on GitHub.

[Google Colab](https://colab.research.google.com/)
: A Jupyter Notebook service from Google that provides access to free computing resources,
including GPUs and TPUs.

[JupyterHub](https://jupyterhub.readthedocs.io/en/stable/)
: A core open source tool from the Jupyter community, JupyterHub allows you to
deploy an application that provides remote data science environments to multiple
users. It can be deployed in the cloud, or on your own hardware.

[Jupyter Book](https://jupyterbook.org/)
: Jupyter Book is a distribution of {term}`Sphinx` that allows you to write content
in markdown and Jupyter Notebooks, execute content and insert it into your book,
and build a variety of outputs for interactivity and document publishing.

MyST Markdown
: MyST stands for "Markedly Structured Text". It is a flavor of [Markdown](https://en.wikipedia.org/wiki/Markdown) that was designed to make it easy to write content that can be parsed by a {term}`MyST Document Engine`. MyST Markdown syntax was created to support functionality in the MyST specification like extensions, roles and directives, and cross-references. It was originally created for Jupyter Book via the [MyST Parser for Sphinx](https://myst-parser.readthedocs.io), but now serves as a standard markdown syntax across the MyST ecosystem.

MyST Document Engine
: A MyST Document Engine builds {term}`MyST AST` according to the {term}`MyST Specification`[^myst]. For example, a MyST Document Engine might know how to transform a text file written in {term}`MyST Markdown` into JSON output that follows the {term}`MyST Specification`. The official MyST Document Engine is documented at [mystmd.org/guide](https://mystmd.org/guide), and is maintained by the [Jupyter Book team](https://compass.jupyterbook.org)

[^myst]: Often we focus upon a MyST Engine's ability to parse {term}`MyST Markdown`. However, a MyST Engine may consume _any_ kind of input markup as long as the _result_ is a {term}`MyST AST` that follows the {term}`MyST Specification`. This is why the [official MyST Document Engine](https://mystmd.org) can parse other kinds of markup, such as a subset of LaTeX.

MyST Specification
: A specification that describes the structure and function of the MysT AST. It provides a framework for defining all of the kinds of content and metadata that a MyST document can contain. For example, the MyST specification defines how sections can contain paragraphs, how paragraphs can contain sentences, and how sentences can contain a "bolded" chunk of text. The specification is [defined at mystmd.org/spec](xref:spec/#overview).

MyST AST
: A structured representation of a MyST Document, typically built from a markup language (like MyST Markdown) by a {term}`MyST Document Engine`, that adheres to the {term}`MyST Specification`. Usually, a MyST [Abstract Syntax Tree (AST)](wiki:Abstract_syntax_tree) is represented as a JSON data structure, with metadata attached to each piece of content that describes its role, relationships with other content, etc. The AST allows us to separate the steps of parsing content (such as {term}`MyST Markdown`) from generating output like HTML, PDF, docx, etc.

MyST Renderer
: An application that consumes {term}`MyST AST` and uses it to present the contents in a particular format. For example, the MyST
:::

(index-page)=

## Index

```{show-index}

```
