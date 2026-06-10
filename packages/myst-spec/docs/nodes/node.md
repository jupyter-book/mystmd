Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.

__type__: _string_
: identifier for node variant

__data__: _object_, _optional_
: information associated by the ecosystem with the node; never specified by mdast

__position__: _object_, _optional_, ({ref}`position`)
: location of node in source file; must not be present for generated nodes

