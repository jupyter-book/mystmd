---
title: Host your MyST Site
short_title: Web hosting
description: Deploy your MyST site to static HTML or a MyST-aware server.
---

There are two different ways to host MyST websites online.

- **As a static website**. An HTML file is generated for each page at once. The collection of HTML files and website assets can be served from static site hosts (like [GitHub Pages](https://docs.github.com/en/pages), [Netlify](https://netlify.com), and [ReadTheDocs](https://readthedocs.org)).
- **As an application**. A MyST _server_ is run that dynamically generates pages when a user visits them. Your site can be served by a hosting provider that supports applications (like [Curvenote](https://curvenote.com) or [Vercel](https://vercel.com))

The high-level differences between these approaches are outlined in [](#deployment-comparison).
:::{table} High-Level Comparison of MyST Site Deployment Types
:label: deployment-comparison

| Deployment Type | High Performance | Seamless Updates | Static Hosting |
| :-------------: | :--------------: | :--------------: | :------------: |
| Static website  |        ❌        |        ❌        |       ✅       |
|   MyST server   |        ✅        |        ✅        |       ❌       |

:::

:::{note} MyST was designed to be deployed as an application
Deploying MyST as an application has many benefits. For example, [performance enhancements](./accessibility-and-performance.md) (like pre-fetching for instant page-transitions, loading indicators, and smaller network payloads) and easier upgrades as new MyST versions are released.

The [default themes](#default-web-themes) for MyST are designed to be MyST applications rather than static sites, but the core functionality is equally shared between the two options.
:::

% - Static deployments are MPA (each page own HTML document), SSG (rendered ahead of time)
% - Servers are SPA (request JSON), SSR+hydration
%- Term definitions?
% - SPA vs MPA
% - SSR vs CSR vs SSG

The choice between static hosts and application-based hosts often comes down to the type of website hosting that is available, and the amount of complexity that you're willing to deal with in deploying your site.
The sections below share a few considerations to help you make a decision.

## Static Websites

### Creating Static HTML

To create a static HTML export of your MyST site, build it as HTML:

```bash
myst build --html
```

After the build process, you can see the folder in `_build/html`, which has all assets for your static website. You can verify that the site is working correctly by starting a static web-server, for example,

```shell
npx serve _build/html
```

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

:::{tip} Static HTML generates folder-based HTML files
:class: dropdown

When you generate static HTML using MyST, routes to documents (e.g. `/folder/mydoc`) must be rendered into static HTML files. MyST will turn routes into HTML paths like so:

```
/myfolder/mydoc/index.html
```

When the browser sends a request to the route `/folder/mydoc`, the server interprets that as request for the HTML file `/myfolder/mydoc/index.html`, and returns that.

Some SSGs instead return HTML files like `/myfolder/mydoc.html`, and this can trigger different behavior depending on the hosting platform you're using. However, `/myfolder/mydoc/index.html` is generally a safer bet, which is why it is the default.

See [the trailing slash and hosting provider guide](https://github.com/slorber/trailing-slash-guide) for more information about the impact of this behavior across hosting providers.

_Inspired from the [excellent Docusaurus documentation](https://docusaurus.io/docs/advanced/routing#routes-become-html-files)_
:::

(deploy:base-url)=
### Custom domains and the base URL

When deploying static HTML to the web, you may have to specify a Base URL so that links resolve properly.
This happens when you serve your MyST site from a *subfolder* of a parent URL.
For example:

- `mysite.org/`: **Does not** require a `BASE_URL` to be set, because the root site is where your MyST site lives.
- `mysite.org/docs/`: **Does** require a `BASE_URL` to be set, because your MyST HTML files will be in `docs/`, not the root.

If MyST detects an environment variable called `BASE_URL` it will prepend it to all links.

In the following examples we first define a `BASE_URL` parameter and then build the MyST HTML assets.

::::{tab-set}
:::{tab-item} Bash
```bash
export BASE_URL="/repository_name"
myst build --html
```
:::
:::{tab-item} Powershell
```powershell
$env:BASE_URL = "/folder1/folder2" 
myst build --html
```
:::
:::{tab-item} Fish
```fish
set -x BASE_URL "/folder1/folder2"
myst build --html
```
:::
:::{tab-item} CMD
```cmd
set BASE_URL=/folder1/folder2
myst build --html
```
:::
::::

:::{tip} Set `BASE_URL` in your CI/CD
You can set environment variables in many CI/CD services like GitHub Actions and Netlify.
This can be a useful way to ensure the `BASE_URL` is set before your site is deployed.
:::

### Services for Static Web Hosting

The contents of the `_build/html` can be served from any static web server. The following articles outline the process of deploying your static site to well-known website providers:

(static-web-services-dropdown)=

:::{toc}
:context: children
:::

## Application Websites

### Creating Structured Site Data

MyST servers consume _structured data_ that represents a MyST website. These data can be built using the `myst build` command,

```shell
myst build --site
```

which populates the `_build/site` directory with information about your website including the metadata, cross-references, static images, and [MyST AST](https://mystmd.org/spec).

### Deploying to a MyST-Aware Server

:::{note}
At present, only [Curvenote](https://curvenote.com/) provides out-of-the-box support for deployment of MyST websites:
:::

% TODO: vercel/netlify server

:::{card} Curvenote
:link: ./deployment-curvenote.md
Deploy to Curvenote as a dynamic site with a managed MyST theme.
:::
