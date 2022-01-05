#!/usr/bin/env node
import commander from 'commander';
import { addAuthCLI, addExportCLI, addTokenCLI } from './services';
import version from '../version';

const program = new commander.Command();
addExportCLI(program);
addTokenCLI(program);
addAuthCLI(program);

program.option('-d, --debug [file]', 'Log out any errors to the console or an optional file.');
program.version(version, '-v, --version', 'output the current version');
program.parse(process.argv);
