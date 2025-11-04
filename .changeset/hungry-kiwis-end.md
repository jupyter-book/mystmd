---
'myst-templates': minor
---

adds support for github-releases URLs for themes

when fetching the location of a theme, this patch will interpret URLs that end
in '.release' as the location of a package built by github-releases  
this is in addition to the existing support for URLs that end in '.git' and that
expect the theme contents to be found in a archived (zipped) git commit
