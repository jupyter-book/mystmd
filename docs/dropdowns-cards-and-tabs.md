---
title: Dropdowns, Tabs & Cards
description: Add advanced user-iterface elements to your MyST documents with grids, cards, tabs, and dropdowns.
thumbnail: ./thumbnails/dropdowns-cards-and-tabs.png
---

(dropdowns)=

## Dropdowns

Dropdowns can be used to toggle content and show it only when a user clicks on the header panel. These use the standard HTML `<details>` element, meaning they also will work without Javascript. The dropdown can have a title, as the directive argument, and the open option can be used to initialise the dropdown in the open state.

::::{dropdown} Open dropdown to see the syntax!
:open:

````markdown
```{dropdown} Dropdown Title
:open:

Dropdown content
```
````

::::

```{seealso}
:class: dropdown

# Use "Admonition Dropdowns" for style!
You can also hide the body of your admonition blocks so that users must click a button to reveal their content. This is helpful if you’d like to include some text that isn’t immediately visible to the user.

To turn an admonition into a dropdown, add the option `:class: dropdown` to them. See [](#admonition-dropdown) for more information.
```

### Cards

Cards provide an easy way for you to content into a standard “header”, “body”, “footer” structure that has a similar alignment and visual style. It is useful for creating galleries or high-visibility collections of links and information.

Cards have four main sections, and uses special characters to separate certain sections:

- A card `title`: The argument given to the directive.
- A card `header`: Any content that precedes a line with ^^^.
- A card `footer`: Any content that comes after a line with +++.
- A card `body`: Any content that comes in between ^^^ and +++.

Here is an example card (note the use of ^^^ and +++ to separate the header, body, and footer):

````markdown
```{card} Card Title
Header
^^^
Card content
+++
Footer
```
````

```{card} Card Title
Header
^^^
Card content
+++
Footer
```

```{note}
Card headers and footers are optional. If you don’t include ^^^ or +++ in your card, they will not show up.
```

You can also add a `link` argument to the card, which will allow you to make the entire card clickable.

:::{card} Clickable Card
:link: https://myst-tools.org

The entire card can be clicked to navigate to `myst-tools.org`.
:::

### Grids

Grids allow you to structure arbitrary chunks of content in a grid-like system. You can also control things like the width of columns, the “gutters” between columns, etc.

To generate a grid, use the ` ```{grid} ` wrapper directive along with ` ```{grid-item-card} ` directives inside. For example:

::::{grid} 1 1 2 3

:::{grid-item-card}
Text content ✏️
^^^
Structure books with text files and Jupyter Notebooks with minimal configuration.
:::

:::{grid-item-card}
MyST Markdown ✨
^^^
Write MyST Markdown to create enriched documents with publication-quality features.
:::

:::{grid-item-card}
Executable content 🔁
^^^
Execute notebook cells, store results, and insert outputs across pages.
:::
::::

## Tabs

You can also produce tabbed content. This allows you to display a variety of tabbed content blocks that users can click on.

`````markdown
````{tab-set}
```{tab-item} Tab 1
:sync: tab1
Tab one
```
```{tab-item} Tab 2
:sync: tab2
Tab two
```
````
`````

Creates:

````{tab-set}
```{tab-item} Tab 1
:sync: tab1
Tab one
```
```{tab-item} Tab 2
:sync: tab2
Tab two
```
````

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

### `tab-item` reference

**Arguments** _(required: `1`, string)_
: The `tab-item` requires a single argument that is the title as a string.

    ```{warning}
    :class: dropdown
    # Note: the `tab-item` title is not currently not parsed

    The current implementation does not parse the tab title properly, and markup in this field will not be parsed.
    ```

**Options**
: No options for the `tab-item` are required

    sync _(optional, string)_
    : A key that is used to sync the selected tab across multiple tab-sets.

    selected _(flag, no-value)_
    : a flag indicating whether the tab should be selected by default.
