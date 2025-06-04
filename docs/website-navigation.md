---
title: Web Navigation, Structure, and Menus
description: There are several UI elements that you can configure to help users navigate your MyST website.
thumbnail: thumbnails/table-of-contents.png
---

In the [default MyST templates](./website-templates.md) there are several sections of the page that help your users navigate within and between pages.
Here's how you can configure them.

:::{seealso} For all theme options
See [](#site-options) for a list of all site options in both of the default themes.
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

````{list-table}
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
      url: https://somelink.org
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
````

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

````{list-table}
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
````

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

### Use the Edit this Page button

If you've added [`github` MyST frontmatter](#table-frontmatter), the MyST themes will display an "Edit this page" link for your page. This link will point to the source file for your page in GitHub, allowing a reader to quickly view the source and make an edit using GitHub's UI.

:::{tip} How to use GitHub's UI to edit a page
There are two ways to edit a URL in GitHub:

1. Click the pencil icon {kbd}`✏️` to open a lightweight editor on the page.
2. Replace `.com` with `.dev` in the URL (or, simply press the period button {kbd}`.`). This will open a VSCode editor session you can use to make more extensive edits.
:::

To override this behavior and set a manual edit URL, use the `edit_url` field in [MyST frontmatter](#table-frontmatter).

To disable the `Edit this page` button, set the value of `edit_url` to `null`.

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

### Make content expand to the right margin

To make content take up the empty space to the right of the content (where the secondary sidebar usually lives), attach the `col-page-right` CSS class (one of the [built-in CSS classes](#built-in-css)) to a page block or element.

Here's an example of attaching the class directly to an admonition:

````md
```{note} This note will spread to the right!
:class: col-page-right
Yes it will!
```
````

```{note} This note will spread to the right!
:class: col-page-right
Yes it will!
```

You could also attach the CSS class to a [content block](./blocks.md).

(navigation:footer)=

## Footer

You can add a site-wide footer by using [site "parts"](#parts:site).
Add a footer part to your `myst.yml` like so:

```{code} yaml
:filename: myst.yml
site:
  parts:
    footer: footer.md
```

The contents of `footer.md` will be rendered at the bottom of each page.
It will be parsed similarly to other MyST content (though some functionality like code execution will not work).

### Style your footer

By default footers have style that is similar to the rest of your document.
To define a different style (e.g., a multi-column footer with links), use a combination of [`{grid}` and button elements](#grids), along with a [custom CSS style sheet](style-sheet).
Footers are wrapped in a `div` with class `.footer`, which can be used in CSS to select items for styling.

For example, the following `myst.yml` configuration adds a `footer.css` file that can be used to define the look and feel of your footer.

```{code} yaml
:filename: myst.yml
site:
  options:
    style: ./css/footer.css
  parts:
    footer: footer.md
```

### An example custom footer

The [example landing page](https://github.com/myst-examples/landing-pages) includes a [`footer.md`](https://raw.githubusercontent.com/jupyter-book/example-landing-pages/refs/heads/main/footer.md) and [`./css/footer.css`](https://raw.githubusercontent.com/jupyter-book/example-landing-pages/refs/heads/main/css/footer.css) that you can customize.
