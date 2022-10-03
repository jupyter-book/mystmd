---
title: jtex
description: jtex is a command line tool and library for rendering LaTeX documents from Jinja-style templates.
---

`jtex` is a command line tool (CLI) for rendering $\LaTeX$ documents from Jinja-style templates. This package uses [nunjucks](https://mozilla.github.io/nunjucks/) (a port of Jinja) as the template engine with a modified environment and syntax that plays well with $\LaTeX$'s markup.

```{important}
:class: dropdown
# Looking for Templates?

MyST Templates are available in the [myst-templates organization](https://github.com/myst-templates) on GitHub. You can also see all listed community tempaltes using `jtex list`, or browse the [api](https://api.myst.tools/templates/tex) if you are into JSON.

To create your own template see [](./create-a-latex-template.md).
```

**Goals**

- Provide a data-driven templating markup for $\LaTeX$
- Provide validation of templates and supplied options when rendering a template
- Work with standardized frontmatter to make authors, affiliations, etc. easy to template
- Work with the MyST ecosystem of tools
- Support many user supplied templates, local templates, etc.

**Not Goals**

- Translation to $\LaTeX$, instead see `myst-to-tex` or [using pandoc](pandoc-comparison.md)

## Installation

Install the package globally using npm:

```bash
npm install -g jtex
```

and confirm correct installation by typing:

```bash
jtex --version
```

## Usage with MyST

The main usage for `jtex` is with `myst` and `curvenote` command line tools,
both of which can compile markdown into $\LaTeX$ for templating with `jtex`.

## Simple Example

A document can be used very simply with the document as `doc`, the contents of which are
documented in [](document.md). Be sure to include the `[-IMPORTS-]` and the `[-CONTENT-]`.

```latex
% template.tex
\documentclass{article}

[-IMPORTS-]

\title{[-doc.title-]}
\author{[-doc.authors[0].name-] ([-doc.authors[0].email-])}

\begin{document}
\maketitle

[-CONTENT-]

The End!
\end{document}
```
