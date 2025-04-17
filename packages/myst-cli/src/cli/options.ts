import { InvalidArgumentError, Option } from 'commander';

export const MYST_DOI_BIB_FILE = 'myst.doi.bib';

function parseInt(value: any) {
  const parsedValue = Number.parseInt(value, 10);
  if (isNaN(parsedValue)) throw new InvalidArgumentError('Not a number.');
  return parsedValue;
}

export function makePdfOption(description: string) {
  return new Option('--pdf', description).default(false);
}

export function makeTexOption(description: string) {
  return new Option('--tex', description).default(false);
}

export function makeTypstOption(description: string) {
  return new Option('--typst', description).default(false);
}

export function makeDocxOption(description: string) {
  return new Option('--word, --docx', description).default(false);
}

export function makeMdOption(description: string) {
  return new Option('--md', description).default(false);
}

export function makeIpynbOption(description: string) {
  return new Option('--ipynb', description).default(false);
}

export function makeJatsOption(description: string) {
  return new Option('--jats, --xml', description).default(false);
}

export function makeMecaOptions(description: string) {
  return new Option('--meca', description).default(false);
}

export function makeCffOption(description: string) {
  return new Option('--cff', description).default(false);
}

export function makeSiteOption(description: string) {
  return new Option('--site', description).default(false);
}

export function makeHtmlOption(description: string) {
  return new Option('--html', description).default(false);
}

export function makeLogsOption(description: string) {
  return new Option('--logs', description).default(false);
}

export function makeCacheOption(description: string) {
  return new Option('--cache', description).default(false);
}

export function makeExecuteOption(description: string) {
  return new Option('--execute', description).default(false);
}

export function makeAllOption(description: string) {
  return new Option('-a, --all', description).default(false);
}

export function makeDOIBibOption() {
  return new Option(
    '--doi-bib',
    `Generate (or regenerate) ${MYST_DOI_BIB_FILE} file containing bibtex entries for all remotely loaded DOI citations`,
  )
    .default(false)
    .implies({ writeDOIBib: true });
}

export function makeWatchOption() {
  return new Option('--watch', 'Watch modified files and re-build on change').default(false);
}

export function makeNamedExportOption(description: string) {
  return new Option('-o, --output <output>', description);
}

export function makeStrictOption() {
  return new Option('--strict', 'Summarize build warnings and stop on any errors.').default(false);
}

export function makeForceOption() {
  return new Option(
    '--force',
    'Build outputs for the given format, even if corresponding exports are not defined in file frontmatter',
  ).default(false);
}

export function makeCheckLinksOption() {
  return new Option('--check-links', 'Check all links to websites resolve.').default(false);
}

export function makeKeepHostOption() {
  return new Option(
    '--keep-host',
    'The HOST environment variable is changed to "localhost" by default. This flag uses the original environment variable.',
  ).default(false);
}

export function makeHeadlessOption() {
  return new Option(
    '--headless',
    'Run the server in headless mode, with only the content server started',
  ).default(false);
}

export function makePortOption() {
  return new Option('--port <port>', 'Run the application server from the specified port number')
    .argParser(parseInt)
    .env('PORT')
    .default(undefined);
}

export function makeServerPortOption() {
  return new Option(
    '--server-port <server-port>',
    'Run the content server from the specified port number',
  )
    .argParser(parseInt)
    .env('SERVER_PORT')
    .default(undefined);
}

export function makeTemplateOption() {
  return new Option(
    '--template <path-to-template>',
    'Use this template file, instead of the one specified in the myst.yml manifest',
  ).default(undefined);
}

export function makeYesOption() {
  return new Option('-y, --yes', 'Automatically respond yes to prompts').default(false);
}

export function makeCIOption() {
  return new Option(
    '--ci',
    'Indicate the command is running during automated continuous integration',
  ).default(false);
}

export function makeMaxSizeWebpOption() {
  return new Option('--max-size-webp <size>', 'Max image size to convert to webp format in MB')
    .default(1.5 * 1024 * 1024, '1.5')
    .argParser((value) => {
      if (value == null) return undefined;
      const parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) {
        throw new InvalidArgumentError('Must be number');
      }
      return parsedValue * 1024 * 1024;
    });
}

export function makeTempOption() {
  return new Option(
    '--temp',
    'Delete the _build/temp folder where intermediate build artifacts are saved',
  ).default(false);
}

export function makeExportsOption() {
  return new Option(
    '--exports',
    'Delete the _build/exports folder where exports are saved by default',
  ).default(false);
}

export function makeTemplatesOption() {
  return new Option(
    '--templates',
    'Delete the _build/templates folder where downloaded templates are saved',
  ).default(false);
}
