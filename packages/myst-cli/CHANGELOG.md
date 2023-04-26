# myst-cli

## 0.1.25

### Patch Changes

- 01cdd78e: Allow output to be specified from the command line
- ff43d9c9: Fix crosslinked content for single file exports
- 79743342: Add inline evaluation role that pulls from user_expressions
- 84efceb6: Bug where we were not waiting for webp to be built, meaning large images!
- 01cdd78e: Have command line print jats rather than xml
- Updated dependencies [0c044516]
- Updated dependencies [8b1f65d9]
- Updated dependencies [79743342]
- Updated dependencies [fb0e9d7e]
- Updated dependencies [685bbe58]
- Updated dependencies [cb9c1f6a]
- Updated dependencies [da8abded]
- Updated dependencies [d3c120ee]
- Updated dependencies [ff43d9c9]
- Updated dependencies [09a34b20]
- Updated dependencies [3da85094]
- Updated dependencies [ff43d9c9]
- Updated dependencies [9a226245]
- Updated dependencies [da8abded]
  - myst-to-jats@0.0.25
  - myst-frontmatter@0.0.13
  - myst-spec-ext@0.0.11
  - myst-parser@0.0.27
  - myst-to-tex@0.0.25
  - tex-to-myst@0.0.25
  - myst-transforms@0.0.27
  - jtex@0.1.13
  - myst-config@0.0.14
  - myst-templates@0.1.15
  - myst-to-docx@0.0.22

## 0.1.24

### Patch Changes

- ac890599: Fix the types in myst-cli

## 0.1.23

### Patch Changes

- ea0c73b5: Add placeholder for end-to-end cli tests
- c7258e25: Consolidate export options logic and support multiple file exports
- Updated dependencies [a32e2aa2]
- Updated dependencies [caf45cd1]
  - myst-to-jats@0.0.24
  - myst-frontmatter@0.0.12
  - jtex@0.1.12
  - myst-config@0.0.13
  - myst-templates@0.1.14
  - myst-to-docx@0.0.21
  - myst-to-tex@0.0.24
  - tex-to-myst@0.0.24

## 0.1.22

### Patch Changes

- 2db5e057: Add p-limit to the dependencies
- Updated dependencies [3a42cd9e]
- Updated dependencies [8f502f5d]
  - myst-transforms@0.0.26
  - citation-js-utils@0.0.15
  - myst-to-jats@0.0.23
  - myst-parser@0.0.26

## 0.1.21

### Patch Changes

- 1670c49a: Do not publish local file paths to site json
- 624ea081: Add source url / key to embed nodes in mdast
- 5ba3b13f: Add bibliogrpahy from citations to JATS export backmatter
- d28b5e9d: Move KINDS --> SourceFileKind and move to myst-common
- Updated dependencies [c138efed]
- Updated dependencies [039a49a3]
- Updated dependencies [5ba3b13f]
- Updated dependencies [d28b5e9d]
- Updated dependencies [5ba3b13f]
  - myst-to-jats@0.0.22
  - myst-frontmatter@0.0.11
  - myst-common@0.0.16
  - citation-js-utils@0.0.14
  - jtex@0.1.11
  - myst-config@0.0.12
  - myst-templates@0.1.13
  - myst-to-docx@0.0.20
  - myst-to-tex@0.0.23
  - tex-to-myst@0.0.23
  - myst-ext-card@0.0.6
  - myst-ext-grid@0.0.6
  - myst-ext-reactive@0.0.6
  - myst-ext-tabs@0.0.6
  - myst-transforms@0.0.25
  - myst-parser@0.0.25

## 0.1.20

### Patch Changes

