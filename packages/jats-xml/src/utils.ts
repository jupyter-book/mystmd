import type { GenericNode, GenericParent } from 'myst-common';
import { toText } from 'myst-common';
import type { Element } from 'xml-js';
import doi from 'doi-utils';
import { select, selectAll } from 'unist-util-select';
import type { ArticleId } from './types';
import { Tags } from './types';

export function convertToUnist(node: Element): GenericNode | GenericParent {
  switch (node.type) {
    case 'element': {
      const { name, attributes, elements } = node;
      const children = elements?.map(convertToUnist);
      const next: GenericNode = { type: name ?? 'unknown', ...attributes };
      if (children) next.children = children;
      return next;
    }
    case 'text': {
      const { attributes, text } = node;
      return { type: 'text', ...attributes, value: String(text) };
    }
    case 'cdata': {
      const { attributes, cdata } = node;
      return { type: 'cdata', ...attributes, cdata };
    }
    case 'comment': {
      const { comment } = node;
      return { type: 'comment', value: String(comment) };
    }
    default:
      console.log(node);
      throw new Error(`found ${node.type} ${node.name}`);
  }
}

const MonthLookup: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function toDate(date?: GenericParent): Date | undefined {
  if (!date) return;
  const isoDate = date['iso-8601-date'];
  if (isoDate) return new Date(isoDate);
  const year = Number(toText(select('year', date)));
  if (!year || Number.isNaN(year)) return;
  const monthText = toText(select('month', date));
  const monthTextNumber = Number(monthText);
  const month = Number.isNaN(monthTextNumber) ? MonthLookup[monthText] : monthTextNumber - 1;
  if (month == null) return new Date(Date.UTC(year, 0));
  const day = Number(toText(select('day', date)));
  if (!day || Number.isNaN(day)) return new Date(Date.UTC(year, month));
  return new Date(Date.UTC(year, month, day));
}

export function formatDate(date?: Date) {
  if (!date) return;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

export function findDoi(node: GenericParent): string | null {
  const id = select('[pub-id-type=doi]', node);
  if (id && toText(id)) return toText(id);
  const doiTag = (selectAll(`${Tags.articleId},${Tags.pubId}`, node) as ArticleId[]).find((t) =>
    doi.validate(toText(t)),
  );
  return toText(doiTag) || null;
}
