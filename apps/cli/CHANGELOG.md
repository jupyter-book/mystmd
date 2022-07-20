# curvenote

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
