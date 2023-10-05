import type { Contributor, ProjectFrontmatter } from 'myst-frontmatter';
import type { Element, IJatsSerializer } from './types.js';

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

export function getJournalMeta(): Element | null {
  const elements = [
    ...getJournalIds(),
    ...getJournalTitleGroup(),
    ...getJournalAffiliations(),
    ...getJournalISNs(),
    ...getJournalPublisher(),
    // notes
    // self-url
  ];
  return elements.length ? { type: 'element', name: 'journal-meta', elements } : null;
}

/**
 * Add a article `title-group`, for example:
 *
 * ```xml
 * <title-group>
 *   <article-title>
 *     Systematic review of day hospital care for elderly people
 *   </article-title>
 * </title-group>
 * ```
 *
 * See: https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/article-title.html
 */
export function getArticleTitle(frontmatter: ProjectFrontmatter): Element[] {
  const title = frontmatter?.title;
  const subtitle = frontmatter?.subtitle;
  if (!title && !subtitle) return [];
  const articleTitle: Element[] = [
    {
      type: 'element',
      name: 'article-title',
      elements: title ? [{ type: 'text', text: title }] : [],
    },
  ];
  const articleSubtitle: Element[] = subtitle
    ? [
        {
          type: 'element',
          name: 'subtitle',
          elements: [{ type: 'text', text: subtitle }],
        },
      ]
    : [];
  return [
    {
      type: 'element',
      name: 'title-group',
      elements: [...articleTitle, ...articleSubtitle],
    },
  ];
}

/**
 * Add authors and contributors to contrib-group
 *
 * Authors are tagged as contrib-type="author"
 */
export function getArticleAuthors(frontmatter: ProjectFrontmatter): Element[] {
  const generateContrib = (author: Contributor, type?: string): Element => {
    const attributes: Record<string, any> = {};
    const elements: Element[] = [];
    if (type) attributes['contrib-type'] = type;
    if (author.id) attributes.id = author.id;
    if (author.corresponding) attributes.corresp = 'yes';
    if (author.deceased) attributes['deceased'] = 'yes';
    if (author.equal_contributor != null) {
      attributes['equal-contrib'] = author.equal_contributor ? 'yes' : 'no';
    }
    if (author.orcid) {
      elements.push({
        type: 'element',
        name: 'contrib-id',
        attributes: { 'contrib-id-type': 'orcid' },
        elements: [{ type: 'text', text: author.orcid }],
      });
    }
    if (author.nameParsed && (author.nameParsed?.given || author.nameParsed?.family)) {
      const { given, family, dropping_particle, non_dropping_particle, suffix } = author.nameParsed;
      const nameElements: Element[] = [];
      if (family) {
        nameElements.push({
          type: 'element',
          name: 'surname',
          elements: [
            {
              type: 'text',
              text: non_dropping_particle ? `${non_dropping_particle} ${family}` : family,
            },
          ],
        });
      }
      if (given) {
        nameElements.push({
          type: 'element',
          name: 'given-names',
          elements: [
            {
              type: 'text',
              text: dropping_particle ? `${given} ${dropping_particle}` : given,
            },
          ],
        });
      }
      // Prefix not yet supported by name parsing
      if (suffix) {
        nameElements.push({
          type: 'element',
          name: 'suffix',
          elements: [{ type: 'text', text: suffix }],
        });
      }
      elements.push({
        type: 'element',
        name: 'name',
        elements: nameElements,
      });
    }
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
            name: 'xref',
            attributes: { 'ref-type': 'aff', rid: aff },
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
    if (author.url) {
      elements.push({
        type: 'element',
        name: 'ext-link',
        attributes: { 'ext-link-type': 'uri', 'xlink:href': author.url },
        elements: [{ type: 'text', text: author.url }],
      });
    }
    return { type: 'element', name: 'contrib', attributes, elements };
  };
  const contribs = [
    ...(frontmatter.authors ?? []).map((author): Element => {
      return generateContrib(author, 'author');
    }),
    ...(frontmatter.contributors ?? []).map((contributor): Element => {
      return generateContrib(contributor);
    }),
  ];

  return contribs?.length ? [{ type: 'element', name: 'contrib-group', elements: contribs }] : [];
}

