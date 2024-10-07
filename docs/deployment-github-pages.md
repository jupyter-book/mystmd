---
title: Deploy to GitHub Pages
short_title: Github Pages
description: Deploy your MyST site to GitHub pages.
---

[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) allows you to host static HTML files online from GitHub repositories using GitHub Actions.
This page has important information for how to do so.

## Instructions

To get setup with GitHub Pages, ensure that your repository is hosted in GitHub and you are in the root of the Git repository.
There's a special `init` function which adds the proper configuration for deploying to GitHub Pages with a GitHub Action.

🛠 In the root of your git repository run `myst init --gh-pages`

The command will ask you questions about which branch to deploy from (e.g. `main`) and the name of the GitHub Action (e.g. `deploy.yml`). It will then create a GitHub Action[^actions] that will run next time you push your code to the main branch you specified.

:::{figure} ./images/myst-init-gh-pages.png
:class: framed
The command `myst init --gh-pages` will guide you through deploying to GitHub Pages.
:::

[^actions]: To learn more about GitHub Actions, see the [GitHub documentation](https://docs.github.com/en/actions/quickstart). These are YAML files created in the `.github/workflows` folder in the root of your repository.

🛠 In your repository, navigate to {kbd}`Settings` -> {kbd}`Pages` and enable GitHub Pages by choosing {kbd}`GitHub Actions` as the source.

This has activated GitHub Pages to accept new HTML from GitHub actions.

To trigger the action, push new commits of code to the branch that you've configured with the action above. You should start seeing your website show up at `<githuborg>.github.io/<githubrepo>`.

## `BASE_URL` Configuration for GitHub Pages
The MyST CLI needs to know the destination (base URL) or your site during build time. If you setup deployment to GitHub Pages using the `myst init --gh-pages` command, then _this is handled automatically for you_. Otherwise, if you deploy your website from a repository that's not the default GitHub Pages repository (i.e., not called `<username>.github.io`), you likely need to define a `BASE_URL` that includes the repository name.[^except-custom-domains] 
[^except-custom-domains]: If you're using a custom domain, you may not need to set `BASE_URL` if the site is served from the base domain (e.g.: `mydomain.org`) without a sub-folder (e.g., `mydomain.org/mydocs/`).

## Example: A Full GitHub Action

The GitHub Action below builds and deploys your site automatically.
Click the dropdown to show it, and copy/paste/modify as you like.

:::{note} GitHub Action Example
:class: dropdown

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
        uses: actions/upload-pages-artifact@v3
        with:
          path: './_build/html'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

:::
