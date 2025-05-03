---
title: Contribute to the MyST documentation
short_title: Write Documentation
---

The documentation of MyST is inspired by the [Diataxis Documentation Framework](https://diataxis.fr).

## How to build the MyST guide documentation locally

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

## How to update the live website at mystmd.org

When you change the content here or in most other MyST repositories, it will _not_ automatically update mystmd.org. This is because we use [a custom MyST theme](#about:mystmd.org) that aggregates content from several MyST repositories into a single website.

The content for the live website mystmd.org is **managed by a Curvenote deployment**. To update the content of `mystmd.org`, you must make a deployment to Curvenote.

Currently, the only way to update the content in MyST's Curvenote deployment is to ask [@rowanc1](https://github.com/rowanc1) to do it. See [this issue about standardizing team access to documentation infrastructure](https://github.com/jupyter-book/team-compass/issues/25) for making this easier for our team to use.

### Caution: only update the live deployment if we know the theme still works!

If we've only changed content in a repository, then it is usually safe to deploy the change to the live site at mystmd.org.

However, **if MyST or one of its themes has been updated, first confirm that the [mystmd.org theme](#about:mystmd.org) has been updated to reflect these new changes.

## How does the MyST guide content relate to the documentation at mystmd.org

The documentation in this repository serves the content that lives [at `mystmd.org/guide`](https://mystmd.org/guide).

The full content and theme for [`mystmd.org`](https://mystmd.org) is [hosted at `jupyter-book/mystmd.org`](https://github.com/jupyter-book/mystmd.org), which pulls in the content from this folder along with several other documentation sources into one place.

However, the documentation here can be built independently for previewing your changes.

See [](#about:mystmd.org) for more information about the mystmd.org deployment.

(about:mystmd.org)=

## About the `mystmd.org` documentation and theme infrastructure

The [MyST website at mystmd.org](https://mystmd.org) is a custom MyST theme designed by the community in order to aggregate documentation from many locations into one website.

- The **content** for mystmd.org is located across several repositories in the MyST ecosystem, and it is deployed via a Curvenote deployment that uses the latest version of our custom `mystmd.org` theme from Vercel.
- The **theme** for mystmd.org is in [a repository we manage](#mystmd-theme-location) and deployed via Vercel. (see below for details)

(mystmd-theme-location)=
### Where is the mystmd.org theme located?

The [jupyter-book/mystmd.org](https://github.com/jupyter-book/mystmd.org) repository has a custom MyST theme that is used to control the content and structure of the site at mystmd.org. It is a [Remix](https://remix.run/) website and is deployed on [Vercel](https://vercel.com/). 

### How does the mystmd.org theme work?

The custom MyST theme at [jupyter-book/mystmd.org](https://github.com/jupyter-book/mystmd.org) is an example of generating a custom application/site using MyST components. It is **not** how most people build websites with MyST Markdown, but is a good "Advanced Use" example.

The MyST documentation uses a custom theme that inherits from a chain of base themes.
Here's a brief overview of where to look for things:

- The MyST documentation theme is a custom MyST theme defined in the [`jupyter-book/mystmd.org`](https://github.com/jupyter-book/mystmd.org) repository.
- It uses a modified version of [the MyST Book theme at `jupyter-book/myst-theme: /themes/book/`](https://github.com/jupyter-book/myst-theme/tree/main/themes/book).
- The `Book` and `Article` themes are both located in [the `jupyter-book/myst-theme` repository in the `/themes` directory](https://github.com/jupyter-book/myst-theme).
- Each is programmatically published to a repository in [the `myst-templates` GitHub organization](https://github.com/myst-templates) for easier and optimized public consumption.
  - [Book theme source](https://github.com/jupyter-book/myst-theme/tree/main/themes/book) -> [Book theme built version](https://github.com/myst-templates/book-theme)
  - [Article theme source](https://github.com/jupyter-book/myst-theme/tree/main/themes/article) -> [Article theme built version](https://github.com/myst-templates/article-theme)

The **content of mystmd.org** is pulled from a number of repositories across the `jupyter-book` organization.

For example, `mystmd.org/guide` is pulled from [`jupyter-book/mystmd: /docs/`](https://github.com/jupyter-book/mystmd/tree/main/docs), and [`mystmd.org/jtex`](https://mystmd.org/jtex) is pulled from [`jupyter-book/mystmd: /jtex/docs/`](https://github.com/jupyter-book/mystmd/tree/main/packages/jtex/docs). It also includes some custom applications like the Sandbox and MyST demo on the landing page.

### How do I deploy changes to the mystmd.org theme?

After updating the theme at `mystmd.org`, we must [deploy it to Vercel](#team-vercel-deployment) in order to make it available for use.
We use [a GitHub Action to deploy to our Vercel project](https://github.com/jupyter-book/mystmd.org/blob/main/.github/workflows/deploy.yml). This will update the theme infrastructure used to power `mystmd.org`.

To trigger that action, you can either:

1. **Trigger a workflow dispatch**. Go to [the Vercel action page](https://github.com/jupyter-book/mystmd.org/actions/workflows/deploy.yml). Click on *Run Workflow* and it will run.
2. **Push a commit to `main`** (of [jupyter-book/mystmd.org](https://github.com/jupyter-book/mystmd.org)). Any new commit to the `main` branch will trigger this action.

(team-vercel-deployment)=
### Where is the Vercel deployment that serves the mystmd.org theme?

Currently the theme is run on **Rowan's** personal Vercel project.

## How do I preview content changes in pull requests?

We use [the Netlify service](https://netlify.app) to generate deploy previews of the `mystmd` documentation for all pull requests.
These build only the `mystmd` guide (hosted at https://mystmd.org/guide), not the entire mystmd.org website.
They're just used for convenience and review purposes.

Configuration for our Netlify build exists in the [`netlify.toml` configuration file](https://docs.netlify.com/configure-builds/file-based-configuration/) in the root of the repository.

Any team members can have `Developer` access to our shared Netlify account, and Steering Council members can have `Owner` access.
If you'd like access, please ask a maintainer.

(jb-vs-md)=

## How to choose what to document in jupyterbook.org vs. mystmd.org?

:::{warning} We're still figuring this out!
This is a best-effort description of our approach to documentation, based on some conversations we had in https://github.com/jupyter-book/jupyter-book/issues/2239. We'll re-assess this as the documentation of each project evolves.
:::

Jupyter Book and the MyST Document Engine have heavily overlapping functionality, so it may be unclear whether something should be documented at mystmd.org or jupyterbook.org. That's OK and expected - here are some guidelines for where to document things:

- The MyST document engine will be a **power user tool**. It will be more flexible and modular, with an extensive plugin ecosysytem. It will be agnostic to build output, and single- or multi-page documents.
   - MyST should have the complete reference documentation for the MyST engine, as well as longer explanatory content about the MyST ecosystem.
   - As functionaliy is moved into plugins, we similarly prioritize reference documentation and explanation in those spaces.
   - MyST should be a standalone tool and have enough information for a power user to use on its own.
- Jupyter Book will be a **tool for typical users** focused around multi-page documents and websites. It will be opinionated, focused around the "book themes", and be more accessible to a new user or someone unfamiliar with JavaScript workflows.
   - Jupyter Book should focus on **How-Tos** and **Tutorials** that are driven by use-cases in multi-page workflows (e.g., documentation, books, community websites, etc).
   - Focus on keeping documentation outcome-oriented, and link heavily to the MyST engine docs for more complete reference information and explanation.

## How to create and edit Excalidraw diagrams

We use [Excalidraw diagrams](https://excalidraw.com) throughout our documentation.
This is a lightweight way to create flow charts and diagrams.

(export-excalidraw)=

**To create a new Excalidraw diagram**, first create what you wish in Excalidraw. Then, take the following steps:

1. Click the **hamburger menu**, then **export image**.
2. Ensure that **embed scene** is checked. This will include Excalidraw metadata with the output for future editing.
3. Click the `SVG` button (or `PNG` if necessary). This will download a local file with the diagram.
4. Put that in the `images/` folder and link it from your content.

**To make edits to an Excalidraw diagram**, follow these steps:

1. Open [excalidraw.com](https://excalidraw.com).
2. Find the file that you want to edit.
3. Confirm that it is a SVG or PNG that was **created with Excalidraw**, and that had **embed scene** checked upon creation.
4. Drag-and-drop that file into the Excalidraw window. (or, click **hamburger menu** -> **open** and add your file that way).
5. Make your edits in Excalidraw.
6. Export the new diagram using the [steps described above](export-excalidraw).
7. Replace the old file with the new one and commit it to `git`. If using an SVG, you can also just copy/paste the new SVG text and replace the old SVG text with it.

## How to enable Pull Request previews on Netlify

Netlify [Deploy Previews](https://docs.netlify.com/site-deploys/deploy-previews/) allow others to preview the documentation for a repository as part of the Pull Request workflow. This will add a Documentation Preview to the Status Checks of a pull request.
To enable it, do the following:

1. Enable Netlify builds for your repository.
2. Go to the `configuration -> notifications` section and look for **emails and webhooks**.
3. Go to **Deploy Notifications**, which lists the notifications that will post to each PR.
4. To add a new notification, click **Add Notification** -> **GitHub Commit Status**.
5. Ensure the following notifications are listed for **deploy state commit checks**:
   - Add deploy state commit checks when Deploy Preview starts
   - Add deploy state commit checks when Deploy Preview succeeds
   - Add deploy state commit checks when Deploy Preview fails

## How to modify and release a MyST theme

Below is a brief description for how modifications in a theme are released for public consumption.

1. **[dev facing]** we make a bunch of changes to the theme, probably changing things in `themes/book/*`, `themes/article/*` and `packages/*`
2. **[dev facing]** if there were changes in `packages/*` we release the `@myst-theme/*` packages (changesets based ci step)
3. **[dev facing]** we then run `make deploy-book` and `make deploy-article` which builds and bundles each theme, making commits to the https://github.com/myst-templates/book-theme and https://github.com/myst-templates/article-theme repos.
4. **[user facing]** at that point those latest bundle commits will be what is pulled by `mystmd` clients - people who already have those downloaded need to `myst clean --all` (as we don't yet auto bump based on version changes, see [#854](https://github.com/jupyter-book/mystmd/issues/854) for updates).
