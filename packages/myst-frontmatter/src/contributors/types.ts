import type { CreditRole } from 'credit-roles';

export type ContributorRole = CreditRole | string;

export type Name = {
  literal?: string;
  given?: string;
  family?: string;
  dropping_particle?: string;
  non_dropping_particle?: string;
  suffix?: string;
};

export interface Contributor {
  id?: string;
  name?: string; // may be set to Name object
  userId?: string;
  orcid?: string;
  corresponding?: boolean;
  equal_contributor?: boolean;
  deceased?: boolean;
  email?: string;
  roles?: ContributorRole[];
  affiliations?: string[];
  twitter?: string;
  github?: string;
  url?: string;
  note?: string;
  phone?: string;
  fax?: string;
  // Computed property; only 'name' should be set in frontmatter as string or Name object
  nameParsed?: Name;
}
