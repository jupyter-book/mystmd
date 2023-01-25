# myst-cli

## 0.1.7

### Patch Changes

- 9692b9dc: The `myst init` command currently triggers on any command, this now errors and shows help!
- 6da5544f: Update figure/image nodes to embed images if given a target instead of a file path / url
- 6da5544f: Embed block content (including notebook cells) based on block or code cell label in metadata
- 6da5544f: Fix inline DOIs to update references in tex/pdf export
- Updated dependencies [a1a4bd82]
- Updated dependencies [6da5544f]
- Updated dependencies [a1a4bd82]
- Updated dependencies [e1a2407f]
  - jtex@0.1.5
  - myst-transforms@0.0.15
  - myst-frontmatter@0.0.7
  - myst-config@0.0.8
  - myst-templates@0.1.5
  - myst-to-docx@0.0.7
  - myst-to-tex@0.0.12
  - tex-to-myst@0.0.12

## 0.1.6

### Patch Changes

- 8aa3b42b: Improve warning formatting and information capture for errors
- 1d823ca7: Remove dependence on @curvenote/blocks, migrate to nbtx 0.2.0
- a8a93ccb: Catch and mute additional spurious warnings in remix
- 90027bc0: Improve the ability of start function to recover from errors of changing or deleting files
- 89673078: Add timing information to word and latex exports
- 0aff6dc1: Expose short_title on the project pages and allow subtitle on project as well as pages
- 690626b0: Export a single file by default do everything!
- 32f0fb5b: Improve logging for exports when nothing is found
- 09f250a0: Allow myst init to be run simply by typing myst
- 61aa0d60: Pass in the hashing function to minifying notebooks
- 61aa0d60: Remove dependence on `crypto` package, which is built into node
- f40f398b: Move template listing to myst rather than jtex
  Be more explicit about looking for other templates, and allow template listing from local files.
- af6f3190: Add a `myst build --all` option
- ebb8aa2d: Improved error reporting for --write-toc
- 43f1553c: Improve onboarding of myst init
- Updated dependencies [61aa0d60]
- Updated dependencies [c27a0587]
- Updated dependencies [21af5ba9]
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
- Updated dependencies [160e954f]
- Updated dependencies [770bb8da]
- Updated dependencies [f40f398b]
  - myst-to-docx@0.0.6
  - myst-frontmatter@0.0.6
  - jtex@0.1.4
  - myst-templates@0.1.4
  - myst-cli-utils@0.0.10
  - myst-config@0.0.7
  - myst-transforms@0.0.14
  - myst-to-tex@0.0.11
  - tex-to-myst@0.0.11

## 0.1.5

### Patch Changes

- Updated dependencies [27388448]
- Updated dependencies [c97bb569]
- Updated dependencies [8cdb5842]
  - myst-common@0.0.12
  - myst-to-docx@0.0.5
  - myst-to-tex@0.0.10
  - myst-transforms@0.0.13
  - jtex@0.1.3
  - myst-templates@0.1.3
  - tex-to-myst@0.0.10

## 0.1.4

### Patch Changes

- 3178dcda: Improve performance using cached mdast based on file hash
- 3178dcda: Look to known image extensions if the extension is not specified.
- 3178dcda: Add known bibtex files if they are explicitly specified.
- Updated dependencies [bfd72456]
- Updated dependencies [e7330dbb]
- Updated dependencies [8b545a0b]
- Updated dependencies [a79a78c4]
- Updated dependencies [0fa33b10]
- Updated dependencies [0a87866d]
- Updated dependencies [6ebaffda]
- Updated dependencies [e7330dbb]
- Updated dependencies [0e38fe7b]
- Updated dependencies [a5daa0d6]
  - myst-frontmatter@0.0.5
  - myst-common@0.0.11
  - tex-to-myst@0.0.2
  - simple-validators@0.0.3
  - myst-transforms@0.0.12
  - myst-cli-utils@0.0.9
  - jtex@0.1.2
  - myst-config@0.0.6
  - myst-templates@0.1.2
  - intersphinx@0.0.7

## 0.1.3

### Patch Changes

- Update jtex dependency

## 0.1.2

### Patch Changes

- ececeab6: Add option to throw error, rather than just log error, when exports fail
- ececeab6: Move template enums from myst-templates to myst-common
- Updated dependencies [4d41ccc3]
- Updated dependencies [ececeab6]
- Updated dependencies [ececeab6]
  - myst-config@0.0.5
  - myst-common@0.0.10
  - myst-templates@0.1.1
  - myst-to-tex@0.0.9

## 0.1.1

### Patch Changes

- 4e27734b: Default template may be passed directly to site build/start commands
- 4e27734b: Citations, Footnotes, and References type consolidated to myst-common
- Updated dependencies [4e27734b]
  - myst-common@0.0.9
  - myst-transforms@0.0.11

