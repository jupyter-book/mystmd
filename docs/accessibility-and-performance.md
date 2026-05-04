---
title: Accessibility and Performance
short_title: Accessibility & Performance
description: MyST builds documents and websites that are accessible to everyone and quick to load on any device.
---

## Accessibility

Most of the user-facing interface lives in [`myst-theme`](https://github.com/jupyter-book/myst-theme).
These default themes build on top of [Remix](https://remix.run/), which provides sensible accessibility defaults. This section describes the broader goals and considerations around accessibility for the MyST themes.[^scope]

[^scope]: **This page is scoped to the default MyST themes**

    This page describes the **default MyST website themes** (the Remix-based [`book` and `article` themes](https://github.com/jupyter-book/myst-theme) that ship with `mystmd`). Sites built with a custom theme or a different renderer may behave differently.

    For more information about accessibility across all of Jupyter, see the [Jupyter Accessibility Working Group](https://jupyter-accessibility.readthedocs.io).

:::{card} Open an a11y issue »
:link: https://github.com/jupyter-book/myst-theme/issues/new?labels=a11y
If you find a barrier on a MyST site, open an issue in `myst-theme`.
A clear way to reproduce helps even if you can't propose a fix.
:::

### Our accessibility goals

The [default MyST web themes](https://github.com/jupyter-book/myst-theme) aim to meet [WCAG 2.1 AA](https://www.w3.org/TR/WCAG21/), the level required of US public-sector and many private websites under [ADA Title II](https://www.ada.gov/resources/2024-03-08-web-rule/).

Accessibility bugs there are treated like any other bug.
See the [`a11y` issues label](https://github.com/jupyter-book/myst-theme/labels/a11y) for open accessibility issues.
Accessibility contributions follow the [normal contribution process](./contributing.md).


### How accessible is MyST today?

The MyST themes ship with these accessibility behaviors:

- Semantic HTML for articles, asides, figures, navigation, and captions.
- A skip-to-content shortcut and full keyboard navigation for menus, search, and the table of contents.
- Focusable, scrollable cell outputs so keyboard and screen-reader users can reach long stdout, stderr, and equation output.
- Color-contrast-aware defaults in the book and article themes, including code cells and error states.
- Pre-rendered math that ships as accessible HTML rather than images.
- Alt-text for images sourced from figure captions when present.
- `aria` labels and roles on interactive controls (theme toggle, document outline, search dialog, footnote return links).

In April 2026 we completed a focused round of work to [align with WCAG 2.1 AA](https://github.com/jupyter-book/mystmd/issues/2802). We know there is always ongoing work to be done to improve accessibility and welcome both guidance and contributions, see [](#a11y:contribute).

### Cell outputs are not under MyST's control

Many libraries emit interactive JavaScript or images as part of executing code (e.g., Plotly, ipywidgets, etc).
In these cases, MyST does not have control over the structure of what is created, and cannot guarantee their accessibility.
If you find a cell output that is not accessible, please report it in the repository for the tool that produced it.
The fix will most likely need to happen in that upstream tool rather than in the MyST theme.

(a11y:contribute)=
### Where can I follow along or contribute?

Open accessibility work is tracked under the [`a11y` label in `myst-theme`](https://github.com/jupyter-book/myst-theme/labels/a11y).
There's a thread for broader discussion and tracking in the [Accessibility Improvements tracking issue](https://github.com/jupyter-book/myst-theme/issues/238).

### How can I check the accessibility of my own site?

A few tools that others in the community have found useful:

- The [Jupyter Accessibility Working Group](https://jupyter-accessibility.readthedocs.io) has a collection of accessibility resources for the broader Jupyter community.
- [`berkeley-cdss/myst-a11y`](https://github.com/berkeley-cdss/myst-a11y) is a GitHub Action built for MyST sites. It runs [axe-core](https://github.com/dequelabs/axe-core) checks against WCAG 2.0 and 2.1 (A and AA) on every push and reports results as a tracking issue. See [data-8/textbook](https://github.com/data-8/textbook/blob/main/.github/workflows/a11y.yml) for a working example.
- [Lighthouse](https://github.com/GoogleChrome/lighthouse) is built into Chrome DevTools and is useful for a quick audit of a single page.
- [JupyCheck](https://jupycheck.vercel.app/) checks accessibility of source notebooks in Jupyter interfaces. This is useful if you also want readers to launch Jupyter sessions from your MyST site.


## Performance

The [default MyST themes](https://github.com/jupyter-book/myst-theme) are built on [Remix](https://remix.run/) and [React](https://reactjs.org/). These provide link prefetching, smaller download sizes through modern bundlers, image optimization, and faster page transitions that update only the part of the page that changed.
We follow the [PRPL pattern](https://web.dev/apply-instant-loading-with-prpl/) where possible:

- **P**reload the most important resources.
- **R**ender the initial route as soon as possible.
- **P**re-cache remaining assets.
- **L**azy load other routes and non-critical assets.

Hover over a link in the navigation with your browser's developer tools open: the next page is fetched as soon as you hover, before you click. Only that page's content and metadata are downloaded, not a full HTML document, and shared assets like fonts and styles are reused across pages. Pages you've already visited are served from your browser's cache.

Locally, MyST rebuilds and rerenders in under 150ms and restores your scroll position, so you can preview changes without losing your place.

Performance of a deployed site depends on the infrastructure that serves it. See [deployment](./deployment.md) for options.

### Lighthouse

[Lighthouse](https://github.com/GoogleChrome/lighthouse) is a Chrome tool that measures performance, accessibility, and search-engine readiness. It flags asset, image, and crawler issues that affect both real-world load times and search rankings.

```{figure} ./images/lighthouse-2022_09_15.png
:label: lighthouse
A 2022 Lighthouse run on a deployed MyST site using Curvenote's global CDN.
```

```{warning}
Lighthouse scores depend on your network, machine, and the specific page measured; the figure above is a 2022 snapshot. If you find a place where MyST performance can be improved, please [open an issue](https://github.com/jupyter-book/mystmd/issues).
```
