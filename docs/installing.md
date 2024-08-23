---
title: Install the MyST Markdown Command Line Interface
subtitle: Install the MyST CLI using your favourite package manager
short_title: Install MyST
description: MyST Markdown is available through Node and npm, install the package with `npm install mystmd`.
---

:::{tip}
The MyST Markdown Command Line Interface (CLI) is available through [NodeJS](./install-node.md) and the node package manager, `npm`. NodeJS is used by [JupyterLab](https://github.com/jupyterlab/jupyterlab) (as well as many other Python packages) so you may already have it installed, and the following command may just work 🤞:

```shell
npm install -g mystmd
```
:::

To install the MyST CLI, choose your preferred package manager. If you do not know what a package manager is, *it is recommended that you install MyST with `mamba` from conda-forge*.


(installing-myst-tabs)=
:::::{tab-set}
(installing-with-mamba)=
::::{tab-item} conda-forge


🛠 Install `mamba` (<https://mamba.readthedocs.io>), see <xref:biapol#ref:miniforge_python>.


```shell
$ mamba --version
mamba 1.5.8
conda 24.7.1   
```

🛠 Install `mystmd` from `conda-forge`:

```shell
mamba install -c conda-forge mystmd
```

::::
::::{tab-item} PyPI

:::{note} Install Node.js?
:class: dropdown

The `mystmd` package on PyPI ships with the ability to install `node` (<https://nodejs.org>). If you would prefer to install NodeJS manually, see [Installing NodeJS](./install-node.md):
:::


🛠 Install `mystmd`:

```shell
pip install mystmd
```

🛠 Ensure `mystmd` is ready for use:

MyST needs `node` (<https://nodejs.org>) in order to run correctly. If `node` is not already installed, starting `myst` will prompt you to install it:

```shell
$ myst -v
❗ Node.js (node) is required to run MyST, but could not be found`.
❔ Install Node.js in '/root/.local/share/myst/18.0.0'? (y/N): y
⚙️ Attempting to install Node.js in /root/.local/share/myst/18.0.0 ...
ℹ️ Successfully installed Node.js 18.0.0
v1.3.4
```
::::
::::{tab-item} NPM

🛠 Install `node` (<https://nodejs.org>), see [Installing NodeJS](./install-node.md)

```shell
$ node -v
v20.4.0
```

🛠 Then install `mystmd` using npm, yarn or pnpm:

```shell
npm install -g mystmd
```

::::
:::::

This will install `myst` globally (`-g`) on your system and add a link to the main CLI tool. To see if things worked, try checking the version with:

```shell
myst --version
```

This command should print the current version of the package. If all is good, you can type `myst` again in your terminal and it will list the help with all of the options available to you.

```{note}
If you have any challenges installing, please [open an issue here](https://github.com/jupyter-book/mystmd/issues).
```


## Dependencies for $\LaTeX$ and PDF

If you are exporting to $\LaTeX$ with an open-source template specified (see all [templates](https://github.com/myst-templates)) or if you are creating a PDF you will need to install a version of [LaTeX](https://www.latex-project.org/get).

:::::{tab-set}
::::{tab-item} conda-forge

🛠 Install `mamba` (<https://mamba.readthedocs.io>), see <xref:biapol#ref:miniforge_python>.

```shell
$ mamba --version
mamba 1.5.8
conda 24.7.1   
```

🛠 Install `texlive-core` and `latexmk` from `conda-forge`:

```shell
$ mamba install -c conda-forge texlive-core latexmk
```

::::
:::::
