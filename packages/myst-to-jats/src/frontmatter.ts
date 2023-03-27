import type { ProjectFrontmatter } from 'myst-frontmatter';
import type { Element } from './types';

export function getJournalIds(): Element[] {
  // [{ type: 'element', name: 'journal-id', attributes: {'journal-id-type': ...}, text: ...}]
  return [];
}

export function getJournalTitleGroup(): Element[] {
  const elements: Element[] = [];
  // { type: 'element', name: 'journal-title', text: ...}
  // { type: 'element', name: 'journal-subtitle', text: ...}
  // translated title group?
  // abbreviated journal title?
  return elements.length ? [{ type: 'element', name: 'journal-title-group', elements }] : [];
}

export function getJournalAffiliations(): Element[] {
  // contrib-group, aff, aff-alternatives
  return [];
}

export function getJournalISNs(): Element[] {
  // issn, issn-l, isbn...
  return [];
}

export function getJournalPublisher(): Element[] {
  // publisher name, publisher loc
  return [];
}

export function getJournalMeta(): Element[] {
  const elements = [
    ...getJournalIds(),
    ...getJournalTitleGroup(),
    ...getJournalAffiliations(),
    ...getJournalISNs(),
    ...getJournalPublisher(),
    // notes
    // self-url
  ];
  return elements.length ? [{ type: 'element', name: 'journal-meta', elements }] : [];
}

export function getArticleAuthors(frontmatter: ProjectFrontmatter): Element[] {
  // For now this just uses affiliations directly on each <contrib>, as they are defined in ProjectFrontmatter.
  // This should be changed to deduplicate / improve affiliations in frontmatter.
  // contrib-group, aff, aff-alternatives, x
  const contribs = frontmatter.authors?.map((author): Element => {
    const attributes: Record<string, any> = {};
    const elements: Element[] = [];
    attributes['contrib-type'] = 'author';
    if (author.orcid) {
      elements.push({
        type: 'element',
        name: 'contrib-id',
        attributes: { 'contrib-id-type': 'orcid' },
        elements: [{ type: 'text', text: author.orcid }],
      });
    }
    if (author.corresponding) attributes.corresp = 'yes';
    if (author.name) {
      elements.push({
        type: 'element',
        name: 'string-name',
        elements: [{ type: 'text', text: author.name }],
      });
    }
    if (author.roles) {
      elements.push(
        ...author.roles.map((role): Element => {
          return {
            type: 'element',
            name: 'role',
            attributes: {
              vocab: 'CRediT',
              'vocab-identifier': 'http://credit.niso.org/',
              'vocab-term': `${role}`,
            },
            elements: [{ type: 'text', text: role }],
          };
        }),
      );
    }

    if (author.affiliations) {
      elements.push(
        ...author.affiliations.map((aff): Element => {
          return {
            type: 'element',
            name: 'aff',
            elements: [
              {
                type: 'element',
                name: 'institution',
                elements: [{ type: 'text', text: aff }],
              },
            ],
          };
        }),
      );
    }
    if (author.email) {
      elements.push({
        type: 'element',
        name: 'email',
        elements: [{ type: 'text', text: author.email }],
      });
    }
    if (author.website) {
      elements.push({
        type: 'element',
        name: 'ext-link',
        attributes: { 'ext-link-type': 'uri', 'xlink:href': author.website },
        elements: [{ type: 'text', text: author.website }],
      });
    }
    return { type: 'element', name: 'contrib', attributes, elements };
  });
  return contribs ?? [];
}

export function getArticlePermissions(frontmatter: ProjectFrontmatter): Element[] {
  // copyright-statement, -year, -holder
  const text = frontmatter.license?.content?.url ?? frontmatter.license?.code?.url;
  // Add `<ali:free_to_read />` to the permissions
  const freeToRead: Element[] = frontmatter.open_access
    ? [{ type: 'element', name: 'ali:free_to_read' }]
    : [];
  return text
    ? [
        {
          type: 'element',
          name: 'permissions',
          elements: [
            ...freeToRead,
            {
              type: 'element',
              name: 'license',
              elements: [
                {
                  type: 'element',
                  name: 'ali:license_ref',
                  elements: [{ type: 'text', text }],
                },
              ],
            },
          ],
        },
      ]
    : [];
}

export function getArticleVolume(frontmatter: ProjectFrontmatter): Element[] {
  const text = frontmatter.biblio?.volume;
  return text
    ? [{ type: 'element', name: 'volume', elements: [{ type: 'text', text: `${text}` }] }]
    : [];
}

export function getArticleIssue(frontmatter: ProjectFrontmatter): Element[] {
  const text = frontmatter.biblio?.issue;
  return text
    ? [{ type: 'element', name: 'issue', elements: [{ type: 'text', text: `${text}` }] }]
    : [];
}

export function getArticlePages(frontmatter: ProjectFrontmatter): Element[] {
  // fpage/lpage, page-range, or elocation-id
  const { first_page, last_page } = frontmatter.biblio ?? {};
  const pages: Element[] = [];
  if (first_page)
    pages.push({
      type: 'element',
      name: 'fpage',
      elements: [{ type: 'text', text: `${first_page}` }],
    });
  if (last_page)
    pages.push({
      type: 'element',
      name: 'lpage',
      elements: [{ type: 'text', text: `${last_page}` }],
    });
  return pages;
}

export function getArticleMeta(frontmatter: ProjectFrontmatter): Element[] {
  const elements = [
    // article-id
    // article-version, article-version-alternatives
    // article-categories
    // title-group
    ...getArticleAuthors(frontmatter),
    // author-notes
    // pub-date or pub-date-not-available
    ...getArticleVolume(frontmatter),
    // volume-id
    // volume-series
    ...getArticleIssue(frontmatter),
    // issue-id
    // issue-title
    // issue-title-group
    // issue-sponsor
    // issue-part
    // volume-issue-group
    // isbn
    // supplement
    ...getArticlePages(frontmatter),
    // email, ext-link, uri, product, supplementary-material
    // history
    // pub-history
    ...getArticlePermissions(frontmatter),
    // self-uri
    // related-article, related-object
    // abstract
    // trans-abstract
    // kwd-group
    // funding-group
    // support-group
    // conference
    // counts
  ];
  return elements.length ? [{ type: 'element', name: 'article-meta', elements }] : [];
}

export function getFront(frontmatter?: ProjectFrontmatter): Element | null {
  if (!frontmatter) return null;
  const elements: Element[] = [...getJournalMeta(), ...getArticleMeta(frontmatter)];
  if (!elements.length) return null;
  return { type: 'element', name: 'front', elements };
}
