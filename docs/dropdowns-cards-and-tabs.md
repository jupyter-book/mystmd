---
title: Dropdowns, Grids, Tabs and Cards
short_title: Grids, Tabs & Cards
description: Add advanced user-interface elements to your MyST documents with grids, cards, tabs, and dropdowns.
thumbnail: ./thumbnails/dropdowns-cards-and-tabs.png
---

(dropdowns)=

## Dropdowns

Dropdowns can be used to toggle content and show it only when a user clicks on the header panel. These use the standard HTML `<details>` element, meaning they also will work without Javascript. The dropdown can have a title, as the directive argument, and the open option can be used to initialise the dropdown in the open state.

```{myst}
:::{dropdown} Dropdown Title
:open:
Dropdown content
:::
```

```{seealso}
:class: dropdown

# Use "Admonition Dropdowns" for style!
You can also hide the body of your admonition blocks so that users must click a button to reveal their content. This is helpful if you’d like to include some text that isn’t immediately visible to the user.

To turn an admonition into a dropdown, add the option `:class: dropdown` to them. See [](#admonition-dropdown) for more information.
```

## Cards

Cards provide an easy way for you to content into a standard “header”, “body”, “footer” structure that has a similar alignment and visual style. It is useful for creating galleries or high-visibility collections of links and information.
For example, a card with a header, title, body, and footer:

````{myst}
```{card} Card title
:header: The _Header_
:footer: Footer

Card content
```
````

You can also add a `link` option to the card, which will allow you to make the entire card clickable:

```{myst}

:::{card} Clickable Card
:link: https://mystmd.org

The entire card can be clicked to navigate to `mystmd.org`.
:::
```

````{note} Compatibility with Sphinx design
:class: dropdown

In the [Sphinx design project](https://sphinx-design.readthedocs.io/en/latest/cards.html) card headers and footers take a special syntax:

- A card `title`: The argument given to the directive.
- A card `header`: Any content that precedes a line with ^^^.
- A card `footer`: Any content that comes after a line with +++.
- A card `body`: Any content that comes in between ^^^ and +++.

This syntax is supported in `mystmd`, for example:

```markdown
:::{card} Card Title
Header
^^^
Card content
+++
Footer
:::
```

Note that, card headers and footers are optional. If you don’t include ^^^ or +++ in your card, they will not show up.
````

:::{myst:directive} card
:::

## Buttons

A button is an element with text content that triggers an action to navigate to an internal or external reference upon a user click. Use the {myst:role}`button` role followed by the text content and target path to create a button.

```{myst}
{button}`MyST Role Spec <roles.md>`
```

```{myst}
{button}`MyST-MD GitHub <https://github.com/jupyter-book/mystmd>`
```

:::{myst:role} button
:::

## Grids

Grids allow you to structure arbitrary chunks of content in a grid-like system.

To generate a grid, use the ` ```{grid} ` wrapper directive along with ` ```{card} ` directives inside.

The numbers supplied in the argument are column counts to be used on different screen sizes e.g. `1 1 2 3` corresponding to smallest (<768px), medium (768px – 1024px), large (1024px – 1280px), and extra-large screens (>1280px). These pixel widths are determined by the theme (e.g. the book theme), which uses the default Tailwind CSS breakpoints.

For example:

```{myst}
::::{grid} 1 1 2 3

:::{card}
:header: Text content ✏️
Structure books with text files and Jupyter Notebooks with minimal configuration.
:::

:::{card}
:header: MyST Markdown ✨
Write MyST Markdown to create enriched documents with publication-quality features.
:::

:::{card}
:header: Executable content 🔁
Execute notebook cells, store results, and insert outputs across pages.
:::
::::
```

:::{myst:directive} grid
:::

## Tabs

You can also produce tabbed content. This allows you to display a variety of tabbed content blocks that users can click on.

```{myst}
::::{tab-set}
:::{tab-item} Tab 1
:sync: tab1
Tab one
:::
:::{tab-item} Tab 2
:sync: tab2
Tab two
:::
::::
```

If you have multiple tabs with the same name, they will be synced!

````{tab-set}
```{tab-item} Tab 1
:sync: tab1
Synced content for tab 1
```
```{tab-item} Tab 2
:sync: tab2
Synced content for tab 2
```
````

:::{myst:directive} tab-set
:::

:::{myst:directive} tab-item
:::
