import Token from 'markdown-it/lib/token';
import MarkdownIt from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import { HTMLOutputSpecArray } from '../utils';
import { StateEnv, TargetKind } from '../state';

type Args = Record<string, any>;

export type Directive = {
  token: string;
  numbered?: TargetKind;
  getArguments: (info: string) => { args: Args; content?: string };
  getOptions: (data: Record<string, string>) => Record<string, any>;
  renderer: (
    tokens: Token[], idx: number, options: MarkdownIt.Options, env: StateEnv, self: Renderer,
  ) => HTMLOutputSpecArray;
};

export type Directives = Record<string, Directive>;
