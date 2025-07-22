---
title: Callouts & Admonitions
description: Callout blocks or admonitions, like "notes" or "hints" are outlined or shaded areas of a document to bring attention to particular information.
thumbnail: ./thumbnails/admonitions.png
---

Callouts, or "admonitions", highlight a particular block of text that exists slightly apart from the narrative of your page, such as a note or a warning.
For example, try changing the following example of a `{tip}` admonition to a `{warning}`:

```{myst}
:::{tip}
Try changing `tip` to `warning`!
:::
```

In MyST we call these kinds of directives {myst:directive}`admonitions <admonition>`, however, they are almost always used through their _named_ directives, like {myst:directive}`note` or {myst:directive}`danger`. There are ten kinds[^docutils-admonitions] of admonitions available:

```{list-table} Named admonitions that can be used as directives
:label: admonitions-list
* - 🔵 {myst:directive}`note`
  - 🟠 {myst:directive}`attention`
* - 🔵 {myst:directive}`important`
  - 🟠 {myst:directive}`caution`
* - 🟢 {myst:directive}`hint`
  - 🟠 {myst:directive}`warning`
* - 🟢 {myst:directive}`seealso`
  - 🔴 {myst:directive}`danger`
* - 🟢 {myst:directive}`tip`
  - 🔴 {myst:directive}`error`
```

