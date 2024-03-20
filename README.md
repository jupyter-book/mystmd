# MyST Markdown Command Line Interface, `mystmd`

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/executablebooks/mystmd/blob/main/LICENSE)
![CI](https://github.com/executablebooks/mystmd/workflows/CI/badge.svg)
[![Discord Chat](https://img.shields.io/badge/discord-chat-blue?logo=discord&logoColor=white)](https://discord.mystmd.org)

`mystmd` is a set of open-source, community-driven tools designed for scientific communication, including a powerful authoring framework that supports blogs, online books, scientific papers, reports and journals articles.

> **Note**
> The `mystmd` project is in **beta**. It is being used to explore a full MyST implementation and will change significantly and rapidly.
> The project is being developed by a small team of people on the Executable Books Project, and may make rapid decisions without fully public/inclusive discussion.
> We will continue to update this documentation as the project stabilizes.

## Overview

The `mystmd` project provides a command line tool (`mystmd`) for working with MyST Markdown projects.

- Provides functionality for cross-referencing, external structured links, and scientific citations
- Translate and render MyST Markdown into:
  - HTML for static websites, and modern React for interactive websites (like this website!)
  - PDFs and LaTeX documents, with specific templates for over 400 journals
  - Microsoft Word export
- Parse MyST into a standardized AST, that follows the MyST Markdown Spec

See the [documentation](https://mystmd.org/guide).

## Get Started

Ensure that you have an updated version of Node installed (<https://nodejs.org/>):

```bash
node -v
>> v20.4.0
```

The MyST Markdown CLI is available through NPM, PyPI and Conda:

```bash
# Using npm, yarn, or pnpm
npm install -g mystmd
# Or using PyPI
pip install mystmd
# Or using Conda / Mamba
conda install mystmd -c conda-forge
```

Usage:

```bash
myst init
myst start
myst build my-doc.md --tex
```

# Development

All packages for `mystmd` are included in this repository (a monorepo!).

## What's inside?

`mystmd` uses [npm](https://www.npmjs.com/) as a package manager. It includes the following packages/apps:

**Command Line Tools:**

- `mystmd` this provides CLI functionality for `myst start`
- `mystmd-py` a python wrapper over `mystmd`, to ease install for the Python community. Not recommended for local development.

**Core Packages:**

- `myst-cli` this is the package that provides CLI functionality for `mystmd`, it does not export the CLI directly
- `jtex` a templating library ([see docs](https://mystmd.org/jtex))
- `myst-frontmater` definitions and validation for scientific authorship/affiliation frontmatter ([see docs](https://mystmd.org/guide/frontmatter))
- `myst-config` Validation and reading of configuration files
- `myst-templates` types and validation for templates (LaTeX, web and word)

**Markdown Parsing**

- `markdown-it-myst` markdown-it plugin to handle tokenizing roles and directives.
- `myst-directives` core directives for MyST
- `myst-roles` core roles for MyST
- `myst-parser` converts markdown-it token stream to mdast

**Readers**

- `tex-to-myst` convert LaTeX to MyST AST
- `jats-to-myst` convert JATS xml to MyST AST

**Transformers**

- `myst-transforms` a number of transformations for use with myst AST to transform, e.g. links, citations, cross-references, admonitions

**Export Tools**

- `myst-to-docx` convert MyST documents to word docs!
- `myst-to-jats` convert MyST to JATS, for use in scientific archives
- `myst-to-tex` convert MyST to LaTeX, to be used in combination with jtex to create stand alone LaTeX documents
- `myst-to-html` convert MyST to HTML

**Extensions:**

- `myst-ext-card`: Card directives
- `myst-ext-grid`: Grid directives
- `myst-ext-tabs`: Tab directives
- `myst-ext-reactive`: Reactive directives

**Utilities**

- `myst-common` Some common utilities for working with ASTs
- `myst-spec-ext` Extensions to `myst-spec` used throughout this repository, before pushing upstream
- `citation-js-utils` utility functions to deal with citations
- `myst-cli-utils` some shared utils between jtex, and myst-cli
- `simple-validators` validation utilities, that print all sorts of nice warnings

Each package is 100% [TypeScript](https://www.typescriptlang.org/) and [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

### Versioning & Publishing

`mystmd` uses [changesets](https://github.com/changesets/changesets) to document changes to this monorepo, call `npm run changeset` and follow the prompts. Later, `npm run version` will be called and then `npm run publish`.

### Utilities

`mystmd` is built and developed using:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd mystmd
npm run build
```

## Developing

The `mystmd` libraries and command line tools are written in TypeScript, and require [NodeJS and npm](https://nodejs.org) for local development. The `mystmd-py` package, which is a thin Python wrapper around the `mystmd` bundle, can be installed by users using `pip` or `conda`. If you have already installed `mystmd` (e.g. via `pip` or `conda`), it is recommended that you uninstall it (or deactivate the relevant environment) before using the local development instructions below.

For local development, [clone the repository](https://github.com/executablebooks/mystmd) and install the dependencies using npm. You can then build the libraries (`npm run build`) and then optionally link to your globally installed `mystmd` in node using the `npm run link` command.

```shell
git clone git@github.com:executablebooks/mystmd.git
cd mystmd
npm install
npm run build
npm run link
```

These commands allow you to use the `myst` CLI in any directory as usual, and updates to the build are picked up when you rebuild. After making changes, you must rebuild the packages (run `npm run build` again after changing a file), which is done efficiently depending on how deep your change is in the dependency tree, after the build is complete, you can reuse the myst client.

Tests are also a helpful development tool, which don't require full rebuilding. You can run the entire test suite using `npm run test`. If you are working in a particular package, change your working directory and run the tests there, to run in watch mode use `npm run test:watch`.

When contributing code, the continuous integration will run linting and formatting, you can run `npm run lint` and `npm run lint:format` locally to ensure they will pass. Developing in VSCode can be setup to show you changes in real time and fix formatting issues on save (extensions: [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)).

We use `changesets` for tracking changes to packages and updating versions, please add a changeset using `npm run changeset`, which will ask you questions about the package and ask for a brief description of the change. Commit the changeset file to the repository as a part of your pull request.

Running in live-changes mode: depending on the package you are working in we have also setup live changes which can be faster than the `npm run build`; this can be run using `npm run dev`. If your changes aren't showing up, use `npm run build` as normal.

---

As of v1.0.0 this package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

---
