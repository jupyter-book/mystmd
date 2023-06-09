import type { Text } from 'myst-spec';
import type { Link } from './types.js';

export function withoutHttp(url: string) {
  return url?.replace(/https?:\/\//, '');
}

export function updateLinkTextIfEmpty(link: Link, title: string) {
  if (!title) return;
  const text: Text[] = title ? [{ type: 'text', value: title }] : [];
  if (
    link.children?.length === 1 &&
    (link.children?.[0] as Text)?.type === 'text' &&
    (link.children?.[0] as Text)?.value === (link.urlSource || link.url)
  ) {
    // If the link is the same as the original url, for example a <myst:project#target>
    // Replace those with the display name
    link.children = text;
    return;
  }
  if (!link.children || link.children?.length === 0) {
    // If there is nothing in the link, give it the title as text
    link.children = text;
    return;
  }
}
