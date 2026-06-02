---
title: Installing & Building MyST Locally
short_title: Installing Locally
description: Install and build myst locally using Bun.
---

A description of getting started with development is [given in the README](https://github.com/jupyter-book/mystmd/blob/main/README.md#development); we will also outline the basic process here. MyST uses [Bun](https://bun.sh/) as its package manager and JavaScript runtime; you will need to [install Bun](https://bun.sh/docs/installation) before running the commands in this section.

First, use `bun` in the base directory to install the MyST dependencies:

```shell
$ bun install
```

After installing the dependencies, we can then build the MyST application

```shell
$ bun run build
```

The build process may take a minute, as it has to build every package when run for the first time. Subsequent calls to `bun run build` will be faster as they cache unchanged intermediate dependencies. Finally, we need to make the `myst` binary that was built available to our terminal:

```shell
$ bun run link
```

After running these steps, the MyST CLI (as described in [](./quickstart-myst-documents.md)) can be used.
