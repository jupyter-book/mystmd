---
title: Templating Rules
description: 'jtex uses a customized set of jinja templating rules like `[- variable -]` and `[# if condition #]` that work well with the LaTeX.'
---

`jtex` uses `nunjucks`, which is a javascript port of Jinja templating language with the modifications
to allow easy reading and syntax highlighting with LaTeX.
The `nunjucks` ecosystem is compatible with `jinja` templates, and they are modified with custom rules.

## Syntax

|              | customized | standard jinja2 |
| ------------ | ---------- | --------------- |
| Statements   | `[# #]`    | `{% %}`         |
| Expressions  | `[- -]`    | `{{ }}`         |
| Comments     | `%# #%`    | `{# #}`         |
| Line Comment | `%%`       | `##`            |

Statements can be if-blocks or for-loops, a minimal freeform LaTeX example illustrating these would be:

```latex
\documentclass{article}
\begin{document}
\section{Famous People}
%% Print a list of famous people defined in the context dictionary
\begin{itemize}
[# for person in famous_people #]
\item [-person.name-], [-person.job-] [# if person.email #]([-person.email-])[# endif #]
[# endfor #]
\end{itemize}
\end{document}
```

## Other environment differences

In addition to the custom syntax we also set the following options:

| option                | `jtex` setting  | default | effect                                                                                              |
| --------------------- | --------------- | ------- | --------------------------------------------------------------------------------------------------- |
| trim_blocks           | `true`          | `false` | If this is set to `true` the first newline after a block is removed (block, not variable tag!)      |
| autoescape            | `false`         | `true`  | If set to `false` the XML/HTML autoescaping feature is disabled                                     |
| auto_reload           | `true`          | `false` | Will always check template location for changes and recompiles the template as needed               |
| undefined             | SlientUndefined | None    | Ignore any undefined variables in the template, render anyways without affected blocks or variables |
| keep_trailing_newline | `true`          | `false` | Preserve the trailing newline when rendering templates, important in LaTeX                          |

`jinja` provide a whole host of [tags](https://mozilla.github.io/nunjucks/templating.html#tags), [expressions](https://mozilla.github.io/nunjucks/templating.html#expressions) and [filters](https://mozilla.github.io/nunjucks/templating.html#filters) at global scope.

## Filters

Some of the main [filters](https://mozilla.github.io/nunjucks/templating.html#filters) used in the LaTeX templates,
are, for example, `join`, `title`, or `trim`.

**template.tex**

```latex
\keywords{[- doc.keywords | join(", ") -]}
```

**output.tex**

```latex
\keywords{Keyword1, keyword2}
```

## Controlling Whitespace

Jinja allows you to strip all leading or trailing whitespace by adding a minus sign (-) to the start or end block or a variable.
See [nunjucks docs](https://mozilla.github.io/nunjucks/templating.html#whitespace-control) for more information.

The following expression will ensure that a template block, that may be templated over many lines in the template,
will only show up on a single line in the exported LaTeX.
In this case the syntax is `[#-` for blocks and `[--` for variables.

```latex
[#- if parts.acknowledgments -#]
\section*{Acknowledgments}
[- parts.acknowledgments -]
[#- endif -#]
```

This can also be used for inline variables that will have the final output only exist on a single line in the final export.

## Expressions

Note that even though the template is being rendered from a javascript environment,
[expressions](https://mozilla.github.io/nunjucks/templating.html#expressions) and [comparisons](https://mozilla.github.io/nunjucks/templating.html#comparisons)
are Python-like. That is, they follow `and` over `&&` as well as `not` over `!`.
