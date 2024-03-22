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

## Deploying to GitHub Pages

GitHub Pages[^pages] allows you to host your project in a folder, which is your repositories name, for example:\
`https://owner.github.io/repository_name`\
To get setup with GitHub Pages, ensure that your repository is hosted in GitHub and you are in the root of the Git repository.

🛠 In the root of your git repository run `myst init --gh-pages`

The command will ask you questions about which branch to deploy from (e.g. `main`) and the name of the GitHub Action (e.g. `deploy.yml`). It will then create a GitHub Action[^actions] that will run next time you push your code to the main branch you specified.

:::{figure} ./images/myst-init-gh-pages.png
:class: framed
The command `myst init --gh-pages` will guide you through deploying to GitHub Pages.
:::

[^actions]: To learn more about GitHub Actions, see the [GitHub documentation](https://docs.github.com/en/actions/quickstart). These are YAML files created in the `.github/workflows` folder in the root of your repository.
[^pages]: To learn more about GitHub Pages, see the [GitHub documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Navigate to your repository settings, click on Pages and enable GitHub pages. When choosing the source, use `GitHub Actions`:

🛠 Turn on GitHub Pages using **GitHub Actions** as the source.

To trigger action, push your code with the workflow to main.

:::{warning} Custom Domains
GitHub allow you to host your static content on a custom domain, doing so _may_ require you to change the `BASE_URL` environment variable in the action. If you have unstyled content, try changing the `BASE_URL` to a blank string: `BASE_URL=''` (note the **single quotes**!); this serves the build assets from the root of your domain, rather than the default, which is the name or your repository.
:::

:::{tip} `BASE_URL` environment variable
:class: dropdown
The build and site assets are in the `/build` folder, which would point outside of the current repository to a repository called 'build', which probably doesn't exist!

To fix this, we can change the base url that the site is mounted to, which can be done through the `BASE_URL` environment variable:

```bash
export BASE_URL="/repository_name"
```

The base URL is _absolute_ and should not end with a trailing slash. This can be done automatically in a GitHub Action by looking to the `github.event.repository.name` variable.
:::

:::{note} Full GitHub Action
:class: dropdown

The GitHub Action to build and deploy your site automatically is:

```{code} yaml
:filename: deploy.yml
# This file was created automatically with `myst init --gh-pages` 🪄 💚

name: MyST GitHub Pages Deploy
on:
  push:
    # Runs on pushes targeting the default branch
    branches: [main]
env:
  # `BASE_URL` determines the website is served from, including CSS & JS assets
  # You may need to change this to `BASE_URL: ''`
  BASE_URL: /${{ github.event.repository.name }}

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write
# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: 'pages'
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 18.x
      - name: Install MyST Markdown
        run: npm install -g mystmd
      - name: Build HTML Assets
        run: myst build --html
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: './_build/html'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
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

You can also deploy from a GitHub action, which will build your site and then deploy it to Curvenote.

🛠 In the root of your git repository run `myst init --gh-curvenote`

The command will ask you questions about which branch to deploy from (e.g. `main`) and the name of the GitHub Action (e.g. `deploy.yml`). It will then create a GitHub Action[^actions] that will run next time you push your code to the main branch you specified. Ensure that you including setting up your `CURVENOTE_TOKEN` which can be created from your Curvenote profile.

:::{tip} Full GitHub Actions
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
  contents: read
  pull-requests: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy 🚀
        uses: curvenote/action-myst-publish@v1
        env:
          CURVENOTE_TOKEN: ${{ secrets.CURVENOTE_TOKEN }}
```

:::
