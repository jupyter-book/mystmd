---
title: Enumeration
---

There are two stages to add information about numbering and cross-referencing of content, specifically, `enumerateTargetsPlugin` and `resolveReferencesPlugin` these can be run at different times depending on if you are in a single-document or multi-document setup.

The enumeration transforms require state, and can instantiate a `ReferenceState` object or a `MultiPageReferenceState` for collections with multiple pages. The reference resolution is defined in those classes. To create your own reference management, use the `IReferenceState` interface to pass in.

The `enumerateTargetsPlugin` should be run early, and registers targets with the state through `state.addTarget`. This will also tick forward all of the counting in the document (e.g. "Section 3.2.4" or "Figure 5"). The numbering can be configured with a `numbering` option in the `ReferenceState`, or your own implementation of counting.

The `resolveReferencesPlugin` has a number of transformations for (1) links, which identify document level links to other md files; (2) `crossReference` transforms which link references in the state and replace children with, for example, "Figure 1"; and (3) inserting caption numbers into containers.
