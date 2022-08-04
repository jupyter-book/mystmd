export enum CreditRoles {
  Conceptualization = 'Conceptualization',
  DataCuration = 'Data curation',
  FormalAnalysis = 'Formal analysis',
  FundingAcquisition = 'Funding acquisition',
  Investigation = 'Investigation',
  Methodology = 'Methodology',
  ProjectAdministration = 'Project administration',
  Resources = 'Resources',
  Software = 'Software',
  Supervision = 'Supervision',
  Validation = 'Validation',
  Visualization = 'Visualization',
  WritingOriginalDraft = 'Writing – original draft',
  WritingReviewEditing = 'Writing – review & editing',
}

export const DEFAULT_CONTRIBUTION_ROLES: CreditRoles[] = [
  CreditRoles.Conceptualization,
  CreditRoles.DataCuration,
  CreditRoles.FormalAnalysis,
  CreditRoles.FundingAcquisition,
  CreditRoles.Investigation,
  CreditRoles.Methodology,
  CreditRoles.ProjectAdministration,
  CreditRoles.Resources,
  CreditRoles.Software,
  CreditRoles.Supervision,
  CreditRoles.Validation,
  CreditRoles.Visualization,
  CreditRoles.WritingOriginalDraft,
  CreditRoles.WritingReviewEditing,
];

export interface Affiliation {
  id: string;
  text: string;
}

export type AuthorRoles = CreditRoles | string | null;

export interface Author {
  id: string;
  name: string | null;
  userId: string | null;
  orcid: string | null;
  corresponding: boolean;
  email: string | null;
  roles: AuthorRoles[];
  affiliations: string[];
}
