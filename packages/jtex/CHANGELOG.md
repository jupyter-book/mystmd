# jtex

## 0.1.0

### Minor Changes

- d9b7457d: Myst template download, validation, preparation is now part of myst-templates; jtex only handles the tex rendering on top of myst-templates

### Patch Changes

- 5403b5b5: Jtex may now clone templates in addition to download/unzip
- Updated dependencies [5403b5b5]
- Updated dependencies [d9b7457d]
- Updated dependencies [4e1abca3]
- Updated dependencies [11ff02b4]
  - myst-frontmatter@0.0.4
  - myst-templates@0.1.0
  - myst-cli-utils@0.0.8

## 0.0.8

### Patch Changes

- a6a03837: Allow nested files in template.yml
- Updated dependencies [8cb44548]
  - myst-cli-utils@0.0.7

## 0.0.7

### Patch Changes

- 184ad9f9: Move to https://github.com/executablebooks/mystjs
- 615c1441: Jtex can now be used to pre-render word templates
- 615c1441: Sessions are now aware of their build path (making things more consistent)
  For example, change the template location to the site working directory.

  Word templates now use the myst cli, and jtex

- e3c5f93b: Incorrect session URL used in jtex
- Updated dependencies [184ad9f9]
- Updated dependencies [615c1441]
  - myst-cli-utils@0.0.6
  - myst-frontmatter@0.0.3
  - myst-templates@0.0.3
  - simple-validators@0.0.2

## 0.0.6

### Patch Changes

- dbb283c: Improve warnings when checking, and only show the warnings that still remain when `--fix`.
- de034db: Remove curvenote.def to be written by default
- e3a2d05: Consume latest myst-frontmatter
- Updated dependencies [9c2be36]
  - myst-cli-utils@0.0.5

## 0.0.5

### Patch Changes

- 6c2ea00: Improve the listing template to include parts and options

## 0.0.4

### Patch Changes

- 4d560d1: Export packages from myst-to-tex
- 4d560d1: Introduce jtex check --fix, that allows you to automatically add packagaes and doc options to a template.

## 0.0.3

### Patch Changes

- ff79e9f: Pass construct and pass bib file directly to jtex

## 0.0.2

### Patch Changes

- a431f10: All validated frontmatter fields are now copied to jtex renderer doc
