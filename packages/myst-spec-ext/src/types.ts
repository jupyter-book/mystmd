import type {
  Parent,
  StaticPhrasingContent,
  FlowContent,
  ListContent,
  PhrasingContent,
  TableCell as SpecTableCell,
  FootnoteReference as FNR,
  FootnoteDefinition as FND,
  Heading as SpecHeading,
  Image as SpecImage,
  Admonition as SpecAdmonition,
  Code as SpecCode,
  ListItem as SpecListItem,
  Container as SpecContainer,
} from 'myst-spec';

export type Delete = Parent & { type: 'delete' };
export type Underline = Parent & { type: 'underline' };
export type Smallcaps = Parent & { type: 'smallcaps' };
export type DefinitionTerm = Parent & { type: 'definitionTerm' };
export type DefinitionDescription = Parent & { type: 'definitionDescription' };
export type DefinitionList = Parent & {
  type: 'definitionList';
  children: (DefinitionTerm | DefinitionDescription)[];
};
export type CaptionNumber = Parent & {
  type: 'captionNumber';
  kind: string;
  label: string;
  identifier: string;
  html_id: string;
  enumerator: string;
};

export type FootnoteDefinition = FND & {
  /** @deprecated this should be enumerator */
  number?: number;
  enumerator?: string;
};

export type FootnoteReference = FNR & {
  /** @deprecated this should be enumerator */
  number?: number;
  enumerator?: string;
};

export type TableCell = SpecTableCell & { colspan?: number; rowspan?: number; width?: number };

export type TabSet = Parent & {
  type: 'tabSet';
};

export type TabItem = Parent & {
  type: 'tabItem';
  title: string;
  sync?: string;
  selected?: boolean;
};

export type Heading = SpecHeading & {
  html_id?: string;
  implicit?: true;
};

export type Image = SpecImage & {
  urlSource?: string;
  height?: string;
  placeholder?: boolean;
};

export type Iframe = {
  type: 'iframe';
  label?: string;
  identifier?: string;
  src: string;
  width?: string;
  align?: Image['align'];
  class?: Image['class'];
};

export type Admonition = SpecAdmonition & {
  icon?: boolean;
};

export type Code = SpecCode & {
  executable?: boolean;
  visibility?: 'show' | 'hide' | 'remove';
};

export type ListItem = SpecListItem & {
  checked?: boolean;
};

export type CiteKind = 'narrative' | 'parenthetical';

export type Cite = {
  type: 'cite';
  kind: CiteKind;
  label: string;
  children: StaticPhrasingContent[];
  error?: boolean | 'not found' | 'rendering error';
  prefix?: string;
  suffix?: string;
  partial?: 'author' | 'year';
};

export type CiteGroup = {
  type: 'citeGroup';
  kind: CiteKind;
  children: Cite[];
};

export type SiUnit = {
  type: 'si';
  number?: string;
  unit?: string;
  units?: string[];
  alt?: string;
  value: string;
};

export type InlineExpression = {
  type: 'inlineExpression';
  value: string;
  identifier?: string;
  result?: Record<string, any>;
  children?: StaticPhrasingContent[];
};

export enum SourceFileKind {
  Article = 'Article',
  Notebook = 'Notebook',
}

export type Dependency = {
  url?: string;
  slug?: string;
  kind?: SourceFileKind;
  title?: string;
  short_title?: string;
  label?: string;
  location?: string;
};

export type Embed = {
  type: 'embed';
  'remove-input'?: boolean;
  'remove-output'?: boolean;
  source?: Dependency;
  children?: (FlowContent | ListContent | PhrasingContent)[];
};

type IncludeFilter = {
  startAfter?: string;
  startAt?: string;
  endBefore?: string;
  endAt?: string;
  /** Lines start at 1 and can be negative (-1 is the last line). For example, [1, 3, [10]] will select lines 1, 3 and 10 until the end. */
  lines?: (number | [number, number?])[];
};

export type Include = {
  type: 'include';
  file: string;
  literal?: boolean;
  filter?: IncludeFilter;
  lang?: string;
  showLineNumbers?: boolean;
  /** The `match` will be removed in a transform */
  startingLineNumber?: number | 'match';
  emphasizeLines?: number[];
  identifier?: string;
  label?: string;
  children?: (FlowContent | ListContent | PhrasingContent)[];
  /** `caption` is temporary, and is used before a transform */
  caption?: (FlowContent | ListContent | PhrasingContent)[];
};

export type Container = SpecContainer & {
  source?: Dependency;
};
