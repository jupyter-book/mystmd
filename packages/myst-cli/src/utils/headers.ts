import version from '../version.js';

const USER_AGENT = `myst-cli/${version}`;

export const EXT_REQUEST_HEADERS = {
  'User-Agent': USER_AGENT,
};
