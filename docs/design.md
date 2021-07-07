# MyST Parser Design

In this document we outline the general design decisions for a generic MyST parser, and then how this applies to the Javascript parser we have built here.
Note, this may eventually be moved to a "top-level" documentation of MyST.

Currently, the primary implementation of a MyST parser is written as a Sphinx extension (in Python); using markdown-it to initially parse the source text to a "token stream" (a list of syntax tokens, encapsulating the whole document and its content), then we convert this token stream to a docutils AST tree (in the `myst-parser` extension), which Sphinx then uses to convert to the desired output format (e.g. HTML or LaTeX).
Naturally this design is tightly coupled to Sphinx, but (a) in Javascript we do not have an implementation of Sphinx, and (b) we would like to move away from being reliant on any one "technology" for parsing, and instead outline a more generic "standard" for MyST parsing, which anyone could in principle implement.
What we don't want to do though is end up unknowingly reimplementing a worse version of Sphinx.
In the next section then we discuss the Sphinx design, the reasons behind it, and some of its technical limitations.

## Analysis of the Sphinx design

The sphinx design is outlined in more detail at <https://www.sphinx-doc.org/en/master/extdev/appapi.html#sphinx-core-events>, but the basic stages can be described as:

1. We read in a global configuration for the parse.
2. We need to parse the each document into an "output format agnostic" Abstract Syntax Tree (AST). This is performed in a linear manner, stepping through each line of the source text.
   - As well as creating the AST here, we also store aspects of the document to a global state object (known as the `BuildEnvironment`), for later fast lookup.
   - Also to note here, directive and role syntaxes are processed as they are encountered.
3. There are certain per-document AST operations we cannot perform until we have parsed that document, e.g. replacing substitution references with their definitions. These are known as transforms, and are applied in order of priority.
4. We then want to cache each document AST, so that we do not have to re-parse every document when one changes.
   - We also need to cache the global state object
5. There are certain per-document AST operations we cannot perform until we have parsed all documents, i.e our global state is complete and up-to-date, for example matching inter-document references to their targets. These are known as post-transforms, and are applied in order of priority.
   - Additionally, we may want to perform operations specific to a certain output format. These are also included in the post-transforms, and so the post-transforms are run once per each output format.
   - The per document ASTs at this point are transient, i.e. they are not cached, since any change to any document could affect them, and so there is no benefit in caching.
6. Now we have our final ASTs, we can perform the render, whereby we convert the ASTs to the output format.
   - A renderer in sphinx is known as a `Builder`
   - Another important thing we need to do is map filepath references (e.g. for images and downloadable files) to paths in the build folder, and ensure these files are copies there.

Another core concept is that of the logger, which logs specific information/warnings to the console, but also can be configured to fail the build (i.e. produce a non-zero exit code) if any warnings are encountered.
In this way the build is robust to errors (we don't want the whole build failing because of one syntax error), but allows us to programmatically tell if there any issues with our documentation (e.g. when we run CI tests).

As an addendum to the above design, we can also consider the steps to re-build the outputs, given an initial build has already been performed.

1. Within the global configuration specification, each variable defines a rebuild condition, i.e. whether a change in this variable should invoke a full rebuild (invalidating the cached document ASTs and global env and starting again from step (2)) or simply requires a rebuild from step (5).
   - The variables from the last parse are stored in the global env, and compared to those from the current parse.
2. In deciding which documents should be reparsed from step (2), the mtime of the source file and cached AST file are compared
3. step (5) and (6) are always run.

Lastly we should consider Sphinx's plugin system, in the form of extensions which can:

1. Specify additional configuration variables (including type validation and rebuild condition)
2. Define functions that occur after the configuration has been read (known as `config-inited` events) e.g. to apply additional validation
3. Add new parsers to apply to particular file name suffixes
4. Define additional roles and directives
5. Define additional transforms (and their priority)
6. Define additional post-transforms (their priority and what output formats they apply to)
7. Define additional renderers
8. Override which cached documents are considered outdated/invalid (known as `env-get-outdated` events)
9. Interject at a number of other key stages in the build (see other events)

Although a lot of this system is well designed, and we will certainly need to include most if not all of these steps, there a number of design issues that could be improved:

- The configuration must be written as Python file, instead it should be a more general format (like YAML or TOML)
- The document ASTs are designed as Python class instances (see <https://github.com/chrisjsewell/docutils/blob/develop/docutils/docutils/nodes.py>) and cached as pickled files (see https://docs.python.org/3/library/pickle.html). Again this should be a more general format such a JSON.
  - Usually when testing docutils ASTs we use the `pformat` method which converts it into a "pseudo-XML" string, although this does not actually contain all the information about the AST.
  - The markdown-it token stream system allows for a much more facile serialisation/de-serialisation to JSON
- The environment object is again a Python class instance and stored by pickling.
  - More so than just having a general storage format here this is currently a big obstacle for programs that want to access the environment in a dynamic manner, for example language servers that could provide auto-completions and navigation for inter-file references. Here it would be really useful for the environment to be a database with concurrent read/write access.
  - <https://en.wikipedia.org/wiki/SQLite> would possibly be a good choice here, as a serverless DB format (i.e. does not require a background process to be running), with support for basically every programming language.
  - See <https://github.com/chrisjsewell/rst-language-server>, where I was working on such a language server and had to adapt docutils/sphinx in such a way (it was also beneficial to store the line number mappings for references etc)
- Mappings of directive/role names to their processing functions/classes are stored in docutils as global variables. This is problematic for asynchronous document parsing.
- The conversion of roles/directives is performed in the same pass as with all other syntaxes. This leads to the AST being intrinsically "lossy" in that there is no way to recover what directives were in the original source text (see <https://github.com/executablebooks/rst-to-myst> where I had to re-write some of the parsing code to achieve this).
- Role/directive/transform code is very "side-effect heavy", as in they directly mutate the document AST and environment. There is already plenty of literature out there explaining why this is not ideal (e.g. <https://softwareengineering.stackexchange.com/questions/15269/why-are-side-effects-considered-evil-in-functional-programming>), and in general we should strive towards a more functional programming paradigm.
- Overall sphinx is quite difficult to run in a programmatic manner (as opposed to via the command-line)
- Sphinx is quite tied to having files exist on a file system

## Markdown-it considerations

In progress...

token stream vs ast:

```xml
<element>
    <sub-element>
```

```xml
<element-opening>
<sub-element>
<element-closing>
```

only nesting is with `inline` tokens, which have their own token streams in the `children` attribute.
good to walk through, good for headings.

options are static initial inputs, env is dynamic global state


## Design

Parse logger in

- global configuration.