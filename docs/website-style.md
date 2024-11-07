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

## Use content blocks

:::{warning} CSS class support is very limited
Currently, you can only use CSS classes that are pre-loaded by MyST from Tailwind CSS, or defined in the HTML theme (see below for examples of both).
See these issues to track some of this:

- Defining your own CSS classes: https://github.com/jupyter-book/mystmd/issues/857
- Load extra Tailwind CSS classes when they're used on a page: https://github.com/jupyter-book/mystmd/issues/1617
:::

[Content blocks](../blocks.md) allow you to attach arbitrary metadata to chunks of content.
You can attach one or more CSS classes by defining a `class` attribute for a block.
For example the following:

```md
+++ {"class": "col-gutter-right"}
Right-styled

+++

Normal-styled
```

Results in:

+++ {"class": "col-gutter-right"}
Right-styled

+++

Normal-styled

## Use `div` and `span` elements

You can attach classes directly to [`div` and `span` elements](#div-and-span).
This works with `style` properties as well.

For example:

<div class="col-gutter-right" style="font-weight: bold;">Here's my div</div>

Here's some <span class="col-gutter-right" style="font-weight:bold;">Span</span> content

## Add CSS classes to directives

:::{note} Not all directives support the `:class:` option
If you wish to attach classes to a directive that doesn't seem to support it, please [open an issue](https://github.com/jupyter-book/mystmd/issues)
:::

Many directives and content blocks have a `:class:` option that can be used to add arbitrary CSS classes.
For example, below we add a CSS class to an admonition directive to snap it to the right:

````md
```{note}
:class: col-gutter-right
I'm on the right!
```
````

```{note}
:class: col-gutter-right
I'm on the right!
```

## Use the HTML theme grid system classes to position content

The HTML themes come with [a grid system of CSS classes](https://jupyter-book.github.io/myst-theme/?path=/docs/components-grid-system--docs).
You can use these to position content according to the link above.

## Use Tailwind CSS classes

:::{note} Provide feedback
This issue tracks loading extra Tailwind CSS classes when they're used on a page:

- https://github.com/jupyter-book/mystmd/issues/1617
:::

You can use any [Tailwind CSS class](https://tailwindcss.com/docs/installation) that's loaded on a page to style your content.
See the Tailwind documentation for examples of how to do this.
If a class seems to have no effect, it is likely not loaded on the page by MyST.
Currently, it's not possible to customize which classes are included on a page (see above for an issue tracking this).
