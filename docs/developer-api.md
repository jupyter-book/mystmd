---
title: Developer API Reference
subtitle: How the sausage is made
short_title: Developer APIs
description: Reference for MyST's internal APIs — Session, Plugin, AST, transforms, links, config, execution, and logging.
---

This page documents the TypeScript APIs used when extending or integrating with MyST. Familiarity with TypeScript and [unified](https://unifiedjs.com/) is assumed.

## Build pipeline

Understanding where each API sits in the build makes the rest of this page easier to read.

```{mermaid}
flowchart TD
    src["Source files<br>(.md / .ipynb / myst.yml)"]
    out["Render<br>(site JSON · PDF · JATS · DOCX)"]
    p1["🔌 DirectiveSpec · RoleSpec<br>TransformSpec stage:'document'"]
    p2["🔌 TransformSpec stage:'project'<br>LinkTransformer"]

    subgraph per_file ["**Per-file**"]
        parse["Parse → MDAST<br>(VFile + PreRendererData)"]
        exec["Execute notebooks<br>(myst-execute · ICache)"]
        dtrans["Unified transform pipeline<br>→ RendererData"]
        parse --> exec --> dtrans
    end

    subgraph project ["**Project**"]
        ptrans["postProcessMdast<br>(links, cross-refs, enumeration)"]
    end

    src --> per_file
    p1 -. plugin hooks .-> dtrans
    per_file --> project
    p2 -. plugin hooks .-> ptrans
    project --> out
```

Every stage has access to an `ISession` that carries shared state, logging, the Redux store, and loaded plugins.

---

## Session (`ISession`)

The build involves many functions across multiple packages that all need the same shared state — store, paths, logger, HTTP client, plugin registry. Rather than threading those as individual arguments, `ISession` is the single object passed through every stage. Two types share this name at different abstraction levels: a minimal version in `myst-cli-utils` (just logging and fetch) for lightweight utilities, and the full build-time version in `myst-cli` used throughout the CLI.

### Minimal session (`myst-cli-utils`)

[`packages/myst-cli-utils/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli-utils/src/types.ts):

```typescript
interface ISession {
  log: Logger;
  fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;
}
```

Use this type when writing utilities that only need logging and HTTP — e.g. a `LinkTransformer`.

### Full session (`myst-cli`)

[`packages/myst-cli/src/session/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/session/types.ts):

```typescript
type ISession = {
  API_URL: string;
  configFiles: string[];
  store: Store<RootState>;         // Redux store (projects, config, warnings, links)
  log: Logger;
  doiLimiter: Limit;               // p-limit instance for DOI requests
  executionSemaphore: Semaphore;   // controls parallel notebook execution

  reload(): Promise<ISession>;
  clone(): Promise<ISession>;

  sourcePath(): string;   // root of the source tree
  buildPath(): string;    // _build/
  sitePath(): string;     // _build/site/
  contentPath(): string;  // _build/site/content/ — per-page RendererData JSON, served under /content by both myst start and myst build
  publicPath(): string;   // _build/site/public/  — hashed static assets (images, PDFs), served at /

  plugins: ValidatedMystPlugin | undefined;
  loadPlugins(plugins: PluginInfo[]): Promise<MystPlugin>;
  getAllWarnings(ruleId: RuleId): (BuildWarning & { file: string })[];
  jupyterSessionManager(): Promise<SessionManager | undefined>;
  dispose(): void;
  fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;
};
```

### Cache layer (`ISessionWithCache`)

:::{warning} Incomplete documentation
This section is not yet fully understood. Corrections and additions welcome.
:::

As files are processed, MyST accumulates per-file data — parsed MDAST trees, resolved citations, external references, execution outputs — directly on the session object. The runtime session always carries these caches, but `ISession` deliberately omits them to keep the interface minimal. `ISessionWithCache` is a wider TypeScript view of the same object that makes the cache fields accessible. The `$`-prefixed fields are mutated directly by convention.

[`packages/myst-cli/src/session/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/session/types.ts):

```typescript
type ISessionWithCache = ISession & {
  $citationRenderers:  Record<string, CitationRenderer>;          // keyed on file path
  $doiRenderers:       Record<string, SingleCitationRenderer>;    // keyed on DOI
  $externalReferences: Record<string, ResolvedExternalReference>;
  $mdast:              Record<string, { sha256?: string; pre: PreRendererData; post?: RendererData }>;
  $siteTemplate:       MystTemplate;
  $outputs:            MinifiedContentCache;

  $getMdast(file: string): { sha256?: string; pre: PreRendererData; post?: RendererData } | undefined;
  $setMdast(file: string, data: { sha256?: string; pre: PreRendererData; post?: RendererData }): void;
};
```

**When to use it:** when you need cross-file data during a build — for example, reading another file's MDAST or citation renderers from a project-stage operation.

**How to access it:** `TransformSpec` plugins only receive `(tree, vfile)` and cannot access the cache. To get session access, use `extraTransforms` — a `TransformFn[]` passed to `transformMdast` when driving the build programmatically (not via `myst.yml`). A `TransformFn` receives the full session:

```typescript
import { castSession } from 'myst-cli';

const myTransform: TransformFn = async (session, opts) => {
  const cache = castSession(session);
  const other = cache.$getMdast('/path/to/other.md');
};
```

---

## Plugin API

MyST's built-in directive/role/transform set can't anticipate every domain-specific need — theorem environments, data citations, custom callouts, embedded widgets. Plugins let you extend the AST without forking MyST or requiring upstream changes. They are ES modules that export a `MystPlugin` object, registered in `myst.yml` under `project.plugins`.

[`packages/myst-common/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-common/src/types.ts):

```typescript
type MystPlugin = {
  name?:       string;
  author?:     string;
  license?:    string;
  directives?: DirectiveSpec[];
  roles?:      RoleSpec[];
  transforms?: TransformSpec[];
};
```

A minimal plugin file:

```typescript
// my-plugin.mjs
export default {
  name: 'my-plugin',
  directives: [myDirective],
  transforms: [myTransform],
};
```

### Directives (`DirectiveSpec`)

Use directives when you need a new block-level construct with structured arguments, options, and body — things like theorem environments, custom callouts, or image grids that don't fit standard Markdown. Syntax: `:::name ... :::`.

[`packages/myst-common/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-common/src/types.ts):

```typescript
type DirectiveSpec = {
  name: string;
  alias?: string[];
  doc?: string;
  arg?:     ArgDefinition;
  options?: Record<string, OptionDefinition>;
  body?:    BodyDefinition;
  validate?: (data: DirectiveData, vfile: VFile) => DirectiveData;
  run(data: DirectiveData, vfile: VFile, ctx: DirectiveContext): GenericNode[];
};

type ArgDefinition = {
  type: 'string' | 'number' | 'boolean' | 'myst' | typeof String | typeof Number | typeof Boolean;
  required?: boolean;
  doc?: string;
};

type OptionDefinition = ArgDefinition & { alias?: string[] };

type DirectiveData = {
  name: string;           // name as invoked (may be an alias)
  node: Directive;        // raw directive AST node, carries source position
  arg?:     ParseTypes;   // parsed argument — string | number | boolean | GenericNode[]
  options?: Record<string, ParseTypes>;  // parsed options map
  body?:    ParseTypes;   // parsed body — GenericNode[] if type:'myst', otherwise a scalar
};

type DirectiveContext = {
  parseMyst(source: string, offset?: number): GenericParent;
};
```

`ParseTypes` is `string | number | boolean | GenericNode[]`. The concrete type of `arg` and `body` depends on the `type` field in the corresponding `ArgDefinition`/`BodyDefinition`: `String` → `string`, `Number` → `number`, `Boolean` → `boolean`, `'myst'` → `GenericNode[]`.

`ctx.parseMyst` parses a MyST string into an AST subtree. Use it when you need to construct nodes from a string at runtime — for example, when `body.type` is `String` but the content contains MyST markup you want to interpret. The optional `offset` shifts source positions in error reporting to match the original file location.

**What to implement:**

- `run` (required) — called during the document-stage transform pipeline, once per directive occurrence. Must return an array of AST nodes that replace the directive node in the tree.
- `validate` (optional) — called just before `run` with the same `data` and `vfile`. Use it to check option values, emit warnings (see [Logging](#logging-logger)), or normalise data before `run` sees it. Return the (possibly modified) `DirectiveData`.

```typescript
const calloutDirective = {
  name: 'callout',
  arg:  { type: String, required: true },
  body: { type: 'myst' },
  run(data, vfile, ctx) {
    return [{
      type: 'admonition',
      kind: 'note',
      children: [
        { type: 'admonitionTitle', children: [{ type: 'text', value: String(data.arg) }] },
        ...(Array.isArray(data.body) ? data.body : []),
      ],
    }];
  },
};
```

### Roles (`RoleSpec`)

Use roles for inline spans that need custom rendering or semantics — units, abbreviations, domain-specific references — where a full block directive would be overkill. Syntax: `` {name}`body` ``.

[`packages/myst-common/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-common/src/types.ts):

```typescript
type RoleSpec = {
  name: string;
  alias?: string[];
  doc?: string;
  options?: Record<string, OptionDefinition>;
  body?:    BodyDefinition;
  validate?: (data: RoleData, vfile: VFile) => RoleData;
  run(data: RoleData, vfile: VFile): GenericNode[];
};
```

`RoleData` is similar to `DirectiveData` but without `arg` or `ctx`:

```typescript
type RoleData = {
  name: string;
  node: Role;
  body?:    ParseTypes;
  options?: Record<string, ParseTypes>;
};
```

**What to implement:**

- `run` (required) — called once per role occurrence during the document-stage pipeline. Must return an array of AST nodes that replace the role inline.
- `validate` (optional) — same contract as for directives.

Roles do not receive a `DirectiveContext`, so there is no `parseMyst` — if you need to parse body content as MyST, use `body: { type: 'myst' }` in the spec and it will arrive as `GenericNode[]`.

```typescript
const abbrRole = {
  name: 'abbr',
  body: { type: String, required: true },
  run(data) {
    return [{ type: 'abbreviation', title: String(data.body) }];
  },
};
```

### Transforms (`TransformSpec`)

Use transforms when you need to modify *existing* AST nodes globally rather than introduce new syntax — rewriting all links, injecting metadata into headings, normalizing code blocks across the whole document or project. Transforms operate via a [unified](https://unifiedjs.com/) plugin, and `stage` controls when they run:

- `'document'` — once per file, after parsing and before cross-reference resolution
- `'project'` — once per project (all files loaded), during post-processing

[`packages/myst-common/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-common/src/types.ts):

```typescript
type TransformSpec = {
  name: string;
  doc?: string;
  stage: 'document' | 'project';
  plugin: Plugin<[PluginOptions | undefined, PluginUtils], GenericParent>;
};

type PluginUtils = {
  select:    (selector: string, tree?: GenericParent) => GenericNode | null;
  selectAll: (selector: string, tree?: GenericParent) => GenericNode[] | null;
};
```

**What to implement:** the `plugin` field — a [unified `Plugin`](https://unifiedjs.com/learn/guide/create-a-plugin/) function that receives `(options, utils)` and returns a transformer `(tree, vfile) => void | Promise<void>`. The transformer is called once per file (stage `'document'`) or once for each file after all files are loaded (stage `'project'`).

`PluginUtils` provides `select` and `selectAll` as convenience wrappers around `unist-util-select`, so no extra import is needed. `options` is a freeform `Record<string, any>` — currently always `undefined` for plugins loaded via `myst.yml`; only relevant if you invoke `transformMdast` programmatically and pass options directly.

```typescript
import { visit } from 'unist-util-visit';

const boldToEmphasis = {
  name: 'bold-to-emphasis',
  stage: 'document',
  plugin: () => (tree) => {
    visit(tree, 'strong', (node) => {
      node.type = 'emphasis';
    });
  },
};
```

For async transforms, return a `Promise`:

```typescript
const fetchMetadata = {
  name: 'fetch-metadata',
  stage: 'document',
  plugin: () => async (tree, vfile) => {
    const links = selectAll('link', tree);
    await Promise.all(links.map(async (link) => {
      link.data = await fetchLinkMeta(link.url);
    }));
  },
};
```

### `VFile` access in plugins

All three plugin types receive a `vfile` for the current document (see [Document data](#document-data-vfile-prerendererdata-rendererdata) below). Use it to report warnings and errors with source position:

- **Directives**: `validate(data, vfile)` and `run(data, vfile, ctx)`
- **Roles**: `validate(data, vfile)` and `run(data, vfile)`
- **Transforms**: second argument of the unified transformer — `plugin: () => (tree, vfile) => { ... }`

See [](#document-data-vfile-prerendererdata-rendererdata) for how to use `vfile.message()` and `vfile.fail()`.

---

## AST node types

Parsing and rendering are decoupled — the AST is the contract between them. A shared, typed node shape lets transforms, renderers, and validators work against any source format (.md, .ipynb, .tex) without knowing how the document was produced. Base types are in `myst-common`; canonical node types are in [myst-spec](https://github.com/jupyter-book/myst-spec) with MyST-specific extensions in `myst-spec-ext`.

[`packages/myst-common/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-common/src/types.ts):

```typescript
type GenericNode<T = Record<string, any>> = {
  type:       string;
  kind?:      string;
  children?:  GenericNode[];
  value?:     string;
  identifier?: string;
  label?:     string;
  position?:  Node['position'];
} & T;

type GenericParent<T = Record<string, any>> = GenericNode<T> & {
  children: GenericNode[];
};
```

### Notable extended types (`myst-spec-ext`)

Defined in [`packages/myst-spec-ext/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec-ext/src/types.ts).

| Type | Notes |
|---|---|
| `Heading` | adds `implicit`, `html_id`, target info |
| `Image` | adds `urlOptimized`, `placeholder` |
| `Math` / `InlineMath` | adds `typst` rendered form |
| `Block` | adds `visibility`, `executable` flags |
| `Code` | adds `executable`, `visibility` |
| `TabSet` / `TabItem` | tabbed content |
| `Admonition` | adds `icon`, `open` |
| `FootnoteDefinition` / `FootnoteReference` | adds `enumerator` |
| `TableCell` | adds `colspan`, `rowspan` |

### Tree traversal

Use [unist-util-visit](https://github.com/syntax-tree/unist-util-visit) for depth-first traversal and [unist-util-select](https://github.com/syntax-tree/unist-util-select) for CSS-like querying:

```typescript
import { visit, SKIP, EXIT } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';

// Visit all 'code' nodes
visit(tree, 'code', (node, index, parent) => {
  if (node.lang === 'python') node.executable = true;
});

// Stop early
visit(tree, 'heading', (node) => {
  if (node.depth > 2) return EXIT;
  return SKIP;
});

// Query by type and attribute
const figures = selectAll('container[kind=figure]', tree);
const firstLink = select('link', tree);
```

Both `select` and `selectAll` are also provided as `PluginUtils` in `TransformSpec.plugin`, so no extra import is needed there.

---

## Document data (`VFile`, `PreRendererData`, `RendererData`)

Separating raw parse output (`PreRendererData`) from finalized output (`RendererData`) lets transforms mutate freely without corrupting the original, and defers expensive finalization — slug assignment, cross-ref resolution, dependency tracking — until all files are loaded.

### `VFile`

MyST uses [vfile](https://github.com/vfile/vfile) as the standard envelope for a document.[^vfile-why]

[^vfile-why]: The "v" is for "virtual" — the interface doesn't require filesystem access, so it works for files read from disk, generated in memory, or fetched remotely. In MyST's usage the file is always real: `path` is set to the source file location before processing begins, and is used for error reporting and relative path resolution rather than for reading the file (the content is already loaded by then). vfile is used for three reasons: it is required by unified (all unified plugins receive `(tree, vfile)`); it provides structured messages with source position, severity, `ruleId`, and `key`; and those messages accumulate across the transform pipeline and are flushed at the end by `logMessagesFromVFile`, which feeds them into MyST's warning store — including the `ruleId`/`key` that lets users suppress them via `error_rules` in `myst.yml`.

```typescript
interface VFile {
  path:     string;
  value?:   string | Uint8Array;
  messages: VFileMessage[];
  // history, cwd, data, ...
}
```

In plugin context, two things are useful:

- `vfile.path` — the absolute path of the file being processed. Read this when you need to resolve paths relative to the current file, or to identify the file in a log message.
- `vfile.message()` / `vfile.fail()` — attach a warning or error to the file. These surface in the build log with file and line context (see [Logging](#logging-logger)).

### `PreRendererData`

Created when a file is first loaded, before transforms run. [`packages/myst-cli/src/transforms/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/types.ts):

```typescript
type PreRendererData = {
  file:         string;
  location:     string;
  mdast:        GenericParent;        // the raw parsed MDAST
  kind:         SourceFileKind;       // 'article' | 'notebook'
  frontmatter?: PageFrontmatter;
  identifiers?: string[];
  widgets?:     Record<string, any>;
};
```

Stored in `ISessionWithCache.$mdast[file].pre`.

### `RendererData`

Produced after post-processing (cross-refs resolved, slugs assigned, frontmatter finalized). [`packages/myst-cli/src/transforms/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/types.ts):

```typescript
type RendererData = PreRendererData & {
  sha256:       string;
  slug?:        string;
  frontmatter:  PageFrontmatter;       // fully resolved
  references:   References;           // citations, article AST
  dependencies: Dependency[];
};
```

Stored in `ISessionWithCache.$mdast[file].post`. This is what gets serialized to site content JSON.

---

## `LinkTransformer`

Link resolution is inherently domain-specific — DOIs, arXiv IDs, GitHub references, and internal cross-refs all need different handling. Rather than hardcoding each protocol, MyST routes links through a chain of transformers, so new protocols can be added without touching core code. `LinkTransformer` is the interface for one such handler, called during the project-stage link-resolution pass.

[`packages/myst-transforms/src/links/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/types.ts):

```typescript
interface LinkTransformer {
  protocol?:    string;        // e.g. 'doi', 'arxiv'
  formatsText?: boolean;       // set true if transform sets link text
  test(uri?: string): boolean; // return true if this transformer handles the URI
  transform(link: Link, file: VFile): boolean; // mutate link in place; return true on success
}
```

Register transformers by passing them to `linksTransformPlugin` or `linkTransforms` in the project config. The `transform` method receives the `Link` node (from `myst-spec-ext`) and the enclosing `VFile`; mutate the node directly and return `true` on success or `false` to fall through to the next transformer.

```typescript
import type { LinkTransformer } from 'myst-transforms';

const githubTransformer: LinkTransformer = {
  protocol: 'github',
  test: (uri) => !!uri?.startsWith('github:'),
  transform(link, file) {
    const [owner, repo, ...rest] = link.url.replace('github:', '').split('/');
    link.url = `https://github.com/${owner}/${repo}${rest.length ? '/' + rest.join('/') : ''}`;
    return true;
  },
};
```

---

## Configuration (`ProjectConfig`, `SiteConfig`)

The build pipeline makes decisions based on config — which plugins to load, which files to exclude, how to structure the site. Having typed config objects (rather than raw YAML) catches malformed config early and makes programmatic manipulation safe. These types reflect the shape of `myst.yml` after parsing and validation.

### `ProjectConfig`

[`packages/myst-config/src/project/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-config/src/project/types.ts):

