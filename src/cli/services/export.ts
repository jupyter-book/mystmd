import { Command, Option } from 'commander';
import { oxaLinkToWord, oxaLinkToMarkdown, oxaLinkToTex } from '../..';
import { clirun } from './utils';

function makeImageOption() {
  return new Option('-i, --images <images>', 'Change the path to save the images to').default(
    'images',
  );
}

function makeWordExportCLI(program: Command) {
  const command = new Command('docx')
    .alias('word')
    .description('Export a Microsoft Word document from a Curvenote link')
    .argument('<article>', 'A link to the Curvenote article (e.g. oxaLink or api link)')
    .argument('[output]', 'The document filename to export to', 'article.docx')
    .action(clirun(oxaLinkToWord, { program }));
  return command;
}

function makeMarkdownExportCLI(program: Command) {
  const command = new Command('markdown')
    .alias('md')
    .description('Export a markdown file from a Curvenote link')
    .argument('<article>', 'A link to the Curvenote article (e.g. oxaLink or api link)')
    .argument('[output]', 'The document filename to export to', 'article.md')
    .addOption(makeImageOption())
    .action(clirun(oxaLinkToMarkdown, { program }));
  return command;
}

function makeTexExportCLI(program: Command) {
  const command = new Command('latex')
    .alias('tex')
    .description('Export a tex file from a Curvenote link')
    .argument('<article>', 'A link to the Curvenote article (e.g. oxaLink or api link)')
    .argument('[output]', 'The document filename to export to', 'main.tex')
    .addOption(makeImageOption())
    .action(clirun(oxaLinkToTex, { program }));
  return command;
}

export function addExportCLI(program: Command) {
  const command = new Command('export').description(
    'Export a Curvenote document to different formats',
  );
  command.addCommand(makeWordExportCLI(program));
  command.addCommand(makeMarkdownExportCLI(program));
  command.addCommand(makeTexExportCLI(program));
  program.addCommand(command);
}
