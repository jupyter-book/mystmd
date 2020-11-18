# `markdown-it-myst`

{abbr}`MyST (Markedly Structured Text)` is a flavor of markdown inspired from the Sphinx ecosystem and {abbr}`RST (reStructured Text)`.

Any [CommonMark](https://commonmark.org/) markdown (such as [Jupyter Notebook](https://jupyter.org) markdown) is natively supported by the MyST parser. The goal of MyST *javascript* parser ([markdown-it-myst](https://github.com/executablebooks/markdown-it-myst)) is to have overlap with Sphinx ecosystem and {abbr}`RST (reStructured Text)` and provide a flexible renderer that can be used outside of the Sphinx ecosystem.

```{important}
For integration with **Sphinx**, use the Python reference implementation for MyST parser, which can be found at:

<https://myst-parser.readthedocs.io/en/latest/>
```

The focus of the project is on components that are useful in rendering books, as this is a project associated with [JupyterBook](https://jupyterbook.org/) and the [Executable Books Project](https://executablebooks.org/).

The project has the following goals:

* Admonitions (callouts)
* References and citations
* Figures, with cross-references
* Math and equations, with cross-references

(start)=
## Getting Started

You can create headings using between 1-6 `#`'s. For referencing content, there are two things you need!

```myst
(start)=
## Getting Started

A reference to {ref}`"start" <start>` or {ref}`start` which will use the title of the header.
```

A reference to {ref}`"start" <start>` or {ref}`start` (which is this section!) in the javascript implementation *only* looks to the current page's content. In Sphinx, these are cross-links across your entire documentation/book.

You can also use [Markdown](start) links (i.e. `[Markdown](start)` with the reference id as the link).

---

## Admonitions

```{admonition} Definition
**Admonition**: An act or action of admonishing; authoritative counsel or warning. Mostly used in the 1800s and in [Sphinx documentation](https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html).

*Also known as* a **callout**.
```

Possible admonition types:
* `attention`,
* `caution`,
* `danger`,
* `error`,
* `hint`,
* `important`,
* `note`,
* `tip`,
* `warning`,
* `admonition`: Note this can take a `title` argument on the first line of the directive. This allows you to have a custom title.

```{attention}
This is an `attention` admonition. Try changing the directive to one of the options above.
```

