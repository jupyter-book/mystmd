Admonition node for drawing attention to text, separate from the neighboring content

__type__: _string_, ("admonition")
: See also {ref}`node`

__kind__: _string_, _optional_, ("attention" | "caution" | "danger" | "error" | "hint" | "important" | "note" | "seealso" | "tip" | "warning")
: kind of admonition, to determine styling

__class__: _string_, _optional_
: admonition class info to override kind

__children__: _array_, _optional_, ({ref}`admonitiontitle` | {ref}`flowcontent`)
: An optional `admonitionTitle` followed by the admonitions content.

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`

