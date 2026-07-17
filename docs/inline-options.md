---
title: Inline Options
subtitle: Concise specification of CSS classes, IDs, and attributes
description: MyST Markdown has support for inline attributes for both roles and directives, allowing concise specification of CSS classes, IDs, and attributes. This complements other methods for defining options, making markup more expressive and flexible.
# thumbnail: thumbnails/inline-options.png
---

:::{warning} Inline Options are in Beta
The support for inline attributes is in beta and may have some bugs or limitations.
Please give feedback on [GitHub](https://github.com/orgs/jupyter-book/discussions).
:::

MyST Markdown has support for inline attributes for both roles and directives, allowing concise specification of CSS classes, IDs, and attributes. This complements other methods for defining options, making markup more expressive and flexible.

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
: Allows simpler attribute values when there are no spaces.

For directives, these can be mixed with other ways to define options on directives, classes are combined in a single space-separated string; other repeated directive options will raise a duplicate option warning.
