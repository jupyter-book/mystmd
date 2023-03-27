# myst-frontmatter

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

- 184ad9f9: Move to https://github.com/executablebooks/mystjs
- 615c1441: Sessions are now aware of their build path (making things more consistent)
  For example, change the template location to the site working directory.

  Word templates now use the myst cli, and jtex

- Updated dependencies [184ad9f9]
  - simple-validators@0.0.2
