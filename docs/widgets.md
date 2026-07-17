---
title: Widgets
description: Add interactive JavaScript widgets to MyST sites.
---

MyST Widgets let you include JavaScript applets into the content of a MyST document.
They are self-contained, and can be shared across MyST projects (e.g. via an [`{embed}` directive](./embed.md)).
They are designed to be simple to develop and use.

MyST widgets follow the [anywidget specification](https://docs.anywidget.dev), a toolset for authoring reusable web-based widgets for interactive computing environments.
Widgets written for Jupyter anywidget can also work in MyST sites.

:::{caution}
Widget support is experimental. The interfaces may change as we learn more about their usage.
:::

Here's an example that creates a clickable button:

:::{card} Confetti Example

```{anywidget} https://github.com/jupyter-book/example-js-anywidget/releases/latest/download/widget.mjs

```

:::

## Overview of MyST Widgets

MyST Widgets are defined with the following two things:

1. **A JavaScript module**. This defines the core logic of the widget.
2. **A stylesheet** (optional). This applies styles to the widget.

The Widget module exports a `render` function that operates on two arguments:

1. `model`: contains the widget state, and can be used to update that state in your module.
2. `el`: a DOM element that your module can modify, and that will be inserted into the page.

The `el` DOM of a widget is a <wiki:Shadow_DOM>.
It is not "owned" by React in the same way that the rest of the page is, and so it is a safer way to generate arbitrary HTML and CSS as part of your MyST document.

## Simple widget structure

A widget module must export a default object with a `render` function:

```{code-block} javascript
:filename: my-widget.mjs
function render({ model, el }) {
  // Build your UI and append it to `el`
}
export default { render };
```

You can then use it in a MyST document via the `{widget}` directive like so:

````
```{anywidget} ./my-widget.mjs
```
````

The `render` function receives two arguments:

`model`
: A state object initialized from the JSON body of the `{anywidget}` directive.

  - **`model.get(key)`** — read a state value
  - **`model.set(key, value)`** — update a state value (triggers change events)
  - **`model.on('change:<key>', callback)`** — react to state changes

`el`
: An empty DOM element where your widget should render its content. Add and modify this DOM and it will show up on the page.

The `render` function can optionally return a cleanup function that is called when the widget is removed from the page.

## Use the widget model

The following simple widget example demonstrates how to use the `get`, `set`, and `on` functions of the `model` object.

Widgets contain a model (accessible via the `model` argument) that contains their state.
This can be arbitrary key/value pairs that are used in the final display of the widget.

You can instantiate a widget with model values via JSON provided in the directive body.
For example, this would create a widget with `count: 0`.

````
```{anywidget} my-widget.mjs
{
  "count": 0
}
```
````

- Running `model.get('count')` returns `0` at widget startup.
- Running `model.set('count', 10)` updates its value to `10`.
- Running ``model.on('change:count`, (count) => el.button.innerHtml = `Count is `${count}`) `` will update the button's HTML each time `count` changes.

### An example widget

Below is a simple widget example that ties together the logic above:

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

## Add style to widgets

There are three ways you can style widgets.

```{toc}
:context: section
```

### Style with a CSS stylesheet

You can create your own stylesheet (`.css` file) and link it to the Widget output.
For example, create a stylesheet like the following:

```{literalinclude} example-widget-style.css

```

And then add it to the widget like so:

````markdown
```{anywidget} ./example-widget.mjs
:css: ./example-widget-style.css
{
  "count": 0
}
```
````

:::{card} Styled Button Example

```{anywidget} ./example-widget.mjs
:css: ./example-widget-style.css
{
  "count": 0
}
```

:::

These styles are added to a <wiki:Shadow_DOM> that isolates the widget from the rest of the page styles.

### Add style attributes to DOM elements

If you wish to keep your styles entirely contained within the widget module, you can assign them directly to elements you create.
For example:

```javascript
function render({ model, el }) {
  const btn = document.createElement('button');
  Object.assign(btn.style, {
    padding: '0.4em 0.8em',
    border: '2px solid #333',
    borderRadius: '4px',
  });
  el.appendChild(btn);
}
```

This is the simplest approach, but note that inline styles have
high specificity - they cannot be overridden by a CSS stylesheet unless you use `!important` rules.

### Style with a stylesheet within the DOM

Combine the two approaches above by injecting a `<style>` tag into the `el` DOM and attaching a class to your widget elements.
This allows you to use CSS styling that a user could over-ride more easily if they wish.

```javascript
function render({ model, el }) {
  const style = document.createElement('style');
  style.textContent = `.my-button { padding: 0.4em 0.8em; border: 2px solid #333; }`;
  el.appendChild(style);

  const btn = document.createElement('button');
  btn.classList.add('my-button');
  el.appendChild(btn);
}
```

## Return a cleanup function

The `render` function can optionally return a cleanup function. This is called when the widget is removed from the page — for example, when a user navigates to a different page. Use it to clean up any resources your widget created, such as if you create JavaScript timers.

For example, the following cleanup function cleans up a timer that would otherwise run after the widget was destroyed:

```javascript
function render({ model, el }) {
  // UI
  const span = document.createElement('span');
  el.appendChild(span);

  // Update UI from model
  model.on('change:timestamp', () => {
    el.innerText = model.get('timestamp');
  });

  // Update model from events
  let timeoutID;
  const step = () => {
    model.set('timestamp', new Date().toLocaleTimeString());
    timeoutID = setTimeout(step, 1000);
  };
  step();

  // Clean up when the widget is removed from the page
  return () => clearTimeout(timeoutID);
}
export default { render };
```

## Security and best practices

:::{warning} Only load widgets from sources you trust!
Widget modules run arbitrary JavaScript — if you're loading a widget from a remote source, ensure that you can trust it!
:::

Widgets have full access to the page's `document`, which means they can select, modify, or remove any element on the page, not just their own `el` DOM.
**We do not recommend modifying elements outside of the `el` DOM.** Making changes outside of the `el` dom is not a supported workflow and can cause unpredictable behavior.

## Future Development

In the future, we are looking to find ways to integrate widgets with core MyST AST rendering. This would make it possible to create widgets that act on the MyST AST, such as table filtering, or galleries. Stay tuned!
