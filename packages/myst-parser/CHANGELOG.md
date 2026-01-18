# myst-parser

## 1.6.4

### Patch Changes

- Updated dependencies [c9ec7f2]
  - myst-roles@1.6.4
  - myst-directives@1.6.4

## 1.6.3

### Patch Changes

- fae1ab1: Do not raise errors on unprocessed nodes
- Updated dependencies [2e6e81f]
  - myst-directives@1.6.3
  - myst-common@1.9.2
  - myst-roles@1.6.3

## 1.6.2

### Patch Changes

- 770eece: Footnotes and role parsing
- Updated dependencies [770eece]
- Updated dependencies [a742dda]
- Updated dependencies [f1ccba4]
- Updated dependencies [c2d895a]
  - markdown-it-myst@1.0.14
  - myst-common@1.9.1
  - myst-directives@1.6.2
  - myst-roles@1.6.2

## 1.6.1

### Patch Changes

- Updated dependencies [1735db4]
- Updated dependencies [6fe5960]
- Updated dependencies [30acc57]
  - myst-directives@1.6.1
  - myst-roles@1.6.1
  - myst-common@1.9.0

## 1.6.0

### Minor Changes

- cd8ee79: Update MarkdownIt to 13 for all dependencies, add types to dependencieswq

### Patch Changes

- Updated dependencies [e293e72]
- Updated dependencies [cd8ee79]
  - myst-roles@1.6.0
  - markdown-it-myst@1.0.13
  - myst-common@1.8.4
  - myst-directives@1.6.0

## 1.5.17

### Patch Changes

- Updated dependencies [a85b321]
- Updated dependencies [df8bbb0]
- Updated dependencies [c736b16]
  - markdown-it-myst@1.0.12
  - myst-common@1.8.3
  - myst-roles@1.5.17
  - myst-directives@1.5.17

## 1.5.16

### Patch Changes

- 8ffa2d33c: Transform lists that have non-block content (text, italic, inlineCode, etc.) to ensure they are in paragraphs.
- efc29a450: Add footnoteReference to known list elements inline children.
- a0fbdc419: CiteGroup as another phrasing type
  - myst-common@1.8.2
  - myst-roles@1.5.16
  - myst-directives@1.5.16

## 1.5.15

### Patch Changes

- 0b284816: Ensure that the options are also on the mystRole.
- 0b284816: Add typst as an option to the math nodes.
- Updated dependencies [0b284816]
  - myst-directives@1.5.15
  - myst-roles@1.5.15
  - myst-common@1.8.1

## 1.5.14

### Patch Changes

- Updated dependencies [d09a748f]
  - myst-directives@1.5.14
  - myst-roles@1.5.14

## 1.5.13

### Patch Changes

- Updated dependencies [c6213ed]
- Updated dependencies [c6213ed]
- Updated dependencies [c6213ed]
- Updated dependencies [c6213ed]
  - markdown-it-myst@1.0.11
  - myst-directives@1.5.13
  - myst-roles@1.5.13
  - myst-common@1.7.11

## 1.5.12

### Patch Changes

- aa49c51c: Added support for include directive options when not using the literal option.
- Updated dependencies [0052853]
- Updated dependencies [aa49c51c]
  - myst-directives@1.5.12
  - myst-common@1.7.9
  - myst-roles@1.5.12

## 1.5.11

### Patch Changes

- 7d24862a: Remove java and zip from linkified TLDs.
  - myst-common@1.7.8
  - myst-roles@1.5.11
  - myst-directives@1.5.11

## 1.5.10

### Patch Changes

- 2ab9bfdf: Remove .es linkify
- 3b05051d: Explicitly trim math strings
- Updated dependencies [67bc9b8d]
- Updated dependencies [0d82810f]
- Updated dependencies [9717b067]
  - myst-common@1.7.6
  - myst-directives@1.5.10
  - myst-roles@1.5.10

## 1.5.9

### Patch Changes

- Updated dependencies [d7a6fddd]
  - myst-directives@1.5.9
  - myst-roles@1.5.9

