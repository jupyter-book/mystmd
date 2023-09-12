export type Award = {
  id?: string;
  name?: string;
  description?: string;
  sources?: string[]; // These are affiliation ids
  /** Recipients and investigators are added to author list; these are references */
  recipients?: string[];
  investigators?: string[];
};

export type Funding = {
  statement?: string;
  /** Open access statement */
  open_access?: string;
  awards?: Award[];
};
