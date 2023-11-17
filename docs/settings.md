---
title: Settings
description: Project and page settings for MyST
---

The `settings` field in the project or page frontmatter allows you to change how the parsing, transforms, plugins, or other behaviors of mystmd.

## Available settings fields

(setting:output_stderr)=
output_stderr
: Remove, warn or error on stderr outputs. (e.g. DeprecationWarnings, RuntimeWarnings)

    - `"show"`: (default): show all stderr (unless a `remove-stderr` tag is present on the cell)
    - `"remove"`: remove all stderr outputs
    - `"remove-warn"` or `"remove-error"`: remove all stderr, and log a warning or error
    - `"warn"` or "error": log a warning or error if an stderr is found

(setting:output_stdout)=
output_stdout
: Remove, warn or error on stdout outputs. (e.g. long text outputs, like text-based progress bars)

    - `"show"`: (default): show all stdout (unless a `remove-stdout` tag is present on the cell)
    - `"remove"`: remove all stdout outputs
    - `"remove-warn"` or `"remove-error"`: remove all stdout, and log a warning or error
    - `"warn"` or "error": log a warning or error if an stdout is found
