import yaml from 'js-yaml';

export const TOC_FORMAT = 'jb-book';
export const TOC_FORMAT_ARTICLE = 'jb-article';

export type TocOptions = {
  path?: string;
  filename?: string;
  ci?: boolean;
};

export type JupyterBookPart = {
  caption?: string;
  chapters?: JupyterBookChapter[];
};

export type JupyterBookChapter = {
  file?: string;
  url?: string;
  title?: string;
  glob?: string;
  sections?: JupyterBookChapter[];
};

export type TOC = {
  format: string;
  root: string;
  sections?: JupyterBookChapter[];
  chapters?: JupyterBookChapter[];
  parts?: JupyterBookPart[];
};


export function parseTOC(contents: string): TOC {
  const toc = yaml.load(contents) as any;
  if (Array.isArray(toc)) {
    throw new Error(
        `Encountered a legacy ToC, please see: https://executablebooks.org/en/latest/blog/2021-06-18-update-toc`,
      );
  }
  const { format, root, sections, chapters, parts } = toc;
  if (![TOC_FORMAT, TOC_FORMAT_ARTICLE].includes(format))
    throw new Error(`The toc.format must be ${TOC_FORMAT} or ${TOC_FORMAT_ARTICLE}`);
  if (!root) throw new Error(`The toc.root must exist`);
  if (+!!sections + +!!chapters + +!!parts !== 1) {
    throw new Error(`The toc must have one and only one sections, chapters, or parts`);
  }
  return toc;
}

