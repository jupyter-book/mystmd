Top-level container node to provide association and numbering to child content

__type__: _string_, ("container")
: See also {ref}`node`

__kind__: _string_, ("figure" | "table")
: kind of container contents

__class__: _string_, _optional_
: any custom class information

__enumerated__: _boolean_, _optional_
: count this container for numbering based on kind, e.g. Figure 1a

__enumerator__: _string_, _optional_
: resolved enumerated value for this container

__children__: _array_, ({ref}`caption` | {ref}`legend` | {ref}`image` | {ref}`table`)
: See also {ref}`parent`

__identifier__: _string_, _optional_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`