## 1.5.8

### Patch Changes

- Updated dependencies [eb411d0b]
  - myst-directives@1.5.8
  - myst-common@1.7.4
  - myst-roles@1.5.8

## 1.5.7

### Patch Changes

- ce3c11c: Update inter-version deps
- Updated dependencies [ce3c11c]
  - myst-directives@1.5.7
  - myst-roles@1.5.7

## 1.5.6

### Patch Changes

- c758f1b5: Directive option flag is always a boolean
- Updated dependencies [c758f1b5]
  - markdown-it-myst@1.0.10
  - myst-roles@1.5.6
  - myst-directives@1.5.6

## 1.5.5

### Patch Changes

- Updated dependencies [63f9265b]
- Updated dependencies [8ba7b73a]
  - myst-roles@1.5.5
  - myst-common@1.6.0
  - myst-directives@1.5.5

## 1.5.4

### Patch Changes

- 88396dd: Add enumerator and enumerated to directives
- 5ac2d0bc: Fix inline parsing for roles
- 1a5f3f33: Enable strikethrough as markdownit extension
- Updated dependencies [60fc2574]
- Updated dependencies [88396dd]
- Updated dependencies [5ac2d0bc]
- Updated dependencies [4e880f3e]
  - myst-directives@1.5.4
  - markdown-it-myst@1.0.9
  - myst-common@1.5.4
  - myst-roles@1.5.4

## 1.5.3

### Patch Changes

- Updated dependencies [857c5acf]
  - myst-directives@1.5.3
  - myst-roles@1.5.3
  - myst-common@1.5.3

## 1.5.2

### Patch Changes

- Updated dependencies [134598fd]
- Updated dependencies [3fd53be8]
  - myst-directives@1.5.2
  - myst-common@1.5.2
  - myst-roles@1.5.2

## 1.5.1

### Patch Changes

- b3e9df9d: Update to Project Jupyter and change all URLs
- Updated dependencies [b3e9df9d]
  - markdown-it-myst@1.0.8
  - myst-directives@1.5.1
  - myst-common@1.5.1
  - myst-roles@1.5.1

## 1.5.0

### Patch Changes

- 8e486e56: Ignore 'dot' top level domain.
- 372de44c: Exclude '.so' from tlds
- 848b6d8b: Fix options passing for mystParse unified plugin
- Updated dependencies [d04ceb6a]
- Updated dependencies [0576d5ad]
  - myst-directives@1.5.0
  - myst-common@1.5.0
  - myst-roles@1.5.0

## 1.4.4

### Patch Changes

- Updated dependencies [933b7b33]
  - myst-directives@1.4.4
  - myst-common@1.4.5
  - myst-roles@1.4.4

## 1.4.3

### Patch Changes

- Updated dependencies [9e311c38]
- Updated dependencies [c0f51ee5]
  - myst-common@1.4.2
  - myst-directives@1.4.3
  - myst-roles@1.4.3

## 1.4.2

### Patch Changes

- Updated dependencies [59b523c4]
  - myst-directives@1.4.2
  - myst-roles@1.4.2

## 1.4.1

### Patch Changes

- Updated dependencies [ddb29b0]
  - myst-directives@1.4.1
  - myst-roles@1.4.1

## 1.4.0

### Patch Changes

- Updated dependencies [3241933]
- Updated dependencies [3b008cbb]
- Updated dependencies [e0cd47e3]
- Updated dependencies [f13d451d]
- Updated dependencies [f656e572]
- Updated dependencies [a3e3aa0c]
- Updated dependencies [f13d451d]
  - myst-directives@1.4.0
  - myst-common@1.3.0
  - myst-roles@1.4.0

## 1.3.0

### Minor Changes

- 9271361: Add support for nested parsing via a context object

### Patch Changes

- Updated dependencies [2c4e3057]
- Updated dependencies [9271361]
  - myst-common@1.2.0
  - myst-roles@1.3.0
  - myst-directives@1.3.0

## 1.2.3

### Patch Changes

