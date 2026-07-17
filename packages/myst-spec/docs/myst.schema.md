# Node Type Index

(flowcontent)=
## FlowContent

Any of {ref}`paragraph` | {ref}`definition` | {ref}`heading` | {ref}`thematicbreak` | {ref}`blockquote` | {ref}`list` | {ref}`html` | {ref}`code` | {ref}`comment` | {ref}`target` | {ref}`directive` | {ref}`admonition` | {ref}`container` | {ref}`math` | {ref}`table` | {ref}`footnotedefinition`

(listcontent)=
## ListContent

Only {ref}`listitem`

(phrasingcontent)=
## PhrasingContent

Any of {ref}`staticphrasingcontent` | {ref}`emphasis` | {ref}`strong` | {ref}`link` | {ref}`linkreference` | {ref}`subscript` | {ref}`superscript` | {ref}`underline` | {ref}`abbreviation` | {ref}`crossreference` | {ref}`footnotereference`

(staticphrasingcontent)=
## StaticPhrasingContent

Any of {ref}`text` | {ref}`html` | {ref}`emphasisstatic` | {ref}`strongstatic` | {ref}`inlinecode` | {ref}`break` | {ref}`image` | {ref}`imagereference` | {ref}`role` | {ref}`subscriptstatic` | {ref}`superscriptstatic` | {ref}`underlinestatic` | {ref}`inlinemath`

(blockbreak)=
## BlockBreak

Top-level break in the myst document, breaking it into Blocks

__type__: _string_, ("blockBreak")
: See also {ref}`node`

__meta__: _string_, _optional_
: Block metadata. Conventionally this is a stringified JSON dictionary but it may be any arbitrary string.

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(block)=
## Block

Top-level content blocks or cells the myst document, delimited by BlockBreaks

__type__: _string_, ("block")
: See also {ref}`node`

__meta__: _string_, _optional_
: block metadata from preceding break; conventionally, a stringified JSON dictionary but may be any arbitrary string

__children__: _array_, _optional_, ({ref}`flowcontent` | {ref}`listcontent` | {ref}`phrasingcontent`)
: Top-level children of myst document

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(role)=
## Role

Custom in-line behavior

__type__: _string_, ("mystRole")
: See also {ref}`node`

__name__: _string_
: No description for this property.

__value__: _string_, _optional_
: content of the directive

__children__: _array_, _optional_, ({ref}`phrasingcontent`)
: parsed role content

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(directive)=
## Directive

Content block with predefined behavior

__type__: _string_, ("mystDirective")
: See also {ref}`node`

__name__: _string_
: No description for this property.

__args__: _string_, _optional_
: No description for this property.

__options__: _object_, _optional_
: No description for this property.

__value__: _string_, _optional_
: body of the directive, excluding options

__children__: _array_, _optional_, ({ref}`flowcontent` | {ref}`phrasingcontent`)
: parsed directive content

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(target)=
## Target

Target node - provides identifier/label for the following node

__type__: _string_, ("mystTarget")
: See also {ref}`node`

__label__: _string_, _optional_
: unresolved target label

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(crossreference)=
## CrossReference

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


(abbreviation)=
## Abbreviation

Abbreviation node described by title

__type__: _string_, ("abbreviation")
: See also {ref}`node`

__children__: _array_, ({ref}`staticphrasingcontent`)
: abbreviated value
: See also {ref}`parent`

__title__: _string_, _optional_
: advisory information for the abbreviation

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(admonition)=
## Admonition

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


(admonitiontitle)=
## AdmonitionTitle

Custom title for admonition, replaces kind as title

__type__: _string_, ("admonitionTitle")
: See also {ref}`node`

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(container)=
## Container

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


(caption)=
## Caption

Caption for container content

__type__: _string_, ("caption")
: See also {ref}`node`

