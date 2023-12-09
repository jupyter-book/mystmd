import { writeTexLabelledComment } from 'myst-common';
import type { TexTemplateImports } from '../types.js';

const commentLength = 50;

export function createTexImportCommands(
  commands: Set<string>,
  existingPackages?: string[],
): string[] {
  const sorted = [...commands].sort();
  const existingSet = new Set(existingPackages);
  const filtered = existingPackages ? sorted.filter((p) => !existingSet.has(p)) : sorted;
  return filtered.map((c) => `\\usepackage{${c}}`);
}

export function createTexMathCommands(plugins: Record<string, string>): string[] {
  if (!plugins || Object.keys(plugins).length === 0) return [];
  return Object.entries(plugins).map(([k, v]) => {
    const numArgs = v.match(/#([1-9])/g)?.length ?? 0;
    if (numArgs === 0) return `\\newcommand{${k}}{${v}}`;
    return `\\newcommand{${k}}[${numArgs}]{${v}}`;
  });
}

export function renderTexImports(
  templateImports?: TexTemplateImports,
  existingPackages?: string[],
  preamble?: string,
): string {
  if (!templateImports || typeof templateImports === 'string') return templateImports || '';
  const packages = new Set(templateImports.imports);
  const imports = writeTexLabelledComment(
    'imports',
    createTexImportCommands(packages, existingPackages),
    commentLength,
  );
  const commands = writeTexLabelledComment(
    'math commands',
    createTexMathCommands(templateImports.commands),
    commentLength,
  );
  const block = `${imports}${commands}`;
  if (!block) return '';
  const percents = ''.padEnd(commentLength, '%');
  const preambleContent = preamble ? `${preamble}\n` : '';
  return `${percents}\n${block}${percents}\n${preambleContent}`;
}

export function mergeTexTemplateImports(
  current?: Partial<TexTemplateImports>,
  next?: Partial<TexTemplateImports>,
): TexTemplateImports {
  return {
    commands: { ...current?.commands, ...next?.commands },
    imports: [...new Set([...(current?.imports ?? []), ...(next?.imports ?? [])])],
  };
}
