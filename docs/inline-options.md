---
title: Inline Options
# subtitle: Generate figures and other rich content using Jupyter kernels
# short_title: Execute During Build
# description: MyST can execute Markdown files and Jupyter Notebooks, making it possible to build rich websites from computational documents.
# thumbnail: thumbnails/execute-notebooks.png
---

MyST Markdown is introducing inline attributes for both roles and directives, allowing concise specification of CSS classes, IDs, and attributes. This complements existing methods for defining options, making markup more expressive and flexible.

```markdown
:::{tip .dropdown open="true"} Title
Tip Content
:::
```

This can also be used for roles:

`` {span .text-red-500}`Red text` ``

{span .text-red-500}`Red text`

## Syntax Overview

The inline attribute syntax follows this pattern:

````text
{role #id .class key="value" key=value}`content`

```{directive #id .class key="value" key=value}
content
```
````

Name (e.g. `tip` or `cite:p`)
: The directive or role name must come first. There must only be a single "bare" token.

ID (`#id`)
: Defines the label/identifier of the node

Class (`.class`)
: Adds CSS class(es).

Quoted Attributes (`key="value"`)
: Supports attributes containing spaces or special characters.

Unquoted Attributes (`key=value` or `key=123`)
: Allows simpler attribute values.

For directives, these can be mixed with other ways to define options on directives, classes are combined in a single string other repeated directive options will raise a duplicate option warning.
