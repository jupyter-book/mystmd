import path from 'path';
import type { PageSlugs } from '../project/types.js';

function input2name(input: string, allowed: RegExp, join: string) {
  let name = `¶${input}`
    .toLowerCase()
    .split('')
    .map((char) => (allowed.test(char) ? char : '¶'))
    .join('')
    .split('')
    .reduce((p, n) => (p.charAt(p.length - 1) === '¶' && n === '¶' ? p : p + n))
    .slice(1)
    .replace(/¶/g, join);
  if (join) {
    name = name.replace(new RegExp(`${join}+`, 'g'), join);
  }
  if (name.charAt(0) === join) name = name.slice(1);
  if (name.charAt(name.length - 1) === join) name = name.slice(0, name.length - 1);
  return name;
}

const title2name = (title: string) =>
  input2name(title.replace(/&/g, '¶and¶'), /^[a-z0-9-]/, '-').slice(0, 50);

function removeLeadingEnumeration(s: string): string {
  if (s.match(/^([12][0-9]{3})([^0-9])?/)) {
    // Starts with what looks like a year
    return s;
  }
  if (s.match(/^([0-9]{5})/)) {
    // More than five numbers
    return s;
  }
  const removed = s.replace(/^([0-9_.-]+)/, '');
  if (!removed) return s; // Never return an empty slug!
  return removed;
}

export function createSlug(s: string): string {
  return title2name(removeLeadingEnumeration(s));
}

export function createTitle(s: string): string {
  return (
    removeLeadingEnumeration(s)
      // https://stackoverflow.com/questions/18379254/regex-to-split-camel-case
      .split(/([A-Z][a-z0-9]+)|_|-/)
      .filter((e) => e)
      .join(' ')
      .trim()
      // Now make it into title case (simple, but good enough)
      .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()))
  );
}

export function fileInfo(file: string, pageSlugs: PageSlugs): { slug: string; title: string } {
  const { name } = path.parse(file);
  let slug = createSlug(name);
  const title = createTitle(name);
  if (pageSlugs[slug]) {
    pageSlugs[slug] += 1;
    slug = `${slug}-${pageSlugs[slug] - 1}`;
  } else {
    pageSlugs[slug] = 1;
  }
  return { slug, title };
}
