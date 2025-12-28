---
title: Deploy to Read the Docs
short_title: ReadTheDocs
description: Deploy your MyST site to Read the Docs.
---

[Read the Docs](https://readthedocs.org) is a popular platform for hosting documentation that provides free hosting for open source projects and supports automatic builds from your Git repository.
This page has important information for how to deploy MyST sites to Read the Docs.

## Instructions

To get setup with Read the Docs, ensure that your repository is hosted on GitHub, GitLab, or Bitbucket, and you are in the root of the Git repository.
There's a special `init` function which adds the proper configuration for deploying to Read the Docs.

🛠 In the root of your git repository run `myst init --readthedocs`

The command will ask you which `Python` and `Node.js` versions to use. It will then create a `.readthedocs.yaml` configuration file in the root of your repository.[^python-note]

[^python-note]: While MyST builds only require Node.js, the configuration also includes Python. This is useful if you need to execute code in Jupyter notebooks or if you're using [Jupyter Book](https://jupyterbook.org) features alongside MyST.

After creating the configuration file, you'll need to:

🛠 Create an account on [readthedocs.org](https://readthedocs.org) if you don't have one

🛠 Import your project from your Git hosting provider (GitHub, GitLab, or Bitbucket)

🛠 Commit and push the `.readthedocs.yaml` file to your repository

Read the Docs will automatically build your documentation on each push. Your documentation will be available at `https://YOUR-PROJECT.readthedocs.io`.

## ReadTheDocs JavaScript might interfere with your site

By default, ReadTheDocs enables [documentation addons](https://docs.readthedocs.com/platform/latest/addons.html) that execute JavaScript on the page.
This may interfere with the React-based rendering that the `myst-theme` uses.
You might see an occasional "flicker" of the content as a result.
Experiment with disabling these add-ons and it may improve your outcomes, your mileage may vary!

## Example: A Full Read the Docs Configuration

The configuration file below builds and deploys your site automatically.
Click the dropdown to show it, and copy/paste/modify as you like.

:::{note} Read the Docs Configuration Example
:class: dropdown

```{code} yaml
:filename: .readthedocs.yaml
# Read the Docs configuration file for myst
# See https://docs.readthedocs.io/en/stable/config-file/v2.html for details
# This file was created automatically with `myst init --readthedocs`

# Required
version: 2

# Set the OS, Python version, and Node.js version
# Note: Python is included for executing code in notebooks or using Jupyter Book
build:
  os: ubuntu-22.04
  tools:
    python: "3.12"
    nodejs: "22"
  commands:
    # Install mystmd
    - npm install -g mystmd
    # Build the site
    - myst build --html
    # Copy the output to Read the Docs expected location
    - mkdir -p $READTHEDOCS_OUTPUT/html/
    - cp -r _build/html/. "$READTHEDOCS_OUTPUT/html"
    # Clean up build artifacts
    - rm -rf _build
```

:::
