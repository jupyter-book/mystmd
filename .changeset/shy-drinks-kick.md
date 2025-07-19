---
'myst-cli': minor
---

Currently, the static export triggered by `myst build --html` exports
`any/route` to `any/route.html`. This makes it hard to deploy to
static page sites like GitHub (or even Apache), which all expect
`/any/route` to point to `any/route/index.html`. This change is to
update the static export to using that naming convention, i.e. to
produce the `index.html` files as expected.
