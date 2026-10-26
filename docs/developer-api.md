---
title: MyST engine internals
short_title: Engine internals
description: How a build moves through the MyST engine, and which objects carry state between the stages.
---

This page explains how a build moves through the engine and which objects carry state between the stages.
It is for people changing the engine or calling `myst-cli` from their own code.
If you are writing a plugin, start with [](#plugins:api) instead.
Each section links to the source on `main`, which may be newer than the version you have installed.

(api:pipeline)=

## Build pipeline

```{mermaid}
flowchart TD
    src["Source files<br>(.md / .ipynb / myst.yml)"]
    out["Render<br>(site JSON · PDF · JATS · DOCX)"]
    p1["🔌 DirectiveSpec · RoleSpec"]
    p2["🔌 TransformSpec stage: 'document'"]
    p3["🔌 LinkTransformer<br>TransformSpec stage: 'project'"]

    subgraph per_file ["Per file"]
        parse["Parse → MDAST<br>(PreRendererData)"]
        exec["Execute notebooks<br>(myst-execute)"]
        dtrans["Document transforms<br>→ RendererData"]
        parse --> exec --> dtrans
    end

    subgraph project ["Project"]
        ptrans["postProcessMdast<br>(resolve links and cross-references,<br>then project transforms)"]
    end

    src --> per_file
    p1 -.-> parse
    p2 -.-> dtrans
    per_file --> project
    p3 -.-> ptrans
    project --> out
```

Directives and roles run inside the parser, so they see no other file and no execution output.
Document transforms then run once per file in [`transformMdast`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/mdast.ts), which ends by building that file's `RendererData`.
Once every file is loaded, MyST collects cross-reference targets from all of them.
Finally `postProcessMdast`, in the same module, runs once per file.
It resolves links and cross-references in place and then runs the project transforms.
See [](#develop:transforms) for what the AST looks like before and after.

Every engine function in these stages takes an `ISession`.
Plugins never receive a session, as explained in [](#api:session-cache).

(api:session)=

## Session

Every stage shares one session object.
It carries the logger, the HTTP client, the Redux store, the build paths, and the loaded plugins.
Two types share the name.

- The minimal [`ISession` in `myst-cli-utils`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli-utils/src/types.ts) has only `log` and `fetch()`. Use it for utilities and [link transformers](#api:link-transformer).
- The full [`ISession` in `myst-cli`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/session/types.ts) adds the Redux `store` (see [](#api:config)), path helpers such as `sourcePath()` and `buildPath()`, the loaded `plugins`, and helpers for notebook execution. The source lists the rest.

(api:session-cache)=

### Session cache: `ISessionWithCache`

At runtime the session also caches per-file data such as parsed trees, citation renderers, and execution outputs.
[`ISessionWithCache`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/session/types.ts) is the wider type that exposes these caches.
Call `castSession(session)` to get the wider type.
The two types are separate so that code which only needs `ISession` does not have to import every `myst-*` package that the cache fields depend on.
Both types and `castSession` are exported from `myst-cli`, but neither is a stable public API.

- `$mdast` maps each file to its `pre` and `post` data (see [](#api:document-data)). Read and write entries through `$getMdast(file)` and `$setMdast(file, data)`.
- The other caches are `$citationRenderers` (keyed by file), `$doiRenderers` (keyed by DOI), `$externalReferences`, `$outputs`, and `$siteTemplate`.

Plugin transforms never see the session.
If you drive the build yourself, you can pass `extraTransforms` to `transformMdast` or `processProject` instead.
MyST calls each transform as `transform(session, opts)` once per file, right after that file's `RendererData` is stored.
The `opts` argument is the same options object that `transformMdast` received.

(api:document-data)=

## Document data

- A [`VFile`](https://github.com/vfile/vfile) wraps one document while transforms run. Its `path` is the absolute source path. Messages attached to the file become build warnings, as described in [](#plugins:warnings).
- [`PreRendererData`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/types.ts) is created when a file is loaded. It holds the `file` path, its `location` in the project, the parsed `mdast`, the `kind` (`Article`, `Notebook`, or `Part`), and optional `frontmatter`, `identifiers`, and `widgets`.
- `RendererData` extends `PreRendererData` with `sha256`, `slug`, the resolved `frontmatter`, `references`, and `dependencies`. `transformMdast` builds the `RendererData`, `postProcessMdast` updates the object in place, and the site content JSON is the serialised form.

(api:ast)=

## AST node types

- [`GenericNode` and `GenericParent`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-common/src/types.ts) are the loosely typed shapes most engine code uses. They have `type`, optional `children`, `value`, `label`, `identifier`, and `position`, and allow any other field.
- The canonical node types are in [myst-spec](https://github.com/jupyter-book/myst-spec). MyST-only additions are in [`myst-spec-ext`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec-ext/src/types.ts).
- Traverse with [unist-util-visit](https://github.com/syntax-tree/unist-util-visit) and query with [unist-util-select](https://github.com/syntax-tree/unist-util-select):

```{code} typescript
import { visit } from 'unist-util-visit';
import { selectAll } from 'unist-util-select';

visit(tree, 'code', (node) => {
  if (!node.lang) node.lang = 'text';
});
const figures = selectAll('container[kind=figure]', tree);
```

(api:link-transformer)=

## Link transformers

DOIs, arXiv IDs, and internal cross-references each need their own handling.
Link resolution is therefore a chain of [`LinkTransformer`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/types.ts) objects, tried in order during post-processing.

- `test(uri)` returns whether this transformer handles the URI.
- `transform(link, vfile)` mutates the `Link` node in place and returns `true` on success.
- `protocol` names the scheme. Set `formatsText` to `true` if your transformer sets the link text itself, so that MyST leaves it alone.

The built-in transformers live in [`myst-transforms/src/links/`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links).
To add your own, pass them as `extraLinkTransformers` to `postProcessMdast` or `processProject`.
They run before the built-ins.
There is no way to add them from `myst.yml`.

(api:config)=

## Where the other types live

- [`ProjectConfig`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-config/src/project/types.ts) and [`SiteConfig`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-config/src/site/types.ts) are the validated forms of `myst.yml`. Read them from the Redux store with the [`selectors`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/store/selectors.ts) exported from `myst-cli`.
- [`ICache` and `LocalDiskCache`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-execute/src/cache.ts) in `myst-execute` cache cell outputs on disk, one JSON file per key, so that rebuilds skip unchanged cells.
- [`Logger`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli-utils/src/types.ts) is `Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>`. Use `session.log` for build-level messages and `fileWarn` from `myst-common` for anything tied to a document, as described in [](#plugins:warnings).
