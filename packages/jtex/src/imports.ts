import type { ExpandedImports } from './types';

const commentLenth = 50;

function label(title: string, commands: string[]) {
  if (!commands || commands?.length === 0) return '';
  const len = (commentLenth - title.length - 4) / 2;
  const start = ''.padEnd(Math.ceil(len), '%');
  const end = ''.padEnd(Math.floor(len), '%');
  const titleBlock = `${start}  ${title}  ${end}\n`;
  return `${titleBlock}${commands.join('\n')}\n`;
}

export function renderImports(expandedImports?: string | ExpandedImports): string {
  if (!expandedImports || typeof expandedImports === 'string') return expandedImports || '';
  const imports = label('imports', [...new Set(expandedImports.imports)]);
  const commands = label('math commands', [...new Set(expandedImports.commands)]);
  const block = `${imports}${commands}`;
  if (!block) return '';
  const percents = ''.padEnd(commentLenth, '%');
  return `${percents}\n${block}${percents}`;
}

export function mergeExpandedImports(
  current?: Partial<ExpandedImports>,
  next?: Partial<ExpandedImports>,
): ExpandedImports {
  return {
    commands: [...(current?.commands ?? []), ...(next?.commands ?? [])],
    imports: [...(current?.imports ?? []), ...(next?.imports ?? [])],
  };
}
