import type { Affiliation, Contributor } from '../index.js';

export type Award = {
  id?: string;
  name?: string;
  description?: string;
  sources?: Affiliation[]; // These are affiliation ids
  /** Recipients and investigators are added to author list; these are references */
  recipients?: (Contributor | Affiliation)[];
  investigators?: Contributor[];
};

export type Funding = {
  statement?: string;
  /** Open access statement */
  open_access?: string;
  awards?: Award[];
};
