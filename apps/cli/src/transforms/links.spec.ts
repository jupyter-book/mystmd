import { vol } from 'memfs';
import { fileFromRelativePath } from './links';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('fs', () => require('memfs').fs);

beforeEach(() => vol.reset());

describe('fileFromRelativePath', () => {
  it('non-existent returns undefined', async () => {
    vol.fromJSON({});
    expect(fileFromRelativePath('readme')).toEqual(undefined);
  });
  it('url returns undefined', async () => {
    vol.fromJSON({});
    expect(fileFromRelativePath('https://example.com')).toEqual(undefined);
  });
  it('file returns file', async () => {
    vol.fromJSON({ 'readme.pdf': '' });
    expect(fileFromRelativePath('readme.pdf')).toEqual('readme.pdf');
  });
  it('file returns file (decodeURI)', async () => {
    vol.fromJSON({ 'notebooks/Joint EM inversion.ipynb': '' });
    expect(fileFromRelativePath('notebooks/Joint%20EM%20inversion')).toEqual(
      'notebooks/Joint EM inversion.ipynb',
    );
    expect(fileFromRelativePath('notebooks/Joint%20EM%20inversion.ipynb')).toEqual(
      'notebooks/Joint EM inversion.ipynb',
    );
    expect(fileFromRelativePath('notebooks/Joint EM inversion.ipynb')).toEqual(
      'notebooks/Joint EM inversion.ipynb',
    );
  });
  it('file with no ext returns ipynb file', async () => {
    vol.fromJSON({ 'readme.ipynb': '' });
    expect(fileFromRelativePath('readme')).toEqual('readme.ipynb');
  });
  it('file with no ext prefers md', async () => {
    vol.fromJSON({ 'readme.md': '', 'readme.ipynb': '' });
    expect(fileFromRelativePath('readme')).toEqual('readme.md');
  });
  it('file in folder', async () => {
    vol.fromJSON({ 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('folder/readme')).toEqual('folder/readme.md');
  });
  it('file in path', async () => {
    vol.fromJSON({ 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('readme', 'folder/readme.ipynb')).toEqual('folder/readme.md');
  });
  it('file up a directory', async () => {
    vol.fromJSON({ 'readme.md': '', 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('../readme', 'folder/readme.ipynb')).toEqual('readme.md');
  });
  it('hash passed through', async () => {
    vol.fromJSON({ 'readme.md': '', 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('../readme#target#etc', 'folder/readme.ipynb')).toEqual(
      'readme.md#target#etc',
    );
  });
});
