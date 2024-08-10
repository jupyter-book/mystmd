---
title: Web Navigation, Structure, and Menus
description: There are several UI elements that you can configure to help users navigate your MyST website.
thumbnail: thumbnails/table-of-contents.png
---

In the [default MyST templates](./website-templates.md) there are several sections of the page that help your users navigate within and between pages.
Here's how you can configure them.

## Website Layout

The default MyST themes are divided into five main sections:

:::{figure} images/website-layout.svg
:width: 400px
The layout of the default MyST web themes.
Other themes may have slightly different structure.
:::

- **[Header](#navigation:header)**: Contains top-level site navigation.
- **[Primary sidebar](#navigation:sidebar-primary)**: Cross-page navigation defined in the [Table of Contents](./table-of-contents.md).
- **[Content window](#navigation:content-window)**: Contains content and metadata for the current page.
- **[Secondary sidebar](#navigation:sidebar-secondary)**: Contains in-page navigation and links.
- **[Footer](#navigation:footer)**: (work in progress) Contains more in-depth site navigation.

(navigation:header)=
## Header


(site-navigation)=

### Site navigation

In addition to [your MyST document's Table of Contents](./table-of-contents.md), you may specify a top-level navigation for your MyST site.
These links are displayed across all pages of your site, and are useful for quickly jumping to sections of your site, or for external links.

Specify top-level navigation with the `site.nav` option, and provide a collection of navigation links similar to [how the Table of Contents is structured](./table-of-contents.md). For example:

```{code-block} yaml
:filename: myst.yml

site:
  nav:
    # A top-level dropdown
    - title: Dropdown links
      children:
        - title: Page one
          url: https://mystmd.org
        - title: Page two
          url: https://mystmd.org/guide
    # A top-level link
    - title: A standalone link
      url: https://jupyter.org
```

% TODO: Clarify why some things have their own section (nav: and actions:) while
% others are nested under site.options.

### Action buttons

Action buttons provide a more noticeable button that invites users to click on them.
They are located in the top-right of the page.

Add action buttons to your site header with the `site.actions` option. For example:

```{code-block} yaml
:filename: myst.yml

site:
  actions:
    - title: Button text
      url: https://mystmd.org
    - title: Second button text
      url: https://mystmd.org/guide
```


(navigation:sidebar-primary)=
## Primary sidebar

Is defined by your [MyST Project Table of Contents](./table-of-contents.md).

(navigation:content-window)=
## Content window

Is populated with page-level metadata and your page's content.
See [](./frontmatter.md) for many kinds of metadata that configure this section.

(navigation:sidebar-secondary)=
## Secondary sidebar

Contains the in-page navigation of the page, autopopulated by the page's header structure.

(navigation:footer)=
## Footer

:::{warning} Work in progress
Default footer support is not yet avialable.
See https://github.com/jupyter-book/myst-theme/issues/448 to provide feedback on this feature.
:::
+++

