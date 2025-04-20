---
"myst-templates": patch
"myst-cli": patch
---

Add a `--template` flag to `myst` that allows the user to specify a custom location for `template.yml`. When that flag is specified, the template is local, and therefore we do not validate the `files` section of the template.
