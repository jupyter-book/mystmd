# Overview

MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown. The main use case driving the development and design of MyST is [JupyterBook](https://jupyterbook.org/), which helps you create educational online textbooks and tutorials with Jupyter Notebooks and narrative content written in MyST. The extensions and design of MyST is inspired by the [Sphinx](https://www.sphinx-doc.org/) and [ReStructured Text](https://docutils.sourceforge.io/rst.html) (RST) ecosystems.

> MyST is designed to harness the extensibility and community of RST and bring these super-powers into Markdown.

MyST is a superset of [CommonMark](./commonmark.md) (the standard form of Markdown) and allows you to directly create “directives” and “roles” as extension points in the language. `directives` are block-level extension points, like [callout panels](./admonitions.md), tabs, [figures](./figures.md) or embedded charts; and roles are inline extension points, for components like [references](./references.md), [citations](./citations.md), or [inline math](./math.md).

## Directives & Roles

Roles and directives are two of the most powerful parts of MyST. They are kind of like functions, but written in a markup language. They both serve a similar purpose, but roles are written in one line whereas directives span many lines. They both accept different kinds of inputs, and what they do with those inputs depends on the specific role or directive being used.

### Directives

Directives are multi-line containers that include an identifier, arguments, options, and content. Examples include [admonitions](./admonitions.md), [figures](./figures.md), and [equations](./math.md). At its simplest, you can use directives using the following markup:

````{raw} html
<myst-demo>
```{note}
Here is a note!
```
</myst-demo>
````

The `{note}` directive above doesn't take any arguments and we didn't add any options. In addition to the directive name and the directive content, directives allow two other configuration points:

1\) **directive arguments** - a list of words that come just after the `{directivename}`.

````
```{directivename} arg1 arg2
My directive content.
```
````

2\) **directive options** - a collection of flags or key/value pairs that come just underneath `{directivename}`.

There are two ways to write directive options

`````{list-table}
* - 2a) Options as `:key: val` pairs.\
    Great for a few options.
  - 2b) Options as `key: val` pairs enclosed by `---` lines.\
    This is parsed as YAML, and easier for listing many options.
* - ````
    ```{directivename}
    :key1: metadata1
    :key2: metadata2

    My directive content.
    ```
    ````
  - ````
    ```{directivename}
    ---
    key1: metadata1
    key2: metadata2
    ---

    My directive content.
    ```
    ````
`````

```{tip}
Remember, specifying directive keywords with `:key:` or `---` will make no difference. We recommend using `---` if you have many keywords you wish to specify, or if some values will span multiple lines. Use the `:key: val` syntax as a shorthand for just one or two keywords.
```

Try editing the following `{figure}` directive, you can center the figure with an `:align: center` option!

````{raw} html
<myst-demo>
```{figure} https://source.unsplash.com/random/400x200?meditation
:align: right

The picture would look better if it is `:align: center`-ed!
```
</myst-demo>
````

### Roles

Roles are very similar to directives, but they are written entirely in one line. The syntax of a role is:

```
Some content {rolename}`and here is my role's content!`
```

Of course, roles will only work if `rolename` is a valid role name! The `abbr` role creates inline abbreviations, for example, `` {abbr}`MyST (Markedly Structured Text)` `` will become {abbr}`MyST (Markedly Structured Text)`! When you hover over[^1] the abbreviation you will see the `title` appear!

[^1]: Abbreviations are also great structured data for screen-readers!

Roles are defined inline, with an identifier and input. There are a number of roles included in MyST, including abbreviations, subscript, and superscript, as well as inline [](./math.md). Unknown roles will still be parsed as well:

```{raw} html
<myst-demo>
Here is an {abc}`unknown role`.
</myst-demo>
```

## Nesting content blocks in Markdown

If you’d like to nest content blocks inside one another in Markdown (for example, to put a {note} inside of a {margin}), you may do so by adding extra backticks (`) to the outer-most block. This works for literal code blocks as well.

For example, the following syntax:

`````
````
```
```
````
`````

yields

````
```
```
````

Thus, if you’d like to nest directives inside one another, you can take the same approach. For example, the following syntax:

`````{raw} html
<myst-demo>
````{important}
```{note}
Here's my `important`, highly nested note! 🪆
```
````
</myst-demo>
`````

produces a note in the margin!
