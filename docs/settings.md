---
title: Project settings
description: Project and page settings for MyST
---

The `settings` field in the project or page frontmatter allows you to change how the parsing, transforms, plugins, or other behaviors of mystmd.

Here's an example of settings specified in **project frontmatter**

```{code-block} yaml
:filename: myst.yml
project:
  settings:
    output_matplotlib_strings: remove
    output_stderr: remove-warn
```

Here's an example of settings in **page frontmatter**

```{code-block} yaml
:filename: page.md

settings:
  output_matplotlib_strings: remove
  output_stderr: remove-warn
```

(project-settings)=

## Available settings fields

(setting:output_stderr)=
output_stderr
: Remove, warn or error on stderr outputs. (e.g. DeprecationWarnings, RuntimeWarnings)

    - `"show"`: (default): show all stderr (unless a `remove-stderr` tag is present on the cell)
    - `"remove"`: remove all stderr outputs
    - `"remove-warn"` or `"remove-error"`: remove all stderr, and log a warning or error
    - `"warn"` or "error": log a warning or error if a stderr is found

: Can be controlled or overridden by a [notebook cell tag](#tbl:notebook-cell-tags).

(setting:output_stdout)=
output_stdout
: Remove, warn or error on stdout outputs. (e.g. long text outputs, like text-based progress bars)

    - `"show"`: (default): show all stdout (unless a `remove-stdout` tag is present on the cell)
    - `"remove"`: remove all stdout outputs
    - `"remove-warn"` or `"remove-error"`: remove all stdout, and log a warning or error
    - `"warn"` or "error": log a warning or error if a stdout is found

: Can be controlled or overridden by a [notebook cell tag](#tbl:notebook-cell-tags).

(setting:output_matplotlib_strings)=
output_matplotlib_strings
: Remove, warn, or error on cell outputs that return a string-based Python object (e.g., matplotlib strings outputs, such as `<Figure size 720x576 with 1 Axes>` or `Text(0.5, 0.98, 'Test 1')`). These can also be suppressed by ending your cell content with a semicolon in Jupyter Notebooks. The default is to remove these and warn (`"remove-warn"`).

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

(setting:myst_to_tex:beamer)=
beamer
: Indicate you are building a beamer presentation.

    - `true`: Add `\begin{frame}` environment for each block, delimited by `+++`, and enable presentation outline with block metadata `+++ {"outline":true}`
    - `false` (default): No extra `\begin{frame}` environment will be used

(setting:error_rules)=

## Error Rules

The `error_rules` list in the project configuration can be used to disable or modify logging rules in the CLI:

```{code-block} yaml
:filename: myst.yml
project:
  error_rules:
    - rule: math-eqnarray-replaced
      severity: ignore
    - rule: link-resolves
      severity: ignore
      keys:
        - /known-internal-link
        - https://flaky-connection.com
        - 'https://example.org/**'
        - 'https://*.example.com/**'
```

The `severity` of each rule can be set to `ignore`, `warn`, or `error`. If the rule is triggered, then the severity listed will be adopted rather than the default log message severity. The default severity for rules included in the list is `ignore`, which means that simply listing the rule IDs as strings will ignore those rules. To discover the rule ID, run myst in debug mode to get the error (and optional key) printed to the console. For example, the above configuration updates will no longer warn on `math-eqnarray-replaced` and will also ignore the two links when running `myst build --check-links --strict` in continuous integration.

Some error rules support a `key` field that identifies specific instances of the error. This allows you to target particular cases rather than all instances of a rule. For example, the `link-resolves` rule uses the URL as the key, allowing you to ignore specific broken links while still checking others. Similarly, the `doi-link-valid` rule uses the DOI value as the key, so you can ignore specific invalid DOIs while still validating others. When a rule supports keys, you can provide a list of keys (or key patterns) in the `keys` field to match multiple specific instances.

:::{seealso .dropdown} List of Error Rules

The full list of errors and warnings used across MyST with their defaults shown.

```{myst:error-rules-list}

```

:::

### Pattern Matching in Keys

Keys support glob patterns, allowing you to match multiple URLs or paths with a single pattern. Patterns use the same glob syntax as many modern build tools:

- `*` matches any characters except `/` (e.g., `https://example.com/*` matches `https://example.com/page` but not `https://example.com/path/to/page`)
- `**` matches any characters including `/` (e.g., `https://example.org/**` matches all URLs under `example.org`)
- `?` matches a single character (e.g., `page?` matches `page1`, `page2`, etc.)
- `*.example.com` matches any subdomain (e.g., `www.example.com`, `blog.example.com`)
- Brace expansion like `{www,blog}.example.com` matches either `www.example.com` or `blog.example.com`
- Use `{http,https}://` to match both HTTP and HTTPS protocols (e.g., `{http,https}://api.example.com/**` matches both protocol variants)

:::{note .dropdown} Automatically Skipped Domains

The following domains are automatically skipped by the link checker and do not need to be added to error_rules:

- `example.com`, `example.org`, `example.net` (and their `www.` variants) - Reserved for documentation per RFC 2606
- `linkedin.com`, `twitter.com`, `medium.com`, `wikipedia.org` - Block automated access from CI environments

:::

**Common use cases:**

To fail CI when there are missing links, you can use `myst build --check-links --strict` with the following example `myst.yml` configuration.

```{code-block} yaml
:filename: myst.yml
project:
  error_rules:
    # Match both HTTP and HTTPS for a domain
    - rule: link-resolves
      keys:
        - '{http,https}://legacy-api.mysite.com/**'
        - '{http,https}://staging.mysite.com/**'
```

This is particularly useful for ignoring groups of external links that may be blocked in CI environments or example URLs that don't need to be checked.
