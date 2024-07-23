---
title: Contribute to the MyST documentation
short_title: Write Documentation
---

The documentation of MyST is inspired by the [Diataxis Documentation Framework](https://diataxis.fr).

## Build the MyST guide documentation locally

To build the MyST guide documentation:

1. Clone this repository:

   ```
   git clone https://github.com/jupyter-book/mystmd
   ```

2. [Install MyST Markdown by following these instructions](https://mystmd.org/guide/quickstart)
3. Navigate to the docs folder:

   ```
   cd docs/
   ```

4. Start a MyST server to preview the documentation:

   ```
   myst start
   ```

This will build the documentation locally so that you can preview what your changes will look like.

## How this relates to the documentation at mystmd.org

The documentation in this repository serves the content that lives [at `mystmd.org/guide`](https://mystmd.org/guide).

The full content and theme for [`mystmd.org`](https://mystmd.org) is [hosted at `jupyter-book/mystmd.org`](https://github.com/jupyter-book/mystmd.org), which pulls in the content from this folder along with several other documentation sources into one place.

However, the documentation here can be built independently for previewing your changes.

## The documentation theme infrastructure

The [MyST website at mystmd.org](https://mystmd.org) is a custom MyST theme designed by the community in order to aggregate documentation from many locations into one website.

The custom theme is a [Remix](https://remix.run/) website and is deployed on [Vercel](https://vercel.com/).

It is an example of how to generate a custom application/site using MyST components.
For example, `mystmd.org/guide` is pulled from [`jupyter-book/mystmd: /docs/`](https://github.com/jupyter-book/mystmd/tree/main/docs), and [`mystmd.org/jtex`](https://mystmd.org/jtex) is pulled from [`jupyter-book/mystmd: /jtex/docs/`](https://github.com/jupyter-book/mystmd/tree/main/packages/jtex/docs). It also includes some custom applications like the Sandbox and MyST demo on the landing page.

It is **not** how most people build websites with MyST Markdown, but is a good "Advanced Use" example.

### Where the mystmd.org theme is located

The MyST documentation uses a custom theme that inherits from a chain of base themes.
Here's a brief overview of where to look for things:

- The MyST documentation theme is a custom MyST theme defined in the [`jupyter-book/mystmd.org`](https://github.com/jupyter-book/mystmd.org) repository.
- It uses a modified version of [the MyST Book theme at `jupyter-book/myst-theme: /themes/book/`](https://github.com/jupyter-book/myst-theme/tree/main/themes/book).
- The `Book` and `Article` themes are both located in [the `jupyter-book/myst-theme` repository in the `/themes` directory](https://github.com/jupyter-book/myst-theme).
- Each is programmatically published to a repository in [the `myst-templates` GitHub organization](https://github.com/myst-templates) for easier and optimized public consumption.
  - [Book theme source](https://github.com/jupyter-book/myst-theme/tree/main/themes/book) -> [Book theme built version](https://github.com/myst-templates/book-theme)
  - [Article theme source](https://github.com/jupyter-book/myst-theme/tree/main/themes/article) -> [Article theme built version](https://github.com/myst-templates/article-theme)

### Modifying and releasing a theme

Below is a brief description for how modifications in a theme are released for public consumption.

1. **[dev facing]** we make a bunch of changes to the theme, probably changing things in `themes/book/*`, `themes/article/*` and `packages/*`
2. **[dev facing]** if there were changes in `packages/*` we release the `@myst-theme/*` packages (changesets based ci step)
3. **[dev facing]** we then run `make deploy-book` and `make deploy-article` which builds and bundles each theme, making commits to the https://github.com/myst-templates/book-theme and https://github.com/myst-templates/article-theme repos.
4. **[user facing]** at that point those latest bundle commits will be what is pulled by `mystmd` clients - people who already have those downloaded need to `myst clean --all` (as we don't yet auto bump based on version changes, see [#854](https://github.com/jupyter-book/mystmd/issues/854) for updates).

## Deploy previews for pull requests

We use [the Netlify service](https://netlify.app) to generate deploy previews of the `mystmd` documentation for all pull requests.
These build only the `mystmd` guide (hosted at https://mystmd.org/guide), not the entire mystmd.org website.
They're just used for convenience and review purposes.

Configuration for our Netlify build exists in the [`netlify.toml` configuration file](https://docs.netlify.com/configure-builds/file-based-configuration/) in the root of the repository.

Any team members can have `Developer` access to our shared Netlify account, and Steering Council members can have `Owner` access.
If you'd like access, please ask a maintainer.
