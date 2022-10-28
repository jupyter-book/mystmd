# MyST Javascript Tools

`mystjs` is a set of open-source, community-driven tools designed for scientific communication, including a powerful authoring framework that supports blogs, online books, scientific papers, reports and journals articles.

> **Note**
> The `mystjs` project is in **beta**. It is being used to explore a full MyST implementation in JavaScript and will change significantly and rapidly.
> The project is being developed by a small team of people on the Executable Books Project, and may make rapid decisions without fully public/inclusive discussion.
> We will continue to update this documentation as the project stabilizes.

## Overview

The `mystjs` project provides a Javascript parser (`mystjs`) and command line tool (`myst-cli`) for working with MyST Markdown projects.

- Parse MyST into a standardized AST, that follows the MyST Spec
- Translate and render MyST into:
  - HTML for static websites, and modern React for interactive websites (like this website!)
  - PDFs and LaTeX documents, with specific templates for over 400 journals
  - Microsoft Word export
- Provide functionality for cross-referencing, external structured links, and scientific citations

## Get Started

The MyST CLI is available through Node and NPM:

```bash
npm install -g myst-cli
myst init
myst build my-doc.md --tex
```

# Development

All dependencies for `mystjs` are included in this repository (a monorepo!).

## What's inside?

`myst-cli` uses [npm](https://www.npmjs.com/) as a package manager. It includes the following packages/apps:

**Packages:**

- `citation-js-utils` utility functions to deal with citations
- `intersphinx` a command line tool and package for reading and writing o
- `jtex` a templating library ([see docs](https://js.myst.tools/jtex))
- `mystjs` a MyST parser, with extensibility
- `myst-cli` this will provide CLI functionality for `myst build mystdoc.md`
- `myst-cli-utils` some shared utils between intersphinx, jtex, and myst-cli
- `myst-common` Some common utilities for working with ASTs
- `myst-config` Validation and reading of configuration files
- `myst-frontmater` definitions and validation for scientific authorship/affiliation frontmatter ([see docs](https://js.myst.tools/guide/frontmatter))
- `myst-templates` types and validation for templates (latex, web and word)
- `myst-to-docx` convert myst documents to word docs!
- `myst-to-react` create basic, ideally unthemed react components for content only (_coming soon_)
- `myst-to-tex` convert myst to latex, to be used in combination with jtex to create stand alone latex documents
- `myst-transforms` a number of transformations for use with myst AST to transform, e.g. links, citations, cross-references, admonitions
- `simple-validators` validation utilities, that print all sorts of nice warnings

Each package is 100% [TypeScript](https://www.typescriptlang.org/).

### Versioning & Publishing

`mystjs` uses [changesets](https://github.com/changesets/changesets) to document changes to this monorepo, call `npm run changeset` and follow the prompts. Later, `npm run version` will be called and then `npm run publish`.

### Utilities

`mystjs` is built and developed using:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd mystjs
npm run build
```

### Develop

To develop all apps and packages, run the following command:

```
cd mystjs
npm run dev
```

This will create a local `myst` CLI interface that you can use to develop and test locally.
