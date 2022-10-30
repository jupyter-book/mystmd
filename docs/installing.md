---
title: Installing MyST
description: MyST is available through Node and npm, install the package with `npm install myst-cli`.
---

+++

MyST is available through [NodeJS](./installing-prerequisites.md) and the node package manager, `npm`. Node is used by Jupyter as well as many other Python packages so you may already have it installed on your *PATH* and the following command may just work 🤞.

🛠️ [Install NodeJS](./installing-prerequisites.md) and run the following command:

```shell
npm install -g myst-cli
```

````{important}
**Note**

If you do not have `npm` installed you can look at our guide for [Installing NodeJS](./installing-prerequisites.md). If you have any challenges installing, please [open an issue here](https://github.com/executablebooks/mystjs/issues).
````

This will install `myst` globally (`-g`) on your system and add a link to the main CLI tool. To see if things worked, try checking the version with:

```shell
myst --version
```

This command should print the current version of the package. If all is good, you can type `myst` again in your terminal and it will list the help with all of the options available to you.

````{note}
If you have any challenges installing, please [open an issue here](https://github.com/executablebooks/mystjs/issues).
````

+++

## Updating MyST

There are new releases of the MyST CLI every few weeks, to update to the latest version of `myst`, use:

```shell
npm update -g myst-cli
```

Try the `myst --version` command before and after, with an update you should be on the most up to date version (see [npm](https://npmjs.com/package/myst-cli) for the latest version!). If you are not, try `npm uninstall -g myst-cli` or without the `-g` global flag, until `myst` is no longer available on your command line. Then try installing again!

+++

### Dependencies for $\LaTeX$ and PDF

If you are exporting to $\LaTeX$ with an open-source template specified (see all [templates](https://github.com/myst-templates)) or if you are creating a PDF you will need to install a version of [LaTeX](https://www.latex-project.org/get).

+++

## Developing

For the [mystjs](https://github.com/executablebooks/mystjs) library on GitHub, `git clone` and you can install the dependencies and then create a local copy of the library with the `npm run dev` command.

```shell
git clone git@github.com:executablebooks/mystjs.git
cd mystjs
npm install
npm run dev
```

This will create a local copy of `myst` for use on the command line and start various web-servers for testing.
