---
title: Deploying to Curvenote
short_title: Curvenote
description: Deploy your MyST site to Curvenote
---

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

[^actions]: To learn more about GitHub Actions, see the [GitHub documentation](https://docs.github.com/en/actions/quickstart). These are YAML files created in the `.github/workflows` folder in the root of your repository.
