---
title: Comparing to Pandoc
description: jtex can work directly with pandoc, however, also has a different approach to templating latex than pandoc for data-driven templates.
---

`jtex` is a data-driven templating library, not a document translation package, and although `jtex` is designed to work with the open-source MyST community, it can also work with `pandoc` when not using `pandoc` in "standalone" mode. This creates the inner $\LaTeX$ inputs that can be used with `jtex`.

For example, converting a document into latex using `pandoc` can then be rendered in a `jtex` template:

```bash
pandoc pandoc_example.md -o my_content.tex --bibliography references.bib --biblatex
jtex render my_content.tex --template arxiv --frontmatter frontmatter.yml
```

It is also possible to use Pandoc to create $\LaTeX$ templates, and there are a number of decisions that `jtex` has taken. Specifically, `jtex` was designed with:

- an easy to read syntax that stands out against $\LaTeX$
- full template creation, without needing inheritance, default partials, or any other default decisions
- a well-used templating language, `jinja`, with full support for variables and control-flow
- entirely web-friendly langauges (no `lua` filters!)
- a permissive open-source license (no `GPL` restrictions!)

## Pandoc templating overview

Pandoc comes with a [built-in templating feature](https://pandoc.org/MANUAL.html#templates), which is powerful and links to Pandoc’s underlying data structures.

Pandoc’s [templating syntax](https://pandoc.org/MANUAL.html#template-syntax) is very close to the Jinja style that we have embraced in `jtex` templates, with variable interpolation, control flow, partial templates, and filters all available with specializations for different output formats.

For LaTeX, Pandoc provides a [complete default template](https://github.com/jgm/pandoc-templates/blob/master/default.latex) that allows the rendering of a document with metadata and content. The default template covers everything from `beamer` presentations, posters, to potentially any journal template. This is complete but **complex**, and requires any new template to have a deep understanding of pandoc before their template can be created. For users to make their own templates, this can be pretty overwhelming.

## No inheritance

In `jtex` a user can take the style guide provided by a journal and simply remove the default content, and put in variables, based on standardized [](document.md) or additional data-driven options. There is no breaking up a template into partials and no filters necessary.

In `pandoc` converting a journal supplied style-guide to a template requires you to break up the template into partials, e.g. `before-body.tex`, as well as provide custom `lua` filters that integrate with `pandoc`. The final template/extension is much further away from the original latex template.

We believe that `pandoc` is very powerful, but requires much more knowledge to contribute a template, and those final templates are harder to keep in sync with the original templates because of all the differences.

## Template syntax

The template syntax that `pandoc` uses is `$if(beamer)$` and `${ variable }`. Both brackets and dollar signs are used in the $\LaTeX$ langauge, making it quite difficult to do syntax highlighting or rendering on the template without `pandoc` in the loop.

In `jtex` we have chosen a [templating syntax](template-rules.md) (e.g. `[# if beamer #]` and `[- variable -]`) that works with the $\LaTeX$ language, and any existing syntax highlighters. This can help authors when they are writing their own templates.

## Data driven

One of the drivers behind `jtex` is to expose submission requirements for authors when they are writing their documents.
These can surface any problems with your work in sensible error messages, with the descriptions directly from the journals that you are submitting to!

For example, here is an excerpt from the AGU template, which requires a data availability statement, currently a freeform "part" of the document.

```yaml
parts:
  - id: availability
    required: true
    description: |
      AGU requires an Availability Statement for the underlying data needed to understand, evaluate, and build upon the reported research at the time of peer review and publication.
options:
  - type: choice
    id: journal_name
    title: AGU Journal Name
    choices:
      - 'JGR: Atmospheres'
      - 'JGR: Biogeosciences'
      - 'JGR: Earth Surface'
```

In MyST, these parts can be defined as blocks `+++ { "part": "availability" }` or through the command line arguments in `jtex` directly.

These fields and parts can have additional fields (max characters, or validation against a format) to validate your documents and raise warnings or errors. This helps ensure that your documents are in the correct form, as well as to structure that metadata for communicating and archiving.

These goals of `jtex` are quite different than a universal document translator, which is aimed at converting between 100s of formats.
