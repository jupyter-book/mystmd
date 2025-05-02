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

## Add a Style Sheet (CSS) to your website

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

(add-css-classes)=
## Add CSS Classes to content and blocks

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

### Add CSS classes in-line to role and directive titles

You can add CSS classes directly to roles and divs using [Inline Options syntax](./inline-options.md).

## Built-in CSS Classes

The HTML themes come with [a grid system of CSS classes](https://jupyter-book.github.io/myst-theme/?path=/docs/components-grid-system--docs), which can be used out-of-the-box to position content.

(light-dark-css)=
## Provide Light and Dark Mode images

You can use [Tailwind CSS classes](https://tailwindcss.com/docs/dark-mode) to make certain content show up in light vs. dark mode. By default items are shown in light mode, so here is how you can control light vs. dark behavior:

**To only show in dark mode**, attach the CSS class `hidden dark:block`. This hides the element by default, and sets its display to `block` when the Dark theme is active.

**To only show in light mode**, attach the CSS class `dark:hidden`. The element will be hidden when Dark mode is active.

For example, here is how you can make two elements swap visibility during light and dark mode. This is useful if you have two versions of an image that are meant for light and dark modes, but the same approach could be applied to any element you can [attach CSS classes to](#add-css-classes).

````{myst}
:::{div}
:class: hidden dark:block
The theme is dark.
:::

:::{div}
:class: dark:hidden
The theme is light.
:::
````

:::{warning} This will only work if you're using the default themes
This syntax depends on [Tailwind CSS](https://tailwindcss.com/docs/dark-mode), which comes with the default themes. If you're using a custom HTML theme, these classes may not work.
:::
