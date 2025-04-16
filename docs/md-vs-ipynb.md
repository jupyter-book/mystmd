# How to choose between `.ipynb` and `.md` when writing Jupyter notebooks

You can work with Jupyter notebooks in both the `.ipynb` format as well as in a text-based format like [MyST Markdown](./notebooks-with-markdown.md). This is a brief guide to help you choose when to use one vs. the other.

**This is a question of trade-offs, not right and wrong**. There are benefits and drawbacks to using either the more-structured `.ipynb` format, or the more human-readable `.md` format. We'll try to describe each of them below.

## Key differentiators between `.md` and `.ipynb`

**`.ipynb`** is a JSON-based format that captures the **entire interactive session**, including code, Markdown, **outputs**, and detailed **metadata**. It is designed for **machine readability** and preserving execution state. It often results in very complex `diff`s when doing code review, becaue there is a lot of machine-generated information inside an `.ipynb` file. However, this also means that it preserves more information about the result of your computations inside the file itself.

**`.md`** is a plain text file with markdown inside. It is more human-readable, and slightly less-structurd than JSON files. It focused on the **input cells** and **markdown cells** of a Jupyter Notebook, as well as **human-generated metadata** (like cell tags). Markdown notebooks **do not store outputs**. If you execute a cell with a Markdown-based Jupyter Notebook, then outputs will exist in your interactive session but not be saved to the `.md` file. This makes **code review and version control much easier** because you're only looking at markdown and some human-generated syntax for code cells. Finally, Jupyter UIs require installing either [Jupytext](https://jupytext.readthedocs.io/) or [JupyterLab-MyST](https://github.com/jupyter-book/jupyterlab-myst) to read markdown-based notebooks.

### When to lean towards `.ipynb`

- **Output preservation:** When you need to store and share the **results of code execution** (text, tables, figures) without requiring re-running.
- **Out-of-the-box Jupyter UI support:** When you cannot assume that your reader can install `jupytext` or `jupyterlab-myst`.
- **Computational intensity:** For notebooks with **lengthy or resource-intensive computations**, saving outputs via `.ipynb` avoids redundant runs.
- **Self-contained execution history:** When the complete record of an interactive session, including execution order and timestamps, is important.
- **Rich interactive elements:** If your notebook heavily utilizes **complex widgets or interactive visualizations** whose state needs direct preservation.

### When to lean towards Markdown (`.md`)

- **Version control clarity:** When **tracking changes** to the notebook's content (code and narrative) in a collaborative setting is crucial. Markdown's readability makes `diff`ing straightforward.
- **Human-focused authoring:** If you prioritize writing and reviewing the **source content** in a highly readable, human-editable format.
- **Collaborative review:** For workflows involving frequent **reviews of the code and explanations**, where output changes are less critical to the review process.
- **Integration with text-based workflows:** When you intend to use notebooks with tools that excel with Markdown, such as static site generators or documentation pipelines.
- **When re-executing your content is important or easy:** When you want to re-execute your content at build-time, markdown-based formats are usually easier to work with. This allows you to ensure your code is reproducible, so long as it isn't extremely complex or costly to do execute.

## Reminder: there is not a single right answer

People have debated the "`.ipynb` vs. `.md`" question for many years. There is no single answer that works for every use-case. Hopefully the ideas above give a general idea for when to use one vs. the other.
