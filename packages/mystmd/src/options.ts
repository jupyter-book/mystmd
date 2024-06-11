import { Option } from 'commander';

export function makeProjectOption(description: string) {
  return new Option('--project', description).default(false);
}

export function makeWriteTOCOption() {
  return new Option(
    '--write-toc',
    'Generate editable table of contents within your myst.yml file, if it does not exist',
  )
    .default(false)
    .implies({ writeTOC: true });
}

export function makeGithubPagesOption() {
  return new Option(
    '--gh-pages',
    'Creates a GitHub action that will deploy your site to GitHub pages',
  ).default(false);
}

export function makeGithubCurvenoteOption() {
  return new Option(
    '--gh-curvenote',
    'Creates a GitHub action that will deploy your site to Curvenote',
  ).default(false);
}
