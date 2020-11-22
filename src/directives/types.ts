import Token from 'markdown-it/lib/token';
import MarkdownIt from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import { StateEnv, TargetKind } from '../state';

type Attrs = Record<string, any>;

export type DirectiveConstructor = {
  token: string;
  numbered?: TargetKind;
  getArguments: (info: string) => { attrs: Attrs; content?: string };
  getOptions: (data: Record<string, string>) => Record<string, any>;
  renderer: (
    tokens: Token[], idx: number, options: MarkdownIt.Options, env: StateEnv, self: Renderer,
  ) => [string, string | null];
};

export type Directives = Record<string, DirectiveConstructor>;
