---
title: Asides, Margin Content, and Sidebars
short_title: Asides & Margins
description: Asides provide an easy way to represent content that is only indirectly related to the article's main content, such as in the sidebar or margin.
---

Asides provide an easy way to represent content that is only indirectly related to the article's main content. Where supported, MyST will attempt to display an {myst:directive}`aside` _as close as possible_ but separately from the main article, such as in the side-margin.

```{aside}
Here’s some margin content! It was created by using the {myst:directive}`margin` directive in a Markdown, we can include images:

![](https://source.unsplash.com/random/400x75?sunset)

or any other sort of content!
```

````markdown
```{aside}
This is an aside. It is not entirely relevant to the main article.
```
````

You can also refer to this directive using {myst:directive}`margin` or {myst:directive}`sidebar`, which will have slightly different classes applied in the future.

:::{warning} Experimental

Many of the features on this page are experimental and may change at any time.

These elements can conflict with the document outline when they are both competing for the margin space (see [#170](https://github.com/executablebooks/myst-theme/issues/170)).

:::
