---
title: Deploying your MyST Site
short_title: Deployment
description: Deploy your MyST site to static HTML or a MyST-aware server.
---

The default themes for MyST sites are applications that render structured data _dynamically_, and are not static HTML sites. This choice allows the websites to include many [performance enhancements](./accessibility-and-performance.md) such as pre-fetching for instant page-transitions, loading indicators, and smaller network payloads. However, these advantages require that your website either (a) requires a web server or service that understands MyST sites; or (b) is changed to an HTML export that does not include these features but does allow you to host static files on services like GitHub pages.

## Creating Static HTML

To create a static HTML export of your MyST site, build it as HTML:

```bash
myst build --html
```

After the build process, you can see the folder in `_build/html`, which has all assets for your static website. You can verify that the site is working correctly by starting a static web-server, for example,\
`npx serve _build/html`\
which will serve a static version of the site.

:::{danger} Static sites should have an `index.html`
:class: dropdown

Your site should be configured with a single project at the root, this can be done by removing the `site.projects` list so that the site builds at the root url, rather than in a nested folder.

If your project is configured to be in a nested folder using a project `slug`, a site index will _not_ be created and your project will be instead accessible at a nested slug.

To fix this, change your `site` configuration to use a flat rather than nested project:

```yaml
version: 1
# Your project must be listed in the same myst.yml configuration
project: ...
site:
  title: Site Title
  # Delete the following `site.projects` configuration:
  # projects:
  #   - slug: nested-folder
  #     path: .
```

:::

:::{tip} Ignore the `_build` folder in Git
:class: dropdown

If you are using Git, add the `_build` folder to your `.gitignore` so that it is not tracked. This folder contains auto-generated assets that can easily be re-built -- for example in a Continuous Integration system like GitHub Actions.
:::

## Deployment Targets

:::{card} GitHub Pages
:link: ./deployment-github-pages.md
Deploy as a static site to GitHub pages using an action.
:::

:::{card} Curvenote
:link: ./deployment-curvenote.md
Deploy to Curvenote as a dynamic site with a managed MyST theme.
:::

:::{card} Netlify
:link: ./deployment-netlify.md
Deploy to Netlify as static HTML, and pull-request previews.
:::
