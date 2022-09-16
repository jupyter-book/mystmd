import memfs from 'memfs';
import { fileFromRelativePath } from './links';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('fs', () => memfs.fs);

beforeEach(() => memfs.vol.reset());

describe('fileFromRelativePath', () => {
  it('non-existent returns undefined', async () => {
    memfs.vol.fromJSON({});
    expect(fileFromRelativePath('readme')).toEqual(undefined);
  });
  it('url returns undefined', async () => {
    memfs.vol.fromJSON({});
    expect(fileFromRelativePath('https://example.com')).toEqual(undefined);
  });
  it('file returns file', async () => {
    memfs.vol.fromJSON({ 'readme.pdf': '' });
    expect(fileFromRelativePath('readme.pdf')).toEqual('readme.pdf');
  });
  it('file returns file (decodeURI)', async () => {
    memfs.vol.fromJSON({ 'notebooks/Joint EM inversion.ipynb': '' });
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
    memfs.vol.fromJSON({ 'readme.ipynb': '' });
    expect(fileFromRelativePath('readme')).toEqual('readme.ipynb');
  });
  it('file with no ext prefers md', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'readme.ipynb': '' });
    expect(fileFromRelativePath('readme')).toEqual('readme.md');
  });
  it('file in folder', async () => {
    memfs.vol.fromJSON({ 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('folder/readme')).toEqual('folder/readme.md');
  });
  it('file in path', async () => {
    memfs.vol.fromJSON({ 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('readme', 'folder/readme.ipynb')).toEqual('folder/readme.md');
  });
  it('file up a directory', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('../readme', 'folder/readme.ipynb')).toEqual('readme.md');
  });
  it('hash passed through', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('../readme#target#etc', 'folder/readme.ipynb')).toEqual(
      'readme.md#target#etc',
    );
  });
});
