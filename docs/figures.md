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
```{image} https://source.unsplash.com/random/500x150?sunset
:alt: Beautiful Sunset
:width: 500px
:align: center
```
````

## Figure directive

````{myst}
```{figure} https://source.unsplash.com/random/400x200?beach,ocean
:name: myFigure
:alt: Random image of the beach or ocean!
:align: center

Relaxing at the beach 🏝 🌊 😎
```
````
