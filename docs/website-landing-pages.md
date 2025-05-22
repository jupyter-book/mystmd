---
title: Landing Pages
subtitle: Add visually appealing landing pages to your project
abbreviations:
  CTA: Call To Action
thumbnail: ./thumbnails/landing-pages.png
site:
  hide_outline: true
---

:::{warning} Landing Pages are Experimental
Landing pages are experimental, and the syntax and/or supported block-types are likely to change. Keep up-to-date with this page to ensure you stay abreast of these changes.
:::

The MyST [book-theme](#template-site-myst-book-theme) template provides out-of-the-box support for high-level landing-page blocks. By adding a small amount of annotation to your landing page, you can increase the approachability of your home page by composing it from visually-appealing blocks.

:::{tip} Landing Page Example
You can find a full working example at [`jupyter-book/example-landing-pages`](https://github.com/jupyter-book/example-landing-pages).
:::

## Defining a Block

The landing-page feature uses MyST [](#blocks) to annotate sections of a page. Each landing-page block-type has a distinct `kind` that can be defined using the `+++` block syntax as follows:

```markdown
+++ {"kind": "justified"}

I am a\
Subtitle

### Justified

A CTA that is justified to the left. At smaller screen sizes, buttons and links are placed below the description, whilst for large displays they float to right of the heading.

{button}`Go to Wiki <https://wikipedia.org>`
[MyST](https://mystmd.org)
```

See [](#justified-cta) to see how this CTA is rendered.

There are a few special block-types supported out of the box:

[`split-image`](#split-image-cta)
: A CTA consisting of a left-side image and a right-side call out with optional links and buttons.

[`justified`](#justified-cta)
: A CTA justified to the left of the screen with optional buttons and links aligned to the right.

[`centered`](#centered-cta)
: A CTA centered on the page. Where defined, buttons and links are placed below the content.

[`logo-cloud`](#logo-cloud-cta)
: A logo cloud section may be used to highlight prominent people, concepts, or projects. It adds a little sparkle to the existing [](#grids) feature by centering and emboldening narrative text.

Each CTA supports a subtitle, title, and description, which must be defined in the following order:

```markdown
I am a subtitle! \
I occur before the heading.

## I am a heading!

I am a description, I follow the heading.
```

Where a landing-page block supports links and buttons, these are pulled from anywhere in the block description, e.g.:

```markdown
I am a subtitle! \
I occur before the heading.

## I am a heading!

I am a description, [I am a link!](https://wikipedia.org).
I follow the heading. {button}`I am a button <https://mystmd.org>`
```

## Turning off elements on the landing page

It can be helpful to turn off the outline and table of contents on landing pages as well as hide the default title-block, this can be completed through the frontmatter block at the top of your index page:

```yaml
---
title: Welcome to My Landing Page
site:
  hide_outline: true
  hide_toc: true
  hide_title_block: true
---
```

## Examples

+++ { "kind": "split-image", "class": "col-body" }

Subtitle

(split-image-cta)=

### Split-Image

A helpful description in the body of the CTA. {button}`Go to Wiki <https://wikipedia.org>`

![An image.](https://fastly.picsum.photos/id/1045/512/512.jpg?hmac=xSX-hQcOc9AVckDyczqSvsXTDAJqpF8WBgEWAYGN0AI)

[MyST](https://mystmd.org)

+++ { "kind": "justified", "class": "col-body"}

I am a Subtitle

(justified-cta)=

### Justified

A CTA that is justified to the left. At smaller screen sizes, buttons and links are placed below the description, whilst for large displays they float to right of the heading.

{button}`Go to Wiki <https://wikipedia.org>`

+++ { "kind": "centered", "class": "col-body"}

Subtitle

(centered-cta)=

### Centered

A CTA that is centered in the middle of the page. Buttons and links are placed below the description.

{button}`Go to Wiki <https://wikipedia.org>`

+++ { "kind": "logo-cloud", "class": "col-body"}

(logo-cloud-cta)=

### Logo Cloud

Logo-clouds can focus on grid-like content.

::::{grid}
:::{figure} https://fastly.picsum.photos/id/939/128/128.jpg?hmac=1eysq3_FiKeEH3dMDvzKHL-lwBr9HNlviw35OOqJ4Xs
Tower Block Inc
:::

:::{figure} https://fastly.picsum.photos/id/88/128/128.jpg?hmac=gLk80MwrYMX7V6Uj5rwj_RGQbEx9PwmLhJdyPqvlPJw
Highways LTD
:::

:::{figure} https://fastly.picsum.photos/id/531/128/128.jpg?hmac=L9q2GhcxT3h9NZ9mjpu9pif4_1tL2O9vD3o724WXJcE
Cameras LLC
:::
::::

{button}`Go to Wiki <https://wikipedia.org>`
