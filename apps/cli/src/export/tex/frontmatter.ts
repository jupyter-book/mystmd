import YAML from 'yaml';
import { toTex } from '@curvenote/schema';
import { prepareToWrite } from '../../frontmatter';
import { PageFrontmatter } from '../../frontmatter/types';
import { getEditorState } from '../utils/getEditorState';

export interface JtexOutputConfig {
  path: string;
  filename: string;
  copy_images: boolean;
  single_file: boolean;
}

export interface JtexConfig {
  version: number;
  template: string | null;
  strict: boolean;
  input: {
    references: string | null;
    tagged: Record<string, string>;
  };
  output: JtexOutputConfig;
  options: Record<string, any>;
}

export type LatexFrontmatter = PageFrontmatter & {
  jtex: JtexConfig;
};

export function escapeLatex(maybeUnsafe: string): string {
  return toTex(getEditorState(`<p>${maybeUnsafe}</p>`).doc);
}

export function buildJtexSection(
  tagged: Record<string, string>,
  options: Record<string, any>,
  output: JtexOutputConfig,
  template: string | null,
  references: string | null = 'main.bib',
): JtexConfig {
  return {
    version: 1,
    template,
    strict: false,
    input: {
      references,
      tagged,
    },
    output,
    options,
  };
}

const FM_DELIM = '% ---';
const FM_LINE = '% ';

export function stringifyFrontmatter(data: Record<string, any>) {
  data = prepareToWrite(data);
  // remove any keys that have undefined values, as YAML will silently convert these to null
  const noUndefined = Object.entries(data).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    return { ...acc, [key]: value };
  }, {});

  const lines = YAML.stringify(noUndefined)
    .split('\n')
    .filter((line) => line.length > 0);
  const fm = lines.map((line) => `${FM_LINE}${line}`);
  return `${FM_DELIM}\n${fm.join('\n')}\n${FM_DELIM}\n`;
}
