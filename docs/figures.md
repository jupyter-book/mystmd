---
title: Images, Figures and Videos
short_title: Images, Figures, & Videos
description: MyST Markdown allows you to create images and figures in your documents, including cross-referencing content throughout your pages.
thumbnail: ./thumbnails/figures.png
---

MyST Markdown can be used to include images and figures in your documents as well as referencing those images easily throughout your website, article or paper.

## Simple images

The simplest way to create an image is to use the standard Markdown syntax:

```md
![alt](link 'title')
```

You can explore a [demo of images](#md:image) in the discussion of [](./commonmark.md) features of MyST.

Using standard markdown to create an image will render across all output formats (HTML, TeX, Word, PDF, etc). However, this markdown syntax is limited in the configuration that can be applied beyond `alt` text and an optional `title`.

There are two directives that can be used to add additional information about the layout and metadata associated with an image. For example, {myst:directive}`image.width`, {myst:directive}`alignment <image.align>` or a {myst:directive}`figure caption <figure.body>`.

**image**
: The {myst:directive}`image` directive allows you to customize {myst:directive}`image.width`, {myst:directive}`alignment <image.align>`, and other {myst:directive}`classes <image.class>` to add to the image

**figure**
: The {myst:directive}`figure` directive can contain a {myst:directive}`figure caption <figure.body>` and allows you to cross-reference this in other parts of your document.

(image-directive)=

## Image directive

````{myst}
```{image} https://github.com/rowanc1/pics/blob/main/grapes-wide.png?raw=true
:alt: Grapes on a vineyard
:width: 500px
:align: center
```
````

(figure-directive)=

## Figure directive

````{myst}
```{figure} https://github.com/rowanc1/pics/blob/main/sunset.png?raw=true
:label: myFigure
:alt: Sunset at the beach
:align: center

Relaxing at the beach 🏝 🌊 😎
```
````

```{note}
You may also embed [notebook cell outputs as images or figures](#targeting-cells).
```

## Subfigures

Subfigures can be created by omitting the directive argument to figure, and having the body contain one or more images or figures.
These will be numbered as `Figure 1a` and `Figure 1b`, etc. For example:

:::{figure}
:label: subFigure
:align: left

![Banff, Canada](https://github.com/rowanc1/pics/blob/main/banff-wide.png)
![Golden Gate Bridge, San Francisco](https://github.com/rowanc1/pics/blob/main/sfo-wide.png)

We saw some great things on our trips this year to Banff, Canada 🇨🇦 and San Francisco, USA 🌉.
:::

You can also cross-reference either the whole figure [@subFigure], or an individual subfigure [@subFigure-a] or [@subFigure-b]. Each subfigure is given an implicit reference that matches the figure label with a suffix of their letter, for example, a figure with label `my-figure` the two subfigures can be referred to as `my-figure-a` and `my-figure-b`, respectively. If you provide a [specific label for a subfigure](#label-anything), that label will be used instead of the implicit label.

```{myst}
:::{figure}
:label: my-figure
:align: left

(my-figure-fruit)=
![Here is some fruit 🍏](https://github.com/rowanc1/pics/blob/main/apples-wide.png?raw=true)

![My vacation pics! 🏝](https://github.com/rowanc1/pics/blob/main/ocean-wide.png?raw=true)

Some pictures of fruit and the ocean!
:::

See [](#my-figure-fruit) for the fruit, and [](#my-figure) to reference both subfigures.
```

By default, when referring to subfigures, the `{number}` that is used includes the parent enumerator (that is: `1a` rather than just `a`). To specifically use the sub-enumerator only, you can use the syntax `{subEnumerator}` in your text link which will be replaced with the sub-enumerator (that is: `a` rather than `1a`).

## Supported Image Formats

MyST supports many images formats including `.png`, `.jpg`, `.gif`, `.tiff`, `.svg`, `.pdf`, and `.eps`.
Many of these image formats are easily supported for HTML themes including `.png`, `.jpg` and `.gif`. However, the raster image formats can be further optimized to [improve site performance](./accessibility-and-performance.md), MyST translates these to the modern `.webp` format while the site is building. The original file-format is also included your site, with a `srcset` and fallback for older web-browsers.

`````{tab-set}
````{tab-item} PNG
:::{figure} ./images/myst-image.png
:width: 50%
`.png` is natively supported in all exports. The image is converted to `.webp` for web-browsers.
:::
````

````{tab-item} JPG
:::{figure} ./images/myst-image.jpg
:width: 50%
`.jpg` or `.jpeg` is natively supported in all exports. The image is converted to `.webp` for web-browsers.
:::
````

````{tab-item} GIF
:::{figure} ./images/myst-image.gif
:width: 50%
`.gif` is supported web-browsers and Microsoft Word, the first frame is extracted for $\LaTeX$ and PDF exports. The image is converted to `.webp` for web-browsers.
:::
````

````{tab-item} TIFF
:::{figure} ./images/myst-image.tiff
:width: 50%
`.tiff` is not supported by most web-browsers, and is converted to `.png`. Microsoft Word, $\LaTeX$ and PDF exports can work with these `.png` images, which are also converted to `.webp` for web-browsers.
:::
````

````{tab-item} SVG
:::{figure} ./images/myst-image.svg
:width: 50%
`.svg` is supported by web-browsers and is not further optimized or rasterized. When exporting to $\LaTeX$ and PDF the images are translated to `.pdf` using `inkscape` or as a fallback to `.png` using `imagemagick`. Microsoft Word requires the `.png` export.
:::
````

````{tab-item} PDF
:::{figure} ./images/myst-image.pdf
:width: 50%
A `.pdf` image is not supported by web-browsers or Microsoft Word. The images are translated to `.png` using `imagemagick`. $\LaTeX$ and PDF use the `.pdf` image directly.
:::
````

````{tab-item} EPS
:::{figure} ./images/myst-image.eps
:width: 50%
An `.eps` image is not supported by web-browsers or Microsoft Word. The images are translated to `.png` using `imagemagick`. $\LaTeX$ and PDF use the `.eps` image directly.
:::
````
`````

### Image Transformers

There are formats that are not supported by web-browsers but are common in scientific writing like `.tiff`, `.pdf` and `.eps` for site builds, these are converted to `.svg` or `.png` as appropriate and available. For export to $\LaTeX$, PDF or Microsoft Word, the files are converted to an appropriate format that the export can handle (e.g. $\LaTeX$ can work directly with `.pdf` images). For animated images, `.gif`, the first frame is extracted for static exports.

:::{tip} Installing Image Converters
:class: dropdown
The image transforms and optimizations requires you to have the following packages installed:

- [imagemagik](https://imagemagick.org/) for conversion between raster formats
- [inkscape](https://inkscape.org/) for conversion between some vector formats
- [webp](https://developers.google.com/speed/webp) for image optimizations

:::

(figures:multiple-images)=

### Multiple Images

If you have manually converted your images or have different images for different formats, use an asterisk (`*`) as the extension. All images matching the provided pattern will be found and the best image out of the available candidates will be used for the export:

```text
![](./images/myst-image.*)
```

For example, when exporting to $\LaTeX$ the best format is a `.pdf` if it is available; in a web export, a `.webp` or `.svg` will be chosen before a `.png`. In all cases, if an appropriate format is not available the image will be translated.

## Videos

To embed a video you can either use a video platforms embed script or directly embed an `mp4` video file. For example, the

```markdown
:::{figure} ./videos/links.mp4
An embedded video with a caption!
:::

or

![](./videos/links.mp4)
```

Will copy the video to your static files and embed a video in your HTML output.

:::{figure} ./videos/links.mp4
An embedded video with a caption!
:::

These videos can also be used in the [image](#image-directive) or even in simple [Markdown image](#md:image).

### Use an image in place of a video for static exports

If you'd like an image to display for static exports (like PDFs), use the asterisk (`*`) wildcard matching described in [](#figures:multiple-images).

For example, if you had the following two files:

```text
myvideo.mp4  <-- A video of something
myvideo.png <-- A frame of the video as an image
```

Then you could link them both with:

```md
![](myvideo.*)
```

When you build an HTML output, the video will be used, and when you build a PDF output, the image will be used.

## YouTube Videos

If your video is on a platform like YouTube or Vimeo, you can use the {myst:directive}`iframe` directive that takes the URL of the video.

```{myst}
:::{iframe} https://www.youtube.com/embed/F3st8X0L1Ys
:width: 100%
Get up and running with MyST in Jupyter!
:::
```

You can find this URL when clicking share > embed on various platforms. You can also give the {myst:directive}`iframe` directive {myst:directive}`iframe.width` and a {myst:directive}`caption <iframe.body>`.
