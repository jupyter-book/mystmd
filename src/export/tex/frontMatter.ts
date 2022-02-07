import YAML from 'yaml';
import { Blocks } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import { buildDocumentModel, ExportAuthorModel, ExportDateModel } from '../model';
import { Block, Version } from '../../models';
import { getEditorState } from '../../actions/utils';
import { ISession } from '../../session/types';

export interface JtexOutputConfig {
  path: string;
  filename: string;
  copy_images: boolean;
  single_file: boolean;
}

export interface LatexFrontMatter {
  title: string;
  description: string;
  short_title: string;
  authors: ExportAuthorModel[];
  date: ExportDateModel;
  tags: string[];
  oxalink: string | null;
  jtex: {
    version: number;
    template: string | null;
    strict: boolean;
    input: {
      references: string | null;
      tagged: Record<string, string>;
    };
    output: JtexOutputConfig;
    options: Record<string, any>;
  };
}

function escapeLatex(maybeUnsafe: string): string {
  return toTex(getEditorState(`<p>${maybeUnsafe}</p>`).doc);
}

export async function buildFrontMatter(
  session: ISession,
  block: Block,
  version: Version<Blocks.Article>,
  tagged: Record<string, string>,
  options: Record<string, any>,
  output: JtexOutputConfig,
  template: string | null,
  references: string | null = 'main.bib',
): Promise<LatexFrontMatter> {
  const model = await buildDocumentModel(session, block, version, options, escapeLatex);
  const data = {
    ...model,
    jtex: {
      version: 1,
      template,
      strict: false,
      input: {
        references,
        tagged,
      },
      output,
      options,
    },
  };
  return data;
}

const FM_DELIM = '% ---';
const FM_LINE = '% ';

export function stringifyFrontMatter(data: LatexFrontMatter) {
  const lines = YAML.stringify(data)
    .split('\n')
    .filter((line) => line.length > 0);
  const fm = lines.map((line) => `${FM_LINE}${line}`);
  return `${FM_DELIM}\n${fm.join('\n')}\n${FM_DELIM}\n`;
}
