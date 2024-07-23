# Contribute to this project

This page contains pointers and links to help you contribute to this project.

> [!TIP]
> See [our comprehensive contributing guide](https://mystmd.org/guide/contributing) for more information about how to contribute to the project.
> This page helps you get started, but that resource has much more information.

<!-- MYST START -->

## Our team compass

The [Executable Books Team Compass][compass] is a source of truth for our team structure and policy.
It also has a lot of information about how to contribute.

## Code of conduct

We expect all contributors to this project to [Code of Conduct][coc].

## Where we work

We do most of our work in GitHub repositories in [the `jupyter-book/` GitHub organization](https://github.com/jupyter-book).

## Where we communicate

- For chat and real-time conversations: [The MyST community Discord server](https://discord.mystmd.org).
- For discussions around work and development: Issues in the `mystmd` repositories.
- For general discussions and questions: [the `mystmd` community forum](https://github.com/jupyter-book/mystmd/discussions).

## Relevant GitHub repositories

The `mystmd` project covers a _subset_ of the [`jupyter-book/` GitHub organization](https://github.com/jupyter-book).
It focuses on the Javascript-based MyST Markdown engine and ecosystem, as well as the markdown syntax that MyST uses.

Below is a list of relevant repositories and a brief description of each.

- [mystmd](https://github.com/jupyter-book/mystmd): The MyST document engine and functionality not related to specific renderers.
- [myst-theme](https://github.com/jupyter-book/myst-theme): The web components and themes that are used for either the book or article themes for MyST.
- [myst-spec](https://github.com/jupyter-book/myst-spec): Questions about the markdown syntax for MyST and standardization efforts for MyST functionality.
- [jupyterlab-myst](https://github.com/jupyter-book/jupyterlab-myst): Questions about the JupyterLab extension for MyST.
- [MyST Templates](https://github.com/myst-templates): Repositories that contain templates for rendering MyST documents into various outputs like LaTeX, JATS, Typst, and Docx.

> [!NOTE]
> There are many repositories with similar functionality in the `executablebooks/` organization. Many of these are based around the [Sphinx documentation ecosystem](https://www.sphinx-doc.org). For example, the [MyST-NB repository](https://github.com/executablebooks/myst-nb) is a Sphinx extension for Jupyter notebooks, and the [MyST Parser repository](https://github.com/executablebooks/myst-parser) is a MyST markdown parser for Sphinx.

## Contribution workflow

Generally speaking, our contribution workflow looks something like this:

- **Conduct free-form conversation and brainstorming in our forum**. We have [a community forum](https://github.com/jupyter-book/mystmd/discussions) for general discussion that does not necessarily require a change to our code or documentation. If you have a specific enhancement or bug you would like to propose for resolution, see the next steps.
- **Search open issues to see if your idea is already discussed**. Use [a GitHub search in the `jupyter-book/` organization](https://github.com/search?q=org:jupyter-book%20&type=code) to see if you should add to an existing issue or create a new one. If you don't think an issue exists that covers your idea or bug, go ahead and open one.
- **Discuss and propose changes in issues**. Issues are a way for us to agree on a problem to solve, and align on a way to solve it. They should invite broad feedback and be as explicit as possible when making formal proposals.
- **Make a pull request to implement an idea**. We use Pull Requests to formally propose changes to our code or documentation. These generally point to an issue and ideally will close it.
- **Iterate on the pull request and merge**. Pull Requests should have discussion and feedback from at least one core team member, and ideally from many. Once the PR is ready to merge, a core team member may decide to do so. See [our decision-making guide for formal details][governance].

This describes the high-level process that is usually followed.
In practice, we recommend attempting a contribution to get a feel for how it works in practice.

## How our team is structured

Our [Team page][team] lists all of the teams in the `jupyter-book/` organization and their members.
In addition, [our Governance page][governance] describes the responsibilities and authority that team members have.

## How we make decisions

Our [governance page][governance] describes our formal decision-making processes.

## Developer quickstart

These sections help you get started with a development environment for `mystmd` and learn how to contribute to the codebase.

### Tools for development

`mystmd` is built and developed using:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Developer workflow

The `mystmd` libraries and command line tools are written in TypeScript, and require [NodeJS and npm](https://nodejs.org) for local development. The `mystmd-py` package, which is a thin Python wrapper around the `mystmd` bundle, can be installed by users using `pip` or `conda`. If you have already installed `mystmd` (e.g. via `pip` or `conda`), it is recommended that you uninstall it (or deactivate the relevant environment) before using the local development instructions below.

For local development, [clone the repository](https://github.com/jupyter-book/mystmd) and install the dependencies using npm. You can then build the libraries (`npm run build`) and then optionally link to your globally installed `mystmd` in node using the `npm run link` command.

```shell
git clone git@github.com:jupyter-book/mystmd.git
cd mystmd
npm install
npm run build
npm run link
```

These commands allow you to use the `myst` CLI in any directory as usual, and updates to the build are picked up when you rebuild. After making changes, you must rebuild the packages (via `npm run build` in the top-level directory), which is done efficiently depending on how deep your change is in the dependency tree. After the build is complete, you can reuse the myst client.

Tests are also a helpful development tool, which don't require full rebuilding. You can run the entire test suite using `npm run test`. If you are working in a particular package, change your working directory and run the tests there, to run in watch mode use `npm run test:watch`.

When contributing code, the continuous integration will run linting and formatting. You can run `npm run lint` and `npm run lint:format` locally to ensure they will pass. If you are using the VSCode editor, it can be setup to show you changes in real time and fix formatting issues on save (extensions: [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)).

We use `changesets` for tracking changes to packages and updating versions, please add a changeset using `npm run changeset`, which will ask you questions about the package and ask for a brief description of the change. Commit the changeset file to the repository as a part of your pull request.

Running in live-changes mode: depending on the package you are working in we have also setup live changes which can be faster than the `npm run build`; this can be run using `npm run dev`. If your changes aren't showing up, use `npm run build` as normal.

### Versioning & Publishing

`mystmd` uses [changesets](https://github.com/changesets/changesets) to document changes to this monorepo, call `npm run changeset` and follow the prompts. Later, `npm run version` will be called and then `npm run publish`.

### Packages in the mystmd repository

All packages for `mystmd` are included in this repository (a monorepo!).
We use [npm](https://www.npmjs.com/) as a package manager.
The `mystmd` package includes the following packages/apps:

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

[compass]: https://compass.jupyterbook.org
[coc]: https://compass.jupyterbook.org/code-of-conduct
[team]: https://compass.jupyterbook.org/team
[governance]: https://compass.jupyterbook.org/team
[decisions]: https://compass.jupyterbook.org/team