```typescript
type ProjectConfig = ProjectFrontmatter & {
  // (inherits title, description, authors, keywords, license, ...)
  index?:       string;
  exclude?:     string[];
  plugins?:     PluginInfo[];
  error_rules?: ErrorRule[];
};

type PluginInfo =
  | string                                        // path shorthand
  | { type: 'javascript'; path: string }
  | { type: 'executable';  path: string };
```

### `SiteConfig`

[`packages/myst-config/src/site/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-config/src/site/types.ts):

```typescript
type SiteConfig = {
  title?:     string;
  options?:   SiteOptions;
  projects?:  SiteProject[];
  nav?:       SiteNavItem[];
  actions?:   SiteAction[];
  domains?:   string[];
  template?:  string;
};

type SiteProject = {
  path?:  string;
  slug:   string;
};

type SiteNavItem =
  | { title: string; url: string; children?: SiteNavItem[] }
  | { title: string; children:    SiteNavItem[] };
```

Retrieve the active config from the Redux store:

```typescript
import { selectors } from 'myst-cli';

const projectConfig = selectors.selectCurrentProjectConfig(session.store.getState());
const siteConfig    = selectors.selectCurrentSiteConfig(session.store.getState());
```

---

## Execution and cache (`ICache`, `LocalDiskCache`)

Notebook execution is expensive and deterministic for a given cell input. Caching results to disk means repeated builds skip re-execution when nothing has changed — critical for interactive development with large notebooks. `myst-execute` provides the cache abstractions used for this.

[`packages/myst-execute/src/cache.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-execute/src/cache.ts):