__children__: _array_, ({ref}`flowcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(legend)=
## Legend

Legend for container content

__type__: _string_, ("legend")
: See also {ref}`node`

__children__: _array_, ({ref}`flowcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(footnotereference)=
## FootnoteReference

Inline reference to footnote

__type__: _string_, ("footnoteReference")
: See also {ref}`node`

__identifier__: _string_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(footnotedefinition)=
## FootnoteDefinition

Rich footnote content associated with footnote reference

__type__: _string_, ("footnoteDefinition")
: See also {ref}`node`

__children__: _array_, ({ref}`flowcontent`)
: See also {ref}`parent`

__identifier__: _string_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(math)=
## Math

Math node for presenting numbered equations

__type__: _string_, ("math")
: See also {ref}`node`

__enumerated__: _boolean_, _optional_
: count this math block for numbering based on kind, e.g. See equation (1a)

__enumerator__: _string_, _optional_
: resolved enumerated value for this math block

__identifier__: _string_, _optional_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__value__: _string_
: See also {ref}`literal`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(inlinemath)=
## InlineMath

Fragment of math, similar to InlineCode, using role {math}

__type__: _string_, ("inlineMath")
: See also {ref}`node`

__value__: _string_
: See also {ref}`literal`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(table)=
## Table

Two-dimensional table data

__type__: _string_, ("table")
: See also {ref}`node`

__align__: _string_, _optional_, ("left" | "center" | "right")
: No description for this property.

__children__: _array_, ({ref}`tablerow`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(tablerow)=
## TableRow

One row of table containing cells

__type__: _string_, ("tableRow")
: See also {ref}`node`

__children__: _array_, ({ref}`tablecell`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(tablecell)=
## TableCell

One cell of table

__type__: _string_, ("tableCell")
: See also {ref}`node`

__header__: _boolean_, _optional_
: No description for this property.

__align__: _string_, _optional_, ("left" | "center" | "right")
: alignment of content within cell

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(subscript)=
## Subscript

Subscript content, using role {subscript}

__type__: _string_, ("subscript")
: See also {ref}`node`

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(subscriptstatic)=
## SubscriptStatic

Subscript content, with static children; used when parent node requires static content

__type__: _string_, ("subscript")
: See also {ref}`node`

__children__: _array_, ({ref}`staticphrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(superscript)=
## Superscript

Superscript content, using role {superscript}

__type__: _string_, ("superscript")
: See also {ref}`node`

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(superscriptstatic)=
## SuperscriptStatic

Superscript content, with static children; used when parent node requires static content

__type__: _string_, ("superscript")
: See also {ref}`node`

__children__: _array_, ({ref}`staticphrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(underline)=
## Underline

Underline content, using role {underline}

__type__: _string_, ("underline")
: See also {ref}`node`

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(underlinestatic)=
## UnderlineStatic

Underline content, with static children; used when parent node requires static content

__type__: _string_, ("underline")
: See also {ref}`node`

__children__: _array_, ({ref}`staticphrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(comment)=
## Comment

Comment nodes for comments present in myst but ignored upon render

__type__: _string_, ("mystComment")
: See also {ref}`node`

__value__: _string_
: See also {ref}`literal`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(paragraph)=
## Paragraph

__type__: _string_, ("paragraph")
: See also {ref}`node`

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(heading)=
## Heading

__type__: _string_, ("heading")
: See also {ref}`node`

__depth__: _integer_
: No description for this property.

__enumerated__: _boolean_, _optional_
: count this heading for numbering based on kind, e.g. Section 2.4.1

__enumerator__: _string_, _optional_
: resolved enumerated value for this heading

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__identifier__: _string_, _optional_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(thematicbreak)=
## ThematicBreak

__type__: _string_, ("thematicBreak")
: See also {ref}`node`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(blockquote)=
## Blockquote

__type__: _string_, ("blockquote")
: See also {ref}`node`

__children__: _array_, ({ref}`flowcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(list)=
## List

__type__: _string_, ("list")
: See also {ref}`node`

__ordered__: _boolean_, _optional_
: Is item order important or not?

__start__: _integer_, _optional_
: Starting number of ordered list

__spread__: _boolean_, _optional_
: One or more children are separated with a blank line from others

__children__: _array_, ({ref}`listcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(listitem)=
## ListItem

__type__: _string_, ("listItem")
: See also {ref}`node`

__spread__: _boolean_, _optional_
: One or more children are separated with a blank line from others

__children__: _array_, ({ref}`phrasingcontent` | {ref}`flowcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(html)=
## HTML

Fragment of raw HTML - does not need to be valid or complete

__type__: _string_, ("html")
: See also {ref}`node`

__value__: _string_
: See also {ref}`literal`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(code)=
## Code

Block of preformatted text

__type__: _string_, ("code")
: See also {ref}`node`

__lang__: _string_, _optional_
: language of the code

__meta__: _string_, _optional_
: custom information relating to the node

__class__: _string_, _optional_
: user-defined class for code block

__showLineNumbers__: _boolean_, _optional_
: No description for this property.

__startingLineNumber__: _integer_, _optional_
: No description for this property.

__emphasizeLines__: _array_, _optional_, (integer)
: No description for this property.

__identifier__: _string_, _optional_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__value__: _string_
: See also {ref}`literal`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(definition)=
## Definition

Reference to a url resource

__type__: _string_, ("definition")
: See also {ref}`node`

__identifier__: _string_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__url__: _string_
: See also {ref}`resource`

__title__: _string_, _optional_
: See also {ref}`resource`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(text)=
## Text

__type__: _string_, ("text")
: See also {ref}`node`

__value__: _string_
: See also {ref}`literal`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(emphasis)=
## Emphasis

Stressed, italicized content

__type__: _string_, ("emphasis")
: See also {ref}`node`

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(emphasisstatic)=
## EmphasisStatic

Stressed, italicized content, with static children; used when parent node requires static content

__type__: _string_, ("emphasis")
: See also {ref}`node`

__children__: _array_, ({ref}`staticphrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(strong)=
## Strong

Important, serious, urgent, bold content

__type__: _string_, ("strong")
: See also {ref}`node`

__children__: _array_, ({ref}`phrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(strongstatic)=
## StrongStatic

Important, serious, urgent, bold content, with static children; used when parent node requires static content

__type__: _string_, ("strong")
: See also {ref}`node`

__children__: _array_, ({ref}`staticphrasingcontent`)
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(inlinecode)=
## InlineCode

Fragment of code

__type__: _string_, ("inlineCode")
: See also {ref}`node`

__value__: _string_
: See also {ref}`literal`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(break)=
## Break

Line break

__type__: _string_, ("break")
: See also {ref}`node`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(link)=
## Link

Hyperlink

__type__: _string_, ("link")
: See also {ref}`node`

__children__: _array_, ({ref}`staticphrasingcontent`)
: See also {ref}`parent`

__url__: _string_
: See also {ref}`resource`

__title__: _string_, _optional_
: See also {ref}`resource`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(image)=
## Image

Image hyperlink

__type__: _string_, ("image")
: See also {ref}`node`

__class__: _string_, _optional_
: user-defined class for image

__width__: _string_, _optional_
: image width in pixels or percentage

__align__: _string_, _optional_, ("left" | "center" | "right")
: No description for this property.

__url__: _string_
: See also {ref}`resource`

__title__: _string_, _optional_
: See also {ref}`resource`

__alt__: _string_, _optional_
: See also {ref}`alternative`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(linkreference)=
## LinkReference

Hyperlink through association

__type__: _string_, ("linkReference")
: See also {ref}`node`

__children__: _array_, ({ref}`staticphrasingcontent`)
: See also {ref}`parent`

__referenceType__: _string_, ("shortcut" | "collapsed" | "full")
: See also {ref}`reference`

__identifier__: _string_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(imagereference)=
## ImageReference

Image through association

__type__: _string_, ("imageReference")
: See also {ref}`node`

__referenceType__: _string_, ("shortcut" | "collapsed" | "full")
: See also {ref}`reference`

__identifier__: _string_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: See also {ref}`optionalassociation`

__alt__: _string_, _optional_
: See also {ref}`alternative`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


(resource)=
## Resource

Reference to external resource

__url__: _string_
: A Uniform Resource Locator (URL) to an external resource or link.

__title__: _string_, _optional_
: advisory information, e.g. for a tooltip


(optionalassociation)=
## OptionalAssociation

Internal relation from one node to another; not required by node

__identifier__: _string_, _optional_
: identifier that may match another node; value is unparsed and must be normalized such that whitespace is collapsed to single space, initial/final space is trimmed, and case is folded

__label__: _string_, _optional_
: node label; character escapes and references are parsed; may be normalized to a unique identifier


(association)=
## Association

Internal relation from one node to another

__identifier__: _string_
: See also {ref}`optionalassociation`

__label__: _string_, _optional_
: node label; character escapes and references are parsed; may be normalized to a unique identifier
: See also {ref}`optionalassociation`


(alternative)=
## Alternative

Alternative description of image

__alt__: _string_, _optional_
: field describing the image


(reference)=
## Reference

Marker associated to another node

__referenceType__: _string_, ("shortcut" | "collapsed" | "full")
: explicitness of the reference:
   `shortcut` - reference is implicit, identifier inferred
   `collapsed` - reference explicit, identifier inferred
   `full` - reference explicit, identifier explicit


(node)=
## Node

Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.

__type__: _string_
: identifier for node variant

__data__: _object_, _optional_
: information associated by the ecosystem with the node; never specified by mdast

__position__: _object_, _optional_, ({ref}`position`)
: location of node in source file; must not be present for generated nodes


(literal)=
## Literal

Basic node with required string value

__value__: _string_
: The value of the node

__type__: _string_
: identifier for node variant
: See also {ref}`node`

__data__: _object_, _optional_
: information associated by the ecosystem with the node; never specified by mdast
: See also {ref}`node`

__position__: _object_, _optional_, ({ref}`position`)
: location of node in source file; must not be present for generated nodes
: See also {ref}`node`


(parent)=
## Parent

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


(point)=
## Point

One place in a source file

__line__: _integer_
: line in the source file, 1-indexed

__column__: _integer_
: column in the source file, 1-indexed

__offset__: _integer_, _optional_
: offset character in the source file, 0-indexed


(position)=
## Position

Location of a node in a source file

__start__: _object_, ({ref}`point`)
: place of first character of parsed source region

__end__: _object_, ({ref}`point`)
: place of first character after parsed source region, whether it exists or not

__indent__: _array_, _optional_, (integer)
: start column at each index in the source region, for elements that span multiple lines


(root)=
## Root

Myst syntax tree built on existing mdast schemas

__type__: _string_, ("root")
: See also {ref}`node`

__children__: _array_, ({ref}`block` | {ref}`blockbreak` | {ref}`flowcontent`)
: Top-level children of myst document
: See also {ref}`parent`

__position__: _object_, _optional_, ({ref}`position`)
: See also {ref}`node`

__data__: _object_, _optional_
: See also {ref}`node`


