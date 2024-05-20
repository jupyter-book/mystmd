// Created with jtex v.1.0.17
#import "lapreprint.typ": *
#show: template.with(
  title: "Testing Math Plugins",
  abstract: (
    (
      title: "Abstract",
      content: [

      ]
    ),
  ),
  date: datetime(
    year: 2024,
    month: 5,
    day: 20,
  ),
  keywords: (),
  authors: (
  ),
  affiliations: (
  ),
  margin: (
  ),
)


/* Math Macros */
#let three = $d$
#let one = $x$
#let five = $x = x$
#let six = $d = d$
#let seven = $d = d = d$

/* Written by MyST v1.2.3 */

= No plugins <no-plugins>

$ a^2 + b^2 = c^2 $
= Simple plugin <simple-plugin>

Project frontmatter should give us `d`

$ d = three $
Page should override and we should see `x`

$ x = one $
= Macros should recurse <macros-should-recurse>

Page frontmatter should fill in this project macro

$ five $
Project frontmatter should fill in this page macro

$ six $
Double recurse

$ seven $