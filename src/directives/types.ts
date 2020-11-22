import Token from 'markdown-it/lib/token';
import MarkdownIt from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import { HTMLOutputSpecArray } from '../utils';
import { StateEnv, TargetKind, Target } from '../state';

export type Directive<Args extends {} = {}, Opts extends {} = {}> = {
  token: string;
  numbered?: TargetKind;
  getArguments: (info: string) => { args: Args; content?: string };
  getOptions: (data: Record<string, string>) => Opts;
  renderer: (
    args: Args, opts: Opts, target: Target | undefined,
    tokens: Token[], idx: number, options: MarkdownIt.Options, env: StateEnv, self: Renderer,
  ) => HTMLOutputSpecArray;
};

export type Directives = Record<string, Directive>;
