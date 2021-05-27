# markdown-it-myst

[![markdown-it-myst on npm](https://img.shields.io/npm/v/markdown-it-myst.svg)](https://www.npmjs.com/package/markdown-it-myst)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/executablebooks/markdown-it-myst/blob/master/LICENSE)
[![CI](https://github.com/executablebooks/markdown-it-myst/workflows/CI/badge.svg)](https://github.com/executablebooks/markdown-it-myst/actions)
[![docs](https://github.com/executablebooks/markdown-it-myst/workflows/docs/badge.svg)](https://executablebooks.github.io/markdown-it-myst)
[![demo](https://img.shields.io/badge/live-demo-blue)](https://executablebooks.github.io/markdown-it-myst/demo/index.html)

```{danger}
`markdown-it-myst` is alpha, expect changes! (January, 2021)
```

{abbr}`MyST (Markedly Structured Text)` is a flavor of markdown inspired from the Sphinx ecosystem and {abbr}`RST (reStructured Text)`.

Any [CommonMark](https://commonmark.org/) markdown (such as [Jupyter Notebook](https://jupyter.org) markdown) is natively supported by the MyST parser. The goal of MyST *javascript* parser ([markdown-it-myst](https://github.com/executablebooks/markdown-it-myst)) is to have overlap with Sphinx ecosystem and {abbr}`RST (reStructured Text)` and provide a flexible renderer that can be used outside of the Sphinx ecosystem.

```{important}
For integration with **Sphinx**, use the Python reference implementation for MyST parser, which can be found at:

<https://myst-parser.readthedocs.io/en/latest/>

The following documentation refers only to the Javascript MyST parser.
```

The focus of `markdown-it-myst` is on components that are useful in rendering books, as this is a project associated with [JupyterBook](https://jupyterbook.org/) and the [Executable Books Project](https://executablebooks.org/).

## Project Goals
* Provide a Javascript implementation of [MyST](https://myst-parser.readthedocs.io) markdown extensions
  * Uses standard html for all known roles and directives, with no styling enforced or provided
* Provide functionality for cross-referencing that is usually completed by Sphinx (e.g. in the [Python implementation](https://github.com/executablebooks/MyST-Parser))
* Support Core-MyST roles and directives

## Supported Syntax
* Common mark
* Admonitions (callouts)
* References and citations
* Figures, with cross-references
* Math and equations, with cross-references
* Common roles and directives that constitute "Core MyST"
