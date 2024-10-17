import type { Command } from 'commander';
import { build, Session, makeBuildCommand } from 'myst-cli';
import { clirun } from './clirun.js';

export function makeBuildCLI(program: Command) {
  const command = makeBuildCommand().action(
    clirun(Session, build, program, {
      keepAlive: (_, opts) => !!opts.watch,
    }),
  );
  return command;
}