## 0.1.0

### Minor Changes

- d9b7457d: myst-cli now lets you initialize, build, and run myst sites locally

### Patch Changes

- 5403b5b5: Modify site frontmatter/config for templating - remove some fields, allow arbitrary template options, do not inherit from site frontmatter on page/project
- 48ae3284: Support basic callout admonitions that use the QMD format (e.g. `{.callout-tip}`). More to come in the future!
- e37dca1d: Add site build/start to myst-cli
- 11ff02b4: Update doi-utils to 1.0.9
- Updated dependencies [6439be3b]
- Updated dependencies [5403b5b5]
- Updated dependencies [5403b5b5]
- Updated dependencies [d9b7457d]
- Updated dependencies [adb6e7fa]
- Updated dependencies [4e1abca3]
- Updated dependencies [11ff02b4]
  - myst-to-tex@0.0.8
  - myst-config@0.0.4
  - myst-frontmatter@0.0.4
  - jtex@0.1.0
  - myst-templates@0.1.0
  - myst-transforms@0.0.10
  - myst-cli-utils@0.0.8
  - myst-common@0.0.8
  - intersphinx@0.0.6

## 0.0.9

### Patch Changes

- Fix modules type that picked up a bad tsconfig

## 0.0.8

### Patch Changes

- 8cb44548: Move isUrl utility to myst-cli-utils
- Updated dependencies [97a888c0]
- Updated dependencies [a6a03837]
- Updated dependencies [8cb44548]
  - myst-common@0.0.7
  - jtex@0.0.8
  - intersphinx@0.0.5
  - myst-cli-utils@0.0.7

## 0.0.7

### Patch Changes

- f3247103: Allow specifying valid imageExtensions to transformMdast
- 44c508bb: Bug fix: await docx export write to file
- f0db164a: Transform svg/gif images to png if imagemagick or inkscape are available
- Updated dependencies [fced5986]
- Updated dependencies [73db6da8]
- Updated dependencies [0170a2cc]
- Updated dependencies [3baa63eb]
- Updated dependencies [fced5986]
  - myst-to-docx@0.0.4
  - myst-transforms@0.0.9
  - myst-common@0.0.6
  - mystjs@0.0.15

## 0.0.6

### Patch Changes

- 17daf15e: Introduce GithubTransformer for file links.
- 88666aee: Deprecate unified exports from `mystjs`
- 184ad9f9: Move to https://github.com/executablebooks/mystjs
- cfb1307b: Relative paths in config should be '.' not ''
- 615c1441: Sessions are now aware of their build path (making things more consistent)
  For example, change the template location to the site working directory.

  Word templates now use the myst cli, and jtex

- e6917c63: Bug fix: await docx export write to file
- Updated dependencies [17daf15e]
- Updated dependencies [88666aee]
- Updated dependencies [a9110bff]
- Updated dependencies [184ad9f9]
- Updated dependencies [a9110bff]
- Updated dependencies [615c1441]
- Updated dependencies [615c1441]
- Updated dependencies [a9110bff]
- Updated dependencies [0b2298fd]
- Updated dependencies [e3c5f93b]
- Updated dependencies [3fba7cb7]
  - myst-transforms@0.0.8
  - mystjs@0.0.14
  - citation-js-utils@0.0.11
  - intersphinx@0.0.4
  - jtex@0.0.7
  - myst-cli-utils@0.0.6
  - myst-common@0.0.5
  - myst-config@0.0.3
  - myst-frontmatter@0.0.3
  - myst-templates@0.0.3
  - myst-to-docx@0.0.3
  - myst-to-tex@0.0.7
  - simple-validators@0.0.2

## 0.0.5

### Patch Changes

Initial release of actual cli, including some docs!

- 0e3a511: Move @curvenote/nbtx --> nbtx
- Updated dependencies [0e3a511]
  - nbtx@0.1.12

## 0.0.4

### Patch Changes

- Updated dependencies [68d411e]
  - @curvenote/site-common@0.0.18

## 0.0.3

### Patch Changes

- Updated dependencies
  - @curvenote/site-common@0.0.17

## 0.0.2

### Patch Changes

- e3a2d05: Split standalone myst cli out of curvenote cli
- Updated dependencies [a662904]
- Updated dependencies [dbb283c]
- Updated dependencies [e3a2d05]
- Updated dependencies [9c2be36]
- Updated dependencies [de034db]
- Updated dependencies [e3a2d05]
- Updated dependencies [c9889c0]
  - myst-to-tex@0.0.6
  - jtex@0.0.6
  - @curvenote/blocks@1.5.16
  - myst-config@0.0.2
  - @curvenote/site-common@0.0.16
  - myst-cli-utils@0.0.5
  - intersphinx@0.0.3
