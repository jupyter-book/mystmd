---
title: Installing MyST Command Line Tools
subtitle: Work locally with MyST documents and notebooks
subject: MyST Quickstart Tutorial
short_title: MyST Install
description: Get up and running with the MyST (Markedly Structured Text) command line interface. MyST is designed to create publication-quality documents written entirely in Markdown.
---

::::{important} Objective

The goal of these quickstart tutorials are to get you up and running on your local computer 👩‍💻:

- learn how to write MyST Markdown 🖊
- export PDF, Word and $\LaTeX$ documents 📑
- and create a website like this one 🌎

The tutorials will be brief on explaining MyST syntax, but we include an [MyST Markdown Guide](./quickstart-myst-markdown.md) providing more depth on syntax and pointers to other pages.

:::{note}
:class: dropdown
**Looking for JupyterBook docs?**

The `myst` CLI is not the same as [JupyterBook](https://jupyterbook.org/), which uses the Sphinx documentation engine!
You can read about the [history of `mystmd` development](./background.md).
The content that you build is compatible between tools in the MyST ecosystem, however, this tutorial focuses on the `mystmd` tools and CLI.

`mystmd` has capabilities beyond JupyterBook, for example exporting to scientific PDF documents, and you can use the two tools together! 💚
:::
::::

To follow along with this quickstart tutorial on your own computer, it is helpful if you have some familiarity with using the command line, as well as using a text editor and/or JupyterLab.

(lookout-for-tutorial-actions)=

> 🛠 Throughout the tutorial, whenever you're supposed to _do_ something you will see a 🛠

## Installing the MyST Markdown CLI 📦

`mystmd` is a command line interface (CLI) that provides modern tooling for technical writing, reproducible science, and creating scientific & technical websites. To get started, install `mystmd`.

:::{tip} Prerequisites
:class: dropdown

You should have these programs installed:

- [Node.js](https://nodejs.org) version **>=16.0.0**
- [Node Package Manager (npm)](https://docs.npmjs.com/about-npm) version **>=7.0.0**
- A code and notebook editor ([VSCode](https://code.visualstudio.com/) is great, and we recommend [Jupyter Lab](https://jupyter.org/install) for notebooks)

If the node ecosystem is new to you[^conda], see our getting started guides for [installing node](./installing-prerequisites.md).

[^conda]: If you have experience in Conda installations, we would _love_ your help to get the MyST install process into a form that most Pythonistas are familiar with!! See [GitHub issue](https://github.com/executablebooks/mystmd/issues/139) 🙏 🐍 🚀

:::

Check your `node` installation **greater than version 16** (see [Installing NodeJS](./installing-prerequisites.md)):

```bash
node -v
>> v16.18.1
```

🛠 Install the MyST command line tools:

```bash
npm install -g mystmd
```

If you have any problems, see [installing MyST](./installing.md) and or [open an issue here](https://github.com/executablebooks/mystmd/issues/new?assignees=&labels=bug&template=bug_report.yml). 🐛

:::{danger} Note: `myst-cli` is deprecated
:class: dropdown
In July 2023, we renamed the package to `mystmd` from `myst-cli`. Installing `myst-cli` will no longer create a `myst` command from your terminal. You can uninstall `myst-cli` using:

```bash
npm uninstall -g myst-cli
```

:::

:::{note}
:class: dropdown
**Updating MyST**

There are new releases of the MyST Markdown CLI every few weeks, to update to the latest version of `myst`, use:

```shell
npm update -g mystmd
```

To get the latest templates, clean your templates directory with:

```shell
myst clean --templates
```

This will remove the `_build/templates` directory, which will be re-downloaded with the latest templates when you run `myst start` or `myst build`.
:::

## Download example content

We provide an example project that includes a few simple markdown files and some Jupyter Notebooks.
In it's initial state, the project is **not** a good example of how to use MyST, but through the course of the tutorials you will correct that by improving the metadata, adding export targets, and creating a website!

🛠 Download the example content[^no-git], and navigate into the folder:

```bash
git clone https://github.com/executablebooks/mystmd-quickstart.git
cd mystmd-quickstart
```

[^no-git]: If you aren't familiar with git, it isn't required for this tutorial, you can download the zip file with the contents from the [quickstart repository](https://github.com/executablebooks/mystmd-quickstart).

## Go through the tutorials 🚀

You are well on your way to getting started with `myst` the tutorials are written to go through in order, however, you can also jump in

🛠 Choose a quickstart tutorial to go on a `myst`ical journey! 🃏 🎲

:::{card} MyST Websites 🌎
:link: ./quickstart-myst-websites.md
Learn the basics of customizing a MyST Website, including sharing frontmatter between pages.
:::

:::{card} MyST Documents 📑
:link: ./quickstart-myst-documents.md
Learn the basics of MyST Markdown, and export to a Word document, PDF, and $\LaTeX$!
:::

:::{card} MyST Markdown Guide 📖
:link: ./quickstart-myst-markdown.md
See an overview of MyST Markdown syntax with inline demos and examples.
:::
