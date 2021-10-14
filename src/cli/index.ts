#!/usr/bin/env node
import commander from 'commander';
import { makeAuthCLI, makeExportCLI, makeTokenCLI } from './services';

const program = new commander.Command();
program.addCommand(makeExportCLI());
program.addCommand(makeTokenCLI());
program.addCommand(makeAuthCLI());

program.parse(process.argv);
