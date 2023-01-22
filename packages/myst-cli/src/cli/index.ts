#!/usr/bin/env node
import { Command } from 'commander';
import version from '../version';
import { makeBuildCLI } from './build';
import { makeCleanCLI } from './clean';
import { makeInitCLI } from './init';
import { makeStartCLI } from './site';
import { makeTemplatesCLI } from './templates';

const program = new Command();

program.addCommand(makeInitCLI(program));
program.addCommand(makeStartCLI(program));
program.addCommand(makeBuildCLI(program));
program.addCommand(makeTemplatesCLI(program));
program.addCommand(makeCleanCLI(program));
program.version(`v${version}`, '-v, --version', 'Print the current version of myst');
program.option('-d, --debug', 'Log out any errors to the console.');
program.parse(process.argv);
