---
title: Styles and CSS Classes
description: How to customize the look and feel of your website with CSS.
---

MyST has basic support for styling your content with CSS.
This page describes some common ways to do so.

:::{caution} This is still a work in progress
We're still building out custom CSS functionality with the MyST engine.
Follow and comment on the issues linked below to help us improve it!
:::

## Defining a Style Sheet

The [default MyST website themes](#default-web-themes) support bundling a custom [style-sheet](https://en.wikipedia.org/wiki/CSS). This can be used to introduce custom CSS styling to your website. To include a custom CSS file as part of your website build, you can define the @template-site-myst-book-theme-style option, e.g.

```{code} yaml
:filename: myst.yml
:linenos:
:emphasize-lines: 3
site:
  options:
    style: ./my-style.css
```

For example, the style-sheet could contain styling for `em` elements nested below a particular `text-gradient` class:

:::{literalinclude} public/style.css
:::

## Adding CSS Classes

The intended way to apply custom styling to your MyST website is to use CSS classes to connect your content to the style sheet. There are several ways to do this.

### Use content blocks

[Content blocks](../blocks.md) allow you to attach arbitrary metadata to chunks of content.
You can attach one or more CSS classes by defining a `class` attribute for a block.
For example the following:

```{myst}
+++ {"class": "text-gradient"}
This is _emphasized_. This is not emphasized.

+++

This is not emphasized.
```

### Use `div` and `span` elements

You can attach classes directly to [`div` and `span` elements](#div-and-span).

{myst:directive}`div` and {myst:role}`span` are analogous to their HTML counterparts. Unlike their directive/role, the HTML elements can also be given `style` options, e.g.

```{myst}
<div class="text-gradient" style="font-weight: bold;">Here's my <em>div</em></div>

Here's some <span class="text-gradient" style="font-weight:bold;">span <em>styled</em></span> content
```

### Add CSS classes to directives

Many directives and content blocks have a `:class:` option that can be used to add arbitrary CSS classes.
For example, below we add a CSS class to an admonition directive to snap it to the right:

````{myst}
```{note}
:class: text-gradient
I'm _very stylish_.
```
````

## Built-in CSS Classes

The HTML themes come with [a grid system of CSS classes](https://jupyter-book.github.io/myst-theme/?path=/docs/components-grid-system--docs), which can be used out-of-the-box to position content.
