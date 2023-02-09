import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type { GenericNode } from 'myst-common';
import type { MathExtensionOptions } from './plugins';
import type { MdastOptions } from './tokensToMyst';

export type TokenHandlerSpec = {
  type: string;
  getAttrs?: (token: Token, tokens: Token[], index: number) => Record<string, any>;
  attrs?: Record<string, any>;
  noCloseToken?: boolean;
  isText?: boolean;
  isLeaf?: boolean;
};

enum ParseTypesEnum {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  parsed = 'parsed',
}

type ParseTypes = string | number | boolean | GenericNode[];

type ArgDefinition = {
  type: ParseTypesEnum;
  required?: boolean;
  doc?: string;
};

type BodyDefinition = ArgDefinition;

type OptionDefinition = {
  name: string;
} & ArgDefinition;

type DirectiveData = {
  arg?: ParseTypes;
  options?: Record<string, ParseTypes>;
  body?: ParseTypes;
};

type RoleData = {
  body?: ParseTypes;
};

export type DirectiveSpec = {
  name: string;
  doc?: string;
  arg?: ArgDefinition;
  options?: OptionDefinition[];
  body?: BodyDefinition;
  validate?: (data: DirectiveData) => DirectiveData;
  run: (data: DirectiveData) => GenericNode[];
};

export type RoleSpec = {
  name: string;
  body?: BodyDefinition;
  validate?: (data: RoleData) => RoleData;
  run: (data: RoleData) => GenericNode[];
};

export type AllOptions = {
  markdownit: MarkdownIt.Options;
  extensions: {
    colonFences?: boolean;
    frontmatter?: boolean;
    math?: boolean | MathExtensionOptions;
    footnotes?: boolean;
    deflist?: boolean;
    tasklist?: boolean;
    tables?: boolean;
    blocks?: boolean;
  };
  mdast: MdastOptions;
  directives: DirectiveSpec[];
  roles: RoleSpec[];
};
