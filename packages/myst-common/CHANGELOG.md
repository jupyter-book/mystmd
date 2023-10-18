# myst-common

## 1.1.10

## 1.1.9

### Patch Changes

- 6d0e4e3f: Add option to remove part data when extracting parts from a document.
- 6d0e4e3f: Allow for multiple parts to be specified in extraction
- 8b7b5fe6: Update dependencies

## 1.1.8

### Patch Changes

- e846cf4: Add support for abbreviations in LaTeX (acronyms)

## 1.1.7

### Patch Changes

- d35e02bc: Export `BodyDefinition` and `OptionDefinition`.
- b74fb3c1: Add ruleId to file warnings in redux store
- ed7b430f: Allow alias field for directive options.
- 239ae762: Add `pluginLoads` ruleId
- b74fb3c1: Add ruleIds to all errors/warnings across myst-cli
- 86c78957: Add MySTPlugin to common exported types
- d35e02bc: Only allow `alias` to be a string list, which simplifies the downstream implementations
- d35e02bc: Allow for `ParseTypesEnum` to also be a `Number`, `String` or `Boolean` object or `"myst"` for parsed content.
- 99659250: Added support for glossaries and TEX/PDF export. Now it is possible to render glossaries in TeX and PDF documents.

## 1.1.6

## 1.1.5

### Patch Changes

- 7752cb70: Bump dependency versions

## 1.1.4

## 1.1.3

## 1.1.2

### Patch Changes

- 24c0aae7: Move from Root in mdast to `GenericParent` to relax types

## 1.1.1

### Patch Changes

- ac650f5d: Extract tagged parts

## 1.1.0

### Minor Changes

- 44ff6917: Rearrange package imports and fix versions

### Patch Changes

- Updates to internal dependencies

## 1.0.4

### Patch Changes

- 7b72b097: New Embed and Container node type in myst-spec-ext

## 1.0.3

### Patch Changes

- 4df753a9: Add title and short_title to source dependency

## 1.0.2

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd

## 1.0.1

### Patch Changes

- Add slug to Dependency type

## 0.0.17

### Patch Changes

- 79e24fd7: Add NotebookCell

## 0.0.16

### Patch Changes

- d28b5e9d: Move KINDS --> SourceFileKind and move to myst-common

## 0.0.15

### Patch Changes

- c832b38e: FootnoteDefinitions remain on the mdast tree during processing

## 0.0.14

### Patch Changes

- 9105d991: Undefined children still have a key defined. Delete the children if they are null-ish.

## 0.0.13

### Patch Changes

- Add ParseTypesEnum to myst-common

## 0.0.12

### Patch Changes

- 27388448: Update packages to unstarred versions

## 0.0.11

### Patch Changes

- e7330dbb: Add mergeTextNodes as a utility to myst-common

## 0.0.10

### Patch Changes

- ececeab6: Move template enums from myst-templates to myst-common

## 0.0.9

### Patch Changes

- 4e27734b: Citations, Footnotes, and References type consolidated to myst-common

## 0.0.8

### Patch Changes

- 11ff02b4: Update doi-utils to 1.0.9

## 0.0.7

### Patch Changes

- 97a888c0: Allow toText to take a null

## 0.0.6

### Patch Changes

- 73db6da8: Add GenericNode and GenericParent

## 0.0.5

### Patch Changes

- 184ad9f9: Move to https://github.com/executablebooks/mystmd
- 3fba7cb7: Modify extractPart to no longer support tags

## 0.0.4

### Patch Changes

- Added extractPart utilities.

## 0.0.3

### Patch Changes

- The package myst-utils was renamed to myst-common, we missed registering this by 7 hours. Super annoying, but it needs a bump across all packages.

## 0.0.2

### Patch Changes

- 2b85858: Html ID now strips starting and ending `-`s
