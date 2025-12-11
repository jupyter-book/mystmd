---
title: Command Line
description: jtex can be used on the command line, as well as a package.
---

`jtex` can be used as a package as well as a command-line interface. It is most common that you will be using `jtex` as a component of the `myst` ecosystem, however, if you are contributing or building your own template locally, there are a number of tools that can help you validate and build your `template.yml`. To install the command line tools use:

```bash
npm install -g jtex
```

## Rendering

To render a template, you need to have the template directory defined, as well as `content.tex` and a `frontmatter.yml`.

```{danger}
This is currently not yet implemented in `jtex`.
```

```bash
jtex render content.tex output/folder --frontmatter ./frontmatter.yml --template my/template/folder
```

## Building Templates

### `jtex check [folder] [--fix]`

Without a `folder`, it will use the current directory. You can use the `--fix` argument to automatically add `packages` and known arguments to your `template.yml`.

```bash
jtex check arxiv_two_column
> template.yml
>   [parts.0] 'parts.0' extra key ignored: chars
> template.tex
>   [options] The following options were not referenced in the template: "show_date"
>   [options] The template.yml does not include "watermark" but it is referenced in template.tex on line 57
> jtex found warnings or errors in validating your template.
```

### `jtex parse [file]`

To see the contents of your template that are rendered.

```bash
jtex parse arxiv_two_column/template.tex
> Doc:
>     title                         line 53
>     authors                       lines 72, 75
>     keywords                      lines 95, 96
>
> Options:
>     watermark                     line 57
>     link                          lines 116, 119
>
> Parts:
>     abstract                      lines 89, 91
>     acknowledgments               lines 108, 112
>
> Packages:
>     preprint                      line 2
>     lipsum                        line 3
>     amsthm                        line 19
```

```{warning}
The list is for the purpose of validating the template options, it is not necessarily comprehensive and may miss some entries. It will generally work as long as your template properties are defined on a single line.

The packages picked up are single lines of `\usepackage{name}` or `\RequirePackage{name}`.
```
