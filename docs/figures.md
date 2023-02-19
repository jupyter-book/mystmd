---
title: Images and figures
description: MyST Markdown allows you to create images and figures in your documents, including cross-referencing content throughout your pages.
thumbnail: ./thumbnails/figures.png
---

MyST Markdown can be used to include images and figures in your documents as well as referencing those images easily throughout your website, article or paper.

## Simple images

The simplest way to create an image is to use the standard Markdown syntax:

```md
![alt](link 'title')
```

You can explore a {ref}`demo of images <md:image>` in the discussion of [](./commonmark.md) features of MyST.

Using standard markdow to create an image will render across all output formats (HTML, TeX, Word, PDF, etc). However, this markdown syntax is limited in the configuration that can be applied beyond `alt` text and an optional `title`. For example, the image width, alignment or a figure caption cannot be set with this syntax.

There are two directives that can be used to add additional information about the layout and metadata associated with an image.

**image**
: The `image` directive allows you to customize width, alignment, and other classes to add to the image

**figure**
: The `figure` directive can contain a figure caption and allows you to cross-reference this in other parts of your document.

## Image directive

````{myst}
```{image} https://images.unsplash.com/photo-1564731119111-2debdd39229c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=150&ixid=MnwxfDB8MXxyYW5kb218MHx8c3Vuc2V0fHx8fHx8MTY3NjgzNDAzNg&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=500
:alt: Beautiful Sunset
:width: 500px
:align: center
```
````

## Figure directive

````{myst}
```{figure} https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=200&ixid=MnwxfDB8MXxyYW5kb218MHx8YmVhY2gsb2NlYW58fHx8fHwxNjc2ODM0MTMy&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=400
:name: myFigure
:alt: Random image of the beach or ocean!
:align: center

Relaxing at the beach 🏝 🌊 😎
```
````

```{note}
You may also embed [notebook cell outputs as images or figures](#targeting-cells).
```
