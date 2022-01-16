import YAML from 'yaml';
import { Author, Blocks, oxaLink } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import { Block, User, Version } from '../../models';
import { getEditorState } from '../../actions/utils';
import { ISession } from '../../session/types';

function escapeLatex(maybeUnsafe: string): string {
  return toTex(getEditorState(`<p>${maybeUnsafe}</p>`).doc);
}

function toShortTitle(title: string): string {
  return title.slice(0, 50);
}

function toDateFields(d: Date): ExportDateModel {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1, // latex expects 1-indexed month
    day: d.getDate(),
  };
}

export interface ExportDateModel {
  year: number;
  month: number;
  day: number;
}

export interface ExportAuthorModel {
  name: string;
  affiliation?: string;
  location?: string;
  curvenote?: string;
  is_corresponding: boolean;
}

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
      references: string;
      tagged: Record<string, string>;
    };
    output: JtexOutputConfig;
    options: Record<string, any>;
  };
}

function getCorresponsingAuthorNames(options: {
  corresponding_author?: { name: string; email: string }[];
}) {
  if (!options.corresponding_author || options.corresponding_author.length === 0)
    return new Set([]);
  return new Set(options.corresponding_author.map(({ name }) => name));
}

async function toAuthorFields(
  session: ISession,
  author: Author,
  corresponding: Set<string>,
): Promise<ExportAuthorModel> {
  if (author.plain)
    return { name: author.plain, is_corresponding: corresponding.has(author.plain) };

  const user = await new User(session, author.user as string).get();
  return {
    name: user.data.display_name,
    affiliation: user.data.affiliation,
    location: user.data.location,
    curvenote: `${session.SITE_URL}/@${user.data.username}`,
    is_corresponding: corresponding.has(user.data.display_name),
  };
}

export async function buildFrontMatter(
  session: ISession,
  block: Block,
  version: Version<Blocks.Article>,
  tagged: Record<string, string>,
  options: Record<string, any>,
  output: JtexOutputConfig,
  template: string | null,
  references = 'main.bib',
): Promise<LatexFrontMatter> {
  const corresponding = getCorresponsingAuthorNames(options);
  const authors = await Promise.all(
    block.data.authors.map((a) => toAuthorFields(session, a, corresponding)),
  );
  const data = {
    title: escapeLatex(block.data.title ?? ''),
    description: escapeLatex(block.data.description ?? ''),
    short_title: escapeLatex(toShortTitle(block.data.title ?? '')),
    authors,
    date: toDateFields(version.data.date),
    tags: block.data.tags.map((t) => escapeLatex(t)),
    oxalink: oxaLink(session.SITE_URL, version.id),
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
