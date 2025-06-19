---
title: Developer Guide
short_title: Developer Guide
---

These sections help you get started with a development environment for `mystmd` and learn how to contribute to the codebase. Note that `mystmd` is written in [TypeScript](https://www.typescriptlang.org/).

We start by discussing the project architecture, and give a birds eye view of how the various parts fit together.
Then, we delve into the specific tools you need, and the developer workflow for each part.
Finally, we go over requirements for contributing code back, via GitHub Pull Requests.

(architecture)=

## Architecture underlying a MyST build

From an author's perspective, `mystmd` can be thought of as a tool which compiles files in [MyST Markdown format](./quickstart-myst-markdown),
a variant of Markdown with several extensions, into books, articles, and websites.
Like other such tools, it can produce static output, such as PDF, docx, or HTML.
See [](#overview-build-process) for a conceptual overview.

However, for a developer it is important to understand that `mystmd` consists of two parts:

1. An engine that converts input documents into an AST (abstract syntax tree).
2. A renderer, that converts that AST into a given output format.

This model is equally applicable to exporting/converting static documents and rich web applications. Here's a workflow for static documents:

```{mermaid}
flowchart LR
  subgraph "<tt>myst build</tt>"
  myfile.md --> AST --> PDF
  end
```

Here's a workflow for producing a rich web application:

(diagram-app)=

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

## Project-specific concepts

`mystmd` is built on top of well known tools in the JavaScript ecosystem, such as [unist](https://github.com/syntax-tree/unist) from [unified](https://unifiedjs.com/), [mdast](https://github.com/syntax-tree/mdast), and [citation.js](https://citation.js.org/) for the `myst` CLI. The default MyST web themes use [React](https://reactjs.org/), [Remix](https://remix.run/) (potentially [`vite`](https://remix.run/docs/en/main/guides/vite) soon), and [Tailwind CSS](https://tailwindcss.com/) for the theme server.

If you are familiar with these tools, you should not find many surprises in the codebase.

That said, there are a couple of concepts used _only_ in this project, that won't be familiar. These are detailed below:

(develop-renderers-themes)=
### Concepts: Renderers, themes, and templates

In the diagram above, we saw that `mystmd` produces websites by:

- Parsing a set of documents to an AST.
- Transforming the AST into a resolved AST.
- Rendering the AST into components that can be used by a template or theme.
- Exporting into a final output by a template / theme.

This section describes a bit more how **Rendering** and **Exporting** work using **Themes** and **Templates**.

For an introduction to themes and templates, see [](#overview-themes). In addition, below we'll define what a **Renderer** is:

```{glossary}
Renderer
: Converts MyST AST into components that {term}`themes` and {term}`templates` can use to export final outputs. For example, the [`myst-to-react` renderer](https://github.com/jupyter-book/myst-theme/tree/main/packages/myst-to-react) converts MyST AST into a number of React components that the [`book` and `article` React themes](https://github.com/jupyter-book/myst-theme/tree/main/themes) use to generate websites.
```

For example, in the case of the `book` theme, a MyST Document engine serves MyST AST via a Content Server, the [MyST React renderer](https://github.com/jupyter-book/myst-theme/tree/main/packages/myst-to-react) ingests that content and output React components, and the [book theme](https://github.com/jupyter-book/myst-theme/tree/main/themes/book) converts those components into HTML outputs.

#### Where to find renderers, themes, and templates

MyST has multiple renders, themes, and templates that allow it to transform MyST AST into final output formats. The MyST team maintains a few that are worth noting:

- [`github.com/jupyter-book/mystmd`](https://github.com/jupyter-book/mystmd): Has several out-of-the-box renderers in addition to the core document engine.
  - A collection of Renderers, look for the [`myst-to-*` folders in `mystmd/packages`](https://github.com/jupyter-book/mystmd/tree/main/packages). These render MyST AST into components that themes can consume.
- [`github.com/jupyter-book/myst-theme`](https://github.com/jupyter-book/myst-theme): The core React-based renderer and theme.
  - A collection of [MyST Rendering Packages](https://github.com/jupyter-book/myst-theme/tree/main/packages) that define various React UI components for default MyST themes to use.
  - The [MyST React Renderer](https://github.com/jupyter-book/myst-theme/tree/main/packages/myst-to-react) generates React components out of MyST AST for use by the default MyST Themes. It provides a `<MyST />` component which can render MyST AST into a React tree.
  - The source code of the [default MyST Themes](https://github.com/jupyter-book/myst-theme/tree/main/themes), each of which use the React renderer. These themes are built and then published at the [`myst-templates` GitHub organization](https://github.com/myst-templates/book-theme) for consumption by users.
  - A React [context](https://react.dev/reference/react/useContext), named `ThemeContext` (defined [here in the `myst-theme` repository](https://github.com/jupyter-book/myst-theme/blob/main/packages/providers/src/theme.tsx)), is used to push state deeply into the tree, without having to pass it via props.
- [`myst-templates`](https://github.com/myst-templates): An index of templates that convert rendered components into final outputs. These are similar to _MyST Themes_, but follow a more standard "template" structure to product static outputs.

:::{error} to do — explain rendering

- describe the render loop, and how render blocks are registered
- explain the ThemeProvider
- explain styling
:::

#### Example: Adding an "edit this page" button

Here's a brief example to illustrate a common development pattern.
Let's say we want to add a new button to each page of the MyST Theme that includes an "edit link" for the page.

To accomplish this, we need to make three contributions.

First, update [`jupyter-book/mystmd`](https://github.com/jupyter-book/mystmd), so that we can expose the "edit link" for each page as a new piece of metadata. [The main logic for adding the edit URL is here](https://github.com/jupyter-book/mystmd/pull/1804/files#diff-582c1df86d16945dd170ec211cedead020d37f750744946564f7483d08a1059bR27-R30).

Second, update the React theme infrastructure at [`jupyter-book/myst-theme`](https://github.com/jupyter-book/myst-theme/tree/main/themes). [Here's a pull request that implements this](https://github.com/jupyter-book/myst-theme/pull/577/files). Note how it:

1. [Defines a new React component called `<EditLink />`](https://github.com/jupyter-book/myst-theme/pull/577/files#diff-9f15761b56400d627876d6a1402c47f2e463590d010256066b64dc0475fd4e99R156-R174).
2. [Pulls the new edit URL metadata from the MyST AST](https://github.com/jupyter-book/myst-theme/pull/577/files#diff-9f15761b56400d627876d6a1402c47f2e463590d010256066b64dc0475fd4e99R248).
3. [Adds the new `<EditLink />` component to the `<FrontMatterBlock />` component](https://github.com/jupyter-book/myst-theme/pull/577/files#diff-9f15761b56400d627876d6a1402c47f2e463590d010256066b64dc0475fd4e99R299).
4. Because the book theme and the article theme _already use_ the `<FrontMatterBlock />`, they inherit this functionality automatically.

(develop:transforms)=

### Concepts: MyST Transformers

See [](#overview-transformers) for a higher-level overview of transforms.
This section provides a few concrete examples of how transforms modify the AST throughout the transforms process.

#### Example: Parsing an admonition

Let's say you've got MyST Markdown that defines an admonition, like this:

```{code} markdown
:filename: page1.md
:::{note} Here's an admonition
:::
```

The result of Parsing phase will be raw MyST AST (normally, this is `.json` but we'll show it in YAML so it is a bit more readable):

```{code} yaml
:filename: page1.json
- type: mystDirective
  name: note
  args: Here's an admonition
  children:
    - type: admonition
      kind: note
      children:
        - type: paragraph
          children:
            - type: text
              value: Here's an admonition
```

The AST simply encodes that there's a Directive present, with the name `note`.

After initial parsing, all **Directive** nodes are run, triggering the [Admonition Directive logic](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/admonition.ts). This converts the `Directive Node` into an `Admonition Node`.

During the **transform** phase, the [Admonition Transforms](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/admonitions.ts) is applied to each Admonition node. These do things like double-check that the admonition has all the necessary information to be rendererd.

The final output has more admonition-specific metadata defined, like `admonitionTitle`.

```{code} yaml
:filename: page1.json
- type: admonition
  kind: note
  children:
    - type: admonitionTitle
      children:
        - type: text
          value: Note
    - type: paragraph
      children:
        - type: text
          value: Here's an admonition
```

#### Example: Parsing a cross-reference

Let's say you have a page that labels some content, and cross-references it elsewhere on the page:

```{code} markdown
:filename: page1.md
(label)=
**A labeled paragraph**.

A reference to [my label](#label)
```

The initial parse of this page nodes where labels are present, and treats our markdown link syntax as a regular URL.

```{code} yaml
:filename: page1.json
- type: mystTarget
  label: label
- type: paragraph
  children:
    - type: strong
      children:
        - type: text
          value: A labeled paragraph
- type: paragraph
  children:
    - type: text
      value: 'A reference to '
    - type: link
      url: '#label'
      children:
        - type: text
          value: my label
```

During the **Transformations** phase, a number of [enumeration transforms](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts) are run, including one that detects and resolves cross-reference links. At the end of these transforms, the AST now correctly encodes that we have a cross reference rather than a "normal" URL link. This can now be rendered into various output formats.

```{code} yaml
:filename: page1.json
- type: paragraph
  children:
    - type: strong
      children:
        - type: text
          value: A labeled paragraph
  label: label
  identifier: label
  html_id: label
- type: paragraph
  children:
    - type: text
      value: 'A reference to '
    - type: crossReference
      children:
        - type: text
          value: my label
      urlSource: '#label'
      identifier: label
      label: label
      kind: paragraph
      template: Paragraph
      resolved: true
      html_id: label
```


## Tools used in development

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

## Developer workflow: myst CLI

The `mystmd` libraries and command line tools are written in [TypeScript](https://www.typescriptlang.org/), and require [NodeJS and npm](https://nodejs.org) for local development.

:::{warning} Don't use `mystmd-py` and the NPM installation at the same time
:class: dropdown

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

These commands allow you to use the `myst` CLI from any directory; source code changes are picked up after each `npm run build` (executed in the top-level source directory).

```{warning} Windows users should use unix-like shells
The build process uses unix commands that might not work properly on Windows.
When building on Windows, use either WSL or a unix-like shell (such as Git Bash or MSYS2), and make sure that npm is set to use these by default (`npm config set script-shell path/to/shell.exe`).
```

## Developer workflow: myst-theme

The [`myst-theme` README](https://github.com/jupyter-book/myst-theme/) provides a more detailed overview of the components of that package.

Recall from the [architecture overview](#diagram-app) that `myst-theme` is a React web application. It provides theming, and requires a separate content server for data. When developing, the steps are therefore to:

1. Launch a content server
2. Launch the `myst-theme` web application server (this is what you browse to)
3. Run a process to monitor changes and rebuild `myst-theme`

### Content server

We need some example data to test our theme against, such as [the example landing page](https://github.com/jupyter-book/example-landing-pages). Clone this example content repository and start the content server:

```shell
git clone https://github.com/jupyter-book/example-landing-pages
cd example-landing-pages
myst start --headless
```

The `--headless` flag tells `myst` not to start a theme server; we want to do that ourselves in the next step.

When you start a content server _without_ a theme server, you can still "visit" the pages in your site (often on port `3100`). If you do so, you will see raw JSON and images. These represent the AST that the _content server_ produces, and that a _theme server_ uses to render a website (in the next step).

### myst-theme server

We now fire up the `myst-theme` React app. This app server fetches the AST `JSON` from the content-server, then converts it to HTML, and serves it to the client where it is [hydrated](<https://en.wikipedia.org/wiki/Hydration_(web_development)>).

First, clone [the `myst-theme` repository](https://github.com/jupyter-book/myst-theme/) and install dependencies:

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

Each time you change the myst-theme source, you must recompile by re-running `npm run build`. This allows you to preview the changes locally.

To automatically watch for changes and reload, use the following command:

```shell
npm run dev
```

Note that you can run `npm run dev` from within any folder if you'd like to watch individual packages instead of the entire directory structure.

## Infrastructure we run
(myst-api-server)=
### The MyST API server

We run a lightweight server at [`api.mystmd.org`](https://api.mystmd.org/) to help users resolve and download templates. The code for this exists at [the `myst-templates/templates` repository](https://github.com/myst-templates/templates).

For example, to get a list of template types you can `GET` this URL:

https://api.mystmd.org/templates

And to see a list of available templates that can be resolved for Typst, you can `GET` this URL:

https://api.mystmd.org/templates/typst

## How to make a release

:::{important} Release Coordination
We use the [`#release_coordination`](https://discord.com/channels/1083088970059096114/1384242935645737141) Discord channel to coordinate and collaborate on releases. For example, to ensure that features are not half-shipped, additional PRs can make it into a release, or other release responsibilities that can be shared among the team (e.g. release notes, theme deployments, social media posts, documentation updates).
:::

### Make a release of `mystmd`

To publish a new release of `mystmd`, we do two things:

1. [Publish to NPM](#release-npm).
2. [Publish a GitHub release](#release-github).

We describe each below.

(release-npm)=
#### Publish a `mystmd` release to NPM

- Find the **changesets** PR. This contains a list of the version updates that will be included with this release. [Here's an example of a release PR](https://github.com/jupyter-book/mystmd/pull/1896).
- Double-check the changes that have been merged to `main` and make sure nothing particularly complex or breaking has been merged. Bias towards action, but use your best judgment on whether to move forward.
- After merging that PR, [this GitHub action will make a release](https://github.com/jupyter-book/mystmd/blob/main/.github/workflows/release.yml).
  - It calls `npm run version` to generate the changelog (to review the changelog, you can run that command locally too).
  - It then publishes the updated packages to the [`mystmd` npm registry](https://www.npmjs.com/package/mystmd) (it calls `npm run publish:ci`, which calls `changeset publish`).
  - It creates a git version tag (which you'll use in making the GitHub release).
- Next, [make a release on GitHub](#release-github).

(release-github)=
#### Make a release on GitHub

When we publish a new release to NPM, we also make a release on GitHub and share it for our user community. Here's a brief process for what to do:

- **Confirm a release has been made**. Go to [the Tags page](https://github.com/jupyter-book/mystmd/tags) and look for a tag from the latest release.
- **Create a release on GitHub**. Go to [the Releases page](https://github.com/jupyter-book/mystmd/releases) and then click **`Draft a new release`**.
  - The **title** should be the version from the tag. So if the tag was `mystmd@1.3.26`, the title is `v1.3.26`.
  - Click **Choose a tag** and link it against the tag for the latest release to NPM (the one you discovered in the first step).
  - Click **Generate release notes** so that GitHub automatically generates a list of the merged PRs and contributors.
  - Categorize the PRs into `Features`, `Fixes`, `Documentation`, and `Maintenance` as you wish. (this is optional)
  - For any major changes or new functionality, write a brief description that helps a user understand why it's important and how to learn more. (this is optional)
  - Write a one or two sentence summary of the big ideas in this release at the top. (this is optional).
- **Publish the release**. Do this by clicking the **`Publish release`** button at the bottom.
- **Write a brief post for sharing the release.** This helps others learn about it, and follow the links for more information. Here's a snippet you can copy/paste:

  ```md
  TITLE: 🚀 Release: MySTMD v1.3.26

  BODY:
  The [Jupyter Book project](https://compass.jupyterbook.org) recently made a new release! 👇

  [MySTMD v1.3.26](https://github.com/jupyter-book/mystmd/releases/tag/mystmd%401.3.26)

  See the link above for the release notes on GitHub! Many thanks to the [Jupyter Book team](https://compass.jupyterbook.org/team) for stewarding our development and this release.
  ```

- **Share the release post in Jupyter-adjacent spaces**. Here are a few places that are worth sharing (you can just copy/paste the same text into each):
  - [The MyST Discord](https://discord.mystmd.org/)
  - [The Jupyter Zulip Forum](https://https://jupyter.zulipchat.com)
  - [The Jupyter Discourse](https://discourse.jupyter.org)
  - Social media spaces of your choosing.

(release-myst-theme)=
### Make a release of the `myst-theme`

The process for releasing `myst-theme` infrastructure is similar to the release process for `mystmd`. Here's a brief overview:

- Find the changesets PR in `myst-theme` and merge it, similar to [the `mystmd` release process](#release-npm). [Here's an example PR in `myst-theme`](https://github.com/jupyter-book/myst-theme/pull/574).
- Double-check the changes that have been merged to `main` and make sure nothing particularly complex or breaking has been merged. Bias towards action, but use your best judgment on whether to move forward.
- Merge that PR. This will trigger the release process by running our release action. [Here's an example run of that action](https://github.com/jupyter-book/myst-theme/actions/runs/15005221275).
  - The action will build the latest version of the theme infrastructure, and update the template files in the [`myst-templates` GitHub organization](https://github.com/myst-templates). [Here are the lines that update this template](https://github.com/jupyter-book/myst-theme/blob/8283e4505fdb418355ca25ae114ba7bea3cec956/.github/workflows/release.yml#L39-L50).
- Make a release on GitHub, by following the same process in [](#release-github).

## Practices we follow

### Build system

We use [Turbo](https://turborepo.com/) to manage our testing and build system.

### Testing

Tests help ensure that code operates as intended, and that changes do not break existing code. You can run the test suite using:

```shell
npm run test
```

If you are working in a particular package, change your working directory to that specific package, and run the tests there. To run in "watch mode" (runs each time a change is saved), use `npm run test:watch`.

### Linting

When contributing code, continuous integration will run linting and formatting on your pull request.
You can also run `npm run lint` and `npm run lint:format` locally to catch errors early. To automate that process for each commit, install the git pre-commit hook: `npm run install-pre-commit`.[^uninstall-pre-commit]
If you are using the VSCode editor, it can be setup to show changes in real time and fix formatting issues on save (extensions: [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)).

[^uninstall-pre-commit]: Uninstall the pre-commit hook with `git config --unset core.hooksPath`.

Running in live-changes mode: depending on the package you are working in we have also setup live changes which can be faster than the `npm run build`; this can be run using `npm run dev`. If your changes aren't showing up, use `npm run build` as normal.

### Versioning and changesets

We use [changesets](https://github.com/changesets/changesets) for tracking changes to packages and updating versions.
To learn about changesets, see [this introductory guide to changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md).
We use this [`changesets` GitHub Action](https://github.com/changesets/action) when we publish a release.

Before submitting your Pull Request, please add a changeset using `npm run changeset`, which will ask you questions about the package and ask for a brief description of the change.
Commit the changeset file to the repository as a part of your pull request.
You can use `npm run version` to preview the generated changelog.

Our current versioning procedure is a little loose compared to strict semantic versioning; as `mystmd` continues to mature, this policy may need to be updated.
For now, we try to abide by the following rules for version bumps:

- **major**: Backward incompatible change to the underlying supported MyST data. These would be cases where a non-developer MyST user's project or site built with major version _N_ would not work with major version _N+1_. Currently, we never intentionally make these changes.
- **minor**: Backward incompatible change to the JavaScript API, for example, changing the call signature or deleting an exported function. These can be a headache for developers consuming MyST libraries, but they do not break MyST content.
- **patch**: For now, everything else is a patch: bug fixes, new features, refactors. This means some patch releases have a huge, positive impact on users and other patch releases are basically invisible.

## Packages in the mystmd repository

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
