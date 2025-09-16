# Introduction

This is the TUD JB2 template to produce your own online interactive textbook. 

## Set up your own repository
Follow these instruction to use this template for your own book.

1. Go to this [repository](https://github.com/TUD-JB-Templates/JB2/template.git)
2. Click the green button `use this template` and click `create a new repository`.
3. Choose a proper name of your repository (this will be also part of your URL!) and choose the option `public`.
4. In your repository, click on `settings` and in the left menu on Pages` and choose `Github actions`

``` {figure} ../Figures/set_up_pages.png
```

5. Click on `code` and click on the `gear-icon` (near **About**) at the right site of the page. 
6. Check the box **Use your GitHub Pages website**.
7. Go to `actions` in the topmenu, click on the (red) `initial commit` and click `re-run all jobs`

The book will now be deployed again - where now it can actually load GitHub pages. 

```{figure} ../Figures/rerunjobs.PNG
---
name: fig_rerun
width: 70%
---
Once the book has been deploy, all circles will be green.
```

8. Use the book link  (`code` $\rightarrow$ below **About**) to your Github page where the book is hosted.
9. The output resembles {numref}`Figuur {number} <fig_templatebook>`.

``` {figure} ../Figures/templateboekoutput.PNG
---
name: fig_templatebook
width: 100%
---
The output of the template book is the same as your book.
```

<!-- 
```{experiment} 123
admonitions are cool
``` 
-->





```{exercise} Testing
test 123
``` 

```{example} Here is an example
testing conversion
```

```{intermezzo} And an intermezzo
intermezzo
```

```{iframe} https://www.youtube.com/embed/oL4-ipL62pQ?si=3G_VbzWoJ2cFF_A3
:name: vid_1

a great movie
```





````{example} An example of nesting admonitions
blabla


```{figure} ../Figures/Cover.PNG
:name: no_name

Figuur
```

````