- be3befd: Fix circular deps
  - myst-common@1.1.35
  - myst-roles@1.2.3
  - myst-directives@1.2.3

## 1.2.2

### Patch Changes

- 5aa3ea2f: Handle blocks with empty children
- 6a57ab77: Only trim end of line for myst-directives, not both the start and end of lines. This is important for keeping indentation in code blocks.
- Updated dependencies [5aa3ea2f]
- Updated dependencies [5aa3ea2f]
- Updated dependencies [6a57ab77]
  - myst-common@1.1.34
  - markdown-it-myst@1.0.7
  - myst-roles@1.2.2
  - myst-directives@1.2.2

## 1.2.1

### Patch Changes

- 20108545: Pass src to the state handlers
- 20108545: compute AMS math tightness based on source
- Updated dependencies [bba5baf9]
- Updated dependencies [117d6008]
- Updated dependencies [ebe65816]
- Updated dependencies [20108545]
- Updated dependencies [20108545]
- Updated dependencies [20108545]
- Updated dependencies [117d6008]
  - myst-common@1.1.32
  - markdown-it-myst@1.0.6
  - myst-directives@1.2.1
  - myst-roles@1.2.1

## 1.2.0

### Patch Changes

- Updated dependencies [1880a465]
- Updated dependencies [a9250ae6]
- Updated dependencies [22c5fff]
- Updated dependencies [e07d55a0]
  - myst-common@1.1.31
  - myst-directives@1.2.0
  - myst-roles@1.2.0

## 1.1.0

### Patch Changes

- 974dde17: Remove tlds package
- Updated dependencies [42af3800]
  - myst-directives@1.1.0
  - myst-common@1.1.30
  - myst-roles@1.1.0

## 1.0.24

### Patch Changes

- Updated dependencies [cbad68cc]
  - myst-directives@1.0.24
  - myst-common@1.1.29
  - myst-roles@1.0.24

## 1.0.23

### Patch Changes

- b289f03e: Remove .py from linkify domains
- Updated dependencies [3c9d9962]
- Updated dependencies [cff47b14]
- Updated dependencies [cff47b14]
  - myst-common@1.1.28
  - myst-roles@1.0.23
  - myst-directives@1.0.23

## 1.0.22

### Patch Changes

- f78db0bf: Update myst-spec
- Updated dependencies [f78db0bf]
  - myst-common@1.1.22
  - myst-roles@1.0.22
  - myst-directives@1.0.22

## 1.0.21

### Patch Changes

- Updated dependencies [9573382a]
- Updated dependencies [bfed37b]
- Updated dependencies [9573382a]
  - myst-directives@1.0.21
  - myst-common@1.1.21
  - myst-roles@1.0.21

## 1.0.20

### Patch Changes

- 6354420: Update versions of myst packages
- Updated dependencies [6354420]
  - myst-directives@1.0.20
  - myst-roles@1.0.20

## 1.0.19

### Patch Changes

- Updated dependencies [4ac26b5e]
  - myst-roles@1.0.19
  - myst-directives@1.0.19

## 1.0.18

### Patch Changes

- Updated dependencies [4846c7fa]
  - myst-directives@1.0.18
  - myst-common@1.1.18
  - myst-roles@1.0.18

## 1.0.17

### Patch Changes

- Updated dependencies [ecc6b812]
- Updated dependencies [2403f376]
  - myst-common@1.1.17
  - myst-directives@1.0.17
  - myst-roles@1.0.17

## 1.0.16

### Patch Changes

- 81a47ef5: Simplify and relax figure directive
- Updated dependencies [81a47ef5]
- Updated dependencies [81a47ef5]
  - myst-directives@1.0.16
  - myst-common@1.1.15
  - myst-roles@1.0.16

## 1.0.15

### Patch Changes

- Updated dependencies [adb9121]
- Updated dependencies [d9953976]
- Updated dependencies [c242d9b1]
  - myst-common@1.1.14
  - markdown-it-myst@1.0.5
  - myst-roles@1.0.15
  - myst-directives@1.0.15

