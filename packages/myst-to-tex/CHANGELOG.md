# myst-to-tex

## 0.0.28

### Patch Changes

- e530b082: Add classes to control code latex output for listing and minted environments
- Updated dependencies [97518ca3]
- Updated dependencies [f97d4d50]
  - myst-frontmatter@0.0.14

## 0.0.27

### Patch Changes

- 330c0f08: Add check to include any recursive commands within plugins in LaTeX

## 0.0.26

### Patch Changes

- Updated dependencies [79e24fd7]
- Updated dependencies [b2ac9d13]
  - myst-common@0.0.17
  - myst-spec-ext@0.0.12

## 0.0.25

### Patch Changes

- 685bbe58: Add SI Units (see https://texdoc.org/serve/siunitx/0)
- ff43d9c9: Remove {name} template from getting printed into single article exports
- Updated dependencies [8b1f65d9]
- Updated dependencies [79743342]
- Updated dependencies [685bbe58]
- Updated dependencies [3da85094]
  - myst-frontmatter@0.0.13
  - myst-spec-ext@0.0.11

## 0.0.24

### Patch Changes

- Updated dependencies [caf45cd1]
  - myst-frontmatter@0.0.12

## 0.0.23

### Patch Changes

- Updated dependencies [039a49a3]
- Updated dependencies [d28b5e9d]
  - myst-frontmatter@0.0.11
  - myst-common@0.0.16

## 0.0.22

### Patch Changes

- 98c47422: Fix bug where empty comment errors on myst-to-tex
- d6d41e51: Copyright symbol must have trailing whitespace, see https://texfaq.org/FAQ-xspace
- c832b38e: FootnoteDefinitions remain on the mdast tree during processing
- Updated dependencies [c832b38e]
- Updated dependencies [0ab667e5]
- Updated dependencies [c832b38e]
  - myst-frontmatter@0.0.10
  - myst-spec-ext@0.0.10
  - myst-common@0.0.15

## 0.0.21

### Patch Changes

- 762baee5: Use \newline instead of \\ for breaks in latex export
- 5a81cd36: Use non-normalized label for latex figure
- 44026903: Escape basic characters in latex href

## 0.0.20

### Patch Changes

- 3abbec6e: Improve footnote whitespace and warnings in myst-to-tex
- 55d64468: Assume enumerated is default true for "star" check in myst-to-tex

## 0.0.19

### Patch Changes

- a353dba6: Support myst 'comment' node in docx/html/jats
- 0859b295: Implement footnotes in myst-to-tex
- 8747eecd: Convert myst 'comment' nodes to latex

## 0.0.18

### Patch Changes

- Updated dependencies [ccd1d5ee]
  - myst-frontmatter@0.0.9

## 0.0.17

### Patch Changes

- Updated dependencies [9105d991]
  - myst-common@0.0.14

## 0.0.16

### Patch Changes

- Updated dependencies
  - myst-common@0.0.13

## 0.0.15

### Patch Changes

- Updated dependencies [9f9954d2]
  - myst-frontmatter@0.0.8

## 0.0.14

### Patch Changes

- 93fcaf3a: Support include node in myst-to-docx and myst-to-tex

## 0.0.13

### Patch Changes

- 2f268d18: Embeded content from other pages resolves on single page PDF/docx export

## 0.0.12

### Patch Changes

- Updated dependencies [e1a2407f]
  - myst-frontmatter@0.0.7

## 0.0.11

### Patch Changes

- Updated dependencies [c27a0587]
- Updated dependencies [3769a662]
- Updated dependencies [5436ab41]
- Updated dependencies [0aff6dc1]
- Updated dependencies [5436ab41]
- Updated dependencies [8b779cf7]
- Updated dependencies [770bb8da]
  - myst-frontmatter@0.0.6

## 0.0.10

### Patch Changes

- 27388448: Update packages to unstarred versions
- 8cdb5842: Capture the `framed` environment when creating admonitions
- Updated dependencies [27388448]
  - myst-common@0.0.12

## 0.0.9

### Patch Changes

- ececeab6: Fix bug when table row has no content
- Updated dependencies [ececeab6]
  - myst-common@0.0.10

## 0.0.8

### Patch Changes

- 6439be3b: Add additional export conversions (`&nbsp;` and `\$\times# myst-to-tex) to myst-to-tex
- Updated dependencies [5403b5b5]
- Updated dependencies [11ff02b4]
  - myst-frontmatter@0.0.4
  - myst-common@0.0.8

## 0.0.7

### Patch Changes

- 184ad9f9: Move to https://github.com/executablebooks/mystjs
- Updated dependencies [184ad9f9]
- Updated dependencies [615c1441]
- Updated dependencies [3fba7cb7]
  - myst-common@0.0.5
  - myst-frontmatter@0.0.3

## 0.0.6

### Patch Changes

- a662904: Add definition lists to latex

## 0.0.5

### Patch Changes

- 4d560d1: Export packages from myst-to-tex

## 0.0.4

### Patch Changes

- The package myst-utils was renamed to myst-common, we missed registering this by 7 hours. Super annoying, but it needs a bump across all packages.
- Updated dependencies
  - myst-common@0.0.3

## 0.0.3

### Patch Changes

- edf10cd: Handle breaks in latex
- Updated dependencies [2b85858]
  - myst-common@0.0.2

## 0.0.2

### Patch Changes

- b63638b: Handle equation environment duplicates

## 0.0.1

### Patch Changes

- f048f5a: Initial working latex converter
