---
title: Developer Guide
short_title: Developer Guide
---

## Developer quickstart

These sections help you get started with a development environment for `mystmd` and learn how to contribute to the codebase. Note that `mystmd` is written in [TypeScript](https://www.typescriptlang.org/).

We start by discussing the project architecture, and give a birds eye view of how the various parts fit together.
Then, we delve into the specific tools you need, and the developer workflow for each part.
Finally, we go over requirements for contributing code back, via GitHub Pull Requests.


(architecture)=
### Architecture

From an author's perspective, `mystmd` can be thought of as a tool which compiles files in [MyST Markdown format](./quickstart-myst-markdown),
a variant of Markdown with several extensions, into books, articles, and websites.
Like other such tools, it can produce static output, such as PDF, docx, or HTML.

However, for a developer it is important to understand that `mystmd` consists of two parts:

1. An engine that converts input documents into an AST (abstract syntax tree).
2. A renderer, that converts that AST into a given output format.

This model is equally applicable to exporting/converting static documents and rich web applications. Here's a workfklow for static documents:

```{mermaid}
flowchart LR
  subgraph "<tt>myst build</tt>"
  myfile.md --> AST --> PDF
  end
```

Here's a workflow for producing a rich web application:

```{mermaid}
flowchart TB
  subgraph "<tt>myst start --headless</tt>"
    subgraph <b>Document conversion</b>
    direction LR
    doc[folder_of/myfile.md] --> ast[AST]
    end
    subgraph <b>Content server</b>
    ast --> content_server[serve AST on http://localhost:3100]
    end
  end
  subgraph "<tt>npm run theme:book</tt>"
    subgraph <b>Theme server</b>
    direction LR
    theme_server[render themed content at http://localhost:3000] --> content_server
    user[User browser] --> theme_server
    end
  end
```

Walking through this last example, we see that invoking `myst start --headless` converts a set of input files into an AST, and serves the resulting AST via a content server.
The **theme server** is a React app that knows how to style data, which it pulls in from the content server.
The user interacts with the React app, which may trigger new fetches from the content server.

#### Project-specific concepts

`mystmd` is built on top of well known tools in the JavaScript ecosystem, such as [unist](https://github.com/syntax-tree/unist) from [unified](https://unifiedjs.com/), [mdast](https://github.com/syntax-tree/mdast), and [citation.js](https://citation.js.org/) for the `myst` CLI or [React](https://reactjs.org/), [Remix](https://remix.run/), and [Tailwind CSS](https://tailwindcss.com/) for the theme server.

If you are familiar with these tools, you should not find many surprises in the codebase.

That said, there are a couple of concepts used *only* in this project, that won't be familiar. These are detailed below:

#### Concepts: theme server

In the diagram above, we saw that `mystmd` produces websites by converting a set of documents to an AST, by serving that AST via a content server, and then exposing the data to the user via a React webapp (`myst-theme`) that pulls in data from the content server.

The `myst-to-react` package provides a `<MyST />` component which can render AST into a React tree.
A React [context](https://react.dev/reference/react/useContext), named ..., is used to push state deeply into the tree, without having to pass it via props.

:::{error} to do — find name of context
:::

:::{error} to do — explain rendering

- describe the render loop, and how render blocks are registered
- explain the ThemeProvider
- explain styling
:::

(develop:transforms)=
#### Concepts: MyST Transformers

MyST Transformers are a way to convert an AST node into another type of node. Transformers operate on AST rather than on raw markdown because AST has more standardized structure to work with. For example, consider a markdown link like `[some text](#a-label)`. In MyST Markdown, this defines a **cross-reference** to `#a-label`, but it uses markdown link syntax. We use a MyST Transformer to convert that markdown to a cross-reference AST node like so:

- First parse the markdown `[some text](#a-label)`.
- The result is a MyST AST node for a markdown link.
- Next, search the document AST for any markdown link nodes with a target that starts with `#`. Assume each one is actually meant to be a cross reference.
- For each, run a **Transformer** that converts the Markdown Link node into a Cross Reference node.

Some other uses for Transformers include:

- Lifting metadata from `code-cells` to their parent structures
- Check that figures have alt-texts
- Convert non-standard AST nodes (e.g., ones generated from a custom user directive) into ones that MyST knows how to render[^ex-transform-node].

[^ex-transform-node]: This is a pattern used in e.g. https://github.com/projectpythia-mystmd/cookbook-gallery/blob/main/pythia-gallery.py where an `executable transform` (non-JS transform that communicates over `STDIO` with `JSON`) takes custom `pythia-cookbooks` nodes and converts them (via some HTTP fetch) to a grid of cards by outputting the relevant grid and card AST nodes.

### Tools

`mystmd` is built and developed using:

- [NodeJS and npm](https://nodejs.org), which provides a JavaScript runtime and package management;
- [TypeScript](https://www.typescriptlang.org/) for static type checking;
- [ESLint](https://eslint.org/) for code linting;
- [Prettier](https://prettier.io) for code formatting; and
- [Changesets](https://github.com/changesets/changesets) for versioning and changelogs.

```{note}
Below you will see several `npm run x` commands.
These are simply aliases for other commands, defined in the [`package.json` file](https://github.com/jupyter-book/mystmd/blob/main/package.json) under "scripts".
```

### Developer workflow: myst CLI

The `mystmd` libraries and command line tools are written in [TypeScript](https://www.typescriptlang.org/), and require [NodeJS and npm](https://nodejs.org) for local development.

:::{warning}
The [`mystmd-py` package](https://github.com/jupyter-book/mystmd/tree/main/packages/mystmd-py/src/mystmd_py) is a thin Python wrapper around the `mystmd` bundle that can be installed using `pip` or `conda`. If you have installed `mystmd` this way, uninstall it before using the local development instructions below.
:::

To do local development, [clone the repository](https://github.com/jupyter-book/mystmd):

```shell
git clone git@github.com:jupyter-book/mystmd.git
cd mystmd
```

Then, install dependencies via npm.
You need to do this each time you pull from upstream, since dependency versions may change:

```shell
npm install
```

Now, build `mystmd`:

```shell
npm run build
```

Optionally, you can link the built executable as your globally installed `mystmd`:

```shell
npm run link
```

```{warning}
The build process uses unix commands that might not work properly on Windows.
When building on Windows, use either WSL or a unix-like shell (such as Git Bash or MSYS2), and make sure that npm is set to use these by default (`npm config set script-shell path/to/shell.exe`).
```

These commands allow you to use the `myst` CLI from any directory; source code changes are picked up after each `npm run build` (executed in the top-level source directory).

### Developer workflow: myst-theme

the [`myst-theme` README](https://github.com/jupyter-book/myst-theme/) provides a more detailed overview of the components of that package.

Recall from the [architecture overview](#architecture) that `myst-theme` is a React web application. It provides theming, and requires a separate content server for data. When developing, the steps are therefore to:

1. Launch a content server
2. Launch the `myst-theme` web application server (this is what you browse to)
3. Run a process to monitor changes and rebuild `myst-theme`

#### Content server

We need some example data to test our theme against, such as [the example landing page](https://github.com/myst-examples/landing-pages). Clone this example content repository and start the content server:

```shell
git clone https://github.com/myst-examples/landing-pages
cd landing-pages
myst start --headless
```

The `--headless` flag tells `myst` not to start up the theme server; we want to do that ourselves in the next step.
When you start a content server _without_ a theme server, you can still "visit" the pages in your site (often on port `3100`). If you do so, you will see raw JSON and images. These represent the AST that a _theme server_ uses to render a website.


#### myst-theme server

We now fire up the `myst-theme` React app. This app server fetches the AST `JSON` from the content-server, then converts it to HTML, and serves it to the client where it is [hydrated](https://en.wikipedia.org/wiki/Hydration_(web_development)).

First, clone the repository and install dependencies:

```shell
git clone https://github.com/jupyter-book/myst-theme/
cd myst-theme
npm install
```

Then, see if you can build the package:

```shell
npm run build
```

After the build succeeds, launch the theme server:

```shell
npm run theme:book
```

After a while, it should tell you that the server has been started at http://localhost:3000. Browse there, and confirm that you can see the landing-page content.

Each time after making changes to the myst-theme source, you'll need to recompile. You can do that using `npm run build`.

To automatically watch for changes and reload, use the following command:

```shell
npm run dev
```

Note that you can run `npm run dev` from within any folder if you'd like to watch individual packages instead of the entire directory structure.

### Practices

#### Testing

Tests help ensure that code operates as intended, and that changes do not break existing code. You can run the test suite using:

```shell
npm run test
```

If you are working in a particular package, change your working directory to that specific package, and run the tests there. To run in "watch mode" (runs each time a change is saved), use `npm run test:watch`.

#### Linting

When contributing code, the continuous integration will run linting and formatting. You can run `npm run lint` and `npm run lint:format` locally to ensure they will pass. If you are using the VSCode editor, it can be setup to show you changes in real time and fix formatting issues on save (extensions: [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)).

Running in live-changes mode: depending on the package you are working in we have also setup live changes which can be faster than the `npm run build`; this can be run using `npm run dev`. If your changes aren't showing up, use `npm run build` as normal.

#### Versioning

We use [changesets](https://github.com/changesets/changesets) for tracking changes to packages and updating versions.
Before submitting your Pull Request, please add a changeset using `npm run changeset`, which will ask you questions about the package and ask for a brief description of the change.
Commit the changeset file to the repository as a part of your pull request.
You can use `npm run version` to preview the generated changelog.

Our current versioning procedure is a little loose compared to strict semantic versioning; as `mystmd` continues to mature, this policy may need to be updated.
For now, we try to abide by the following rules for version bumps:

- **major**: Backward incompatible change to the underlying supported MyST data. These would be cases where a non-developer MyST user's project or site built with major version _N_ would not work with major version _N+1_. Currently, we never intentionally make these changes.
- **minor**: Backward incompatible change to the Javascript API, for example, changing the call signature or deleting an exported function. These can be a headache for developers consuming MyST libraries, but they do not break MyST content.
- **patch**: For now, everything else is a patch: bug fixes, new features, refactors. This means some patch releases have a huge, positive impact on users and other patch releases are basically invisible.

#### Publishing

We use [this GitHub action for triggering releases](https://github.com/jupyter-book/mystmd/blob/main/.github/workflows/release.yml) upon merges to `main`.
It calls  `npm run version` to generate the changelog (to review the changelog, you can run that command locally too).
It then calls `npm run publish:ci`, which calls `changeset publish` to push updated packages to the [npm registry](https://www.npmjs.com/), and adds a git version tag.

### Packages in the mystmd repository

All packages used to build `mystmd` live in the [https://github.com/jupyter-book/mystmd](https://github.com/jupyter-book/mystmd) repository.

```{note}
`myst-theme` is *not* part of the `mystmd` package, and lives at https://github.com/jupyter-book/myst-theme.
```

These packages are [ESM modules](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)[^ESM], written in [TypeScript](https://www.typescriptlang.org/), and live at https://github.com/jupyter-book/mystmd/tree/main/packages.

[^ESM]: ESM modules are imported using the JavaScript `import` syntax, and cannot be used with CommonJS `require()`.

**Command Line Tools:**

- `mystmd`: provides CLI functionality for `myst start`.
- `mystmd-py`: a Python wrapper around `mystmd`, which makes it easy to install the tool in a Python environment. It should not be used for development.

**Core Packages:**

- `myst-cli`: provides CLI functionality for `mystmd`. It does not export the CLI directly.
- `jtex`: a templating library ([see docs](https://mystmd.org/jtex)).
- `myst-frontmater`: definitions and validation for scientific authorship/affiliation frontmatter ([see docs](https://mystmd.org/guide/frontmatter)).
- `myst-config`: validation and reading of configuration files.
- `myst-templates`: types and validation for templates (LaTeX, web, and word).

**Markdown Parsing**

- `markdown-it-myst`: markdown-it plugin to handle tokenizing roles and directives.
- `myst-directives`: core directives for MyST.
- `myst-roles`: core roles for MyST.
- `myst-parser`: converts a [markdown-it](https://github.com/markdown-it/markdown-it) token stream to Markdown AST ([mdast](https://github.com/syntax-tree/mdast)).

**Readers**

- `tex-to-myst`: convert LaTeX to MyST AST.
- `jats-to-myst`: convert JATS XML, a standard for representing papers, to MyST AST.

**Transformers**

- `myst-transforms`: transformations for use with MyST AST to transform, e.g., links, citations, cross-references, and admonitions (see here for more information](#develop:transforms)). 


**Export Tools**

- `myst-to-docx`: convert MyST documents to MS Word format.
- `myst-to-jats`: convert MyST to JATS, for use in scientific archives.
- `myst-to-tex`: convert MyST to LaTeX, to be used in combination with our [jtex](https://mystmd.org/jtex) template compiler, to create stand alone LaTeX documents.
- `myst-to-html`: convert MyST to HTML.

**Extensions:**

- `myst-ext-card`: Card directives.
- `myst-ext-grid`: Grid directives.
- `myst-ext-tabs`: Tab directives.
- `myst-ext-reactive`: Reactive directives.

**Miscellaneous:**

- `myst-common`: common utilities for working with ASTs.
- `myst-spec`: JSON Schema that defines the MyST AST.
- `myst-spec-ext`: temporary development extensions to `myst-spec`.
- `citation-js-utils`: utility functions to deal with citations.
- `myst-cli-utils`: shared utils between jtex, and myst-cli.
- `simple-validators`: validation utilities, that print all sorts of nice warnings.
