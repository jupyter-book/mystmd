#!/usr/bin/env node
import commander from 'commander';
import version from '../version';
import { addAuthCLI } from './auth';
import { addExportCLI } from './export';
import { addSyncCLI } from './sync';
import { addTokenCLI } from './token';
import { addWebCLI } from './web';

const program = new commander.Command();
addSyncCLI(program);
addWebCLI(program);
addTokenCLI(program);
addAuthCLI(program);
addExportCLI(program);

program.version(`v${version}`, '-v, --version', 'Print the current version of curvenote');
program.option('-d, --debug [file]', 'Log out any errors to the console or an optional file.');
program.parse(process.argv);
