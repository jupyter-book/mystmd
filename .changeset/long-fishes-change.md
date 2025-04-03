---
'myst-cli': patch
---

This makes a fix to the checkLinkTransform, that processes `card` nodes in addition to `links`. Card nodes can have optional `url` properties, which when undefined cause a fatal error.
