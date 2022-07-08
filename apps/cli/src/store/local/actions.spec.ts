import mock from 'mock-fs';
import { Session } from '../../session';
import { loadFile } from './actions';

afterEach(() => mock.restore());

const session = new Session();

describe('loadFile', () => {
  it('invalid notebook does not error', async () => {
    mock({ 'notebook.ipynb': '{"invalid_notebook": "yes"}' });
    expect(await loadFile(session, 'notebook.ipynb')).toEqual(undefined);
  });
});
