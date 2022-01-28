import { Author, Blocks, oxaLink } from '@curvenote/blocks';
import { Block, User, Version } from '../models';
import { ISession } from '../session/types';

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

export function toShortTitle(title: string): string {
  return title.slice(0, 50);
}

export function toDateFields(d: Date): ExportDateModel {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1, // latex expects 1-indexed month
    day: d.getDate(),
  };
}

export function getCorresponsingAuthorNames(options: {
  corresponding_author?: { name: string; email: string }[];
}) {
  if (!options.corresponding_author || options.corresponding_author.length === 0)
    return new Set([]);
  return new Set(options.corresponding_author.map(({ name }) => name));
}

export async function toAuthorFields(
  session: ISession,
  author: Author,
  corresponding: Set<string> = new Set([]), // TODO generise to a function allowing various flags to be set
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

export async function buildDocumentModel(
  session: ISession,
  block: Block,
  version: Version<Blocks.Article>,
  options: Record<string, any>,
  escapeFn?: (s: string) => string,
) {
  const corresponding = getCorresponsingAuthorNames(options);
  const authors = await Promise.all(
    block.data.authors.map((a) => toAuthorFields(session, a, corresponding)),
  );

  const escapeIt = (s: string) => escapeFn?.(s ?? '') ?? '';

  return {
    title: escapeIt(block.data.title),
    description: escapeIt(block.data.description),
    short_title: escapeIt(toShortTitle(block.data.title)),
    authors,
    date: toDateFields(version.data.date),
    tags: block.data.tags.map((t) => escapeIt(t)).filter((t) => t && t.length > 0),
    oxalink: oxaLink(session.SITE_URL, version.id),
  };
}
