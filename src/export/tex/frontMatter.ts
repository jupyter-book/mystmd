import YAML from 'yaml';
import { Blocks } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import { Block, Version } from '../../models';
import { ISession } from '../../session/types';
import { buildDocumentModelFromBlock, DocumentModel } from '../model';
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

export type LatexFrontMatter = DocumentModel & {
  jtex: JtexConfig;
};

function escapeLatex(maybeUnsafe: string): string {
  return toTex(getEditorState(`<p>${maybeUnsafe}</p>`).doc);
}

function buildJtexSection(
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

export async function buildFrontMatterFromBlock(
  session: ISession,
  block: Block,
  version: Version<Blocks.Article>,
  tagged: Record<string, string>,
  options: Record<string, any>,
  output: JtexOutputConfig,
  template: string | null,
  references: string | null,
): Promise<LatexFrontMatter> {
  const model = await buildDocumentModelFromBlock(session, block, version, options, escapeLatex);
  const data = {
    ...model,
    jtex: buildJtexSection(tagged, options, output, template, references),
  };
  return data;
}

export function buildFrontMatter(
  model: DocumentModel,
  tagged: Record<string, string>,
  options: Record<string, any>,
  output: JtexOutputConfig,
  template: string | null,
  references: string | null,
): LatexFrontMatter {
  return {
    ...model,
    jtex: buildJtexSection(tagged, options, output, template, references),
  };
}

const FM_DELIM = '% ---';
const FM_LINE = '% ';

export function stringifyFrontMatter(data: LatexFrontMatter) {
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
