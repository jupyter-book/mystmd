---
title: Update the MyST Markdown Command Line Interface
subtitle: Update the MyST CLI using your favourite package manager
short_title: Update MyST
description: MyST Markdown is available through Node and npm, install the package with `npm install mystmd`.
---
+++


## Update the MyST CLI

There are new releases of the MyST Markdown CLI every few weeks. To update to the latest version of `myst`, choose the package manager that you used in [](./installing.md):

::::{tab-set}
:::{tab-item} conda-forge

```bash
mamba update -c conda-forge mystmd
```

:::
:::{tab-item} PyPI

```bash
pip install -U mystmd
```

:::
:::{tab-item} NPM

```bash
npm update -g mystmd
```

:::
::::

Try the `myst --version` command before and after, with an update you should have the most up to date version (see [npm](https://npmjs.com/package/mystmd) for the latest version!). If you not, then you probably have multiple copies of `myst` installed on your computer, which should be removed before re-installing MyST.

## Update the MyST templates and themes

:::{tip}

MyST performs web requests to download templates, check DOIs, etc. If you are working on a network that enforces a strict proxy policy for internet access, you may specify a proxy configuration string with the `HTTPS_PROXY` environment variable, for example:

```shell
HTTPS_PROXY=http://168.63.76.32:3128 \
myst build
```
:::

The MyST templates define how myst **renders** content into outputs like HTML and PDF.
These are updated independently of the MyST CLI.
If a template is not downloaded locally when you build documents with MyST, the latest version will be downloaded.

To get the latest templates, clean your templates directory with:

```shell
myst clean --templates
```

This will remove the `_build/templates` directory, which will be re-downloaded with the latest templates when you run `myst start` or `myst build`.

