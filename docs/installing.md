---
title: Installing MyST Markdown Command Line Interface
short_title: Installing MyST
description: MyST Markdown is available through Node and npm, install the package with `npm install mystmd`.
---

+++

The MyST Markdown Command Line Interface (CLI) is available through [NodeJS](./installing-prerequisites.md) and the node package manager, `npm`. Node is used by Jupyter as well as many other Python packages so you may already have it installed on your _PATH_ and the following command may just work 🤞.

🛠️ [Install NodeJS](./installing-prerequisites.md) and run the following command:

```shell
npm install -g mystmd
```

:::{danger} Do not use `myst-cli`!
In July 2023, we renamed the package and website to `mystmd` from `myst-cli`. Installing `myst-cli` will no longer create a `myst` command from your terminal.
:::

```{important} Installing Node

If you do not have `npm` installed you can look at our how to guide for [Installing NodeJS](./installing-prerequisites.md). If you have any challenges installing, please [open an issue here](https://github.com/executablebooks/mystmd/issues).
```

This will install `myst` globally (`-g`) on your system and add a link to the main CLI tool. To see if things worked, try checking the version with:

```shell
myst --version
```

This command should print the current version of the package. If all is good, you can type `myst` again in your terminal and it will list the help with all of the options available to you.

```{note}
If you have any challenges installing, please [open an issue here](https://github.com/executablebooks/mystmd/issues).
```

+++

## Updating MyST

There are new releases of the MyST Markdown CLI every few weeks, to update to the latest version of `myst`, use:

```shell
npm update -g mystmd
```

Try the `myst --version` command before and after, with an update you should be on the most up to date version (see [npm](https://npmjs.com/package/mystmd) for the latest version!). If you are not, try `npm uninstall -g mystmd` or without the `-g` global flag, until `myst` is no longer available on your command line. Then try installing again!

+++

### Dependencies for $\LaTeX$ and PDF

If you are exporting to $\LaTeX$ with an open-source template specified (see all [templates](https://github.com/myst-templates)) or if you are creating a PDF you will need to install a version of [LaTeX](https://www.latex-project.org/get).
