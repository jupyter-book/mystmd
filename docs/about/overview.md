# What is the MyST stack?

This section provides a high-level overview of the main concepts in the MyST ecosystem, as well as how it relates to specific tools.

MyST might refer to several things, depending on the context.
Here are a few key concepts in MyST:

**The MyST Specification**. A specification that describes the structure and function of MyST documents. It provides a framework for defining all of the kinds of content and metadata that a MyST document can contain. For example, the MyST specification defines how sections can contain paragraphs, how paragraphs can contain sentences, and how sentences can contain a "bolded" chunk of text. The specification is [defined at mystmd.org/spec](https://mystmd.org/spec).

**A MyST Document**. A document that adheres to the MyST Specification. It is usually in the form of an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) that is structured in JSON (or some other machine-readable form), where every bit of content has been parsed and tagged according to the MyST Specification.

**A MyST Document Engine**. The MyST Document Engine is a tool for parsing text-based documents into MyST Documents according to the MyST Specification. For example, a MyST Document Engine might know how to transform a text file with MyST Markdown into a MyST document (outputting a `.json` file that represent that file's AST). The canonical MyST Document Engine is documented at [mystmd.org/guide](https://mystmd.org/guide), and is maintained by the [Jupyter Book team](https://compass.jupyterbook.org)

**MyST Markdown**. MyST stands for "Markedly Structured Text". It is a flavor of markdown that was designed to make it easy to write content that can be parsed by a MyST Document Engine. MyST Markdown syntax was created to support functionality in the MyST specification like extensions, roles and directives, and cross-references.

Here's a diagram showing how these all relate to one another:

:::{figure} ../images/myst-diagram.svg
An overview of some major parts of the MyST stack and how they relate to one another.
In the most common workflow, a text file written in MyST Markdown is parsed by the [MyST Document Engine](https://mystmd.org/guide) which outputs MyST Document that follows the [MyST Specification](https://mystmd.org/spec) (usually a JSON file). This MyST Document can be rendered into many different kinds of outputs, most-commonly HTML or PDF. This usually done by the MyST Document Engine, but can be done by any application that understands how to parse and use the MyST Document Specification.
:::

## Other MyST engines

The [MyST Parser for Sphinx](https://myst-parser.readthedocs.io) is an extension for [Sphinx](https://sphinx-doc.org) that can parse MyST Markdown into Sphinx's internal document structure. It was created to allow users to parse MyST Markdown syntax into Sphinx for [V1 of Jupyter Book](https://jupyterbook.org). It now exists as an independent extension for the Sphinx community, as Jupyter Book now uses the MyST Document Engine.
