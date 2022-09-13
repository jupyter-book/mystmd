---
title: Document Model
description: jtex uses a standard document model to validate and expose frontmatter, as well as custom options that are template specific.
---

The document model is based on `frontmatter` but is modified to make it more useful for $\LaTeX$ templating.
For example, a date is not exposed as a `Date` object, instead it provides `day` `month` and `year` variables
that can be directly used in $\LaTeX$ without any translation.

```latex
\newdate{articleDate}{[-doc.date.day-]}{[-doc.date.month-]}{[-doc.date.year-]}
\date{\displaydate{articleDate}}
```

This is also completed with author and affiliation information, and the document model includes `index` and `letter`,
which help by making it easy to have, Author{sup}`a`, defined in $\LaTeX$ with `[- author.letter -]`.

## Template Variables

`jtex` provides global variables which can be used when rendering the template:

`CONTENT`
: This is the main content of your document.
: You should include it in the body of your template with `[- CONTENT -]`.

`IMPORTS`
: These include imports and math macros that are required by the content of your document.
: These should be included in the head of your template with `[- IMPORTS -]`

`doc`
: The `title`, `date`, `authors` and other information in [](#document-properties) are on this object

`parts`
: The content for each part of your document are included in this object.
: To access the abstract for example, you can use `[- parts.abstract -]`.
: See [](#template-parts) for more information.

`options`
: The options for your template as defined in your `template.yml` options.
: See [](#template-options) for more information.

(document-properties)=

## Document Properties

The following properties are available on the `doc` object:

title (`string`)
: The title of the article

short_title (`string`)
: The short_title, often used as the running title of the document in a header.

description (`string`)
: The description of the article, often used in header information.

date
: An object containing `day`, `month` and `year`. For example:

    ```latex
    \newdate{articleDate}{[-doc.date.day-]}{[-doc.date.month-]}{[-doc.date.year-]}
    \date{\displaydate{articleDate}}
    ```

authors (`Author[]`)
: A list of the authors with information for indexing, corresponding author, and affiliations.
: See [](#doc-authors) below.

affiliations: (`ValueAndIndex[]`)
: The `value`, `index` and uppercase `letter` of the corresponding authors.

bibliography (`string[]`, optional)
: The file paths to the bibliography.

keywords (`string[]`, optional)
: The keywords defined in the frontmatter

(doc-authors)=

## Authors

The following properties are available under the `doc.authors` list:

name (`string`)
: The full authors name as a string.

given_name (`string`)
: The first part of the authors name.

surname (`string`)
: The last part of the authors name.

email (`string`, optional)
: The email of the author if provided.

affiliations (`ValueAndIndex[]`)
: The `value`, `index` and uppercase `letter` of the affiliation.
: The `index` and `letter` are the same as the affiliation in the `doc.affiliations` list above.

corresponding: (`ValueAndIndex[] | undefined`)
: The `value`, `index` and uppercase `letter` of the corresponding authors.
: Can be used as a condition, for example, `[# if author.corresponding #]`

orcid (`string`)
: The ORCID identifier, if provided.

roles (`AuthorRoles[]`)
: Contributing roles as defined in <https://credit.niso.org/>

index (`number`)
: The number of the author, in a list, starting counting at one.

letter (`string`)
: The letter of the author, starting at "A". If there are more letters than 26, they will be repeated ("AA").

The authors and affiliations are often the most complex part of the template, the following statements can give you some ideas of how to use the above properties.

```latex
\author{[# for author in doc.authors #]
[--author.name--]
[# if author.corresponding #]
\footnotemark[[-author.corresponding.index-]]
[#- endif #]\\
[# if author.affiliation #][--author.affiliation.value--]\\[# endif #]
[# if not loop.last #]
\AND
[# endif #]
[# endfor #]
}

\begin{document}
\maketitle

[# for author in doc.authors #]
[# if author.corresponding #]
\footnotetext[[-author.corresponding.index-]]{Correspondence to: [-author.email-]}
[# endif #]
[# endfor #]
```
