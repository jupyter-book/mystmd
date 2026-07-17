---
title: Beamer Template
description: jtex can render to beamer templates, and needs an additional flag to indicate some differences in pre-processing in `myst-to-tex`.
---

```{danger}
Beamer templating is currently in development, and cannot yet be accessed through the command line tools. Please see [github](https://github.com/jupyter-book/mystmd/issues/97) for updates.
```

Beamer slides are created in MyST by separating them out into blocks, denoted by the `+++` markup with optional metadata in JSON.

```markdown
+++ { "outline": true }

# Introduction

## Background

+++

### My Background Slide Title

This is some background on beamer templates, use a combination:

- of `myst-to-tex` for conversion; and
- `jtex` for templating.
```

For simple presentations, all you need to know is the `+++` to separate your slides. Beamer also allows you to create headers that are outside of the slide content, which help structure a talk outline. If you also want content that is outside of your slide frames, use the block metadata and put `{ "outline": true }` to indicate that that block should be treated as the outline. If `outline` is set to `true`, the entire contents of the block will not be included in a slide, you should only include heading information in these slides.

Additionally, if the first content encountered in a block is a header (of any depth), the header will be used as the `frametitle`, which is often displayed differently in a presentation. The MyST markdown above will turn into:

```latex
\section{Introduction}

\subsection{Background}

\begin{frame}
\frametitle{My Background Slide Title}

This is some background on beamer templates, use a combination:

\begin{enumerate}
\item of \texttt{myst-to-tex} for conversion; and
\item \texttt{jtex} for templating.
\end{enumerate}
\end{frame}
```
