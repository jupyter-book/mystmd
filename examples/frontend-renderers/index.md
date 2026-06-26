---
title: Front-end Renderers
description: A MyST plugin that contributes front-end renderers for custom elements.
---

# Front-end Renderers

This site uses a [plugin](./plugin.mjs) that contributes **front-end renderers**.
A renderer pairs a custom element (an mdast node `type`) with an
[anywidget](https://anywidget.dev)-style ESM module that renders that element in
the browser.

The flow is:

1. A **directive** runs at build time and emits a custom node (e.g. `counter`).
2. The matching **renderer** module is copied into the site's `public/` folder
   and listed in `config.json`.
3. The theme loads the module on the site and uses it to render the node.

## Counter

A `{counter}` directive emits a `counter` node, rendered by
`renderers/counter.mjs`:

```{counter} 0
:label: Clicks
```

You can also start counting from another value:

```{counter} 41
:label: Almost there
```

## Clock

A `{clock}` directive emits a `clock` node, rendered by `renderers/clock.mjs`,
which updates every second and cleans up its timer when removed:

```{clock}
:label: The time is
```
