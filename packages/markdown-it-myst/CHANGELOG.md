# markdown-it-myst

## 1.1.0

### Minor Changes

- fe3a7d4: Upgrade to `unified@11`, `vfile@6`, `@types/mdast@4`, `@types/unist@3` and the current majors of the unist, mdast and hast utilities.
  
  Changes visible to users and plugin authors:
  
  - Cross-reference and caption text filled from templates is now a single text node in the site JSON (e.g. `"Figure 1:"` instead of `"Figure "`, `"1"` and `":"`). Rendered output is unchanged.
  - TypeScript plugins and libraries now see the `unified@11` and `@types/unist@3` types. `utils.select` in the plugin API still returns `null` when nothing matches, but plugins calling `unist-util-select` directly now get `undefined`.
  - `TransformSpec.plugin` is typed as a `GenericParent` transformer, which may be async. `MessageInfo.node` and `toText` accept any node, and `forcedRemove` is now exported from `myst-common`.
  - `myst-to-html` exports `htmlToMdast` and `createMdastNode`, the HTML to mdast conversion shared with `myst-transforms`.

### Patch Changes

- 5a2b22e: Update eslint package metadata
- b800e78: Fix duplicate markdown directive argument parsing

## 1.0.19

### Patch Changes

- 5c0347d: Use vitest for the test runner
- 138805c: Fix test invocation

## 1.0.18

### Patch Changes

- 95aa76d: Update package metadata
- 12f4721: Fix dependencies / types

## 1.0.17

### Patch Changes

- 70b417c: Stop citation label parsing at `<` so following HTML and autolinks are preserved

## 1.0.16

### Patch Changes

- 9355519: Add multi-line to role parsing

## 1.0.15

### Patch Changes

- bc240a8: Make citation parsing less aggressive

## 1.0.14

### Patch Changes

- 770eece: Footnotes and role parsing

## 1.0.13

### Patch Changes

- cd8ee79: Update MarkdownIt to 13 for all dependencies, add types to dependencieswq

## 1.0.12

### Patch Changes

- a85b321: Update to package dependencies and typescript

## 1.0.11

### Patch Changes

- c6213ed: Add inline options

## 1.0.10

### Patch Changes

- c758f1b5: Directive option flag is always a boolean

## 1.0.9

### Patch Changes

- 5ac2d0bc: Fix inline parsing for roles

## 1.0.8

### Patch Changes

- b3e9df9d: Update to Project Jupyter and change all URLs

## 1.0.7

### Patch Changes

- 6a57ab77: Only trim end of line for myst-directives, not both the start and end of lines. This is important for keeping indentation in code blocks.

## 1.0.6

### Patch Changes

- 20108545: Add block tightness to the directives

## 1.0.5

### Patch Changes

- c242d9b1: Improve the suffix label parsing for citations

## 1.0.4

### Patch Changes

- f7c29db6: Improve citation parsing to exclude trailing punctuation.

## 1.0.3

### Patch Changes

- 757f1fe4: Add column information to citations and roles

## 1.0.2

### Patch Changes

- Updates to internal dependencies

## 1.0.1

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

## 0.1.3

### Patch Changes

- 99948cc8: Allow whitespace around role name inside brackets

## 0.1.2

### Patch Changes

- 9f8613ef: Fix flag colon option with trailing whitespace
- 5f506356: Allow directives to have spaces, and trim the name before passing it onto other directives
- d14bb127: Do not parse nested colon fence as directive option

## 0.1.1

### Patch Changes

- a22fafa0: Log parse errors with vfile
- a22fafa0: New markdown-it package for generically parsing myst roles/directives - replaces markdown-it-docutils
- a22fafa0: Directive options defined with colons (e.g. :key: value) just parse line-by-line, they no longer use yaml loading.
