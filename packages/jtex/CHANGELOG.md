# jtex

## 1.0.6

### Patch Changes

- 7752cb70: Bump dependency versions
- Updated dependencies [ba0441a0]
  - myst-frontmatter@1.1.5

## 1.0.5

### Patch Changes

- 18f30dd: Update the shape of affiliations in myst-template doc
- Updated dependencies [18f30dd]
  - myst-templates@1.0.8

## 1.0.4

### Patch Changes

- Updates to internal dependencies
- Updated dependencies [44ff6917]
- Updated dependencies [44ff6917]
- Updated dependencies
  - myst-frontmatter@1.1.0
  - myst-cli-utils@2.0.3
  - myst-templates@1.0.5

## 1.0.3

### Patch Changes

- 016c55e7: Use adm-zip to unzip templates, not unzipper
- Updated dependencies [016c55e7]
- Updated dependencies [016c55e7]
  - myst-templates@1.0.3

## 1.0.2

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- Updated dependencies [b0a2a34b]
  - simple-validators@1.0.1
  - myst-frontmatter@1.0.2
  - myst-cli-utils@2.0.1
  - myst-templates@1.0.2

## 1.0.1

### Patch Changes

- 0410d194: Move from myst-tools.org --> mystmd.org
- Updated dependencies [2c19d72c]
- Updated dependencies [3b32538b]
- Updated dependencies [0410d194]
  - myst-frontmatter@1.0.1
  - myst-templates@1.0.1

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

### Patch Changes

- Updated dependencies [00c05fe9]
  - myst-cli-utils@2.0.0
  - myst-templates@1.0.0

## 0.1.15

### Patch Changes

- Updated dependencies [97518ca3]
- Updated dependencies [f97d4d50]
  - myst-frontmatter@0.0.14
  - myst-templates@0.1.18

## 0.1.14

### Patch Changes

- Updated dependencies [7dacd1f0]
  - myst-cli-utils@0.0.12
  - myst-templates@0.1.16

## 0.1.13

### Patch Changes

- Updated dependencies [8b1f65d9]
  - myst-frontmatter@0.0.13
  - myst-templates@0.1.15

## 0.1.12

### Patch Changes

- Updated dependencies [caf45cd1]
  - myst-frontmatter@0.0.12
  - myst-templates@0.1.14

## 0.1.11

### Patch Changes

- Updated dependencies [039a49a3]
  - myst-frontmatter@0.0.11
  - myst-templates@0.1.13

## 0.1.10

### Patch Changes

- Updated dependencies [c832b38e]
- Updated dependencies [c832b38e]
  - myst-frontmatter@0.0.10
  - myst-templates@0.1.12

## 0.1.9

### Patch Changes

- d12a6064: Support copying template files during export and writing relative paths; myst-cli uses this for tex exports
- 3f800fc2: Write only 'myst: v1' not 'jtex: v1' in template.tex on 'jtex check --fix'
- Updated dependencies [d12a6064]
- Updated dependencies [d12a6064]
  - myst-cli-utils@0.0.11
  - myst-templates@0.1.11

## 0.1.8

### Patch Changes

- c643fa8e: Update dependency
- Updated dependencies [ccd1d5ee]
  - myst-frontmatter@0.0.9
  - myst-templates@0.1.10

## 0.1.7

### Patch Changes

- 944ad031: Update myst.tools --> myst-tools.org
- Updated dependencies [944ad031]
  - myst-templates@0.1.7

## 0.1.6

### Patch Changes

- Updated dependencies [9f9954d2]
  - myst-frontmatter@0.0.8
  - myst-templates@0.1.6

## 0.1.5

### Patch Changes

- a1a4bd82: Allow version to be myst: v1
- a1a4bd82: Print YAML errors
- Updated dependencies [e1a2407f]
  - myst-frontmatter@0.0.7
  - myst-templates@0.1.5

## 0.1.4

### Patch Changes

- 21af5ba9: Typo of templates in package!
- 61aa0d60: Remove dependence on `crypto` package, which is built into node
- f40f398b: Move template listing to myst rather than jtex
  Be more explicit about looking for other templates, and allow template listing from local files.
- Updated dependencies [c27a0587]
- Updated dependencies [8508c5e8]
- Updated dependencies [3769a662]
- Updated dependencies [dfc27de6]
- Updated dependencies [5436ab41]
- Updated dependencies [c522e2c5]
- Updated dependencies [0aff6dc1]
- Updated dependencies [5436ab41]
- Updated dependencies [dfc27de6]
- Updated dependencies [8b779cf7]
- Updated dependencies [61aa0d60]
- Updated dependencies [8cb35191]
- Updated dependencies [770bb8da]
- Updated dependencies [f40f398b]
  - myst-frontmatter@0.0.6
  - myst-templates@0.1.4
  - myst-cli-utils@0.0.10

## 0.1.3

### Patch Changes

- c97bb569: Improve the shell output capture for windows
  - myst-templates@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [bfd72456]
- Updated dependencies [0fa33b10]
- Updated dependencies [0a87866d]
- Updated dependencies [6ebaffda]
- Updated dependencies [0e38fe7b]
  - myst-frontmatter@0.0.5
  - simple-validators@0.0.3
  - myst-cli-utils@0.0.9
  - myst-templates@0.1.2

## 0.1.1

### Patch Changes

- 0948131d: Update myst-templates to correct dependency

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

- 184ad9f9: Move to https://github.com/executablebooks/mystmd
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