```typescript
interface ICache<T> {
  test(key: string): boolean;
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}
```

`LocalDiskCache<T>` serializes values to JSON files under a given directory:

```typescript
const cache = new LocalDiskCache<ExecutionResult>('./_build/cache/exec');

if (!cache.test(cellId)) {
  cache.set(cellId, await runCell(cell));
}
const result = cache.get(cellId);
```

### Execution types

[`packages/myst-execute/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-execute/src/types.ts):

```typescript
type ExecutionResult = IOutput[] | IExpressionResult;

type IExpressionResult =
  | { status: 'ok';    data: IMimeBundle; metadata: PartialJSONObject }
  | { status: 'error'; ename: string; evalue: string; traceback: string[] };
```

`IOutput` is from `@jupyterlab/nbformat`. `IMimeBundle` maps MIME types to display data (`text/plain`, `text/html`, `image/png`, etc.).

---

## Logging (`Logger`)

A thin interface rather than a concrete logger lets the same build code work in CLI mode, test environments, and programmatic embedding without coupling to a specific logging library.

[`packages/myst-cli-utils/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli-utils/src/types.ts):

```typescript
type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;
```

`session.log` implements this interface. In transforms, prefer `vfile.message()` for document-level warnings (they carry source position) and `session.log.warn()` for build-level messages.

```typescript
// document-scoped warning (appears with file + line)
vfile.message('Unknown directive option "foobar"', node.position, 'my-plugin');

// build-scoped log (no position)
session.log.warn('Remote fetch failed, using cached result');
```

---

## Reference resolution (`IReferenceStateResolver`)

Cross-document references can't be resolved file-by-file because the target may not have been parsed yet. All targets are collected project-wide first, then resolved in a second pass once every file is loaded. This is internal to MyST and not a direct plugin extension point, but project-stage transforms can read from the resolver.

[`packages/myst-transforms/src/enumerate.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts):

```typescript
interface IReferenceStateResolver {
  getTarget(identifier: string): Target | undefined;
  getAllTargets(): Record<string, Target>;
  resolveReferenceContent(node: CrossReference, vfile: VFile): void;
}
```

The resolver is passed as part of the project-stage transform options and is available via `session.store` through the selectors. Cross-reference nodes (`type: 'crossReference'`) are populated by the `enumerateTargetsPlugin` and `resolveReferencesPlugin` transforms that run automatically — custom transforms can read resolved targets but should not re-run resolution.
