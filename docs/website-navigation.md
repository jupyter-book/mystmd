---
title: Web Navigation, Structure, and Menus
description: There are several UI elements that you can configure to help users navigate your MyST website.
thumbnail: thumbnails/table-of-contents.png
---

In the [default MyST templates](./website-templates.md) there are several sections of the page that help your users navigate within and between pages.
Here's how you can configure them.

:::{seealso} For all theme options
See [](site-options) for a list of all site options in both of the default themes.
:::

## Website Layout

The default MyST themes are divided into five main sections:

% Edit this figure with: excalidraw.com
:::{figure} images/website-layout.excalidraw.svg
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
    - title: Internal page
      url: /website-metadata
```

There are a few types of entries you can define:

:::{list-table}
:header-rows: 1
- * Type
  * Pattern
  * Description
- * **Internal paths**
  * ```yaml
    - title: Custom title
      url: /path/to/document
    ```
  * A path to an internal page. This should begin with `/`. Do not include the file extension of the page!
- * **External URLs**
  * ```yaml
    - title: Custom title
      url: https://somelink.org`
    ```
  * Direct links to an external website. This should be a fully-specified URL.
- * **Dropdowns**
  * ```yaml
    - title: Dropdown title
      children:
      - url: pageone
      - url: pagetwo
    ```
  * Becomes a dropdown with other entries inside.
:::


### Action Buttons

Action buttons provide a more noticeable button that invites users to click on them.
Add action buttons to your site header with the `site.actions` option.

For example:

```{code-block} yaml
:filename: myst.yml

site:
  actions:
    - title: A URL
      url: https://mystmd.org
```


There are two types of actions:


:::{list-table}
:header-rows: 1
- * Type
  * Pattern
  * Description
- * **Static downloads**
  * ```yaml
    - title: Custom title
      url: path/to/myfile.png
    ```
  * A path to an internal file. This turns the button into a download link for the file.
- * **External URLs**
  * ```yaml
    - title: Custom title
      url: https://somelink.org`
    ```
  * Direct links to an external website. This should be a fully-specified URL.
:::

(navigation:sidebar-primary)=
## Primary sidebar (Table of Contents)

Is defined by your [MyST Project Table of Contents](./table-of-contents.md).

### Hide the primary sidebar

To hide the Primary Sidebar, use `site.options.hide_toc` like so:

```{code-block} yaml
:filename: myst.yml
site:
  options:
    hide_toc: true
```

(navigation:content-window)=
## Content window

Is populated with page-level metadata and your page's content.
See [](./frontmatter.md) for many kinds of metadata that configure this section.

(navigation:sidebar-secondary)=
## Secondary sidebar

Contains the in-page navigation of the page, autopopulated by the page's header structure.

### Hide the secondary sidebar

To hide the secondary sidebar, use the `site.options.hide_outline` option:

```{code-block} yaml
:filename: myst.yml
site:
  options:
    hide_outline: true
```

(navigation:footer)=
## Footer

:::{warning} Work in progress
Default footer support is not yet avialable.
See https://github.com/jupyter-book/myst-theme/issues/448 to provide feedback on this feature.
:::
+++