## 1.0.14

### Patch Changes

- 9410e8d: Fix circular dependencies
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
  - myst-common@1.1.13
  - myst-roles@1.0.14
  - myst-directives@1.0.14

## 1.0.13

### Patch Changes

- e25f20d9: Enable smartquotes
- 4534f995: Add directive/role nodes to the DirectiveData and RoleData.
- Updated dependencies [4534f995]
- Updated dependencies [4534f995]
- Updated dependencies [4534f995]
  - myst-directives@1.0.13
  - myst-common@1.1.12
  - myst-roles@1.0.13

## 1.0.12

### Patch Changes

- Updated dependencies [f71817fe]
- Updated dependencies [f7c29db6]
  - myst-roles@1.0.12
  - markdown-it-myst@1.0.4
  - myst-directives@1.0.12

## 1.0.11

### Patch Changes

- Updated dependencies [93b73d2]
  - myst-directives@1.0.11
  - myst-roles@1.0.11

## 1.0.10

### Patch Changes

- Updated dependencies [6d0e4e3f]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [8b7b5fe6]
  - myst-common@1.1.9
  - myst-roles@1.0.10
  - myst-directives@1.0.10

## 1.0.9

### Patch Changes

- myst-roles@1.0.9
- myst-directives@1.0.9

## 1.0.8

### Patch Changes

- ed7b430f: Allow alias field for directive options.
- 757f1fe4: Add column information to citations and roles
- b74fb3c1: Add ruleIds to all errors/warnings across myst-cli
- ed7b430f: All instances of `name` options in directives can also use `label`. (e.g. in a figure or equation).
- d35e02bc: Support ParseTypesEnum as String/Number/Boolean or `"myst"`
- Updated dependencies [d35e02bc]
- Updated dependencies [b74fb3c1]
- Updated dependencies [ed7b430f]
- Updated dependencies [392ba779]
- Updated dependencies [757f1fe4]
- Updated dependencies [d35e02bc]
- Updated dependencies [d35e02bc]
- Updated dependencies [392ba779]
- Updated dependencies [239ae762]
- Updated dependencies [b74fb3c1]
- Updated dependencies [ed7b430f]
- Updated dependencies [86c78957]
- Updated dependencies [392ba779]
- Updated dependencies [4183c05c]
- Updated dependencies [20b9a41a]
- Updated dependencies [60cf9a53]
- Updated dependencies [d35e02bc]
- Updated dependencies [d35e02bc]
- Updated dependencies [d35e02bc]
- Updated dependencies [99659250]
  - myst-common@1.1.7
  - myst-directives@1.0.8
  - markdown-it-myst@1.0.3
  - myst-roles@1.0.8

## 1.0.7

### Patch Changes

- Updated dependencies [7752cb70]
  - myst-directives@1.0.7
  - myst-roles@1.0.7

## 1.0.6

### Patch Changes

- 24c0aae7: Move from Root in mdast to `GenericParent` to relax types
  - myst-roles@1.0.6
  - myst-directives@1.0.6

## 1.0.5

### Patch Changes

- Updates to internal dependencies
- Updated dependencies
  - markdown-it-myst@1.0.2
  - myst-directives@1.0.5
  - myst-roles@1.0.5

## 1.0.4

### Patch Changes

- Updated dependencies [7b72b097]
- Updated dependencies [f44ee18d]
- Updated dependencies [7b72b097]
- Updated dependencies [7b72b097]
- Updated dependencies [7b72b097]
  - myst-directives@1.0.4
  - myst-roles@1.0.4

## 1.0.3

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- Updated dependencies [b0a2a34b]
  - markdown-it-myst@1.0.1
  - myst-directives@1.0.3
  - myst-roles@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [438cdb28]
  - myst-roles@1.0.2
  - myst-directives@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies
  - myst-directives@1.0.1
  - myst-roles@1.0.1

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

### Patch Changes

- Updated dependencies [00c05fe9]
  - markdown-it-myst@1.0.0
  - myst-directives@1.0.0
  - myst-roles@1.0.0

