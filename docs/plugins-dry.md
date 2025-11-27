---
title: '"DRY" your document with plugins'
---

Sometimes our documents require repetitive elements that must be consistent across a
project.

"DRY" stands for "Don't Repeat Yourself", and can be used as a verb representing the
action of deduplicating code.
We can use plugins as a tool for DRYing our documents.

Deduplicating our documents can, as a side effect, make it much easier to alter the
appearance of repetitive elements by making a change in only one place!


## An example of a repetitive element

If you're writing a tutorial, you may want to use
the Diátaxis principle ["point out what the learner should notice"](https://diataxis.fr/tutorials/#point-out-what-the-learner-should-notice)
many times throughout your tutorial document.

For example:

``````{myst}
:::{important} 👀 You should notice...
:class: simple
:icon: false

...this command produces the following output when it's successful:

```
Cloning into 'my-repository'...
remote: Enumerating objects: 417, done.
remote: Counting objects: 100% (178/178), done.
remote: Compressing objects: 100% (101/101), done.
remote: Total 417 (delta 136), reused 97 (delta 77), pack-reused 239 (from 2)
Receiving objects: 100% (417/417), 1.13 MiB | 7.21 MiB/s, done.
Resolving deltas: 100% (229/229), done.
```
``````

It can require a disruptive amount of cognitive load to remember (or copy/paste) this
repeated syntax, and it's also difficult to update all of these repetitive elements when
you decide to change the style or language.
It would be much better to only focus on the unique content of these repetitive
elements to produce the same output:

``````myst
:::{you-should-notice}
...this command produces the following output when it's successful:

```
Cloning into 'my-repository'...
remote: Enumerating objects: 417, done.
remote: Counting objects: 100% (178/178), done.
remote: Compressing objects: 100% (101/101), done.
remote: Total 417 (delta 136), reused 97 (delta 77), pack-reused 239 (from 2)
Receiving objects: 100% (417/417), 1.13 MiB | 7.21 MiB/s, done.
Resolving deltas: 100% (229/229), done.
```
``````

## Generating repetitive MyST elements with a plugin

Using the techniques from [](./plugins-ast.md), we can write a plugin to achieve this:

:::{note}
Setting the body `type: 'myst'` instead of `type: String` means `data.body` will be an
array of MyST nodes instead of raw MyST as text.
This means we don't need to use the `parseMyst()` function!
:::

```{code} javascript
:filename: plugin-you-should-notice.mjs
:linenos:

const youShouldNoticeDirective = {
  name: 'you-should-notice',
  doc: 'Renders a consistent callout when the learner should notice something.',
  body: {type: 'myst'},
  run(data) {
    return [{
      type: 'admonition',
      kind: 'important',
      icon: false,
      class: 'simple',
      children: [
        {
          type: 'admonitionTitle',
          children: [{
            type: 'text',
            value: '👀 You should notice...',
          }],
        },
        ...data.body,
      ],
    }];
  },
};
```

With this plugin, we can write DRY MyST and more easily update our whole document by
updating the plugin, for example:

* Change the title of the admonition on line 16
* Change the style of the admonition on lines 8-10
