import { Command } from 'commander';
import {
  makeKeepHostOption,
  makeHeadlessOption,
  makePortOption,
  makeServerPortOption,
  makeTemplateOption,
  makeExecuteOption,
  makeMaxSizeWebpOption,
} from './options.js';

export function makeStartCommand() {
  const command = new Command('start')
    .description('Start the current project as a website')
    .addOption(makeExecuteOption('Execute Notebooks'))
    .addOption(makeKeepHostOption())
    .addOption(makeHeadlessOption())
    .addOption(makePortOption())
    .addOption(makeServerPortOption())
    .addOption(makeTemplateOption())
    .addOption(makeMaxSizeWebpOption());
  return command;
}
