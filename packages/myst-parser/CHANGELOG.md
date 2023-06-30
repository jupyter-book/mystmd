# myst-parser

## 1.0.2

### Patch Changes

- Updated dependencies [438cdb28]
  - myst-roles@1.0.2
  - myst-directives@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies
  - myst-directives@1.0.1
  - myst-roles@1.0.1

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

### Patch Changes

- Updated dependencies [00c05fe9]
  - markdown-it-myst@1.0.0
  - myst-directives@1.0.0
  - myst-roles@1.0.0

## 0.0.32

### Patch Changes

- d068df65: Change unknown directive from warning to error
- 83200b5c: Change undefined role to error from warning
- Updated dependencies [69a450dd]
- Updated dependencies [de66ba19]
  - myst-directives@0.0.32
  - myst-roles@0.0.32

## 0.0.31

### Patch Changes

- myst-roles@0.0.31
- myst-directives@0.0.31

## 0.0.30

### Patch Changes

- Updated dependencies [837785a3]
  - myst-roles@0.0.30
  - myst-directives@0.0.30

## 0.0.29

### Patch Changes

- Updated dependencies [78b7232e]
  - myst-roles@0.0.29
  - myst-directives@0.0.29

## 0.0.28

### Patch Changes

- Updated dependencies [b9b2ac0b]
  - myst-directives@0.0.28
  - myst-roles@0.0.28

## 0.0.27

### Patch Changes

- 685bbe58: Add SI Units (see https://texdoc.org/serve/siunitx/0)
- ff43d9c9: Remove identifier from embed node
- Updated dependencies [79743342]
- Updated dependencies [685bbe58]
- Updated dependencies [ff43d9c9]
  - myst-roles@0.0.27
  - myst-directives@0.0.27

## 0.0.26

### Patch Changes

- myst-roles@0.0.26
- myst-directives@0.0.26

## 0.0.25

### Patch Changes

- myst-directives@0.0.25
- myst-roles@0.0.25

## 0.0.24

### Patch Changes

- myst-directives@0.0.24
- myst-roles@0.0.24

## 0.0.23

### Patch Changes

- 45ecdf86: Update readme example
- 45ecdf86: Improve parsing of tasklists for mdast
  - myst-directives@0.0.23
  - myst-roles@0.0.23

## 0.0.22

### Patch Changes

- Updated dependencies [833be5a9]
  - myst-directives@0.0.22
  - myst-roles@0.0.22

## 0.0.21

### Patch Changes

- Updated dependencies [9fcf25a9]
  - myst-roles@0.0.21
  - myst-directives@0.0.21

## 0.0.20

### Patch Changes

- myst-roles@0.0.20
- myst-directives@0.0.20

## 0.0.19

### Patch Changes

- 9105d991: Undefined children still have a key defined. Delete the children if they are null-ish.
- Updated dependencies [99948cc8]
  - markdown-it-myst@0.1.3
  - myst-directives@0.0.19
  - myst-roles@0.0.19

## 0.0.18

### Patch Changes

- Updated dependencies [9f8613ef]
- Updated dependencies [5f506356]
- Updated dependencies [8381c653]
- Updated dependencies [c1a8da90]
- Updated dependencies [d14bb127]
  - markdown-it-myst@0.1.2
  - myst-directives@0.0.18
  - myst-roles@0.0.18

## 0.0.17

### Patch Changes

- myst-directives@0.0.17
- myst-roles@0.0.17

## 0.0.16

### Patch Changes

- 844d29fb: Remove unist exports from myst-parser
- a22fafa0: Log parse errors with vfile
- ea89d8b2: Update admonition title to always be the argument.
- 75b6bcb8: Transform numbers into strings silently
- a22fafa0: Refactor role/directive implementations to allow declarative definitions. Pull all default roles/directives from mystjs and myst-cli into separate package with new implementation.
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a2a7044b]
  - markdown-it-myst@0.1.1
  - myst-directives@0.0.16
  - myst-roles@0.0.16

## 0.0.15

### Patch Changes

- fced5986: Deprecate GenericNode, GenericParent, and liftChildren -- these are now in myst-common.

## 0.0.14

### Patch Changes

- 88666aee: Deprecate unified exports from `mystjs`
- a9110bff: Add positions to nodes and update tests
- 184ad9f9: Move to https://github.com/executablebooks/mystmd
- a9110bff: Update line-number logic for code-block to come inline with sphinx
- a9110bff: Pass image height to image token if it exists
