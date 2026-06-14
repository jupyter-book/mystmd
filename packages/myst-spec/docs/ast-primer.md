---
title: A primer on the MyST AST
short_title: AST primer
description: A getting-started guide to the structure of the MyST abstract syntax tree, for renderer and parser authors.
---

The MyST Abstract Syntax Tree (AST) is the structured representation of a MyST document after parsing.
It is plain JSON, consumed by tools that render the document (to HTML, LaTeX, Typst, etc).
This page is a brief overview of the structure and how the pieces fit together.

:::{seealso} The MyST User Guide is for users of the CLI
If you just want to author MyST documents, you probably don't need this page - head to the [MyST Guide](xref:guide).
If you want to build a renderer, write a parser, or generate AST from a plugin, read on.
:::

## The spec and mystmd

This primer covers both **the MyST Specification** (this site) and **mystmd** (the official reference implementation):

- The **spec** defines what a conforming MyST parser must produce - node types, their properties, and how they correspond to source. It evolves through the [MyST Enhancement Proposal process](https://mep.mystmd.org).
- **mystmd** implements the spec, then goes further: it runs transforms that resolve cross-references and apply numbering, emits additional node types that aren't yet in the spec, and applies its own conventions (like named parts of a document).

If you're writing a parser, stick to the spec. mystmd's conventions (like specific named parts) aren't part of the spec, but they're still useful to know, since most MyST content today comes from mystmd. This page flags which is which as we go.

## The shape of a node

Every node in the AST is a JSON object with a `type` field that names what kind of node it is.
Beyond `type`, a node has either a `value` or `children`:

- **Leaf nodes** typically have a `value` (typically a string).
- **Parent nodes** have a `children` array (more nodes).

Nodes may also carry additional properties - `url` on a link, `depth` on a heading, `identifier` on a cross-reference, etc.
These properties are specific to each node type and are documented in the [node reference](./myst.schema.md).

Here is the smallest meaningful AST: a single line of text.

```{myst}
Hello, world!
```

Click the **AST** tab above to see the AST. (The tab displays YAML for readability; MyST sites serve it as JSON.)
You'll find a `root` node (always the outermost node) wrapping a `paragraph`, which wraps a `text` leaf.

## Inline formatting nests parent nodes

Inline formatting introduces parent nodes around the text they decorate.

```{myst}
A paragraph with **bold** and *emphasis*.
```

In the AST tab, the paragraph's `children` is a flat sequence of `text`, `strong`, and `emphasis` nodes. Each `strong` and `emphasis` wraps its own `text` node.
The markup characters (`**`, `*`) are gone from the source text. They've been turned into nested nodes (e.g. `*word*` becomes a `type: emphasis` node wrapping a `text` node).

(pre-and-post)=
## Two processing stages: PRE and POST transforms

In the `myst-cli`, a MyST document is processed through a series of transformations, and the AST has a different shape after each one.
The short-hand for this in MyST documentation is `PRE`- and `POST`-transforms. You can get very granular by applying various [`myst-transforms`](https://npmjs.com/package/myst-transforms) in your own libraries or packages.

1. **PRE**: the output of *parsing*. The parser walks the source and expands directives and roles by calling their `run` functions. Cross-references still look like ordinary `link` nodes (e.g. `url: "#some-label"`). Directives appear as `mystDirective` wrapper nodes containing their expanded children. Numbering has not yet been applied.
2. **POST**: the output after [transforms](xref:guide#develop:transforms) run over the PRE tree. Link nodes pointing at labels become `crossReference` nodes with resolved targets. Most directive wrappers are unwrapped, leaving only their semantic children. Numbering and enumeration are applied. This is the form most renderers consume.

You can see both stages inline: the `{myst}` directive used on this page exposes a **PRE** / **POST** toggle inside its AST tab, and so does the [MyST sandbox](https://mystmd.org/sandbox). Try it on this cross-reference:

```{myst}
(my-label)=
**A labeled paragraph.**

See [this paragraph](#my-label) for context.
```

In **PRE**, the second paragraph contains an ordinary `link` node with `url: "#my-label"`.
In **POST**, that same node has become a `crossReference` with `identifier`, `kind`, and `resolved: true` properties.

### Which stage will you encounter?

- The **spec's [test cases](https://unpkg.com/browse/myst-spec/dist/)** describe the **PRE** form. They are the canonical "source -> AST" pairs that any conforming parser must produce.
- The [node reference](./myst.schema.md) documents node *types* that may appear in either stage. Some properties (like `resolved` on `crossReference`, or computed numbering fields) appear only after transforms.

In short:

- A parser produces PRE. Match the test cases.
- A renderer receives POST. It's what `myst build` emits.
- A transform pipeline applies a series of transformations that change the tree from `PRE` to `POST`

## Directives in PRE vs. POST

Directives change shape between PRE and POST (roles behave similarly):

```{myst}
:::{note}
Heads up!
:::
```

In **PRE**, you'll see a `mystDirective` wrapper (name: `note`) containing an `admonition` child. The wrapper records the directive that produced it. The child is what its `run` function returned from a `mystmd` plugin.

In **POST**, the `mystDirective` wrapper is typically stripped, and transforms may add extra structure. For example, [`admonitionHeadersTransform`](https://github.com/jupyter-book/mystmd/blob/0d626b198093fa740125d02267a111d84547fd36/packages/myst-transforms/src/admonitions.ts#L36) inserts an `admonitionTitle` child.

When directive parsing fails, the POST AST signals it in one of two ways:

- **Unknown directive name** (no plugin registered): the node stays as a `mystDirective` leaf, with the original source text in its `value`.
- **Invalid arguments or body**: the node's type becomes `mystDirectiveError`, and its children are dropped. Renderers can use this to display error messages in the output.

## Plugins often emit a custom node that is transformed

A common plugin pattern uses a directive (or role) to emit a *placeholder* node, then a separate transform to expand that placeholder into real content.

For a working in-repo example of this pattern, see [`docs/templates.mjs`](https://github.com/jupyter-book/mystmd/blob/main/docs/templates.mjs) (the `myst:template` directive emits a `myst-template-ref` placeholder, then `mystTemplateTransform` fetches template metadata and expands them).

This split is useful for anything you can't do inside a directive's [`run()` function](xref:guide#defining-a-new-directive): async work, anything that needs the whole document for context, or anything that depends on cross-references being resolved first.

## Frontmatter and document structure

A document's frontmatter (the YAML at the top of a `.md` file) doesn't appear as a node in the tree.
It is attached separately, alongside the `mdast` (the AST) in the JSON output of `myst build`.
A built page on disk looks roughly like:

```{code} json
:caption: A page from `myst build --site`
{
  "kind": "Article",
  "frontmatter": { "title": "...", "authors": [...] },
  "mdast": { "type": "root", "children": [ ... ] },
  "references": { ... }
}
```

The `mdast` field is the tree you've been inspecting in the AST tabs above.
The `references` field holds cross-document data like resolved cross-references and citations, which a renderer needs when working across pages.

## Chunking a page into blocks

The `+++` syntax divides a page into `block` nodes. Each `block` wraps the content that follows it, and optional JSON after `+++` becomes block metadata:

```{myst}
+++ {"label": "intro", "foo": "bar"}

A first chunk.

+++

A second chunk.
```

In the AST (POST), each chunk ends up inside a `block` node. Recognized keys (`kind`, `class`, `label`, `identifier`) are moved onto the `block` node, anything else is put under `block.data`. See [](./features/blocks.md) for the formal block specification.

## "Parts": named regions of a page or project

Plugins and themes often need to pull out a specific region of a page (the abstract, the acknowledgments, etc.). MyST has "parts" for this.
Parts aren't part of the `myst-specification`, they are a concept used by the [MyST Document Engine](xref:guide) to structure pages and projects.
See [](xref:guide#parts-ast) for details.

## How the MyST AST and its upstream foundation (`mdast`) relate

The MyST AST extends [`mdast`](https://github.com/syntax-tree/mdast), the Markdown AST used widely in the JavaScript [unified](https://unifiedjs.com/) ecosystem, which in turn builds on [`unist`](https://github.com/syntax-tree/unist) (Universal Syntax Tree).
If you've used `remark` or `rehype`, the shape will feel familiar.
MyST adds node types for directives, roles, cross-references, citations, admonitions, equations, and other constructs that don't exist in plain Markdown.

## Where to go next

- The [MyST sandbox](https://mystmd.org/sandbox) parses any MyST input you type and shows the AST in PRE and POST stages.
- The [AST Node index](./myst.schema.md) describes the AST of all nodes defined in the specification.
- The [test cases](https://unpkg.com/browse/myst-spec/dist/) provide source -> expected (PRE) AST pairs.
- [Generate MyST AST with Plugins](xref:guide/plugins-ast) in the MyST Guide shows a few ways to generate AST from a plugin.
