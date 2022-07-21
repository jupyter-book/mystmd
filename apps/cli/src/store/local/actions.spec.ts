import { vol } from 'memfs';
import { Session } from '../../session';
import { loadFile } from './actions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('fs', () => require('memfs').fs);

beforeEach(() => vol.reset());

const session = new Session();

describe('loadFile', () => {
  it('invalid notebook does not error', async () => {
    vol.fromJSON({ 'notebook.ipynb': '{"invalid_notebook": "yes"}' });
    expect(await loadFile(session, 'notebook.ipynb')).toEqual(undefined);
  });
});
