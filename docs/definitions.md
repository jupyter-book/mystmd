---
title: Definition lists
---

Definition lists utilise the [markdown-it-py deflist plugin](https://markdown-it-py.readthedocs.io/en/latest/plugins.html), which itself is based on the [Pandoc definition list specification](http://johnmacfarlane.net/pandoc/README.html#definition-lists).

Here's an example:

```{myst}
Term 1
: Definition

Term 2
: Definition
```

From the [Pandoc documentation](https://pandoc.org/MANUAL.html#definition-lists):

> Each term must fit on one line, which may optionally be followed by a blank line, and must be followed by one or more definitions.
> A definition begins with a colon or tilde, which may be indented one or two spaces.
>
> A term may have multiple definitions, and each definition may consist of one or more block elements (paragraphs, code blocks, lists, etc.)

Here is a more complex example, demonstrating some of these features:

```{myst}
Term _with Markdown_
: Definition [with reference](content/definition-lists)

A second paragraph
: A second definition

Term 2
~ Definition 2a
~ Definition 2b

Term 3
: A code block
: > A quote
: A final definition, that can even include images:

  ![Beach!](https://source.unsplash.com/random/400x200?beach,ocean)
```

% TODO: Images should parse!

````{tip}
In JupyterBook, definition lists are enabled by defining the following setting in your `_config.yml`:

```yaml
parse:
  myst_enable_extensions:
    # don't forget to list any other extensions you want enabled,
    # including those that are enabled by default!
    - deflist
```
````