- c832b38e: myst-cli may now be used to build JATS xml exports
- c832b38e: FootnoteDefinitions remain on the mdast tree during processing
- 4619f158: Add prefix/suffix to inline citations
- Updated dependencies [8b76b444]
- Updated dependencies [c832b38e]
- Updated dependencies [98c47422]
- Updated dependencies [d6d41e51]
- Updated dependencies [e5fb426a]
- Updated dependencies [0ab667e5]
- Updated dependencies [c832b38e]
- Updated dependencies [c832b38e]
- Updated dependencies [265a8ed4]
  - citation-js-utils@0.0.13
  - myst-frontmatter@0.0.10
  - myst-to-tex@0.0.22
  - tex-to-myst@0.0.22
  - myst-spec-ext@0.0.10
  - myst-common@0.0.15
  - myst-transforms@0.0.24
  - myst-to-jats@0.0.21
  - jtex@0.1.10
  - myst-config@0.0.11
  - myst-templates@0.1.12
  - myst-to-docx@0.0.19
  - myst-ext-card@0.0.5
  - myst-ext-grid@0.0.5
  - myst-ext-reactive@0.0.5
  - myst-ext-tabs@0.0.5
  - myst-parser@0.0.24

## 0.1.19

### Patch Changes

- d12a6064: Move hash/copy file function from myst-cli to myst-cli-utils
- d12a6064: Support copying template files during export and writing relative paths; myst-cli uses this for tex exports
- 8e8d0fa9: Refactor image conversion transform for extensibility and code deduplication
- b383f68c: Resolve images with wildcard extensions to existing images
- Updated dependencies [d12a6064]
- Updated dependencies [762baee5]
- Updated dependencies [45ecdf86]
- Updated dependencies [45ecdf86]
- Updated dependencies [d12a6064]
- Updated dependencies [5a81cd36]
- Updated dependencies [44026903]
- Updated dependencies [3f800fc2]
- Updated dependencies [5fc02589]
  - myst-cli-utils@0.0.11
  - myst-to-tex@0.0.21
  - myst-parser@0.0.23
  - myst-spec-ext@0.0.9
  - jtex@0.1.9
  - myst-templates@0.1.11
  - myst-transforms@0.0.23
  - myst-to-docx@0.0.18
  - tex-to-myst@0.0.21

## 0.1.18

### Patch Changes

- 40beee4d: Prevent unwanted repeated site reload
- a965622a: Fix: project frontmatter is now respected with tex files
- Updated dependencies [3abbec6e]
- Updated dependencies [cf7b7004]
- Updated dependencies [78b30547]
- Updated dependencies [6713f432]
- Updated dependencies [6713f432]
- Updated dependencies [833be5a9]
- Updated dependencies [70519a00]
- Updated dependencies [826276dc]
- Updated dependencies [9cc49d1a]
- Updated dependencies [794fbc80]
- Updated dependencies [b4670ec4]
- Updated dependencies [55d64468]
- Updated dependencies [82b583ba]
  - myst-to-tex@0.0.20
  - tex-to-myst@0.0.20
  - myst-transforms@0.0.22
  - myst-spec-ext@0.0.8
  - citation-js-utils@0.0.12
  - myst-to-docx@0.0.17
  - myst-parser@0.0.22

## 0.1.17

### Patch Changes

- 9fcf25a9: Add citation nodes to myst-spec-ext
- 0859b295: Implement footnotes in myst-to-tex
- Updated dependencies [4da8eef5]
- Updated dependencies [452846eb]
- Updated dependencies [4da8eef5]
- Updated dependencies [4da8eef5]
- Updated dependencies [a353dba6]
- Updated dependencies [9fcf25a9]
- Updated dependencies [0859b295]
- Updated dependencies [efe55199]
- Updated dependencies [452846eb]
- Updated dependencies [8747eecd]
  - tex-to-myst@0.0.19
  - myst-to-docx@0.0.16
  - myst-to-tex@0.0.19
  - myst-spec-ext@0.0.7
  - myst-transforms@0.0.21
  - myst-parser@0.0.21

## 0.1.16

### Patch Changes

- Updated dependencies [f227a9e2]
- Updated dependencies [c643fa8e]
- Updated dependencies [f227a9e2]
- Updated dependencies [f227a9e2]
- Updated dependencies [7a78b7be]
- Updated dependencies [f227a9e2]
- Updated dependencies [ccd1d5ee]
  - myst-transforms@0.0.20
  - jtex@0.1.8
  - tex-to-myst@0.0.18
  - myst-frontmatter@0.0.9
  - myst-config@0.0.10
  - myst-templates@0.1.10
  - myst-to-docx@0.0.15
  - myst-to-tex@0.0.18
  - myst-parser@0.0.20

