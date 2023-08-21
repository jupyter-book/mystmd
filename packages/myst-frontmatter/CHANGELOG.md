# myst-frontmatter

## 1.1.4

## 1.1.3

### Patch Changes

- 6655c90: Update generated affiliation ids to not use crypto

## 1.1.2

### Patch Changes

- 2696fada: Add rich affiliations to frontmatter
- d873b941: Upgrade credit-roles for alias support (writing, editing, review, administration, etc.)

## 1.1.1

### Patch Changes

- 8f687eba: Allow thumbnail to be set on project or site

## 1.1.0

### Minor Changes

- 44ff6917: Rearrange package imports and fix versions

### Patch Changes

- 44ff6917: Add jupyter alias in frontmatter for thebe
- Updates to internal dependencies

## 1.0.4

### Patch Changes

- ed0d571d: Add banner and bannerOptimized

## 1.0.3

### Patch Changes

- 18c513bb: Improve MECA export structure and contents for validation with meca js library

## 1.0.2

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- Updated dependencies [b0a2a34b]
  - simple-validators@1.0.1

## 1.0.1

### Patch Changes

- 2c19d72c: Update licenses to most recent spdx licenses
- 3b32538b: Add frontmatter for requirements and resources.

## 0.0.14

### Patch Changes

- 97518ca3: Add collaborations list to myst-frontmatter
- f97d4d50: Add abbreviation frontmatter option to add abbreviations automatically to documents.

## 0.0.13

### Patch Changes

- 8b1f65d9: Update thebe frontmatter options

## 0.0.12

### Patch Changes

- caf45cd1: Add article/sub_articles to export frontmatter

## 0.0.11

### Patch Changes

- 039a49a3: Added a frontmatter field to hold `thebe` options, this includes a numebr of top level keys and nested options.

## 0.0.10

### Patch Changes

- c832b38e: myst-cli may now be used to build JATS xml exports
- c832b38e: FootnoteDefinitions remain on the mdast tree during processing

## 0.0.9

### Patch Changes

- ccd1d5ee: Update license list from https://spdx.org

## 0.0.8

### Patch Changes

- 9f9954d2: Validate short_title and subtitle on site and project

## 0.0.7

### Patch Changes

- e1a2407f: Allow strings in each export

## 0.0.6

### Patch Changes

- c27a0587: Validate cc-by in licenses
- 3769a662: Validate keywords if given as a CSV string
- 5436ab41: Add export to an alias of exports
- 0aff6dc1: Expose short_title on the project pages and allow subtitle on project as well as pages
- 5436ab41: Add validateExportsList for more shared utilities
- 8b779cf7: Allow the export to be a single string of an export format
- 770bb8da: Improve author and affiliation parsing

## 0.0.5

### Patch Changes

- bfd72456: Validate orcid using the `orcid` package
- 0a87866d: Rely on `credit-roles` package for CRediT role validation
- 6ebaffda: Allow author and authors in frontmatter, also allow them to be strings.
- Updated dependencies [0fa33b10]
  - simple-validators@0.0.3

## 0.0.4

### Patch Changes

- 5403b5b5: Modify site frontmatter/config for templating - remove some fields, allow arbitrary template options, do not inherit from site frontmatter on page/project
- 11ff02b4: Update doi-utils to 1.0.9

## 0.0.3

### Patch Changes

- 184ad9f9: Move to https://github.com/executablebooks/mystmd
- 615c1441: Sessions are now aware of their build path (making things more consistent)
  For example, change the template location to the site working directory.

  Word templates now use the myst cli, and jtex

- Updated dependencies [184ad9f9]
  - simple-validators@0.0.2
