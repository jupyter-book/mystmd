---
title: Accessibility and Performance
short_title: Accessibility & Performance
description: MyST sites are designed for mobile and desktop sites, accessibility and speedy page loads.
---

## Performance

The MyST Site existing, modern web-frameworks including [Remix](https://remix.run/) and [React](https://reactjs.org/). These tools come out-of-the-box with prefetching for faster navigation, smaller network payloads through modern web-bundlers, image optimization, and partial-page refresh through single-page application. We follow the [PRPL Pattern](https://web.dev/apply-instant-loading-with-prpl/)[^prpl] where possible.

[^prpl]: PRPL is a pattern designed to improve performance of webpages:

    - Preload the most important resources.
    - Render the initial route as soon as possible.
    - Pre-cache remaining assets.
    - Lazy load other routes and non-critical assets.

As an example, try hovering over the navigation on this page (potentially with your network development tools open!), the entire page will be fetched based on your intent (i.e. hovering over the link for a moment). This includes downloading any assets for additional styling on the upcoming page. Note that many assets are shared between pages, and only the actual content is fetched (i.e. the AST and page metadata), not the full HTML page, which again makes for smaller network payloads and speed for browsing! Content is also cached if you re-visit a page.

When working locally MyST is designed to rebuild and rerender the site in <150ms, and has scroll-restoration so you don't loose your place. This speed can dramatically improve the authoring experience as it allows you to preview changes rapidly.

The real-world deployment of your site will depend on the infrastructure that you use to serve it. See [deployment](./deployment.md) for more information on options for sharing your site.

## Lighthouse Score

Lighthouse is a tool included in Chrome that measures accessibility, performance, and search engine performance (see [lighthouse on GitHub](https://github.com/GoogleChrome/lighthouse)). Although not perfect, the tool does do a good job at highlighting issues with performance, search engine crawling, and accessibility. These scores indicate the real-world performance of a site as well as can effect search engine rankings.

```{figure} ./images/lighthouse-2022_09_15.png
:label: lighthouse
Lighthouse score run Sept 15, 2022 on deployed site using Curvenote's global CDN.
```

Some performance and accessibility considerations:

- Semantic HTML used for articles, asides, figures, nav, and captions, including limited use of generic `div`s and `span`s where we can.
- Anchor tags for all interactive content, that work when Javascript is _not_ enabled
- Prerendering math on the server, reducing page load size (for javascript) and improving render speed and cumulative layout shift.
- Optimizing images to next-generation formats (e.g. `webp`), and providing fallbacks for older browsers (through image source sets)
- Providing figure captions as alt-text for images
- Lazy-fetching syntax highlighters
- Lazy-fetching unused javascript
- Bundling and eliminating code for the entire site
- Ensuring appropriate contrast in text and background in the default themes

````{seealso}
:class: dropdown
# Comparing to Jupyter Book & Quarto

As a comparison to Jupyter Book or Quarto, which are both static site generators for scientific content, and assets built by Sphinx and Pandoc, respectively. There are improvements possible primarily in the bundling of Javascript assets, which is very difficult to do in the Sphinx build process, for example.

```{figure} ./images/lighthouse-jb-2022_09_15.png
:label: lighthouse-jb
Jupyter Book Lighthouse score run Sept 15, 2022 on deployed site, the majority of issues are around bundling assets, reducing javascript used, optimizing images, and speed to initial page load.
```

```{figure} ./images/lighthouse-quarto-2022_09_15.png
:label: lighthouse-quarto
Quarto Lighthouse score run Sept 15, 2022 on deployed site, the majority of issues are image sizing, main-thread work, and high network payloads.
```
````

```{warning}
The performance metrics above are subject to changes over time, and may differ on your computer, network connection and page analyzed.
We include these metrics on this page because (1) we have put a lot of work into performance and accessibility 🎉 and (2) to let you know that as MyST developers we care about performance, accessibility, and semantic HTML that can be read by both search engine crawlers and academic indexes.

If you find a place where we can improve performance in your site, please [open an issue](https://github.com/jupyter-book/mystmd/issues).
```
