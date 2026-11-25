# myst-ext-icon

## 0.1.0

### Minor Changes

- fe3a7d4: Upgrade to `unified@11`, `vfile@6`, `@types/mdast@4`, `@types/unist@3` and the current majors of the unist, mdast and hast utilities.
  
  Changes visible to users and plugin authors:
  
  - Cross-reference and caption text filled from templates is now a single text node in the site JSON (e.g. `"Figure 1:"` instead of `"Figure "`, `"1"` and `":"`). Rendered output is unchanged.
  - TypeScript plugins and libraries now see the `unified@11` and `@types/unist@3` types. `utils.select` in the plugin API still returns `null` when nothing matches, but plugins calling `unist-util-select` directly now get `undefined`.
  - `TransformSpec.plugin` is typed as a `GenericParent` transformer, which may be async. `MessageInfo.node` and `toText` accept any node, and `forcedRemove` is now exported from `myst-common`.
  - `myst-to-html` exports `htmlToMdast` and `createMdastNode`, the HTML to mdast conversion shared with `myst-transforms`.

### Patch Changes

- 5a2b22e: Update eslint package metadata
- Updated dependencies [5a2b22e]
- Updated dependencies [fe3a7d4]
  - myst-common@1.12.0

## 0.0.4

### Patch Changes

- 5c0347d: Use vitest for the test runner
- 138805c: Fix test invocation
- Updated dependencies [5c0347d]
- Updated dependencies [138805c]
  - myst-common@1.10.2

## 0.0.3

### Patch Changes

- 95aa76d: Update package metadata
- Updated dependencies [7fda16f]
- Updated dependencies [95aa76d]
  - myst-common@1.10.1

## 0.0.2

### Patch Changes

- ce3c11c: Update inter-version deps

## 0.0.1

### Patch Changes

- 9c28805a: Add support for parsing icon roles
- Updated dependencies [8ba7b73a]
  - myst-common@1.6.0
