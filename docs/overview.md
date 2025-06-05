# Overview of the MyST stack

This section provides a high-level overview of the main concepts and tools in the MyST ecosystem. See the [guiding principles of the MyST ecosystem](../guiding-principles.md) for some more high-level context.

(overview-build-process)=
## Overview of the MyST build process

The MyST Build process takes input documents from authors and converts them into outputs that are meant for consumption by readers. The [MyST CLI](https://mystmd.org) contains logic to use the MyST Document Engine, renderers, and themes to carry out this entire process. Here's a high-level breakdown of the major steps of that process:

```{list-table}
:header-rows: 1
- - Phase
  - Input
  - Output
- - (1) **Writing**: An author writes content with {term}`MyST Markdown` in a file.
  - Ideas
  - Content (`.md`, `.ipynb`, etc)
- - (2) **Parsing**: A {term}`MyST Document Engine` parses content into structured data called the {term}`MyST AST`. See [](#overview-parsing).
  - Raw content (`.md`, `.ipynb`, etc)
  - Raw MyST AST
- - (3) **Resolving**: Transform raw MyST AST into AST that can be rendered. See [](#overview-transformers).
  - Raw MyST AST
  - Resolved / Processed MyST AST
- - (4) **Rendering**: A {term}`MyST Renderer` transforms the {term}`MyST AST` into components that can be used by a {term}`MyST Theme`.
  - Resolved MyST AST
  - Components that can be rendered into a final output with a _template_ and/or _theme_ (e.g., LaTeX, React, etc).
- - (5) **Theming / templating**: Rendered components are used by a {term}`MyST Theme` to generate final artifacts. See [](#overview-themes).
  - Template components that have been rendered by a MyST renderer.
  - Output formats that are ready for final consumption (e.g., a website or PDF).
```

Here is a brief overview of these steps:

% NOTE: This is an excalidraw SVG. You can edit it directly in Excalidraw.
% See the contributing docs for a short guide.
:::{figure} images/overview-diagram-build.svg
An overview of the "Parsing and Resolving" phase using the MyST Document Engine.
In this stage, a text file written in MyST Markdown is parsed by the {term}`MyST Document Engine` which outputs {term}`MyST AST` that follows the {term}`MyST Specification`. This file undergoes a number of transformations to add metadata, resolve links, and enrich the document. The final output is MyST AST (usually a `.json` file) that can be rendered into many different kinds of outputs.
:::

:::{figure} images/overview-diagram-render.svg
An overview of the "Rendering and Theming" phase using one or more MyST renderers / themes. In this stage, a resolved MyST AST is rendered into multiple components by a MyST renderer. These are building blocks that a theme knows how to convert into a final output. For example, the [MyST React Renderer](https://github.com/jupyter-book/myst-theme/tree/main/packages/myst-to-react) and the [MyST React Themes](https://github.com/jupyter-book/myst-theme/tree/main/themes) know how to use these React components to create a final website.
:::

(overview-parsing)=
## How does parsing work?

The MyST Document engine knows how to parse many kinds of documents into {term}`MyST AST`. This is most-commonly done with Markdown files (`.md`) or Jupyter Notebooks (`.ipynb`) written in {term}`MyST Markdown`, a flavor of Markdown that was designed for the MyST Document Engine.

However, the MyST Engine knows how to parse other kinds of syntax into MyST AST as well. For example, [for admonition compatibility with GitHub Markdown](#admonition-github-compatibility). This is because we see the {term}`MyST AST` as the primary point of _standardization_ for the MyST ecosystem, not the Markdown flavor. Input documents may have many different forms, but once it is parsed into {term}`MyST AST`, the document should have a standardized structure defined by the {term}`MyST Specification`.

## What is the MyST AST and Specification?

The {term}`MyST AST` is a version of parsed MyST content that follows a specific structure so that Renderers can convert into different outputs. MyST AST conforms to the {term}`MyST Specification`. The {term}`MyST Specification` is a superset of [the `mdast` specification](https://github.com/syntax-tree/mdast) (meaning that MyST includes all of the syntax that `mdast` supports, plus some extra ones like Directives).

Here's an example of MyST content, and the same content parsed as MyST AST:

````{list-table}
:header-rows: 1
- - Content
  - AST
- - `**Hello there!**`
  - ```yaml
    - type: block
    children:
      - type: paragraph
        children:
          - type: strong
            children:
              - type: text
                value: Hello there!
    ```
````

The easiest way to understand how {term}`MyST Markdown` gets converted to {term}`MyST AST` is to [explore the MyST Sandbox](https://mystmd.org/sandbox). Click the {kbd}`AST` tab to see the underlying AST structure for anything that you type. The {kbd}`PRE` tab represents the initial parsing phase, and the {kbd}`POST` tab represents the AST after the resolving phase.

(overview-transformers)=
## How do MyST Transformers work?

MyST Transformers are a way to convert a {term}`MyST AST` node into another type of node. Transformers operate on AST rather than on raw Markdown because AST has more standardized structure to work with.

For example, consider a Markdown link like `[some text](#a-label)`. In MyST Markdown, this defines a **cross-reference** to `#a-label`, but it uses Markdown link syntax. We use a **MyST Transformer** to convert that Markdown to a cross-reference AST node like so:

- First parse the Markdown `[some text](#a-label)`.
- The result is a MyST AST node for a **Markdown link**.
- Next, search the document AST for any Markdown link nodes with a target that starts with `#`. Check if there's [a target](./cross-references.md) for the link. If so, it is meant to be a cross reference.
- If so, converts the Markdown Link node into a Cross Reference node.

Some other uses for Transformers include:

- Lifting metadata from `code-cells` to their parent structures
- Check that figures have alt-texts
- Convert non-standard AST nodes (e.g., ones generated from a custom user directive) into ones that MyST knows how to render[^ex-transform-node].

[^ex-transform-node]: For example, see [this Executable Transform example from Project Pythia](https://github.com/projectpythia-mystmd/cookbook-gallery/blob/main/pythia-gallery.py). It is an example of an [`executable transform`](#executable-plugins), which takes custom `pythia-cookbooks` nodes and converts them (via some HTTP fetches) to a grid of cards by outputting the relevant grid and card AST nodes.

See [](#develop:transforms) for more details about how transforms operate on an AST and what intermediate steps look like.

(overview-themes)=
## How do MyST themes and templates work?

MyST {term}`themes` and MyST {term}`templates` are both related to _exporting_ a resolved MyST AST into one or more final output formats. They differ in the amount of _customizability_ that a user has in altering their behavior, but the end-result is the same (generating an export artifact).

```{glossary}
Templates
: Templates are usually used for [static exports](./documents-exports.md) (like LaTeX or Typst). The are structured like a final document (e.g., a LaTeX template for a specific journal), but with fields that MyST uses to insert document metadata at export time (e.g., a `doc.author` field if you want to insert the author name). See [the `myst-templates` GitHub repository](https://github.com/myst-templates) for a list of templates that you can use and contribute to.

Themes
: Themes are similar to templates because they expose more customizability than a template (which simply generates static outputs via a Jinja-like filter), but they function similar to a template because they take rendered components as inputs and export a final output. Themes are usually meant for _websites_, because there is a lot more control a website exposes compared to a static document like LaTeX. Themes have more complex logic, and thus their source-code is often in a dedicated repository. For examples, see the [build outputs of the `book` and `article` web themes are `myst-templates`](https://github.com/myst-templates#templates), but their [source code is in `myst-theme`](https://github.com/jupyter-book/myst-theme/tree/main/themes).
```

For a more technical explanation see [the developer guide on themes, templates, and renderers](#develop-renderers-themes).

## Are there other MyST engines?

The [MyST Specification](https://mystmd.org/spec) and [MyST Markdown Syntax](https://mystmd.org/guide) was designed so that others could implement their own parsers, document engines, and renderers using MyST. Although there are presently no independent examples of a true {term}`MyST Document Engine`, the MyST Parser for Sphinx project fulfills a similar role in the Sphinx ecosystem.

The [MyST Parser for Sphinx](https://myst-parser.readthedocs.io) is an extension for [Sphinx](https://sphinx-doc.org) that can parse MyST Markdown into Sphinx's internal document structure. It was created to allow users to parse MyST Markdown syntax into Sphinx for [V1 of Jupyter Book](https://jupyterbook.org). It now exists as an independent extension for the Sphinx community, as Jupyter Book now uses the MyST Document Engine.

:::{note} MyST Parser for Sphinx Compatibility
As the MyST Parser for Sphinx does not support all of the syntax defined in the MyST Guide, or output {term}`MyST AST`, it's not a true {term}`MyST Document Engine` as defined by this project. That's OK! Its goal is to be a useful tool for the Sphinx community that only leverages parts of the MyST ecosystem (the Markdown flavor), which for many people is "good enough."
:::

## How does Jupyter Book relate to MyST?

The MyST Markdown Syntax was originally created to allow [Jupyter Book V1](https://jupyterbook.org) to use the [Sphinx Document engine](https://sphinx-doc.org) with Markdown content[^md], rather than the less well-known <wiki:ReStructuredText> language.

[^md]: Specifically, the [MyST Parser for Sphinx](https://myst-parser.readthedocs.io) was created to move beyond the functionality of the [`recommonmark` project](https://github.com/readthedocs/recommonmark) in order to natively support docutils `roles` and `directives` in Markdown.

Over time, the Jupyter Book team decided that the most sustainable path forward was to maintain its own document engine, the [MyST Document Engine](https://mystmd.org/guide). An early version of the MyST Document Engine was created by [Curvenote](https://curvenote.com). To promote its long-term sustainability, the project was open sourced and further developed in collaboration with the Jupyter Book team. It serves as the engine behind Jupyter Book V2.

You can think of Jupyter Book as a _distribution of the MyST Document Engine_. In other words, Jupyter Book wraps the MyST Document Engine application, with out-of-the-box configuration that supports a multi-page community knowledge base or documentation site. MyST is created and maintained by the [Jupyter Book team](https://compass.jupyterbook.org).

Currently, Jupyter Book and the MyST Document Engine share much of the same functionality. Over time, we imagine that the MyST Document Engine will be a more flexible tool that makes fewer assumptions about the end use-case that it's being used for. Jupyter Book will then have "more opinions" above the base configuration of the MyST Document Engine. That said — we are still figuring this out! We aren't sure the exact relationship the two will have, and will revisit this as we learn more. See [next.jupyterbook.org](https://next.jupyterbook.org) for Jupyter Book V2 documentation, and [see this section of the Contributing Guide](#jb-vs-md) for our approach to documenting the two projects.

## How do MyST and Sphinx compare?

[Sphinx] is an open-source documentation system used in many software projects, especially in the Python ecosystem. It builds an internal representation of technical documents as a tree (see [docutils]) similar to the {term}`MyST AST`. Whilst Sphinx partially defines a specification of sorts[^docutils], a {term}`MyST Document Engine` explicitly publishes its {term}`MyST AST` for other tools to consume.

The Sphinx ecosystem has excellent support for Python documentation, referencing content, as well as externally providing an inventory of references known as [intersphinx]. You can link to Sphinx documentation with a {term}`MyST Document Engine` by using [intersphinx references](#intersphinx), and the official {term}`MyST Document Engine` automatically exposes the information required to allow Sphinx documentation to reference your MyST project.

At this time, the official {term}`MyST Document Engine` does not support the authoring of software API documentation[^api-docs]. As such, if your project is documenting Python software we suggest that you use Sphinx. If your project is primarily tutorials, educational textbooks (including with Jupyter Notebooks), a presentation, or scientific paper, we hope that you find a better fit with the MyST stack!

Sphinx and MyST take very different approaches to publishing to the web. In Sphinx, themes are used to customize the generation of HTML and JavaScript. Sites built using these themes can be deployed to static web servers like [ReadTheDocs](https://readthedocs.com/). In the MyST world, the equivalent to a Sphinx theme is a {term}`MyST Renderer` that consumes the {term}`MyST AST` and outputs HTML and JavaScript for your browser. Formally separating the {term}`MyST Document Engine` that generates {term}`MyST AST` and the {term}`MyST Renderer` that consumes it makes it possible to create rich new experiences with MyST, such as the [SciPy Conference Proceedings](https://proceedings.scipy.org/) website that renders {term}`MyST AST` on the fly.

Although the official engine also supports static HTML outputs, implementing themes as applications makes it easier to build more powerful MyST viewing experiences.

[^api-docs]: In the future, `mystmd` may offer support for Python and JavaScript documentation, and if you want to contribute please reach out!
[^docutils]: The Docutils source-code _is_ the specification.

[docutils]: https://docutils.sourceforge.io/
[sphinx]: https://www.sphinx-doc.org/
[intersphinx]: https://www.sphinx-doc.org/en/master/usage/extensions/intersphinx.html
