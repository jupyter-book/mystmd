# Markdown (Cheatsheet)

Markdown is een eenvoudige opmaaktaal: platte tekst die *opgemaakt* wordt met kleine stukjes 'code'. Die tekst is vervolgens snel te exporteren naar allerlei andere formats zoals pdf, word, html etc.

```{figure} ../Figures/MyST.PNG
:width:80%

Een Jupyter Book gemaakt met MyST vraagt een collectie van markdown en jupyter notebooks die vervolgens geëxporteerd kunnen worden naar pdf, html maar ook word.
```

## Structuur
We kunnen hier onderscheid maken in twee structuren: die van de inhoud van de boek (een collectie van verschillende documenten), en de (interne)structuur van de hoofdstukken.

### Table of Contents
De software waar we gebruik van maken bouwt zelf een inhoudsopgave (Table of contents, ookwel ToC). Dat gaat op alfabetische volgorde. Maar je kunt ook zelf de ToC specificeren. Dit kan wel het beste door offline te werken (myst init --toc), zie de [documentatie van MyST](https://mystmd.org/guide/table-of-contents#toc-format-legacy). 

### Hoofdstukken
Om onderscheid te maken tussen hoofdstuk, sectie en subsectie (en verder) wordt er gewerkt met aantal `#`, zie hieronder.

```markdown
# H1 hoofdstuk  
## H1.1 sectie   
### H1.1.3 subsectie  
```

```{tip}
Nummer je hoofdstukken en sectie niet! Dit gebeurt automatisch.
```

Een nieuwe regel krijg je door of een harde enter en een witregel, of door een \ achter de zin en een enter of door twee spaties achter de zin.


### Nieuwe regel
::::{tab-set}
:::{tab-item} list
Een nieuwe regel met dubbele spatie.  
Een nieuwe regel met een `\`.\
Een niet regel met een harde enter en witregel.

Einde oefening.
En een voorbeeld als de vorige regel niet eindigt met bovenstaande.
:::
:::{tab-item} syntax
```markdown
Een nieuwe regel met dubbele spatie.  
Een nieuwe regel met een `\`.\
Een nieuw regel met een harde enter en witregel.

Einde oefening.
En een voorbeeld als de vorige regel niet eindigt met bovenstaande.
```
:::
::::


## Basic opmaak
Markdown is een opmaaktaal waarbij de formatting van de tekst gedaan wordt met kleine stukjes code (net als bij HTML).

| Element | Syntax | Voorbeeld | 
| --- | --- | --- |
| Bold | `**dik gedrukte tekst**` | **Bold** |
| Italic | `*italics*` | *Italics*
| Emphasis | `***emphasis***` | ***emphasis*** |
| in line Formule | `$F = m \cdot a$` | $F = m \cdot a$ |
| Super en subscript | ``H{sub}`2`O, and 4{sup}`th` of July`` | H{sub}`2`O, and 4{sup}`th` of July|
| Footnote | ` - A footnote reference[^myref] \ [^myref]: This is an auto-numbered footnote definition.`|- A footnote reference[^myref] \ [^myref]: This is an auto-numbered footnote definition.| 


### Lijsten optie 1
::::{tab-set}
:::{tab-item} list
1. item 1
1. item 2.
1. item 3.
:::
:::{tab-item} syntax
```markdown
1. item 1
1. item 2.
1. item 3.
```
:::
::::

### Lijsten optie 2
::::{tab-set}
:::{tab-item} list
1. item 1
2. item 2.
3. item 3.
:::
:::{tab-item} syntax
```markdown
1. item 1
2. item 2.
3. item 3.
```
:::
::::

### Tabbladen

```markdown
::::{tab-set}
:::{tab-item} Tab 1
Hier tekst in tab 1
:::

:::{tab-item} Tab 2
Hier tekst in tab 2
:::
::::
```

### Afvinklijsten 
::::{tab-set}
:::{tab-item} list
- [x] Een markdown cheatsheet maken
- [x] Online zetten
- [] Laten testen
:::
:::{tab-item} syntax
```markdown
- [x] Een markdown cheatsheet maken
- [x] Online zetten
- [] Laten testen
```
:::
::::


## Formules

Voor de betavakken zijn wiskundige vergelijkingen essentieel. Ook in JB's kun je vergelijkingen opnemen. Wat in LaTeX kan, kan in JB ook, bijv:

$$ F_{res} = m \cdot a$$ (eq:Newton)

Waarbij gelabelde vergelijkingen, zoals {eq}`eq:Newton` naar verwezen kan worden. 

`$$ Vergelijking $$`

Maar je kunt ook inline vergelijkingen opnemen zoals deze: $s=v_{gem}t$. Daarbij gebruik je een enkele dollar teken voor en na je `$ Vergelijking $`


|Naam|Script|Symbolen|
|---|---|---|
|wortel|`\sqrt{4}`|$\sqrt{4}$|
|macht|`^{2x}`|$^{2x}$|
|breuk|`\frac{2}{3}`|$\frac{2}{3}$|
|subscript|`_{gem}`|$_{gem}$
|superscript|`^{N}`|$^{N}$|
|vermenigvuldig|`\cdot`|$\cdot$|

Met wat voorbeelden:
|Naam|Script|Output|
|---|---|---|
|Afgeleide|`\frac{\Delta f}{\Delta t}`|$\frac{\Delta f}{\Delta t}$|
|Integraal|`\int_a^b dx`|$\int_a^b dx$|
|sinus|`sin(x)`|$sin(x)$|

Uitgebreider: https://en.wikibooks.org/wiki/LaTeX/Mathematics

## Admonitions
Je kunt speciale blokken toevoegen die gehighlight worden in de tekst. Zie bijvoorbeeld onderstaande waarschuwing.

```{warning}
Hier een waarschuwing
```

Daar zijn verschillende varianten van zoals:
* tip 
* admonition 
* warning 
* note 
* objective 
* see also ...

```{tip} De gouden...
Exercises zijn een speciaal soort admonition.
```

### Opdrachten
```{exercise} Opdracht 1
:label: ex_opdr_1

Maak de som $4+2$
```

```{solution} ex_opdr_1
:class: dropdown

6
```

## Figuren
Een site / boek kan natuurlijk niet zonder figuren. Er zijn grofweg twee manieren om een figuur te maken

*Snelle figuur, zonder opmaak mogelijkheden*

| Snelle figuur | `![](link naar figuur)` |

*Betere manier met meer controle:*

::::{tab-set}
:::{tab-item} Figuren

```{figure} https://github.com/rowanc1/pics/blob/main/sunset.png
:label: fig_sunset
:width: 70%
:align: center

Met een mooi onderschrift
```

:::

:::{tab-item} MyST Syntax

````markdown
```{figure} https://github.com/rowanc1/pics/blob/main/sunset.png
:label: fig1
:width: 70%
:align: center

Met een mooi onderschrift
```
````

:::
::::

Hier hebben we gebruik gemaakt van figuren die op het internet staan, maar je kunt ook figuren zelf toevoegen aan een folder (bijv. genaamd *Figuren*), waarbij je dan een relatief pad op geeft.

## Tabellen

Tabellen worden gemaakt met scheidingsteken `|`

::::{tab-set}
:::{tab-item} Tabellen

```
|Kop 1|Kop 2|Kop3|
|---|---|---|
|tekst 1|tekst 2|tekst 3|
|tekst 4|tekst 5|tekst 6|
```

:::

:::{tab-item} MyST Syntax

````markdown
```
|Kop 1|Kop 2|Kop3|
|---|---|---|
|tekst 1|tekst 2|tekst 3|
|tekst 4|tekst 5|tekst 6|
```
````

:::
::::

Of via ...

::::{tab-set}
:::{tab-item} Tabellen

```{list-table} Overzicht van sancties bij bepaald gedrag
:header-rows: 1
:name: tl_sancties
* - Gedrag
    - Sanctie bij 1e keer
    - Sanctie bij 2e keer
* - Niet (tijdig of met een geldige reden) afgemeld 
    - Een penalty                                       
    - uitsluiting              
```

:::

:::{tab-item} MyST Syntax

````markdown
```{list-table} Overzicht van sancties bij bepaald gedrag
:header-rows: 1
:name: tl_sancties
* - Gedrag
    - Sanctie bij 1e keer
    - Sanctie bij 2e keer
* - Niet (tijdig of met een geldige reden) afgemeld 
    - Een penalty                                       
    - uitsluiting              
``` 
````

:::
::::

Methode 2 heeft als voordeel de mogelijkheid tot refereren naar {numref}`Tabel {number} <tl_sancties>`


## YouTube
Voor het embedden van YouTube filmpjes op de site heb je de embed YT link nodig. De code wordt dan:

::::{tab-set}
:::{tab-item} YouTube
```{iframe} https://www.youtube.com/embed/YDBr1Lof_mI?si=thWYK9MFi5QJv-tW
:width: 80%
:align: center

Een superleuke video van het project [Show the Physics](https://interactivetextbooks.tudelft.nl/showthephysics)
```
:::
:::{tab-item} syntax
````markdown
```{iframe} https://www.youtube.com/embed/YDBr1Lof_mI?si=thWYK9MFi5QJv-tW
:width: 80%
:align: center

Een superleuke video van het project [Show the Physics](https://interactivetextbooks.tudelft.nl/showthephysics)
```
````
:::
::::

```{warning} YT in pdf
De embedded YT filmpjes worden niet opgenomen in de pdf. Een oplossing zou bijv. een qr code opnemen kunnen zijn.
```

(sec-ref)=
## Referenties

::::{tab-set}
:::{tab-item} list
* Dit is een [hyperlink](https://nos.nl)  
* Dit is een verwijzing naar vergelijking {eq}`eq:Newton`  
* Dit is een verwijzing naar een tabel zoals {numref}`Tabel {number} <tl_sancties>`  
* Dit is een verwijzing naar een figuur zoals {numref}`Figuur {number} <fig_sunset>`  
:::
:::{tab-item} syntax
```markdown
* Dit is een [hyperlink](https://nos.nl)  
* Dit is een verwijzing naar vergelijking {eq}`eq:Newton`  
* Dit is een verwijzing naar een tabel zoals {numref}`Tabel {number} <tl_sancties>`  
* Dit is een verwijzing naar een figuur zoals {numref}`Figuur {number} <fig_sunset>`  
```
:::
::::

