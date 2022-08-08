# curvenote

## 0.6.19

### Patch Changes

- 4b5a4c9: Fetch bibliography items from remote URLs
- 9423af0: Add a `--keep-host` option for curvenote serve and by default use localhost for the value of the HOST environment variable.

## 0.6.18

### Patch Changes

- 58adf87: Added consistent-type-imports eslint rule
- 9ae455e: Improve install of @cuvenote/blocks in the monorepo
- Updated dependencies [58adf87]
- Updated dependencies [9ae455e]
  - @curvenote/blocks@1.5.14
  - citation-js-utils@0.0.9

## 0.6.17

### Patch Changes

- e29e889: Add blocks to monorepo, improve linting for development in other monorepos
- 2b15752: Change NPM requirements for >=7 and remove crossenv
- Updated dependencies [e29e889]
  - @curvenote/blocks@1.5.13
  - citation-js-utils@0.0.8

## 0.6.16

### Patch Changes

- c3fe4b6: Catch citation errors from stopping the build
- 3182d24: Support PDF images in html
- 54f2c4d: SI Units and chemical formulas as basic extensions
- Updated dependencies [1544132]
  - citation-js-utils@0.0.7

## 0.6.15

### Patch Changes

- 87ff5a2: Respect hidden documents in the navigation when pulling or cloning

## 0.6.14

### Patch Changes

- e66b049: Print versions on errors
- da41124: Add `mbox` support for math renderers
- e66b049: Remove write-toc option from the start command
- 3d68483: Update to mystjs 0.0.13
- e66b049: Remove the debug file output option
- 56a4682: Update mystjs to support colon fences
- ae093f6: Move `curvenote build` to the main CLI service
- ee7b327: Support adding a title on relative links to files
- 5cf656c: Update language around curvespace --> website
- b6dcd75: Relative links in `--write-toc` option
- 068bea8: Pull content for a single document
- 40fe45d: Look up all bibtex files on the current tree
- 53b3bec: Introduce `strict` and `check-links` parameters for the build process that can stop the build
- 367b3d5: Allow CLI to run on node v12
- 322574d: Update links in readme and CRT contributor roles
- e66b049: Make the curvenote --branch flag require an argument

## 0.6.13

### Patch Changes

- d220c0d: Never return empty slugs when removing enumeration

## 0.6.12

### Patch Changes

- e048508: Include directive should return if file doesn't exist

## 0.6.11

### Patch Changes

- 01f73de: - `include` added as a directive
  - `tab-set` and `tab-item` added as directives
- fb1364b: Recognize GitHub urls for images
- bc337d0: Added a MyST Demo Component
- b91c836: WebP translation is now only called on png, jpg, jpeg, tiff, or gif

## 0.6.10

### Patch Changes

- 0568d3b: Clone recursively when using locally.

## 0.6.9

### Patch Changes

- Fix bug for including fetch for downloading notebooks
- 801f7c7: Improve logging messages for errors in debug mode.

## 0.6.8

### Patch Changes

- c7830a4: Improve CI logging

## 0.6.7

### Patch Changes

- 53458c6: Logo can be missing for deploy

## 0.6.6

### Patch Changes

- e55abd4: The `curvenote clone` option can now take a -y flag to take the default path.
- 79707eb: Allow the logo to fail to exist, without stopping the site build
- 8ed82ad: Improve clone function to use remote config
- 0a1509c: Add remote site config to list of models that can be fetched from the curvenote API
- 1b23694: Update typescript and @curvenote/blocks
- 3fe1207: Allow project lookup with `@team/name` in addition to links
- Updated dependencies [0a1509c]
- Updated dependencies [1b23694]
  - @curvenote/blocks@1.5.9
  - citation-js-utils@0.0.6

## 0.6.5

### Patch Changes

- e3dcb6e: Replace a process.exit(1) with error in exported function outside CLI

## 0.6.4

### Patch Changes

- 444743f: Update the build to use `esbuild` as well as move all files to `ts` (no `xml` or `json`).

## 0.6.3

### Patch Changes

- c02461d: Expose `thumbnailOptimized` on the config passed to the renderer
- c02461d: Improve teh error message for image writing in thumbnails and normal images
- 3607491: Add alt text to images based on figure captions

## 0.6.2

### Patch Changes

- 40cf170: Deploy functions were split into two functions (#275)
- d89a0d8: `sourceUrl` has been renamed to `urlSource` for consistency with `urlOptimized`, this is backwards compatible.

## 0.6.1

### Patch Changes

- e00c445: Update images for npm publish, and improve terminology.
- 45e7cb6: Introduce `thumbnailOptimized` using webp and create images that have a srcset in the web output.

## 0.6.0

### Minor Changes

- 5655b82: Moved to packaging the CLI as a bundle and curve.space served as a monorepo.
