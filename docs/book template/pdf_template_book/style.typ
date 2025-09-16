  
#let leftCaption(it) = {
  set text(size: 8pt)
  set align(left)
  set par(justify: true)

  // Within the context of the element, you may use the counter
  context(it, {
    text(weight: "bold")[#it.supplement #it.counter.display(it.numbering).]
  })

  h(4pt)
  set text(fill: black.lighten(20%), style: "italic")
  it.body
}


#let template(
  // The book's title.
  title: "Book Title",
  subtitle: none,
  authors: "Your name",
  cover: "path",            // <— path to cover "images/cover.png"
  cover_width: 12cm,    
  // A color for the theme of the document
  theme: red.darken(30%),
  // The book's content.
  body
) = {
  
  set page(numbering: none) //numbering off until first chapter
  
  set heading(numbering: (..args) => {
    let nums = args.pos()
    let level = nums.len()
    if level == 1 {
      [#numbering("1.", ..nums)]
    } else {
      [#numbering("1.1.1", ..nums)]
    }
  })

  // figure
  set figure(numbering: (..args) => {
    let chapter = counter(heading).display((..nums) => nums.pos().at(0))
    [#chapter.#numbering("1", ..args.pos())]
  })
  

  // Configure equation numbering and spacing.
  set math.equation(numbering: (..args) => {
    let chapter = counter(heading).display((..nums) => nums.pos().at(0))
    [(#chapter.#numbering("1)", ..args.pos())]
  })
  show math.equation: set block(spacing: 1em)


  // Configure lists.
  set enum(indent: 10pt, body-indent: 9pt)
  set list(indent: 10pt, body-indent: 9pt)

// COVERPAGE
  // Title, subtitle, 
  align(center, text(17pt, weight: "bold", fill: theme, title))
  if subtitle != none {
    parbreak()
    box(text(14pt, fill: gray.darken(30%), subtitle))
  }

    if cover != none {
      v(1em)
      align(center, image(cover, width: cover_width))
    }

  //author
  v(1em)

  // authors in gray
  if authors != none {
  place(bottom + right, 
    text(12pt, fill: gray.darken(50%), authors)
  )
  }


  // Outline of book
  pagebreak()
  show outline.entry.where(level: 1): it => {
    v(12pt, weak: true)
    strong(it)
  }
  outline(indent: auto)

  show heading.where(level: 1): it => {
    pagebreak()
    // Reset alle relevante tellers bij elk nieuw hoofdstuk
    counter(figure).update(0)                // alle figuren (ongeacht kind)
    counter(figure.where(kind: table)).update(0) // specifiek voor tabellen
    counter(math.equation).update(0)

    it
  }

  // include pagenumber and set it to 1
  set page(numbering: "1")
  counter(page).update(1)


  // Display the book's contents.
  [#body]
}