[^docutils-admonitions]: These admonitions are the same as those used in [docutils](https://docutils.sourceforge.io/docs/ref/rst/directives.html#specific-admonitions) and Sphinx.

See below for a demo of each admonition in the default theme.

`````{tab-set}

````{tab-item} Note
```{note}
This is an note admonition
```
````

````{tab-item} Important
```{important}
This is an important admonition
```
````

````{tab-item} Hint
```{hint}
This is an hint admonition
```
````

````{tab-item} See Also
```{seealso}
This is an seealso admonition
```
````

````{tab-item} Tip
```{tip}
This is an tip admonition
```
````

````{tab-item} Attention
```{attention}
This is an attention admonition
```
````

````{tab-item} Caution
```{caution}
This is an caution admonition
```
````

````{tab-item} Warning
```{warning}
This is an warning admonition
```
````

````{tab-item} Danger
```{danger}
This is an danger admonition
```
````

````{tab-item} Error
```{error}
This is an error admonition
```
````

`````

## Admonition Titles

All admonitions have a single argument ({myst:directive}`docs <admonition.arg>`), which is the admonition title and can use Markdown.
If a title argument is not supplied the first node of the {myst:directive}`admonition.body` is used if it is a `heading` or a paragraph with fully bold text; otherwise the name of the directive is used (e.g. `seealso` becomes `See Also`; `note` becomes `Note`).

```{myst}
:::{tip} Admonition _title_
Here is an admonition!
:::
```

(admonition-github-compatibility)=
:::::::{tip} Compatibility with GitHub
:class: dropdown
GitHub Markdown transforms blockquotes that start with a bold `Note` or text with `[!NOTE]` into a simple admonition (see [GitHub](https://github.com/community/community/discussions/16925)). This syntax only works for `note`, `important` or `warning`. MyST transforms these blockquotes into the appropriate admonitions with a `simple` {myst:directive}`admonition.class`.

```{myst}
> [!NOTE]
> Highlights information that users should take into account, even when skimming.

> [!IMPORTANT]
> Crucial information necessary for users to succeed.

> [!WARNING]
> Critical content demanding immediate user attention due to potential risks.

> **Note**
> This is a note

> **Warning**
> This is a warning
```

:::::::

::::{tip} Compatibility with Pandoc & Quarto
:class: dropdown
In Quarto/Pandoc Markdown admonitions are styled with special classes like `{.callout-note}` or `{.callout-tip}`).
If you are using Jupyter Book V1 or Sphinx documentation, use an {myst:directive}`admonition` directive with the specific class, for example:

```{myst}
::: {.callout-tip}
## Tip with Caption
This is an example of a callout with a caption.
:::
```

::::

::::{warning} Compatibility with Sphinx
:class: dropdown
In Sphinx, all named admonitions (e.g. `{note}` or `{tip}`), have **no arguments**.
If you place content on the first line it will instead be prepended to the admonition body.
If you are using Jupyter Book V1 or Sphinx documentation, use an {myst:directive}`admonition` directive with the specific class, for example:

```{myst}
:::{admonition} The Title
:class: hint
This is the body.
:::
```

::::

(admonition-dropdown)=

## Admonition Dropdown

To turn an admonition into a dropdown, add the `dropdown` {myst:directive}`admonition.class` to them.
Dropdown admonitions use the `<details>` HTML element (meaning they also will work without JavaScript!),
and they can be helpful when including text that shouldn't immediately visible to your readers.
To have a dropdown-style admonition start open, add the {myst:directive}`admonition.open` option.

```{myst}
:::{note} Click Me! 👈
:class: dropdown
👋 This could be a solution to a problem or contain other detailed explanations.
:::

:::{note} Hide Me! 👈
:class: dropdown
:open: true
👋 This is an admonition with a lot of text. The user can hide it if they want.

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
:::
```

:::{seealso} You can also use a `{dropdown}`
:class: dropdown
You can also use a {myst:directive}`dropdown` directive, which provides a more compact writing experience and is simpler in the displayed style. See [](#dropdowns) for more information.
:::

## Simpler Admonitions

Admonitions can additionally be styled as `simple`, and can optionally hide the icon using the `icon` option of the `{myst:directive}`admonition.class`.

```{myst}
:::{important} Magic
:class: simple
This is a magic cat. It casts a luck spell on you that lasts an hour. \
**つ( ･ω･｡)つ━☆・*。**
:::
```

Removing the icon from an admonition of a certain class allows using a custom emoji for style. 

```{myst}
:::{danger} 🎤 Transcript. **Speaker:** John Smith
:icon: false
— To begin this lecture, I would like to ask the audience some questions.

...

— The next assignment has to be handed in by 01.05. Thanks everyone for attending.
:::
```

Multiple classes can be combined. See below for an example.

```{myst}
:::{warning} ✍️ NB
:class: simple
:class: dropdown
:icon: false
:open:
The proof of the lemma for $x \leqslant 0$ is left to the reader.  
:::
```

## Custom admonitions
It is possible to make [your own admonition](https://next.jupyterbook.org/plugins/directives-and-roles/#create-a-custom-admonition) and embed it through a [plugin](https://next.jupyterbook.org/tutorial/plugins/). The colors, icon and behaviour in dark/light mode can be specified through a customs css file. 

```{raw} markdown
/* Custom experiment admonition, based on documentation (see https://next.jupyterbook.org/plugins/directives-and-roles#create-a-custom-admonition). 
*   css file (custom.css) included in style folder. 
*/

const experiment = {
  name: "experiment",
  doc: "A custom admonition that uses a specific color.",
  arg: { type: String, doc: "The title of the admonition." },
  options: {
    collapsed: { type: Boolean, doc: "Whether to collapse the admonition." },
  },
  body: { type: String, doc: "The body of the directive." },
  run(data, vfile, ctx) {
    
    let title = data.arg.trim();
    let body = data.body.trim();

    // console.log("[experiment plugin] ", data.arg, data.body);
    // console.log("[experiment plugin] ", ctx.parseMyst(body));
    // console.log("[experiment plugin] ", ctx.parseMyst(body)["children"]);
    // console.log("[experiment plugin] ", ctx.parseMyst(body)["children"][0]);



    const admonition = {
        "type": "admonition",
        "kind": "admonition",
        "class": "admonition-experiment",  //Add class (custom.css)
        "icon": false,
        "children": [
          
          {
            "type": "admonitionTitle",
            "class": "admonition-title-experiment", // This does not work! note to self: not all dirs take their classes to the output. 
            // The first ["children"][0] removes the MyST "tree" top-level node.
            // The second ["children"] removes an unnecessary top-level paragraph node.
            "children": ctx.parseMyst(`${title}`)["children"][0]["children"]
            
          },
          
          {
            "type": "paragraph",
            "children": ctx.parseMyst(body)["children"] 
          }
        ]
    }
    return [admonition];
  }
};

const plugin = {
  name: "experiment",
  directives: [experiment],
};



export default plugin;
```

```{raw} css
/*Title color in dark mode, changes title color into black when in dark mode*/
.dark aside.admonition-experiment .dark\:text-white {
   color: rgb(0 0 0); 
}

/* Parent */
aside.admonition-experiment {
  border-color: rgb(255, 0, 0) !important; /* Important zorgt ervoor dat we over de oude stijl heen schrijven */
  background-color: rgb(255, 255, 255); /* Change background color text part*/
} 

/* Title */
aside.admonition-experiment > div:first-child {
  background-color: rgb(251, 183, 183);  /* Change header background color */
}

/* Icon */
aside.admonition-experiment > div:first-child::before {
  content: "🧪";
  /* add padding left so it is not directly on the side*/
  padding-left: 0.2em;
  margin-left: 0.5em;
}

aside.admonition-experiment > div:first-child > div:first-child {
  background-color: rgb(251, 183, 183); /* changes header color of text part
  margin-left: 0 !important; /* voorkomt dubbele margin */
}

/* end of new code */

.admonition-experiment .admonition-title-experiment {
  background-color: black; /* Change header background color */
  color: #FFFFFF; /* Change header text color */
}

/* Custom icon using ::before pseudo-element */
.admonition-experiment .admonition-title-experiment::before {
  content: "🧪"; /* Use an emoji or */
  content: "\f0c3"; /* Use a FontAwesome icon code */
  font-family: "Font Awesome 5 Free"; /* If using FontAwesome */
  margin-right: 0.5em;
}

aside.admonition-experiment img {
display: block;
}

```



```{experiment} Make your own admonition
:class: dropdown

Using the description above, make your own custom admonition!
```


