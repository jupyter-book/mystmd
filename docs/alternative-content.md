---
title: Alternatives
description: Specify alternative representations for videos and animated graphics.
---

The MyST Document Engine supports multiple kinds of export targets, such as PDF via Typst, and web deployments. Each of these has its own preferred set of image formats that it can display, and certain content may not be supported by one or more exporters (such as HTML). 

Authors can use the {myst:directive}`alternatives` directive to define several representations of the same conceptual entity in order to allow different exports to choose their preferred representation:

````{myst}
:::{alternatives}
![](https://gifdb.com/images/high/earth-spinning-and-rotating-zxmey0cjachu1buc.gif)
![](http://pngimg.com/uploads/earth/earth_PNG39.png)
:::
````

In the above example, exporters (such as the PDF exporter) that do not understand GIF images will choose the PNG representation instead. Meanwhile, exporters that support GIF images _may_ choose the GIF _if_ it is preferred over the PNG format (which it usually is). The decision about which content to render lies with the exporter, not the MyST engine.

For now, the `alternatives` directive only supports the following content:
1. Images
2. Videos
3. Anywidgets

:::{note}
In future, we expect to open this up to more complex types such as figures with different images and captions.
:::
