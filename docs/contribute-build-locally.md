---
title: Installing & Building MyST Locally
short_title: Installing Locally
description: Install and build myst locally using NodeJS and NPM.
---

A description of getting started with development is [given in the README](https://github.com/jupyter-book/mystmd/blob/main/README.md#development); we will also outline the basic process here. Like most [NodeJS](https://nodejs.org/) applications, MyST uses the NPM package manager to manage dependencies; you will need to [install NodeJS](./install-node.md) before running the commands in this section.

First, we must use `npm` in the base directory to install the MyST dependencies:

```shell
$ npm install
```

After installing the dependencies, we can then build the MyST application

```shell
$ npm run build
```

The build process may take a minute, as it has to build every package when run for the first time. Subsequent calls to `npm run build` will be faster as they cache unchanged intermediate dependencies. Finally, we need to make the `myst` binary that was built available to our terminal:

```shell
$ npm run link
```

After running these steps, the MyST CLI (as described in [](./quickstart-myst-documents.md)) can be used.
