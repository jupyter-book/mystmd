# Grid inside figure

Manual test for `grid` as valid figure content (see `myst-transforms` `SUBFIGURE_TYPES`).

## Figure with grid and images

::::::{figure}
:label: fig-grid-images

:::::{grid} 1 2 2 2

::::{grid-item}

![](https://picsum.photos/seed/grid-a/320/200)

::::

::::{grid-item}

![](https://picsum.photos/seed/grid-b/320/200)

::::

::::{grid-item}

![](https://picsum.photos/seed/grid-c/320/200)

::::

:::::

A figure caption with a responsive grid of images.

::::::

## Figure with grid and text only

::::::{figure}
:label: fig-grid-text

:::::{grid} 1 1 2 2

::::{grid-item}

Panel A

::::

::::{grid-item}

Panel B

::::

::::{grid-item}

Panel C

::::

:::::

Simple grid panels without widgets.

::::::