export function getArticleAffiliations(frontmatter: ProjectFrontmatter): Element[] {
  const affs = frontmatter.affiliations?.map((affiliation): Element => {
    const elements: Element[] = [];
    const attributes: Record<string, any> = {};
    if (affiliation.id) {
      attributes.id = affiliation.id;
    }
    const instWrapElements: Element[] = [];
    if (affiliation.name) {
      instWrapElements.push({
        type: 'element',
        name: 'institution',
        elements: [{ type: 'text', text: affiliation.name }],
      });
    }
    if (affiliation.isni) {
      instWrapElements.push({
        type: 'element',
        name: 'institution-id',
        attributes: { 'institution-id-type': 'isni' },
        elements: [{ type: 'text', text: affiliation.isni }],
      });
    }
    if (affiliation.ringgold) {
      instWrapElements.push({
        type: 'element',
        name: 'institution-id',
        attributes: { 'institution-id-type': 'ringgold' },
        elements: [{ type: 'text', text: `${affiliation.ringgold}` }],
      });
    }
    if (affiliation.ror) {
      instWrapElements.push({
        type: 'element',
        name: 'institution-id',
        attributes: { 'institution-id-type': 'ror' },
        elements: [{ type: 'text', text: affiliation.ror }],
      });
    }
    if (instWrapElements.length) {
      elements.push({ type: 'element', name: 'institution-wrap', elements: instWrapElements });
    }
    if (affiliation.department) {
      elements.push({
        type: 'element',
        name: 'institution-wrap',
        elements: [
          {
            type: 'element',
            name: 'institution',
            attributes: { 'content-type': 'dept' },
            elements: [{ type: 'text', text: affiliation.department }],
          },
        ],
      });
    }
    if (affiliation.address) {
      elements.push({
        type: 'element',
        name: 'addr-line',
        elements: [{ type: 'text', text: affiliation.address }],
      });
    }
    if (affiliation.city) {
      elements.push({
        type: 'element',
        name: 'city',
        elements: [{ type: 'text', text: affiliation.city }],
      });
    }
    if (affiliation.state) {
      elements.push({
        type: 'element',
        name: 'state',
        elements: [{ type: 'text', text: affiliation.state }],
      });
    }
    if (affiliation.postal_code) {
      elements.push({
        type: 'element',
        name: 'postal-code',
        elements: [{ type: 'text', text: affiliation.postal_code }],
      });
    }
    if (affiliation.country) {
      elements.push({
        type: 'element',
        name: 'country',
        elements: [{ type: 'text', text: affiliation.country }],
      });
    }
    if (affiliation.phone) {
      elements.push({
        type: 'element',
        name: 'phone',
        elements: [{ type: 'text', text: affiliation.phone }],
      });
    }
    if (affiliation.fax) {
      elements.push({
        type: 'element',
        name: 'fax',
        elements: [{ type: 'text', text: affiliation.fax }],
      });
    }
    if (affiliation.email) {
      elements.push({
        type: 'element',
        name: 'email',
        elements: [{ type: 'text', text: affiliation.email }],
      });
    }
    if (affiliation.url) {
      elements.push({
        type: 'element',
        name: 'ext-link',
        attributes: { 'ext-link-type': 'uri', 'xlink:href': affiliation.url },
        elements: [{ type: 'text', text: affiliation.url }],
      });
    }
    return {
      type: 'element',
      name: 'aff',
      attributes,
      elements,
    };
  });
  return affs ? affs : [];
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

export function getKwdGroup(frontmatter: ProjectFrontmatter): Element[] {
  const kwds = frontmatter.keywords?.map((keyword): Element => {
    return { type: 'element', name: 'kwd', elements: [{ type: 'text', text: keyword }] };
  });
  return kwds?.length ? [{ type: 'element', name: 'kwd-group', elements: kwds }] : [];
}

export function getFundingGroup(frontmatter: ProjectFrontmatter): Element[] {
  const fundingGroups = frontmatter.funding?.map((fund): Element => {
    const elements: Element[] = [];
    if (fund.awards?.length) {
      elements.push(
        ...fund.awards.map((award): Element => {
          const awardElements: Element[] = [];
          if (award.sources?.length) {
            awardElements.push(
              ...award.sources.map((source): Element => {
                return {
                  type: 'element',
                  name: 'funding-source',
                  elements: [
                    {
                      type: 'element',
                      name: 'xref',
                      attributes: { 'ref-type': 'aff', rid: source },
                    },
                  ],
                };
              }),
            );
          }
          if (award.id) {
            awardElements.push({
              type: 'element',
              name: 'award-id',
              elements: [{ type: 'text', text: award.id }],
            });
          }
          if (award.name) {
            awardElements.push({
              type: 'element',
              name: 'award-name',
              elements: [{ type: 'text', text: award.name }],
            });
          }
          if (award.description) {
            awardElements.push({
              type: 'element',
              name: 'award-desc',
              elements: [{ type: 'text', text: award.description }],
            });
          }
          if (award.recipients?.length) {
            awardElements.push(
              ...award.recipients.map((recipient): Element => {
                const recipientElements: Element[] = [];
                const author: Contributor = [
                  ...(frontmatter.authors ?? []),
                  ...(frontmatter.contributors ?? []),
                ].find((auth) => auth.id === recipient) ?? { name: recipient };
                if (author.orcid) {
                  recipientElements.push({
                    type: 'element',
                    name: 'contrib-id',
                    attributes: { 'contrib-id-type': 'orcid' },
                    elements: [{ type: 'text', text: author.orcid }],
                  });
                }
                if (author.nameParsed && (author.nameParsed?.given || author.nameParsed?.family)) {
                  const { given, family, dropping_particle, non_dropping_particle, suffix } =
                    author.nameParsed;
                  const nameElements: Element[] = [];
                  if (family) {
                    nameElements.push({
                      type: 'element',
                      name: 'surname',
                      elements: [
                        {
                          type: 'text',
                          text: non_dropping_particle
                            ? `${non_dropping_particle} ${family}`
                            : family,
                        },
                      ],
                    });
                  }
                  if (given) {
                    nameElements.push({
                      type: 'element',
                      name: 'given-names',
                      elements: [
                        {
                          type: 'text',
                          text: dropping_particle ? `${given} ${dropping_particle}` : given,
                        },
                      ],
                    });
                  }
                  // Prefix not yet supported by name parsing
                  if (suffix) {
                    nameElements.push({
                      type: 'element',
                      name: 'suffix',
                      elements: [{ type: 'text', text: suffix }],
                    });
                  }
                  recipientElements.push({
                    type: 'element',
                    name: 'name',
                    elements: nameElements,
                  });
                }
                if (author.name) {
                  recipientElements.push({
                    type: 'element',
                    name: 'string-name',
                    elements: [{ type: 'text', text: author.name }],
                  });
                }
                return {
                  type: 'element',
                  name: 'principal-award-recipient',
                  elements: recipientElements,
                };
              }),
            );
          }
          if (award.investigators?.length) {
            awardElements.push(
              ...award.investigators.map((investigator): Element => {
                const investigatorElements: Element[] = [];
                const author: Contributor = [
                  ...(frontmatter.authors ?? []),
                  ...(frontmatter.contributors ?? []),
                ].find((auth) => auth.id === investigator) ?? { name: investigator };
                if (author.orcid) {
                  investigatorElements.push({
                    type: 'element',
                    name: 'contrib-id',
                    attributes: { 'contrib-id-type': 'orcid' },
                    elements: [{ type: 'text', text: author.orcid }],
                  });
                }
                if (author.nameParsed && (author.nameParsed?.given || author.nameParsed?.family)) {
                  const { given, family, dropping_particle, non_dropping_particle, suffix } =
                    author.nameParsed;
                  const nameElements: Element[] = [];
                  if (family) {
                    nameElements.push({
                      type: 'element',
                      name: 'surname',
                      elements: [
                        {
                          type: 'text',
                          text: non_dropping_particle
                            ? `${non_dropping_particle} ${family}`
                            : family,
                        },
                      ],
                    });
                  }
                  if (given) {
                    nameElements.push({
                      type: 'element',
                      name: 'given-names',
                      elements: [
                        {
                          type: 'text',
                          text: dropping_particle ? `${given} ${dropping_particle}` : given,
                        },
                      ],
                    });
                  }
                  // Prefix not yet supported by name parsing
                  if (suffix) {
                    nameElements.push({
                      type: 'element',
                      name: 'suffix',
                      elements: [{ type: 'text', text: suffix }],
                    });
                  }
                  investigatorElements.push({
                    type: 'element',
                    name: 'name',
                    elements: nameElements,
                  });
                }
                if (author.name) {
                  investigatorElements.push({
                    type: 'element',
                    name: 'string-name',
                    elements: [{ type: 'text', text: author.name }],
                  });
                }
                return {
                  type: 'element',
                  name: 'principal-investigator',
                  elements: investigatorElements,
                };
              }),
            );
          }
          return { type: 'element', name: 'award-group', elements: awardElements };
        }),
      );
    }
    if (fund.statement) {
      elements.push({
        type: 'element',
        name: 'funding-statement',
        elements: [{ type: 'text', text: fund.statement }],
      });
    }
    if (fund.open_access) {
      elements.push({
        type: 'element',
        name: 'open-access',
        elements: [
          { type: 'element', name: 'p', elements: [{ type: 'text', text: fund.open_access }] },
        ],
      });
    }
    return { type: 'element', name: 'funding-group', elements };
  });
  return fundingGroups ? fundingGroups : [];
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

export function getArticleMeta(frontmatter?: ProjectFrontmatter, state?: IJatsSerializer): Element {
  const elements = [];
  if (frontmatter) {
    elements.push(
      // article-id
      // article-version, article-version-alternatives
      // article-categories
      ...getArticleTitle(frontmatter),
      ...getArticleAuthors(frontmatter),
      ...getArticleAffiliations(frontmatter),
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
    );
  }
  if (state?.data.abstracts && state.data.abstracts.length > 0) {
    elements.push(...state.data.abstracts);
  }
  if (frontmatter) {
    elements.push(
      // trans-abstract
      ...getKwdGroup(frontmatter),
      ...getFundingGroup(frontmatter),
      // support-group
      // conference
      // counts
    );
  }
  return { type: 'element', name: 'article-meta', elements };
}

/**
 * Get <front> JATS element
 *
 * This element must be defined in a JATS article and must include <article-meta>
 */
export function getFront(frontmatter?: ProjectFrontmatter, state?: IJatsSerializer): Element[] {
  const elements: Element[] = [];
  const journalMeta = getJournalMeta();
  if (journalMeta) elements.push(journalMeta);
  const articleMeta = getArticleMeta(frontmatter, state);
  elements.push(articleMeta);
  return [{ type: 'element', name: 'front', elements }];
}
