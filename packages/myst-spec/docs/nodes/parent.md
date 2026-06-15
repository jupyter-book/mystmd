Basic node with required node children

__children__: _array_, ({ref}`node`)
: List of children nodes

__type__: _string_
: identifier for node variant
: See also {ref}`node`

__data__: _object_, _optional_
: information associated by the ecosystem with the node; never specified by mdast
: See also {ref}`node`

__position__: _object_, _optional_, ({ref}`position`)
: location of node in source file; must not be present for generated nodes
: See also {ref}`node`

