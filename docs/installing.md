---
title: Install and Update the MyST Markdown Command Line Interface
short_title: Install and Update MyST
description: MyST Markdown is available through Node and npm, install the package with `npm install mystmd`.
---

+++

## Install MyST

The MyST Markdown Command Line Interface (CLI) is available through [NodeJS](./install-node.md) and the node package manager, `npm`. Node is used by Jupyter as well as many other Python packages so you may already have it installed on your _PATH_ and the following command may just work 🤞.

🛠️ Install `NodeJS` by following instructions at [](./install-node.md)

🛠️ Choose either PyPI, Conda, Mamba or NPM and run the following command:

(installing-myst-tabs)=
::::{tab-set}
:::{tab-item} PyPI

🛠 Install `node` (<https://nodejs.org>), see [Installing NodeJS](./install-node.md):

```bash
node -v
>> v20.4.0
```

🛠 Then install `mystmd`:

```bash
pip install mystmd
```

:::
:::{tab-item} Conda / Mamba

🛠 Install `node` (<https://nodejs.org>), or through conda (see [Installing NodeJS](./install-node.md)):

```bash
# Visit https://nodejs.org or:
conda install -c conda-forge 'nodejs>=20,<21'
```

Then install `mystmd`:

```bash
conda install mystmd -c conda-forge
```

:::
:::{tab-item} NPM

🛠 Install `node` (<https://nodejs.org>), see [Installing NodeJS](./install-node.md)

```bash
node -v
>> v20.4.0
```

🛠 Install `mystmd` using npm, yarn or pnpm:

```bash
npm install -g mystmd
```

:::
::::

This will install `myst` globally (`-g`) on your system and add a link to the main CLI tool. To see if things worked, try checking the version with:

```shell
myst --version
```

This command should print the current version of the package. If all is good, you can type `myst` again in your terminal and it will list the help with all of the options available to you.

```{note}
If you have any challenges installing, please [open an issue here](https://github.com/jupyter-book/mystmd/issues).
```


### Dependencies for $\LaTeX$ and PDF

If you are exporting to $\LaTeX$ with an open-source template specified (see all [templates](https://github.com/myst-templates)) or if you are creating a PDF you will need to install a version of [LaTeX](https://www.latex-project.org/get).


+++

## Update MyST

### Update the MyST CLI
There are new releases of the MyST Markdown CLI every few weeks, to update to the latest version of `myst`, use:

```shell
npm update -g mystmd
```

Try the `myst --version` command before and after, with an update you should be on the most up to date version (see [npm](https://npmjs.com/package/mystmd) for the latest version!). If you are not, try `npm uninstall -g mystmd` or without the `-g` global flag, until `myst` is no longer available on your command line. Then try installing again!


There are new releases of the MyST Markdown CLI every few weeks, to update to the latest version of `myst`, use:

::::{tab-set}
:::{tab-item} PyPI

```bash
pip install -U mystmd
```

:::
:::{tab-item} Conda / Mamba

```bash
conda update mystmd -c conda-forge
```

:::
:::{tab-item} NPM

```bash
npm update -g mystmd
```

:::
::::

### Update the MyST templates and themes

The MyST templates define how myst **renders** content into outputs like HTML and PDF.
These are updated independently of the MyST CLI.
If a template is not downloaded locally when you build documents with MyST, the latest version will be downloaded.

To get the latest templates, clean your templates directory with:

```shell
myst clean --templates
```

This will remove the `_build/templates` directory, which will be re-downloaded with the latest templates when you run `myst start` or `myst build`.

+++

## Work with a Proxy Policy

MyST performs web requests to download templates, check DOIs, etc. If you are working on a network that enforces a strict proxy policy for internet access, you may specify a proxy configuration string with the `HTTPS_PROXY` environment variable, for example:

```shell
HTTPS_PROXY=http://168.63.76.32:3128 \
myst build
```
