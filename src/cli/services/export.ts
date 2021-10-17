import commander, { Option } from 'commander';
import { oxaLinkToWord, oxaLinkToMarkdown, oxaLinkToTex } from '../..';
import { clirun } from './utils';

function makeImageOption() {
  return new Option('-i, --images <images>', 'Change the path to save the images to').default(
    'images',
  );
}

export function makeWordExportCLI() {
  const command = new commander.Command('docx')
    .alias('word')
    .description('Export a Microsoft Word document from a Curvenote link')
    .argument('<article>', 'A link to the Curvenote article (e.g. oxaLink or api link)')
    .argument('[output]', 'The document filename to export to', 'article.docx')
    .action(clirun(oxaLinkToWord));
  return command;
}

export function makeMarkdownExportCLI() {
  const command = new commander.Command('markdown')
    .alias('md')
    .description('Export a markdown file from a Curvenote link')
    .argument('<article>', 'A link to the Curvenote article (e.g. oxaLink or api link)')
    .argument('[output]', 'The document filename to export to', 'article.md')
    .addOption(makeImageOption())
    .action(clirun(oxaLinkToMarkdown));
  return command;
}

export function makeTexExportCLI() {
  const command = new commander.Command('latex')
    .alias('tex')
    .description('Export a tex file from a Curvenote link')
    .argument('<article>', 'A link to the Curvenote article (e.g. oxaLink or api link)')
    .argument('[output]', 'The document filename to export to', 'ms.tex')
    .addOption(makeImageOption())
    .action(clirun(oxaLinkToTex));
  return command;
}

export function makeExportCLI() {
  const command = new commander.Command('export').description(
    'Export a Curvenote document to different formats',
  );
  command.addCommand(makeWordExportCLI());
  command.addCommand(makeMarkdownExportCLI());
  command.addCommand(makeTexExportCLI());
  return command;
}
