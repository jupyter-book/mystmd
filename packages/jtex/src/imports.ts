import type { TemplateImports } from './types.js';
import { writeTexLabelledComment } from 'myst-common';

const commentLength = 50;

export function createImportCommands(commands: Set<string>, existingPackages?: string[]): string[] {
  const sorted = [...commands].sort();
  const existingSet = new Set(existingPackages);
  const filtered = existingPackages ? sorted.filter((p) => !existingSet.has(p)) : sorted;
  return filtered.map((c) => `\\usepackage{${c}}`);
}

export function createMathCommands(plugins: Record<string, string>): string[] {
  if (!plugins || Object.keys(plugins).length === 0) return [];
  return Object.entries(plugins).map(([k, v]) => {
    const numArgs = v.match(/#([1-9])/g)?.length ?? 0;
    if (numArgs === 0) return `\\newcommand{${k}}{${v}}`;
    return `\\newcommand{${k}}[${numArgs}]{${v}}`;
  });
}

export function renderImports(
  templateImports?: string | TemplateImports,
  existingPackages?: string[],
): string {
  if (!templateImports || typeof templateImports === 'string') return templateImports || '';
  const packages = new Set(templateImports.imports);
  const imports = writeTexLabelledComment('imports', createImportCommands(packages, existingPackages), commentLength);
  const commands = writeTexLabelledComment('math commands', createMathCommands(templateImports.commands), commentLength);
  const block = `${imports}${commands}`;
  if (!block) return '';
  const percents = ''.padEnd(commentLength, '%');
  return `${percents}\n${block}${percents}`;
}

export function mergeTemplateImports(
  current?: Partial<TemplateImports>,
  next?: Partial<TemplateImports>,
): TemplateImports {
  return {
    commands: { ...current?.commands, ...next?.commands },
    imports: [...new Set([...(current?.imports ?? []), ...(next?.imports ?? [])])],
  };
}
