---
title: Template.yml
description: Every jtex template defines a template.yml to define the options and parts available as well as metadata about the authorship and license of the template.
---

Every template defines a `template.yml` to define the `options`, `parts` and `doc` properties the template exposes and metadata of the authorship and license of the template.

(template-metadata)=

## Template Metadata

The `template.yml` defines information about the template, including who made and contributed it, the license, any tags for the template and links to the source repositories.

This information is meant for listing and searching templates in a user interface or in the command line using:\
`myst templates list`\
The following metadata fields should be included for the template to be attributed correctly.

```yaml
jtex: v1
title: Title of the Template
description: Template description, describing where it is used
version: 1.0.0
license: CC-BY-4.0
authors:
  - name: Journal 42
    github: github_handle
    twitter: twitter_handle
    affiliations:
      - Big Science
tags:
  - two-column
source: https://github.com/my_organization/template
```

```{important}
# Common tags

The `tags` field is often used for searching and finding templates, some common values are:

- paper
- journal
- presentation
- one-column
- two-column
```

(template-options)=

## Template Options

The options of the templates are available as `options.parameter` in the template, and are added in as `[- options.parameter -]` in the `template.tex`.
Options are defined under the `options` dictionary and look like:

```yaml
options:
  - id: paper_size
    type: choice
    description: Set the paper size for the document
    default: usletter
    choices:
      - usletter
      - a4paper
```

Each `options` entry has the following fields:

id (string, required)
: The name of the ID, must be unique to the template, and is how it is accessed in the template as:\
`[- options.id -]`
: The preferred form of IDs is `snake_case` identifiers.

type:
: One of `boolean`, `string`, `choice`, `frontmatter`
: If the type is `frontmatter` then the ID must be included in\
`title`, `description`, `authors`, `short_title`, or `keywords`

title (string, optional)
: The title of the property to show in user interfaces
: If omitted, the title will be derived by splitting the ID on `_` and capitalized.

description (string, optional)
: The description of the option, this can include any information about the parameter, that might be in the template criteria.

required (boolean)
: Indicate if the value is required in the frontmatter.
: If this is `true`, then errors will be shown to the users of the template if they do not provide them.

choices (string array)
: If `type` is "choice", then provide a list of choices that can be used by a template.

max_chars (number)
: The maximum characters for this field.

default
: The default value if not provided

(template-doc)=

## Template Document

The template `doc` lists the [frontmatter](../../../docs/frontmatter.md) options that are required for or used by the template. These can have a `required` field (boolean) as well as an optional `description`.

```yaml
doc:
  - id: title
    required: true
  - id: keywords
    description: >
      Include from three to ten pertinent keywords specific to the article; yet
      reasonably common within the subject discipline.
```

(template-parts)=

## Template Parts

The parts of your document are various portions of the document that do not fit in the main content area. For example, an `abstract`, `acknowledgments` or `data_availability` are all potential parts of a document template.
To define a part, add it to the `parts` array in your `template.yml`.

```yaml
parts:
  - id: abstract
    description: |
      Please provide an abstract of no more than 300 words.
      Your abstract should explain the main contributions of your article,
      and should not contain any material that is not included in the main text.
    max_words: 300
    required: true
```

Each `parts` entry has the following fields:

id (string, required)
: The name of the part, must be unique to the template, and is how it is accessed in the template as:\
`[- parts.abstract -]`
: The preferred form of IDs is `snake_case` identifiers.

title (string, optional)
: The title of the property to show in user interfaces
: If omitted, the title will be derived by splitting the ID on `_` and capitalized.

description (string, optional)
: The description of the option, this can include any information about the parameter, that might be in the template criteria.

required (boolean)
: Indicate if the value is required in the frontmatter.
: If this is `true`, then errors will be shown to the users of the template if they do not provide them.

plain (boolean)
: The part must be in plain text, and will be converted to plain text in the export process.

max_chars (number)
: The maximum characters for this field.

max_words (number)
: The maximum words for this field.

Including parts in your template should always be added in an if-block. For example:

```latex
[# if parts.acknowledgments #]
\section*{Acknowledgments}
[-parts.acknowledgments-]
[# endif #]
```

Even if the template part is required, `jtex` defaults to building regardless but does raise errors to the user.
Many times users create documents in partially complete states, so your template should also work in a partial state!

### Conditional Options and Parts

Conditional values allow additional metadata to be validated and collected if various conditions are met.
These can be applied to both `parts` and `options`.
For example, the following two options allow collection of a publication date if the article is published:

```yaml
options:
  - id: published
    description: Is this submission published?
    type: boolean
    default: false
  - id: publication_date
    title: Publication Date
    description: Use the form "4 May 2020"
    type: string
    condition:
      id: published
      value: true
```

condition
: Indicate that this option is conditional on other options, for example, a journal name.

    id (string)
    : The identifier that this condition

    value
    : The value, that when met, this option is triggered on

(template-files)=

## Template Files

The files are a list of unix-style paths to files that are required by the template. The first entry should always be `template.tex`; this must be in the top level folder next to the `template.yml`. All other files may be nested in sub-folders. This list may not include folders or wildcards.
Common options to include are any `*.sty` files or images required by the template.

```yaml
files:
  - template.tex
  - style.sty
  - citation.bst
  - custom.def
  - images/logo.png
```

These files, and only these files, will be copied in when using the template in `myst`.

(template-packages)=

## Template Packages

The template packages are a list of all the used $\LaTeX$ packages that are already imported by the template.
This is important for some processors to know, for example `myst-to-tex`, which will only add additional imports that are not included in this list.

To create this list, add the `files` first and then run `jtex check --fix` this will add a list of all the automatically found packages in your templates dependencies.

```yaml
packages:
  - amsmath
  - amssymb
  - amsthm
  - natbib
```

## Check your `template.yml`

```bash
npm install -g jtex
```

Navigate into your template directory and run `jtex check`, this will print any warnings or errors encountered.

````{important}
# Automatically fix your `template.yml`

You can fix your `template.yml` automatically using:

```bash
jtex check --fix
```

This will add fields like packages, files, and a `jtex` version, as well as any used, but unnamed `doc` properties.
````
