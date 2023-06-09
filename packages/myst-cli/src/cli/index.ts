#!/usr/bin/env node
import { Command } from 'commander';
import version from '../version.js';
import { makeBuildCLI } from './build.js';
import { makeCleanCLI } from './clean.js';
import { makeInitCLI, addDefaultCommand } from './init.js';
import { makeStartCLI } from './site.js';
import { makeTemplatesCLI } from './templates.js';

const program = new Command();

program.addCommand(makeInitCLI(program));
program.addCommand(makeStartCLI(program));
program.addCommand(makeBuildCLI(program));
program.addCommand(makeTemplatesCLI(program));
program.addCommand(makeCleanCLI(program));
program.version(`v${version}`, '-v, --version', 'Print the current version of myst');
program.option('-d, --debug', 'Log out any errors to the console');
addDefaultCommand(program);
program.parse(process.argv);
