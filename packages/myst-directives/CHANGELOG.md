# myst-directives

## 1.0.13

### Patch Changes

- 4534f995: Add table directive
- 4534f995: Add directive/role nodes to the DirectiveData and RoleData.
- 4534f995: Improve error messages for directive/role options
- Updated dependencies [4534f995]
  - myst-common@1.1.12
  - myst-spec-ext@1.1.12

## 1.0.12

## 1.0.11

### Patch Changes

- 93b73d2: Add `full-width` to figure and table directives

## 1.0.10

### Patch Changes

- Updated dependencies [6d0e4e3f]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [8b7b5fe6]
  - myst-common@1.1.9
  - myst-spec-ext@1.1.9

## 1.0.9

## 1.0.8

### Patch Changes

- ed7b430f: Allow alias field for directive options.
- 392ba779: Move includeDirective transform to myst-transforms and make it generic for use in JupyterLab
- d35e02bc: Move from ParseTypesEnum to String/Number/Boolean in many cases.
- 392ba779: Remove the codeBlockDirective, this is now the same as the `codeDirective`.
- b74fb3c1: Add ruleIds to all errors/warnings across myst-cli
- ed7b430f: All instances of `name` options in directives can also use `label`. (e.g. in a figure or equation).
- 392ba779: Add `literalinclude` directive
- 4183c05c: Document images and figure and iframe directives
- 60cf9a53: Add filename to codeblock and include directives
- d35e02bc: Improve documentation for admonition and include
- Updated dependencies [d35e02bc]
- Updated dependencies [b74fb3c1]
- Updated dependencies [ed7b430f]
- Updated dependencies [4183c05c]
- Updated dependencies [392ba779]
- Updated dependencies [757f1fe4]
- Updated dependencies [239ae762]
- Updated dependencies [b74fb3c1]
- Updated dependencies [86c78957]
- Updated dependencies [60cf9a53]
- Updated dependencies [d35e02bc]
- Updated dependencies [d35e02bc]
- Updated dependencies [99659250]
  - myst-common@1.1.7
  - myst-spec-ext@1.1.7

## 1.0.7

### Patch Changes

- 7752cb70: Bump dependency versions
- Updated dependencies [7752cb70]
  - myst-common@1.1.5
  - myst-spec-ext@1.1.5

## 1.0.6

### Patch Changes

- Updated dependencies [24c0aae7]
  - myst-common@1.1.2
  - myst-spec-ext@1.1.2

## 1.0.5

### Patch Changes

- Updates to internal dependencies
- Updated dependencies [44ff6917]
- Updated dependencies
  - myst-common@1.1.0
  - myst-spec-ext@1.1.0

## 1.0.4

### Patch Changes

- 7b72b097: Embed directive takes label target as arg not option
- f44ee18d: Add caption to iframe
- 7b72b097: Figure directive takes remove-output/input options for notebook figures
- 7b72b097: Add placeholder to figure directive options and image node spec
- 7b72b097: New Embed and Container node type in myst-spec-ext
- Updated dependencies [7b72b097]
- Updated dependencies [7b72b097]
- Updated dependencies [f44ee18d]
  - myst-spec-ext@1.0.3
  - myst-common@1.0.4

## 1.0.3

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- Updated dependencies [b0a2a34b]
  - myst-spec-ext@1.0.2
  - myst-common@1.0.2

## 1.0.2

## 1.0.1

### Patch Changes

- Previous version on npm

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

### Patch Changes

- Updated dependencies [00c05fe9]
  - myst-spec-ext@1.0.0

## 0.0.32

### Patch Changes

- 69a450dd: Allow for multiple images to be included in a single figure directive
- de66ba19: Add glossary and term directives

## 0.0.31

## 0.0.30

## 0.0.29

### Patch Changes

- Updated dependencies [79e24fd7]
- Updated dependencies [b2ac9d13]
  - myst-common@0.0.17
  - myst-spec-ext@0.0.12

## 0.0.28

### Patch Changes

- b9b2ac0b: Update types for directives

## 0.0.27

### Patch Changes

- ff43d9c9: Remove identifier from embed node
- Updated dependencies [79743342]
- Updated dependencies [685bbe58]
- Updated dependencies [3da85094]
  - myst-spec-ext@0.0.11

## 0.0.26

## 0.0.25

### Patch Changes

- Updated dependencies [d28b5e9d]
  - myst-common@0.0.16

## 0.0.24

### Patch Changes

- Updated dependencies [0ab667e5]
- Updated dependencies [c832b38e]
  - myst-spec-ext@0.0.10
  - myst-common@0.0.15

## 0.0.23

### Patch Changes

- Updated dependencies [45ecdf86]
  - myst-spec-ext@0.0.9

## 0.0.22

### Patch Changes

- 833be5a9: Initial support for myst notebooks
- Updated dependencies [833be5a9]
  - myst-spec-ext@0.0.8

## 0.0.21

### Patch Changes

- Updated dependencies [9fcf25a9]
  - myst-spec-ext@0.0.7

## 0.0.20

## 0.0.19

### Patch Changes

- Updated dependencies [9105d991]
  - myst-common@0.0.14

## 0.0.18

### Patch Changes

- 8381c653: Allow admonitions to hide the icon
- c1a8da90: Capture image alignment in figures
- Updated dependencies [e443ad2a]
  - myst-spec-ext@0.0.6

## 0.0.17

### Patch Changes

- Updated dependencies
  - myst-common@0.0.13

## 0.0.16

### Patch Changes

- a22fafa0: Refactor role/directive implementations to allow declarative definitions. Pull all default roles/directives from mystjs and myst-cli into separate package with new implementation.
- a2a7044b: Deprecate codeBlockPlugin for the caption parsing, which now happens in myst-parser and myst-directives
- Updated dependencies [987c1053]
  - myst-spec-ext@0.0.5
