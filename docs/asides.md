---
title: Asides, Margin Content, and Sidebars
short_title: Asides & Margins
description: Asides provide an easy way to represent content that is only indirectly related to the article's main content, such as in the sidebar or margin.
---

Asides provide an easy way to represent content that is only indirectly related to the article's main content.
Where supported, MyST will attempt to display an {myst:directive}`aside` _as close as possible to_—but separate from—the main article, such as in the side-margin.

```{aside} Margin Content
Here’s some margin content! It was created by using the {myst:directive}`margin` directive in a Markdown, we can include images:

![](https://github.com/rowanc1/pics/blob/main/sunset.png)

or any other sort of content!
```

```markdown
:::{aside} Margin Content
Here’s some margin content! It was created by using the {myst:directive}`margin` directive in a Markdown, we can include images:

![](https://github.com/rowanc1/pics/blob/main/sunset.png)

or any other sort of content!
:::
```

You can also refer to this directive using {myst:directive}`margin` or {myst:directive}`sidebar`, which will have slightly different classes applied in the future.

:::{warning} Experimental

Many of the features on this page are experimental and may change at any time.

These elements can conflict with the document outline when they are both competing for the margin space (see [#170](https://github.com/jupyter-book/myst-theme/issues/170)).

There is, yet, no plugin available transforming this directive into a Typst pdf.
:::

% Using bold here, until we fix #170

**Topics**

A topic is like a block quote with a title, or a self-contained section.
Use the "topic" directive to indicate a self-contained idea that is separate from the flow of the document.
Semantically, this is an `<aside>`.

```markdown
:::{topic} This is an optional topic title
This is a topic, with standalone ideas.
:::
```

:::{topic} This is an optional topic title
This is a topic, with standalone ideas.
:::
