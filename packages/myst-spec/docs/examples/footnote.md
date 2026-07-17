``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
Here's a simple footnote,[^1] and here's a longer one.[^bignote]

[^1]: This is the first footnote.

[^bignote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    `{ my code }`

    Add as many paragraphs as you like.
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: paragraph
    children:
      - type: text
        value: Here's a simple footnote,
      - type: footnoteReference
        identifier: '1'
        label: '1'
      - type: text
        value: ' and here''s a longer one.'
      - type: footnoteReference
        identifier: bignote
        label: bignote
  - type: footnoteDefinition
    identifier: '1'
    label: '1'
    children:
      - type: paragraph
        children:
          - type: text
            value: This is the first footnote.
  - type: footnoteDefinition
    identifier: bignote
    label: bignote
    children:
      - type: paragraph
        children:
          - type: text
            value: Here's one with multiple paragraphs and code.
      - type: paragraph
        children:
          - type: text
            value: Indent paragraphs to include them in the footnote.
      - type: paragraph
        children:
          - type: inlineCode
            value: '{ my code }'
      - type: paragraph
        children:
          - type: text
            value: Add as many paragraphs as you like.

```
````

````{tab-item} Render
:sync: render

Here's a simple footnote,[^1] and here's a longer one.[^bignote]

[^1]: This is the first footnote.

[^bignote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    `{ my code }`

    Add as many paragraphs as you like.

````

``````