## 0.0.32

### Patch Changes

- d068df65: Change unknown directive from warning to error
- 83200b5c: Change undefined role to error from warning
- Updated dependencies [69a450dd]
- Updated dependencies [de66ba19]
  - myst-directives@0.0.32
  - myst-roles@0.0.32

## 0.0.31

### Patch Changes

- myst-roles@0.0.31
- myst-directives@0.0.31

## 0.0.30

### Patch Changes

- Updated dependencies [837785a3]
  - myst-roles@0.0.30
  - myst-directives@0.0.30

## 0.0.29

### Patch Changes

- Updated dependencies [78b7232e]
  - myst-roles@0.0.29
  - myst-directives@0.0.29

## 0.0.28

### Patch Changes

- Updated dependencies [b9b2ac0b]
  - myst-directives@0.0.28
  - myst-roles@0.0.28

## 0.0.27

### Patch Changes

- 685bbe58: Add SI Units (see https://texdoc.org/serve/siunitx/0)
- ff43d9c9: Remove identifier from embed node
- Updated dependencies [79743342]
- Updated dependencies [685bbe58]
- Updated dependencies [ff43d9c9]
  - myst-roles@0.0.27
  - myst-directives@0.0.27

## 0.0.26

### Patch Changes

- myst-roles@0.0.26
- myst-directives@0.0.26

## 0.0.25

### Patch Changes

- myst-directives@0.0.25
- myst-roles@0.0.25

## 0.0.24

### Patch Changes

- myst-directives@0.0.24
- myst-roles@0.0.24

## 0.0.23

### Patch Changes

- 45ecdf86: Update readme example
- 45ecdf86: Improve parsing of tasklists for mdast
  - myst-directives@0.0.23
  - myst-roles@0.0.23

## 0.0.22

### Patch Changes

- Updated dependencies [833be5a9]
  - myst-directives@0.0.22
  - myst-roles@0.0.22

## 0.0.21

### Patch Changes

- Updated dependencies [9fcf25a9]
  - myst-roles@0.0.21
  - myst-directives@0.0.21

## 0.0.20

### Patch Changes

- myst-roles@0.0.20
- myst-directives@0.0.20

## 0.0.19

### Patch Changes

- 9105d991: Undefined children still have a key defined. Delete the children if they are null-ish.
- Updated dependencies [99948cc8]
  - markdown-it-myst@0.1.3
  - myst-directives@0.0.19
  - myst-roles@0.0.19

## 0.0.18

### Patch Changes

- Updated dependencies [9f8613ef]
- Updated dependencies [5f506356]
- Updated dependencies [8381c653]
- Updated dependencies [c1a8da90]
- Updated dependencies [d14bb127]
  - markdown-it-myst@0.1.2
  - myst-directives@0.0.18
  - myst-roles@0.0.18

## 0.0.17

### Patch Changes

- myst-directives@0.0.17
- myst-roles@0.0.17

## 0.0.16

### Patch Changes

- 844d29fb: Remove unist exports from myst-parser
- a22fafa0: Log parse errors with vfile
- ea89d8b2: Update admonition title to always be the argument.
- 75b6bcb8: Transform numbers into strings silently
- a22fafa0: Refactor role/directive implementations to allow declarative definitions. Pull all default roles/directives from mystjs and myst-cli into separate package with new implementation.
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a2a7044b]
  - markdown-it-myst@0.1.1
  - myst-directives@0.0.16
  - myst-roles@0.0.16

## 0.0.15

### Patch Changes

- fced5986: Deprecate GenericNode, GenericParent, and liftChildren -- these are now in myst-common.

## 0.0.14

### Patch Changes

- 88666aee: Deprecate unified exports from `mystjs`
- a9110bff: Add positions to nodes and update tests
- 184ad9f9: Move to https://github.com/jupyter-book/mystmd
- a9110bff: Update line-number logic for code-block to come inline with sphinx
- a9110bff: Pass image height to image token if it exists
