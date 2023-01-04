# myst-frontmatter

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
