MyST Markdown Command Line Interface, :code:`mystmd`
****************************************************

.. image:: https://img.shields.io/badge/license-MIT-blue.svg
    :target: https://github.com/executablebooks/mystmd/blob/main/LICENSE
    :alt: MIT License

.. image:: https://github.com/executablebooks/mystmd/workflows/CI/badge.svg
    :target: https://github.com/executablebooks/mystmd/actions/workflows/ci.yml
    :alt: CI

:code:`mystmd` is a set of open-source, community-driven tools designed for scientific communication, including a powerful authoring framework that supports blogs, online books, scientific papers, reports and journals articles.

.. note::
    The :code:`mystmd` project is in **beta**. It is being used to explore a full MyST implementation and will change significantly and rapidly.
    The project is being developed by a small team of people on the Executable Books Project, and may make rapid decisions without fully public/inclusive discussion.
    We will continue to update this documentation as the project stabilizes.

Overview
--------

The :code:`myst` project provides a command line tool (:code:`mystmd`) for working with MyST Markdown projects.

- Provides functionality for cross-referencing, external structured links, and scientific citations
- Translate and render MyST Markdown into:
  - HTML for static websites, and modern React for interactive websites (like this website!)
  - PDFs and LaTeX documents, with specific templates for over 400 journals
  - Microsoft Word export
- Parse MyST into a standardized AST, that follows the MyST Markdown Spec

See the `documentation <https://mystmd.org/guide>`_

Get Started
-----------

The MyST Markdown CLI is available through PyPI:

.. code::

    pip install mystmd
    myst init
    myst build my-doc.md --tex


and Conda:

.. code::

    conda config --add channels conda-forge
    conda config --set channel_priority strict
    conda install mystmd
    myst init
    myst build my-doc.md --tex