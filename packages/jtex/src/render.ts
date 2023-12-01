import { TemplateKind } from 'myst-common';
import type { TexTemplateImports, TypstTemplateImports } from './types.js';
import { renderTexImports } from './tex/imports.js';
import { renderTypstImports } from './typst/imports.js';

export function renderImports(
  kind: TemplateKind,
  output: string,
  imports?: TexTemplateImports | TypstTemplateImports | undefined,
  packages?: string[],
  preamble?: string,
) {
  if (kind === TemplateKind.tex) {
    return renderTexImports(imports as TexTemplateImports, packages, preamble);
  } else if (kind === TemplateKind.typst) {
    return renderTypstImports(output, imports as TypstTemplateImports, preamble);
  }
}
