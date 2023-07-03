---
title: Deploying your MyST Site
short_title: Deployment
description: Deploy your
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

## Deploying to GitHub Pages

There are a few changes that need to be added to make this work for GitHub pages, which hosts your project in a folder, which is your repositories name, for example:\
`https://owner.github.io/repository_name`\
The build and site assets are in the `/build` folder, which would point outside of the current repository to a repository called 'build', which probably doesn't exist!

To fix this, we can change the base url that the site is mounted to, which can be done through the `BASE_URL` environment variable:

```bash
export BASE_URL="/repository_name"
```

The base URL is absolute and should not end with a trailing slash. This can be done automatically in a GitHub Action by looking to the `github.event.repository.name` variable.

:::{tip} Using GitHub Actions
:class: dropdown

You can use GitHub actions to build and deploy your site automatically when you merge new documents, for example.

```yaml
name: MyST Deploy
on:
  push:
    branches: [main]
env:
  BASE_URL: /${{ github.event.repository.name }}
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: 18.x
      - name: Install MyST
        run: npm install -g mystmd
      - name: Build HTML Assets
        run: myst build --html
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_build/html
```

:::

## Deploying to Curvenote

Curvenote provides a free service to host your MyST sites with an up-to-date theme ([deployment documentation](https://github.com/curvenote/action-myst-publish) for MyST sites). The websites are hosted on a `curve.space` subdomain with your username or a [custom domain](https://curvenote.com/docs/web/custom-domains). To configure the domain(s) add them to your site configuration:

```yaml
site:
  domains:
    - username.curve.space
```

You can then deploy the site using:

```bash
curvenote deploy
```

:::{tip} Using GitHub Actions
:class: dropdown

You can use GitHub actions to build and deploy your site automatically when you merge new documents, for example.

See the documentation for the action, including setting up your `CURVENOTE_TOKEN`:\
https://github.com/curvenote/action-myst-publish

```yaml
name: deploy-myst-site
on:
  push:
    branches:
      - main
permissions:
  pull-requests: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy 🚀
        uses: curvenote/action-myst-publish
```

:::
