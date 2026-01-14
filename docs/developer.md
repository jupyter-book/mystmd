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
  subgraph "myst start --headless"
    subgraph "<b>Document conversion</b>"
    direction LR
    doc[folder_of/myfile.md] --> ast[AST]
    end
    subgraph "<b>Content server</b>"
    ast --> content_server[serve AST on http://localhost:3100]
    end
  end
  subgraph "npm run theme:book"
    subgraph "<b>Theme server</b>"
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

MyST has multiple renderers, themes, and templates that allow it to transform MyST AST into final output formats. The MyST team maintains a few that are worth noting:

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

During the **transform** phase, the [Admonition Transforms](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/admonitions.ts) is applied to each Admonition node. These do things like double-check that the admonition has all the necessary information to be rendered.

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

The initial parse of this page creates nodes where labels are present, and treats our markdown link syntax as a regular URL.

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

(developer:mystmd)=

## Local development: `mystmd`

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

### Local docs workflows (preview/build)

To run a MyST server with your local changes and a preview of the documentation, run:

```shell
$ npm run docs
```

## Local development: myst-theme

The [`myst-theme` README](https://github.com/jupyter-book/myst-theme/) provides a more detailed overview of the components of that package.

There are two ways to deploy a theme (AKA React web app): as a server, or as a static build.
Development procedures are slightly different, depending on which approach you take.

### Approach 1: Theme server

Recall from the [architecture overview](#diagram-app) that `myst-theme` is a React web application. It provides theming, and requires a separate content server for data. When developing, the steps are therefore to:

1. Launch a content server
2. Launch the `myst-theme` web application server (this is what you browse to)
3. Run a process to monitor changes and rebuild `myst-theme`

#### Content server

We need some example data to test our theme against, such as [the example landing page](https://github.com/jupyter-book/example-landing-pages). Clone this example content repository and start the content server:

```shell
git clone https://github.com/jupyter-book/example-landing-pages
cd example-landing-pages
myst start --headless
```

The `--headless` flag tells `myst` not to start a theme server; we want to do that ourselves in the next step.

When you start a content server _without_ a theme server, you can still "visit" the pages in your site (often on port `3100`). If you do so, you will see raw JSON and images. These represent the AST that the _content server_ produces, and that a _theme server_ uses to render a website (in the next step).

#### myst-theme server

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

### Approach 2: Static build

No content or theme server is required for a static site build. Steps are:

1. Build the theme for production
2. Point your site config to the built theme
3. Build the site statically

We'll use the mystmd docs site as an example.

#### Build theme

To build a static site against a local theme, the theme must be built as it would be for production. For that we will use the "make" target
instead of `npm run`:

```{code} bash
cd myst-theme
make build-book # because mystmd docs site uses the book theme
```

That should produce a production ready version of the book theme under `.deploy/book`.

:::{tip}
While debugging, it helps to work with a theme built against the "development" version of React, which results in unminimized build artifacts (ie preserving whitespace and variable/function names) and more detailed React errors and warnings. For this, tell remix to run in node "development" mode:

```{code} json
:filename: myst-theme/themes/book/package.json
// Add NODE_ENV near the end of the "prod:build" script
                      v
"prod:build": "... && NODE_ENV=development remix build",
                      ^
```

:::

#### Configure site

Building a static site against a local theme requires configuring your site's `myst.yml` to point to the built theme's `template.yml`. Using the mystmd docs site as
an example:

```{code} yaml
:filename: mystmd/docs/myst.yml
site:
    # assuming your mystmd and myst-theme working directories are siblings
    template: ../../myst-theme/.deploy/book/template.yml
```

(NOTE: This is the _built_ template file, under `.deploy`, not the source template)

#### Build site

```{code} bash
cd mystmd/docs
mystmd build --html
```

Then host the static site locally. An easy way is with Python's built-in http server:

```{code} bash
cd _build/html
python3 -m http.server  # serves on port 8000 by default
```

Finally, browse the site at [http://localhost:8000](http://localhost:8000).

## Step Debugging

Sometimes the trusty `console.log` (aka print statement) is not sufficient for your debugging needs. In more involved situations, a proper step debugger can be your friend.
You may have used Firefox or Chrome developer tools to debug in-browser code by adding the `debugger` keyword into your javascript source.
But what about code that runs in node engine on the server?
Chrome and Firefox dev tools can _also_ debug server-side javascript. To do this, node must be invoked with the `--inspect`
or `--inspect-brk` comand-line option. That will cause the node process to open a socket listening for a debugger to connect. If "inspect-brk" is used
(vs "inspect"), then the process will immediately pause, awaiting a debugger connection. The `debugger` keyword in source will only pause the program if a
debugger is connected when that keyword is reached.

To connect to an awaiting node debug socket, enter into the browser address bar:

- Firefox: `about:debugging`, or
- Chrome: `chrome://inspect`

That opens a debugger control panel in the browser which should list your awaiting node process as available to connect to (if it has been correctly invoked).
(NOTE: other browsers and IDEs can also connect as debug inspectors - see Inspector Clients reference below)

In most cases we don't call `node` directly, so there is no easy way to add those options to a shell invocation.
Instead, an `npm` script can be defined with environment variable `NODE_OPTIONS=--inspect` (or "--inspect-brk") set in an appropriate spot (example follows).

### Debug myst-theme service

For example, to debug myst-theme's book theme running as a dynamic application server, alter the npm scripts like so:

```{code} json
:filename:  myst-theme/themes/book/package.json
// add NODE_OPTIONS
//                                                                                    v
"dev": "npm run dev:copy && npm run build:thebe && concurrently \"npm run dev:css\" \"NODE_OPTIONS=--inspect-brk remix dev\"",
```

Now remove the turbo "--parallel" option, because when turbo runs the theme server in "parallel" (ie multiprocess) mode, each process will attempt to open its own debug socket on the same port, with all but the first failing.
Then your debugger will only connect to the one that succeeded, with no guarantee any subsequent web request will hit the one process connected to the debugger.

```{code} json
:filename:  myst-theme/package.json
// remove the --parallel option
//                           v
"theme:book": "turbo run dev --filter='./themes/book'",
```

### Debug static myst-theme

To debug myst-theme running server-side in service of a static build:

**TBD**

### Debug a mystmd subpackage test suite

This requires a handful of options to be passed to vitest to ensure it runs in a single process. For example, to connect a step debugger to a running `myst-transforms` test:

```{code} json
:filename: mystmd/packages/myst-transforms/package.json
"test": "vitest --inspect-brk --pool threads --poolOptions.threads.singleThread --no-file-parallelism run",
```

### Debugging references

- [Node Inspector Clients](https://nodejs.org/en/learn/getting-started/debugging#inspector-clients)

## Infrastructure we run

(myst-api-server)=

### The MyST API server

We run a lightweight server at [`api.mystmd.org`](https://api.mystmd.org/) to help users resolve and download templates. The code for this exists at [the `myst-templates/templates` repository](https://github.com/myst-templates/templates).

For example, to get a list of template types (i.e. the available output types) you can `GET` this URL:

https://api.mystmd.org/templates

And to see a list of available templates that can be resolved for Typst, you can `GET` this URL:

https://api.mystmd.org/templates/typst

(howto:release)=
## How to make a release

This process follows the general steps of making a release in the Jupyter Book community. Here are the basic steps to follow for any project:

1. [Tell others about the upcoming release](#release:coordination).
2. Publish the release in the package repository for the tool. For example:
   - [How to publish a release of `mystmd`](#release:mystmd).
   - [How to publish a release of `myst-theme`](#release:myst-theme).
3. [Make a release on GitHub](#release:github).
4. [Update the documentation](release:docs).
5. (optionally) [Create and share a blog post](#release:share).

(release:coordination)=
### Coordinating the release with the team

We use the [`#release_coordination`](https://discord.com/channels/1083088970059096114/1384242935645737141) Discord channel to coordinate and collaborate on releases.
This is a way to generate excitement and get any last-second work in before shipping.
It also gives others a heads-up that some new functionality is about to go live.

### Publish a release for the repository

When you publish a release, you upload a new version of the tool for package managers to use. The specifics depend on the toolchain for your package (in particular, it is different for Python vs. JavaScript tools). Here are a few specifics for the `mystmd` repository.

(release:mystmd)=
#### Publish a `mystmd` release to NPM

`mystmd` is published to NPM via a GitHub Action. Here's how to publish a release.

- Find the **changesets** PR. This contains a list of the version updates that will be included with this release. [Here's an example of a release PR](https://github.com/jupyter-book/mystmd/pull/1896).
- Double-check the changes that have been merged to `main` and make sure nothing particularly complex or breaking has been merged. Bias towards action, but use your best judgment on whether to move forward.
- After merging that PR, [this GitHub action will make a release](https://github.com/jupyter-book/mystmd/blob/main/.github/workflows/release.yml).
  - It calls `npm run version` to generate the changelog (to review the changelog, you can run that command locally too).
  - It then publishes the updated packages to the [`mystmd` npm registry](https://www.npmjs.com/package/mystmd) (it calls `npm run publish:ci`, which calls `changeset publish`).
  - It creates a git version tag (which you'll use in making the GitHub release).

You're done!

(release:myst-theme)=
#### Publish a release of `myst-theme`

The process for releasing `myst-theme` infrastructure is similar to the release process for `mystmd`. Here's a brief overview:

- Find the changesets PR in `myst-theme` and merge it, similar to [the `mystmd` release process](#release:mystmd).
  [Here's an example PR in `myst-theme`](https://github.com/jupyter-book/myst-theme/pull/574).
- Double-check the changes that have been merged to `main` and make sure nothing particularly complex or breaking has been merged.
  Bias towards action, but use your best judgment on whether to move forward.
- Merge that PR. This will trigger the release process by running our release action. [Here's an example run of that action](https://github.com/jupyter-book/myst-theme/actions/runs/15005221275).
  - The action will build the latest version of the theme infrastructure, and update the template files in the [`myst-templates` GitHub organization](https://github.com/myst-templates). [Here are the lines that update this template](https://github.com/jupyter-book/myst-theme/blob/8283e4505fdb418355ca25ae114ba7bea3cec956/.github/workflows/release.yml#L39-L50).

You're done!

(release:github)=
### Automated releases on GitHub

After a successful NPM release, our [`release.yml` workflow](https://github.com/jupyter-book/mystmd/blob/main/.github/workflows/publish-github-release.yml) will automatically create a new GitHub Release.
The release notes are generated using [`github-activity`](https://github.com/cheukting/github-activity) and include a summary of all merged PRs and commits since the previous release.

**Maintainers are encouraged to review the new GitHub Release and edit the description as needed.**
For example, you may want to add an executive summary, highlight important changes, or clarify upgrade instructions for users.

You can find the latest releases at: https://github.com/jupyter-book/mystmd/releases

(release:docs)=
### Update documentation

When we make a release we should ensure that the documentation is up-to-date with the latest version. This will depend on the tool that you're using.

**For tools hosted at mystmd.org**, follow these [instructions to update the content at mystmd.org](#docs:update-mystmd.org).

**For most other tools**, the documentation should auto-update with new releases (e.g., via a GitHub action).

(release:share)=
### Create and share a blog post

Feel free to use the blog to post release notes as well.
This should be as simple and quick as possible, don't over-think it. Here are some simple steps:

1. Copy and paste the [release notes you generated](#release:notes) into a new file [on our blog repository](https://github.com/jupyter-book/blog).
2. Use the following YAML header metadata for the post:

   ```yaml
   ---
   date: <release-date>
   author: The Jupyter Book Team
   title: <title from GitHub release>
   tags: release
   ---

   <content from GitHub release>
   ```
3. Self-merge the blog post.

Feel free to celebrate new releases and share the news publicly so that others know about new enhancements in our projects.

**Spaces to publicize releases**. Here are a few places that are worth sharing (you can just copy/paste the same text into each):

- [The MyST Discord](https://discord.mystmd.org/)
- [The Jupyter Zulip Forum](https://https://jupyter.zulipchat.com)
- [The Jupyter Discourse](https://discourse.jupyter.org)
- Social media spaces of your choosing.

## Practices we follow

### Build system

We use [Turbo](https://turborepo.com/) to manage our testing and build system.

(developer:testing)=

### Testing

We use [vitest](https://vitest.dev/guide/) for all tests in `mystmd`.

#### How to run the test suite

First [install `mystmd` locally](#developer:mystmd).

Then, run the test suite using:

```shell
npm run test
```

If you are working in a particular package, change your working directory to that specific package, and run the tests there.

```shell
cd packages/myst-cli
npm run test
```

To run in "watch mode" (runs each time a change is saved), use:

```shell
npm run test:watch
```

To run a single test by matching its title, first change the working directory to the package where the test exists. For example:

```shell
cd packages/mystmd
```

Then run the `npm test` command like so:

```shell
npm run test -- -t "Basic tex build"
```

For integration test titles, see `packages/mystmd/tests/exports.yml`.

#### Types of tests

There are two types of tests in the `mystmd` repository:

**Unit Tests** - are attached to each sub-package in the `packages/` directory. These use [`vitest`](https://vitest.dev/) for basic functionality within each package. They have files like [`config.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/config.spec.ts).

**Integration Tests** - Test the entire `mystmd` build workflow. Here's how it works:

- `packages/mystmd/tests/endToEnd.spec.ts` runs a build from end to end, similar to the `vitest` tests above.
- `packages/mystmd/tests/exports.yml` contains several integration tests - each one points to a build configuration (a folder in `packages/mystmd/tests/`) and compares expected to generated outputs.

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
- `myst-frontmatter`: definitions and validation for scientific authorship/affiliation frontmatter ([see docs](https://mystmd.org/guide/frontmatter)).
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

- `myst-transforms`: transformations for use with MyST AST to transform, e.g., links, citations, cross-references, and admonitions (see here for more [information](#develop:transforms)).

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

## Tips and tricks

### Grepping the codebase

While developing, there are a lot of build artifacts lying around,
making grepping the code harder than it needs to be. Assuming you
have
[ripgrep](https://github.com/BurntSushi/ripgrep?tab=readme-ov-file#installation)
or a compatible alternative installed, you can define a customized
"myst grep" in your shell config (`~/.zshrc`, `~/.bashrc`, etc.):

```sh
alias mg="rg --exclude-dir=build --exclude-dir=_build -g '!*.js' -g '!tailwind.css'"
```

Most notably, this excludes `.js` files, which are generated from TypeScript.
