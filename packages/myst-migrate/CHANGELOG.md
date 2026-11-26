# myst-migrate

## 1.15.0

No changes in this release.

## 1.14.0

### Minor Changes

- fe3a7d4: Upgrade to `unified@11`, `vfile@6`, `@types/mdast@4`, `@types/unist@3` and the current majors of the unist, mdast and hast utilities.
  
  Changes visible to users and plugin authors:
  
  - Cross-reference and caption text filled from templates is now a single text node in the site JSON (e.g. `"Figure 1:"` instead of `"Figure "`, `"1"` and `":"`). Rendered output is unchanged.
  - TypeScript plugins and libraries now see the `unified@11` and `@types/unist@3` types. `utils.select` in the plugin API still returns `null` when nothing matches, but plugins calling `unist-util-select` directly now get `undefined`.
  - `TransformSpec.plugin` is typed as a `GenericParent` transformer, which may be async. `MessageInfo.node` and `toText` accept any node, and `forcedRemove` is now exported from `myst-common`.
  - `myst-to-html` exports `htmlToMdast` and `createMdastNode`, the HTML to mdast conversion shared with `myst-transforms`.

### Patch Changes

- 5a2b22e: Update eslint package metadata

## 1.13.0

## 1.12.0

### Patch Changes

- 5c0347d: Use vitest for the test runner
- 138805c: Fix test invocation

## 1.11.0

### Patch Changes

- 95aa76d: Update package metadata

## 1.10.1

## 1.10.0

### Patch Changes

- 901c83b: Allow for myst.yaml as well as myst.yml.

## 1.9.1

## 1.9.0

## 1.8.3

## 1.8.2

## 1.8.1

## 1.8.0

## 1.7.1

## 1.7.0

## 1.6.7

## 1.6.6

## 1.6.5

## 1.6.4

## 1.6.3

## 1.6.2

## 1.6.1

## 1.6.0

## 1.5.1

### Patch Changes

- 822bae8e: Add support for upgrade/downgrade of outputs

## 1.5.0

## 1.4.0

## 1.3.28

## 1.3.27

## 1.3.26

### Patch Changes

- 7d68c88e: block data class

## 0.0.1

### Patch Changes

- 75bbb180: Add myst-migrate package
