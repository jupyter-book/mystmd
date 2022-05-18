import { Option } from 'commander';

export function makeYesOption() {
  return new Option('-y, --yes', 'Use the defaults and answer "Y" to confirmations').default(false);
}
