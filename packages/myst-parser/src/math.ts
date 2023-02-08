import type MarkdownIt from 'markdown-it';
import { dollarmathPlugin } from 'markdown-it-dollarmath';
import { amsmathPlugin } from 'markdown-it-amsmath';

export type MathExtensionOptions = {
  amsmath?: boolean;
  dollarmath?: boolean;
};

export function plugin(md: MarkdownIt, options?: true | MathExtensionOptions): void {
  const opts = options === true ? { amsmath: true, dollarmath: true } : options;
  if (opts?.dollarmath) dollarmathPlugin(md);
  if (opts?.amsmath) amsmathPlugin(md);
}
