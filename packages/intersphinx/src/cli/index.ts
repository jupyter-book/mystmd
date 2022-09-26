#!/usr/bin/env node
import commander from 'commander';
import version from '../version';
import { addParseCLI } from './parse';
import { addSearchCLI } from './list';

const program = new commander.Command();

addParseCLI(program);
addSearchCLI(program);

program.version(`v${version}`, '-v, --version', 'Print the current version of intersphinx');
program.option('-d, --debug', 'Log out any errors to the console.');
program.parse(process.argv);
