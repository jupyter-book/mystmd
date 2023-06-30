# MyST Markdown Command Line Interface, `mystmd`

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/executablebooks/mystmd/blob/main/LICENSE)
![CI](https://github.com/executablebooks/mystmd/workflows/CI/badge.svg)

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

The MyST Markdown CLI is available through Node and NPM:

```bash
npm install -g mystmd
myst init
myst build my-doc.md --tex
```

# Development

All packages for `mystmd` are included in this repository (a monorepo!).

## What's inside?

`mystmd` uses [npm](https://www.npmjs.com/) as a package manager. It includes the following packages/apps:

**Command Line Tools:**

- `mystmd` this provides CLI functionality for `myst build mystdoc.md`

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

For the [mystmd](https://github.com/executablebooks/mystmd) library on GitHub, `git clone` and you can install the dependencies and then create a local copy of the library with the `npm run dev` command.

```shell
git clone git@github.com:executablebooks/mystmd.git
cd mystmd
npm install
npm run build
npm run dev
```

This will create a local copy of `myst` for use on the command line and start various web-servers for testing.

---

As of v1.0.0 this package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

---
