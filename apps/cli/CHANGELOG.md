# curvenote

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
