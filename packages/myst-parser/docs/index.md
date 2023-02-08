# mystjs

[![mystjs on npm](https://img.shields.io/npm/v/mystjs.svg)](https://www.npmjs.com/package/mystjs)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/executablebooks/mystjs/blob/master/LICENSE)
[![CI](https://github.com/executablebooks/mystjs/workflows/CI/badge.svg)](https://github.com/executablebooks/mystjs/actions)
[![docs](https://github.com/executablebooks/mystjs/workflows/docs/badge.svg)](https://executablebooks.github.io/mystjs)

{abbr}`MyST (Markedly Structured Text)` is a flavor of markdown inspired from the Sphinx ecosystem and {abbr}`RST (reStructured Text)`.

Any [CommonMark](https://commonmark.org/) markdown (such as [Jupyter Notebook](https://jupyter.org) markdown) is natively supported by the MyST parser. The goal of MyST _javascript_ parser ([mystjs](https://github.com/executablebooks/mystjs)) is to have overlap with Sphinx ecosystem and {abbr}`RST (reStructured Text)` and provide a flexible parser and renderer that can be used with other content workflows.

```{important}
For integration with **Sphinx**, use the Python reference implementation for MyST parser, which can be found at:

<https://myst-parser.readthedocs.io/en/latest/>

The following documentation refers only to the Javascript MyST parser.
```

The focus of `mystjs` is on components that are useful in rendering books, papers & reorts. This project is associated with [JupyterBook](https://jupyterbook.org/) and maintained by the [Executable Books Community](https://executablebooks.org/).

## Package Responsibilities

The `mystjs` package provides a Javascript implementation of the [MyST](https://myst-parser.readthedocs.io) parser, with the many of the standard directives and roles included.

- Parse MyST flavored markdown, which includes directives, roles, and block elements
- Export a Markdown Abstract Syntax Tree (`mdast`) that is tested against the MyST specification
- Provide extension point for additional directives and roles to be added
- Provide a serializer into standard html for all known roles and directives
  - CSS styling will not be enforced or provided by this repository
- Provide extension point for cross-referencing between multiple documents

## Supported Syntax

- Commonmark Markdown
- Admonitions (callouts)
- References and citations
- Figures, with cross-references
- Math & equations, with cross-references
- Common roles and directives that constitute "Core MyST"

## Design Choices and Related Packages

The `mystjs` package currently uses `markdown-it` for parsing markdown. This includes packages that are elsewhere in the executablebooks community including:

- [markdown-it-docutils](https://github.com/executablebooks/markdown-it-docutils) - directives and roles
- [markdown-it-dollarmath](https://github.com/executablebooks/markdown-it-dollarmath) - Math extensions to support inline $\LaTeX$ math surrounded by `$`
- [markdown-it-amsmath](https://github.com/executablebooks/markdown-it-amsmath) - Support math that starts with `\begin{equation}`, etc. directly in the content
- [markdown-it-myst-extras](https://github.com/executablebooks/markdown-it-myst-extras) - block breaks, comments, and other utilities for creating the MyST spec.

The package also includes community supported markdown-it plugins (e.g. `markdown-it-footnote`, and others as necessary).

```{note}
`mystjs` may adopt portions of the [unified](https://unifiedjs.com/) ecosystem in the future, but will continue to support basic `markdown-it` parsing as this is required in extending markdown parsers in, for example, [VSCode](https://github.com/executablebooks/myst-vs-code).
```
