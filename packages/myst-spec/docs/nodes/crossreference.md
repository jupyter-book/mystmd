In-line reference to an associated node

__type__: _string_, ("crossReference")
: See also {ref}`node`

__kind__: _string_, _optional_, ("eq" | "numref" | "ref")
: Indicates if the references should be numbered.
   ```{warning}
   The `kind` was based on docutils and is subject to change as we improve the `crossReference` experience.
   ```

__children__: _array_, _optional_, ({ref}`staticphrasingcontent`)
: Children of the crossReference, can include text with "%s" or "{number}" and enumerated references will be filled in.

__identifier__: _string_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`

