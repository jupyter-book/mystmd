---
title: Callouts
description: Callout blocks or admonitions, like "notes" or "hints" are outlined or shaded areas of a document to bring attention to particular information.
thumbnail: ./thumbnails/admonitions.png
---

Callouts, or "admonitions", highlight a particular block of text that exists slightly apart from the narrative of your page, such as a note or a warning.
For example, try changing the following example of a `{tip}` admonition to a `{warning}`:

```{myst}
:::{tip}
Try changing `tip` to `warning`!
:::
```

In MyST we call these kind of directives admonitions, however, they are almost always used through their _named_ directives, like `{note}` or `{danger}`. Admonitions can be styled as `simple` or as a `dropdown`, and can optionally hide the icon. There are ten kinds[^docutils-admonitions] of admonitions available:

```{list-table} Named admonitions that can be used as directives
:name: admonitions-list
* - 🔵 `note`
  - 🟠 `attention`
* - 🔵 `important`
  - 🟠 `caution`
* - 🟢 `hint`
  - 🟠 `warning`
* - 🟢 `seealso`
  - 🔴 `danger`
* - 🟢 `tip`
  - 🔴 `error`
```

[^docutils-admonitions]: These admonitions are the same as those used in [docutils](https://docutils.sourceforge.io/docs/ref/rst/directives.html#specific-admonitions) and Sphinx.

See below for a demo of each admonition in the default theme.

`````{tab-set}

````{tab-item} Note
```{note}
This is an note admonition
```
````

````{tab-item} Important
```{important}
This is an important admonition
```
````

````{tab-item} Hint
```{hint}
This is an hint admonition
```
````

````{tab-item} See Also
```{seealso}
This is an seealso admonition
```
````

````{tab-item} Tip
```{tip}
This is an tip admonition
```
````

````{tab-item} Attention
```{attention}
This is an attention admonition
```
````

````{tab-item} Caution
```{caution}
This is an caution admonition
```
````

````{tab-item} Warning
```{warning}
This is an warning admonition
```
````

````{tab-item} Danger
```{danger}
This is an danger admonition
```
````

````{tab-item} Error
```{error}
This is an error admonition
```
````

`````

## Admonition Titles

All admonitions have a single argument, which is the admonition title and can use markdown.
If a title argument is not supplied the first node is used if it is a `heading` or a paragraph with fully bold text; otherwise the name of the directive is used (e.g. `seealso` becomes `See Also`; `note` becomes `Note`).

```{myst}
:::{tip} Admonition _title_
Here is an admonition!
:::
```

:::::::{tip} Compatibility with GitHub
:class: dropdown
GitHub markdown transforms blockquotes that start with a bold `Note` or `Warning` into a simple admonition (see [GitHub](https://github.com/community/community/discussions/16925)). MyST also transforms these blockquotes into the appropriate admonitions with a `simple` class.

```{myst}
> **Note** This is a note!
```

:::::::

::::{tip} Compatibility with Pandoc & Quarto
:class: dropdown
In Quarto/Pandoc markdown admonitions are styled with special classes like `{.callout-note}` or `{callout-tip}`).
If you are using JupyterBook or Sphinx documentation, use an `{admonition}` directive with the specific class, for example:

```{myst}
::: {.callout-tip}
## Tip with Caption
This is an example of a callout with a caption.
:::
```

::::

::::{warning} Compatibility with Sphinx
:class: dropdown
In Sphinx, all named admonitions (e.g. `{note}` or `{tip}`), have **no arguments**.
If you place content on the first line it will instead be prepended to the admonition body.
If you are using JupyterBook or Sphinx documentation, use an `{admonition}` directive with the specific class, for example:

```{myst}
:::{admonition} The Title
:class: hint
This is the body.
:::
```

::::

(admonition-dropdown)=

## Admonition Dropdown

To turn an admonition into a dropdown, add the `dropdown` class to them.
Dropdown admonitions use the `<details>` HTML element (meaning they also will work without Javascript!),
and they can be helpful when including text that shouldn't immediately visible to your readers.

```{myst}
:::{note} Click Me! 👈
:class: dropdown
👋 This could be a solution to a problem or contain other detailed explanations.
:::
```

:::{seealso} You can also use a `{dropdown}`
:class: dropdown
You can also use a `{dropdown}` directive, which provides a more compact writing experience and is simpler in the displayed style. See [](#dropdowns) for more information.
:::

### Reference

**Arguments** _(markdown)_
: The `admonition` requires a single argument that is the title, parsed as markdown.

**Options**
: No options are required

    class _(optional, string)_
    : CSS classes to add to your admonition. Special classes include:
      - `dropdown`: turns the admonition into a `<details>` html element
      - `simple`: an admonition with "simple" styles
      - the name of an admonition, the first admonition name encountered will be used
    : Note that if you provide conflicting class names, the first one in the {ref}`list above <admonitions-list>` will be used.

    icon _(optional, boolean)_
    : setting icon to false will hide the icon
