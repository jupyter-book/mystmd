import fs from 'node:fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import type { ISession } from 'myst-cli-utils';
import { writeFileToFolder } from 'myst-cli-utils';
import { checkFolderIsGit, checkAtGitRoot } from '../../utils/git.js';
import { npmBinaryName, npmPackageName } from '../../utils/whiteLabelling.js';

const READTHEDOCS_FILENAME = '.readthedocs.yaml';

function createReadTheDocsConfig({
  pythonVersion = '3.12',
  nodeVersion = '22',
}: {
  pythonVersion?: string;
  nodeVersion?: string;
} = {}) {
  return `# Read the Docs configuration file for ${npmBinaryName()}
# See https://docs.readthedocs.io/en/stable/config-file/v2.html for details
# This file was created automatically with \`${npmBinaryName()} init --readthedocs\`

# Required
version: 2

# Set the OS, Python version, and Node.js version
# Note: Python is included for executing code in notebooks or using Jupyter Book
build:
  os: ubuntu-22.04
  tools:
    python: "${pythonVersion}"
    nodejs: "${nodeVersion}"
  commands:
    # Install ${npmBinaryName()}
    - npm install -g ${npmPackageName()}
    # Build the site
    - ${npmBinaryName()} build --html
    # Copy the output to Read the Docs expected location
    - mkdir -p $READTHEDOCS_OUTPUT/html/
    - cp -r _build/html/. "$READTHEDOCS_OUTPUT/html"
    # Clean up build artifacts
    - rm -rf _build
`;
}

export async function readTheDocsAction(session: ISession) {
  // Check if we're in a git repo (warn but don't fail)
  const inGitRepo = await checkFolderIsGit();
  if (!inGitRepo) {
    session.log.warn(
      `${chalk.yellow(
        'Not a git repository',
      )}\n\nThe .readthedocs.yaml file is typically used in a git repository.`,
    );
  }

  // Check if we're at the git root
  if (inGitRepo) {
    const inRoot = await checkAtGitRoot();
    if (!inRoot) {
      session.log.info(
        `${chalk.redBright(
          'Please Run From Root',
        )}\n\nPlease run this command from the root of the git repository.`,
      );
      process.exit(1);
    }
  }

  // Check if config already exists
  if (fs.existsSync(READTHEDOCS_FILENAME)) {
    const promptOverwrite = await inquirer.prompt([
      {
        name: 'overwrite',
        message: `The file ${chalk.yellow(
          READTHEDOCS_FILENAME,
        )} already exists. Do you want to overwrite it?`,
        type: 'confirm',
        default: false,
      },
    ]);
    if (!promptOverwrite.overwrite) {
      session.log.info('Aborted.');
      return;
    }
  }

  session.log.info(`📝 Creating a ${chalk.yellow(READTHEDOCS_FILENAME)} configuration file\n`);

  const prompt = await inquirer.prompt([
    {
      name: 'pythonVersion',
      message: 'What Python version? (For executing notebooks or using Jupyter Book)',
      default: '3.12',
    },
    {
      name: 'nodeVersion',
      message: 'What Node.js version would you like to use?',
      default: '22',
    },
  ]);

  const config = createReadTheDocsConfig({
    pythonVersion: prompt.pythonVersion,
    nodeVersion: prompt.nodeVersion,
  });

  writeFileToFolder(READTHEDOCS_FILENAME, config);

  session.log.info(`
🎉 Read the Docs configuration is ready:

${READTHEDOCS_FILENAME}

✅ ${chalk.bold.green('Next Steps')}

1. Create an account on ${chalk.blue('https://readthedocs.org')} if you don't have one
2. Import your project from GitHub/GitLab/Bitbucket
3. Commit and push the ${chalk.yellow(READTHEDOCS_FILENAME)} file to your repository
4. Read the Docs will automatically build your documentation on each push
5. 🎉 Your documentation will be available at ${chalk.blue('https://YOUR-PROJECT.readthedocs.io')}

For more information, see: ${chalk.blue('https://docs.readthedocs.com/platform/stable/intro/mystmd.html')}
`);
}
