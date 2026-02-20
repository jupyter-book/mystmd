---
title: Anywidgets
description: Add interactive JavaScript widgets to MyST sites.
---

## Getting Started

:::{caution}
Anywidget support is experimental. The interfaces may change as we learn more about their usage.
:::

Anywidget is

> [...] both a specification and toolset for authoring reusable web-based widgets for interactive computing environments.
>
> -- [docs.anywidget.dev](https://docs.anywidget.dev/en/getting-started)

The MyST Document Engine uses the anywidget specification to provide support for embedding JavaScript applets into a MyST site which can be shared across MyST projects.

Here's an example that creates a clickable button:

:::{card} Confetti Example

```{anywidget} https://github.com/jupyter-book/example-js-anywidget/releases/latest/download/widget.mjs

```

:::

Anywidgets are incredibly simple. They only need a tiny amount of JavaScript to define how they run. Here's a tiny counter widget:

```{literalinclude} example-widget.mjs

```

This creates the following button:

:::{card} Naked Button Example

```{anywidget} ./example-widget.mjs
{
  "count": 0
}
```

:::

This is cool! But, it has no styles. Without a style-sheet, the created button inherits the default styles (which are designed to remove all styling)!

We can add a stylesheet ourselves:

```{literalinclude} example-widget-style.css

```

These styles are added to a <wiki:Shadow_DOM> that isolates the anywidget from the rest of the page styles.

:::{card} Styled Button Example

```{anywidget} ./example-widget.mjs
:css: ./example-widget-style.css
{
  "count": 0
}
```

:::

## Future Development

In future, we are looking to find ways to integrate `anywidget` with core MyST AST rendering. This would make it possible to create widgets that act on the MyST AST, such as table filtering, or galleries. Stay tuned!
