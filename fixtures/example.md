# `markdown-it-myst`

{abbr}`MyST (Markedly Structured Text)` is a flavor of markdown inspired from the Sphinx ecosystem and {abbr}`RST (reStructured Text)`.

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

## Figures

```{figure} https://jupyterbook.org/_static/logo.png
:name: jupyter-book-logo

The Jupyter Book Logo!
```

You can see the the logo for JupyterBook in:
* {ref}`Here <jupyter-book-logo>`
* {ref}`jupyter-book-logo`
* {numref}`jupyter-book-logo`
* {numref}`In a Figure named %s <jupyter-book-logo>`

## Math

$$y = m \times x + b$$ (line)

You can see in {eq}`line` that there is math!
