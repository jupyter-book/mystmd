---
title: Install the MyST Markdown Command Line Interface
subtitle: Install the MyST CLI using your favourite package manager
short_title: Install MyST
description: MyST Markdown is available through Node and npm, install the package with `npm install mystmd`.
---

To install the MyST CLI, choose your preferred package manager. If you do not know what a package manager is, _it is recommended that you install MyST with `mamba` from conda-forge_.

(installing-myst-tabs)=
:::::{tab-set}
(installing-conda-forge)=
::::{tab-item} conda-forge

You can install using `mamba` (<https://mamba.readthedocs.io>), see [Getting started with Miniforge](xref:biapol#ref:miniforge_python).

🛠 Then install `mystmd` from `conda-forge`:

```shell
mamba install -c conda-forge mystmd
```

You may also use [conda](https://docs.conda.io/projects/conda/en/latest/user-guide/getting-started.html) which comes packaged with the [Anaconda](https://www.anaconda.com/download/success) python distribution.

🛠 Then install `mystmd` from `conda-forge`:

```shell
conda install -c conda-forge mystmd
```

::::
::::{tab-item} PyPI

🛠 Install `mystmd`:

```shell
pip install mystmd
```

🛠 Ensure `mystmd` is ready for use:

MyST needs `node` (<https://nodejs.org>) in order to run correctly. If `node` is not already installed, starting `myst` will prompt you to install it:

```shell
$ myst -v
Node.js (node) is required to run MyST, but could not be found.
Install Node.js in '/root/.local/share/myst/20.0.0'? (y/N): y
Attempting to install Node.js in /root/.local/share/myst/20.0.0 ...
Successfully installed Node.js 20.0.0
v1.3.4
```

:::{note} Installing Node.js Manually
:class: dropdown

The `mystmd` package on PyPI ships with the ability to install `node` (<https://nodejs.org>). If you would prefer to install NodeJS manually, see [Installing NodeJS](./install-node.md):
:::

::::
::::{tab-item} NPM

Ensure your `node` (<https://nodejs.org>) is up to date (>v20), see [Installing NodeJS](./install-node.md).

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

🛠 Install `texlive-core`, `latexmk`, and `imagemagick` from `conda-forge`:

```shell
$ mamba install -c conda-forge texlive-core latexmk imagemagick
```

`imagemagick` is optional, but recommended if your documents include images that need conversion for PDF output.

::::
:::::

If you maintain a shared JupyterHub or other managed environment, install the PDF export tools into the user environment rather than expecting users to add them one-by-one. A minimal environment for MyST PDF exports should include:

- `mystmd`
- a working $\LaTeX$ distribution, such as `texlive-core` from `conda-forge`
- `latexmk`
- `imagemagick` for image conversion when documents include formats that need conversion for PDF output

For Debian or Ubuntu based images, the equivalent system packages commonly include `texlive-xetex`, `texlive-fonts-recommended`, `texlive-plain-generic`, `latexmk`, and `imagemagick`.
