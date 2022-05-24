#!/usr/bin/env node
import commander from 'commander';
import version from '../version';
import { addAuthCLI, addExportCLI, addWebCLI, addTokenCLI, addSyncCLI } from './services';

const program = new commander.Command();
addTokenCLI(program);
addAuthCLI(program);
addSyncCLI(program);
addWebCLI(program);
addExportCLI(program);

program.version(`v${version}`, '-v, --version', 'Print the current version of curvenotejs');
program.option('-d, --debug [file]', 'Log out any errors to the console or an optional file.');
program.parse(process.argv);
