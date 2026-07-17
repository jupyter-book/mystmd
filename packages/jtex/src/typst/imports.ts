import path from 'node:path';
import type { TypstTemplateImports } from '../types.js';
import { writeFileToFolder } from 'myst-cli-utils';

export function renderTypstImports(
  output: string | false,
  templateImports?: TypstTemplateImports,
  preamble?: string,
): string {
  const { macros, commands } = templateImports ?? {};
  const importStatements: string[] = [];
  const hasMacros = macros && macros.length > 0;
  if (hasMacros) importStatements.push('#import "myst-imports.typ": *');
  if (output && hasMacros) {
    const mystTypst = path.join(path.dirname(output), 'myst-imports.typ');
    writeFileToFolder(mystTypst, macros.join('\n\n'));
  }
  if (commands && Object.keys(commands).length > 0) {
    importStatements.push('', '/* Math Macros */');
    Object.entries(commands).forEach(([k, v]) => {
      // Won't work for math with args
      importStatements.push(`#let ${k} = $${v.trim()}$`);
    });
  }
  if (preamble) importStatements.push(preamble);
  return importStatements.join('\n');
}

export function mergeTypstTemplateImports(
  current?: Partial<TypstTemplateImports>,
  next?: Partial<TypstTemplateImports>,
): TypstTemplateImports {
  return {
    commands: { ...current?.commands, ...next?.commands },
    macros: [...new Set([...(current?.macros ?? []), ...(next?.macros ?? [])])],
  };
}
