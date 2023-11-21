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
    - `"warn"` or "error": log a warning or error if a stderr is found

(setting:output_stdout)=
output_stdout
: Remove, warn or error on stdout outputs. (e.g. long text outputs, like text-based progress bars)

    - `"show"`: (default): show all stdout (unless a `remove-stdout` tag is present on the cell)
    - `"remove"`: remove all stdout outputs
    - `"remove-warn"` or `"remove-error"`: remove all stdout, and log a warning or error
    - `"warn"` or "error": log a warning or error if a stdout is found

(setting:output_matplotlib_strings)=
output_matplotlib_strings
: Remove, warn or error on matplotlib strings outputs. (e.g. `<Figure size 720x576 with 1 Axes>` or `Text(0.5, 0.98, 'Test 1')`). These can also be suppressed by ending your cell content with a semicolon in Jupyter Notebooks. The default is to remove these and warn (`"remove-warn"`).

    - `"show"`: show all matplotlib strings in outputs
    - `"remove"`: remove all matplotlib strings in outputs
    - `"remove-warn"` (default) or `"remove-error"`: remove all matplotlib strings in outputs, and log a warning or error
    - `"warn"` or "error": log a warning or error if matplotlib strings in outputs

## LaTeX Rendering Settings

Adding an object of `myst_to_tex` to the settings will allow you to control various default parts of how the LaTeX renderer behaves.

(setting:myst_to_tex:code_style)=
code_style
: Change the code rendering when writing code.

    - `"verbatim"` (default): Use the `\begin{verbatim}` environment
    - `"minted"`: Use the `\begin{minted}` environment with the language of the code block used
    - `"listings"`: Use the `\begin{listings}` environment with the language of the code block used
