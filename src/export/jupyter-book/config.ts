import fs from 'fs';
import path from 'path';

export interface Options {
  title: string;
  author: string;
  url: string;
  references?: string;
  logo?: string;
  latexTargetName?: string;
}

function createYaml(opts: Options) {
  const {
    title,
    author,
    url,
    references = 'references.bib',
    logo = 'logo.png',
    latexTargetName = 'book.tex',
  } = opts;
  const settings = `# Jupyter Book settings
# Learn more at https://jupyterbook.org/customize/config.html

title: ${title}
author: ${author}
logo: ${logo}

# Force re-execution of notebooks on each build.
# See https://jupyterbook.org/content/execute.html
execute:
  execute_notebooks: force

# Define the name of the latex output file for PDF builds
latex:
  latex_documents:
    targetname: ${latexTargetName}

# Add a bibtex file so that we can create citations
bibtex_bibfiles:
  - ${references}

# Information about where the book exists on the web
repository:
  url: ${url} # Online location of your book

# See https://jupyterbook.org/customize/config.html#add-a-link-to-your-repository
html:
  use_issues_button: true
  use_repository_button: true
  use_edit_page_button: true
  extra_navbar: Written in <a href="https://curvenote.com">Curvenote</a>
`;
  return settings;
}

export function writeConfig(opts: Options) {
  const config = createYaml(opts);
  fs.writeFileSync(path.join('.', '_config.yml'), config);
}
