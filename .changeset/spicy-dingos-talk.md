---
"myst-cli": patch
"tex-to-myst": patch
---

Support page parameter for includegraphics with multi-page pdf
In LaTeX, when including a multi-page PDF as a graphic, it's possible to specify a page number:
```
\includegraphics[width=1.0\textwidth,page=3]{figures/my_pic.pdf}
```
ImageMagick now extracts the correct page when converting from LaTeX.
