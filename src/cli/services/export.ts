import { Command, Option } from 'commander';
import { oxaLinkToWord, oxaLinkToMarkdown, oxaLinkToTex, oxaLinkToPdf } from '../..';
import { oxaLinkToJupyterBook } from '../../export/jupyter-book';
import { clirun } from './utils';

function makeImageOption() {
  return new Option('-i, --images <images>', 'Change the path to save the images to').default(
    'images',
  );
}

function makeTemplateOption() {
  return new Option('-t, --template <name>', 'Specify a template to apply during export');
}

function makeTemplateOptionsOption() {
  return new Option(
    '-o, --options <name>',
    'Specify a `yaml` file containing optional data for the template',
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
    .addOption(makeTemplateOption())
    .addOption(makeTemplateOptionsOption())
    .action(clirun(oxaLinkToTex, { program }));
  return command;
}

function makePdfExportCLI(program: Command) {
  const command = new Command('pdf')
    .description('Export a pdf file from a Curvenote link')
    .argument('<article>', 'A link to the Curvenote article (e.g. oxaLink or api link)')
    .argument('[output]', 'The document filename to export to', 'main.pdf')
    .addOption(makeTemplateOption())
    .addOption(makeTemplateOptionsOption())
    .action(clirun(oxaLinkToPdf, { program }));
  return command;
}

function makeJupyterBookExportCLI(program: Command) {
  const command = new Command('jupyter-book')
    .alias('jb')
    .description('Export a jupyter-book project from a Curvenote link')
    .argument('<project>', 'A link to the Curvenote project (e.g. oxaLink or projectId)')
    .action(clirun(oxaLinkToJupyterBook, { program }));
  return command;
}

export function addExportCLI(program: Command) {
  const command = new Command('export').description(
    'Export a Curvenote document to different formats',
  );
  command.addCommand(makeWordExportCLI(program));
  command.addCommand(makeMarkdownExportCLI(program));
  command.addCommand(makeTexExportCLI(program));
  command.addCommand(makePdfExportCLI(program));
  command.addCommand(makeJupyterBookExportCLI(program));
  program.addCommand(command);
}
