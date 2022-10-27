import { Option } from 'commander';

export function makePdfOption() {
  return new Option('--pdf', 'Build PDF output').default(false);
}

export function makeTexOption() {
  return new Option('--tex', 'Build Tex outputs').default(false);
}

export function makeDocxOption() {
  return new Option('--word, --docx', 'Build Docx output').default(false);
}

export function promptContinue() {
  return {
    name: 'cont',
    message: 'Would you like to continue?',
    type: 'confirm',
    default: true,
  };
}
