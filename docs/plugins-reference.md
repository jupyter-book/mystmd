---
title: Plugin API reference
short_title: Reference
description: Every field a MyST plugin can define, with links to the TypeScript types.
---

This page lists the fields that a plugin can define.
To learn how to write a plugin, start with [](./javascript-plugins.md) or [](./executable-plugins.md).
All types below live in [`myst-common/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-common/src/types.ts).
The engine objects a plugin cannot reach are described in [](#api:pipeline).

(plugins:api)=

## `MystPlugin`

A plugin module default-exports a `MystPlugin` object.
Every field is optional.

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Shown in the build log when the plugin loads. |
| `author`, `license` | `string` | Informational. |
| `directives` | `DirectiveSpec[]` | See [](#plugins:directive-spec). |
| `roles` | `RoleSpec[]` | See [](#plugins:role-spec). |
| `transforms` | `TransformSpec[]` | See [](#plugins:transform-spec). |

(plugins:directive-spec)=

## `DirectiveSpec`

Directives run inside the parser, once per occurrence, when a file is first loaded.
This is before notebook execution and before any transform.

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | The name used in `:::{name}`. Required. |
| `alias` | `string[]` | Other names that invoke the same directive. |
| `doc` | `string` | Description shown in generated documentation. |
| `arg` | definition | The inline argument after the directive name. |
| `options` | `Record<string, definition>` | Named `:key: value` options. Each may also carry an `alias` list. |
| `body` | definition | The content between the fences. |
| `validate` | `(data, vfile) => data` | Optional. Runs before `run` to check or normalise `data`, and returns it. |
| `run` | `(data, vfile, ctx) => GenericNode[]` | Required. Returns the nodes that replace the directive. |

### Argument, option, and body definitions

`arg`, each entry of `options`, and `body` share one shape.

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | `String`, `Number`, `Boolean`, or `'myst'` | How to interpret the text. `'myst'` parses the text into {term}`MyST AST`, and `'parsed'` means the same. |
| `required` | `boolean` | Whether the value must be present. |
| `doc` | `string` | Description shown in generated documentation. |

### `DirectiveData`

What `validate` and `run` receive.

| Field | Meaning |
| --- | --- |
| `name` | The name as invoked, which may be an alias. |
| `node` | The raw directive node, including its source `position`. |
| `arg`, `options`, `body` | Already converted to the declared `type`. A `'myst'` value is an array of nodes. |

### `DirectiveContext`

`ctx.parseMyst(source, offset)` parses a MyST string into AST at runtime.
The optional `offset` shifts line numbers in any resulting messages so they point at the right place in the source file.
See [](#plugins:ctx) for examples.

```{code} javascript
:filename: callout.mjs
const callout = {
  name: 'callout',
  arg: { type: String, required: true },
  body: { type: 'myst' },
  run(data) {
    return [
      {
        type: 'admonition',
        kind: 'note',
        children: [
          { type: 'admonitionTitle', children: [{ type: 'text', value: data.arg }] },
          ...(data.body ?? []),
        ],
      },
    ];
  },
};
```

(plugins:role-spec)=

## `RoleSpec`

A role has the same fields as a directive except that there is no `arg`, and `run(data, vfile)` has no `ctx`.
`data` carries `name`, `node`, `body`, and `options`.
To receive the body as parsed AST, declare `body: { type: 'myst' }`.

(plugins:transform-spec)=

## `TransformSpec`

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Shown in the build log. Required. |
| `doc` | `string` | Description. |
| `stage` | `'document'` or `'project'` | When the transform runs. See the next table. |
| `plugin` | [unified plugin](https://unifiedjs.com/learn/guide/create-a-plugin/) | `(options, utils) => (tree, vfile) => ...`, returning nothing or a `Promise`. Required. |

| Stage | Runs | Relative to resolution |
| --- | --- | --- |
| `'document'` | Once per file, after parsing and execution. | Before links, citations, footnotes, and cross-references are resolved. |
| `'project'` | Once per file during post-processing, after every file is loaded. | After links, citations, and cross-references are resolved. |

`options` is always `undefined`.
The slot exists because every unified plugin takes options, but MyST has no way to set them from `myst.yml`.
`utils.select` and `utils.selectAll` wrap [unist-util-select](https://github.com/syntax-tree/unist-util-select), so no import is needed.
The exact ordering of both stages is in [`myst-cli/src/process/mdast.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/mdast.ts).

(plugins:warnings)=

## Warnings and errors

Every `run`, `validate`, and transform receives the `vfile` for the current document.
Attach messages to the `vfile` rather than printing them.
They then appear in the build log with a file and line, and the rule name lets users silence them with [`error_rules`](#setting:error_rules):

```{code} javascript
vfile.message('Unknown option "foo"', data.node.position, 'my-plugin');
```

The third argument becomes the message's `ruleId`.
Inside the mystmd repository, use `fileWarn`, `fileError`, and `fileInfo` from `myst-common` instead.
They also accept a `note`, a `url`, and a `key`, which is a second identifier so that users can silence one specific message.
Plugins outside the repository cannot import `myst-common` unless it is installed in the project.
