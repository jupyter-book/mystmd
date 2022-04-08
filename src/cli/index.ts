#!/usr/bin/env node
import commander from 'commander';
import version from '../version';
import { addAuthCLI, addExportCLI, addWebCLI, addTokenCLI } from './services';

const program = new commander.Command();
addExportCLI(program);
addTokenCLI(program);
addAuthCLI(program);
addWebCLI(program);

program.option('-D, --debug [file]', 'Log out any errors to the console or an optional file.');
program.option('-C, --config [config]', 'Path to configuration file', './curvenote.yml');
program.version(version, '-V, --version', 'Print the current version of curvenotejs');
program.parse(process.argv);
