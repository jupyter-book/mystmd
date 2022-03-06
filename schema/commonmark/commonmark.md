# Commonmark mdast

A basic Markdown Abstract Syntax Tree, mdast, is defined at [](https://github.com/syntax-tree/mdast). That specification defines the syntax tree for all commonmark features, as well as several additional extensions. Myst mdast is an extension of this mdast, and any valid mdast following that definition will also be valid myst mdast.

## Deviations commonmark mdast

- According to the mdast spec [list items](https://github.com/syntax-tree/mdast#listitem) may only have [flow content](https://github.com/syntax-tree/mdast#flowcontent) children. However, according to the commonmark spec, list items may also be flow or phrasing content, such as [text](https://spec.commonmark.org/0.30/#example-255). This depends on spacing between the list items in the original document. In myst-spec, we choose to follow the commonmark spec and allow `ListItem` children to be `FlowContent` or `PhrasingContent`.
- The commonmark spec presents `+++` as an invalid thematic break in [example 44](https://spec.commonmark.org/0.30/#example-44). However, in Myst `+++` is a block break, a non-commonmark feature. Therefore we simply removed example 44 in our test cases.
