---
'myst-transforms': patch
---

Target propagration should happen after `mystDirectives` have been lifted fixed to work for directives.

Deprecated the `mystCleanup` in favour of a more descriptive name (`liftMystDirectivesAndRoles`) for both the plugin and transform.