## 0.1.15

### Patch Changes

- a9913fc9: Update image conversion transform to handle EPS images
- Updated dependencies [9105d991]
  - myst-common@0.0.14
  - myst-parser@0.0.19
  - myst-ext-card@0.0.4
  - myst-ext-grid@0.0.4
  - myst-ext-reactive@0.0.4
  - myst-ext-tabs@0.0.4
  - myst-templates@0.1.9
  - myst-to-docx@0.0.14
  - myst-to-tex@0.0.17
  - myst-transforms@0.0.19
  - tex-to-myst@0.0.17

## 0.1.14

### Patch Changes

- 78bb237e: Support github-style admonitions, add the `simple` class
- 5f506356: Allow directives to have spaces, and trim the name before passing it onto other directives
- 8381c653: Allow admonitions to hide the icon
- Updated dependencies [78bb237e]
- Updated dependencies [a9f5bf70]
  - myst-transforms@0.0.18
  - myst-parser@0.0.18
  - myst-to-docx@0.0.13

## 0.1.13

### Patch Changes

- Updated dependencies
  - myst-common@0.0.13
  - myst-ext-card@0.0.3
  - myst-ext-grid@0.0.3
  - myst-ext-reactive@0.0.3
  - myst-ext-tabs@0.0.3
  - myst-templates@0.1.8
  - myst-to-docx@0.0.12
  - myst-to-tex@0.0.16
  - myst-transforms@0.0.17
  - tex-to-myst@0.0.16
  - myst-parser@0.0.17

## 0.1.12

### Patch Changes

- a22fafa0: Log parse errors with vfile
- 944ad031: Update myst.tools --> myst-tools.org
- ea89d8b2: Update admonition title to always be the argument.
- a22fafa0: Refactor role/directive implementations to allow declarative definitions. Pull all default roles/directives from mystjs and myst-cli into separate package with new implementation.
- a2a7044b: Deprecate codeBlockPlugin for the caption parsing, which now happens in myst-parser and myst-directives
- Updated dependencies [844d29fb]
- Updated dependencies [a22fafa0]
- Updated dependencies [944ad031]
- Updated dependencies [ea89d8b2]
- Updated dependencies [75b6bcb8]
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a2a7044b]
  - myst-parser@0.0.16
  - jtex@0.1.7
  - myst-templates@0.1.7
  - myst-transforms@0.0.16
  - myst-ext-card@0.0.2
  - myst-ext-grid@0.0.2
  - myst-ext-reactive@0.0.2
  - myst-ext-tabs@0.0.2
  - myst-to-docx@0.0.11

## 0.1.11

### Patch Changes

- 037c8d58: Pull tab/grid/card directives into external packages

## 0.1.10

### Patch Changes

- dad0d6d0: Support PDF images in web and word export
- 81d3098e: Modify how doi references are counted to make log messages slightly more correct
- 81d3098e: Allow file loading to specify maxCharacters to nbtx minification, enabling text output in exports
- 52f0c028: Reload project on toc/bib file changes during site watch
- Updated dependencies [9f9954d2]
  - myst-frontmatter@0.0.8
  - jtex@0.1.6
  - myst-config@0.0.9
  - myst-templates@0.1.6
  - myst-to-docx@0.0.10
  - myst-to-tex@0.0.15
  - tex-to-myst@0.0.15

## 0.1.9

### Patch Changes

- 93fcaf3a: Log vfile errors from myst-to-tex pipeline
- 93fcaf3a: Support `include` node in myst-to-docx and myst-to-tex
- b8f3ccb2: Improve the logging around latex error messages
- Updated dependencies [93fcaf3a]
  - myst-to-docx@0.0.9
  - myst-to-tex@0.0.14
  - tex-to-myst@0.0.14

## 0.1.8

### Patch Changes

- 2f268d18: Embeded content from other pages resolves on single page PDF/docx export
- 2f268d18: Output nodes are reduced to simpler image/code nodes for static PDF/docx exports
- Updated dependencies [2f268d18]
  - myst-to-docx@0.0.8
  - myst-to-tex@0.0.13
  - tex-to-myst@0.0.13

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
