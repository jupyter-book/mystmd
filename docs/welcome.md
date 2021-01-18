# markdown-it-myst

```{danger}
`markdown-it-myst` is pre-alpha, expect changes! (January, 2021)
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
