import commander from 'commander';
import { oxaLinkToWord } from '../..';
import { clirun } from './utils';

export function makeWordExportCLI() {
  const command = new commander.Command('docx')
    .alias('word')
    .description('Export a Microsoft Word document from a Curvenote link')
    .argument('<article>', 'A link to the Curvenote article (e.g. oxaLink or api link)')
    .argument('[output]', 'The document filename to export to', 'article.docx')
    .action(clirun(oxaLinkToWord));
  return command;
}

export function makeExportCLI() {
  const command = new commander.Command('export').description(
    'Export a Curvenote document to different formats',
  );
  command.addCommand(makeWordExportCLI());
  return command;
}
