---
title: Deploying to GitHub Pages
short_title: Github Pages
description: Deploy your MyST site to GitHub pages with a single command.
---

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
