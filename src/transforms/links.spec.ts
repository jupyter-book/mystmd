import mock from 'mock-fs';
import { fileFromRelativePath } from './links';

afterEach(() => mock.restore());

describe('fileFromRelativePath', () => {
  it('non-existent returns undefined', async () => {
    mock({});
    expect(fileFromRelativePath('readme')).toEqual(undefined);
  });
  it('url returns undefined', async () => {
    mock({});
    expect(fileFromRelativePath('https://example.com')).toEqual(undefined);
  });
  it('file returns file', async () => {
    mock({ 'readme.pdf': '' });
    expect(fileFromRelativePath('readme.pdf')).toEqual('readme.pdf');
  });
  it('file returns file (decodeURI)', async () => {
    mock({ 'notebooks/Joint EM inversion.ipynb': '' });
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
    mock({ 'readme.ipynb': '' });
    expect(fileFromRelativePath('readme')).toEqual('readme.ipynb');
  });
  it('file with no ext prefers md', async () => {
    mock({ 'readme.md': '', 'readme.ipynb': '' });
    expect(fileFromRelativePath('readme')).toEqual('readme.md');
  });
  it('file in folder', async () => {
    mock({ folder: { 'readme.md': '', 'readme.ipynb': '' } });
    expect(fileFromRelativePath('folder/readme')).toEqual('folder/readme.md');
  });
  it('file in path', async () => {
    mock({ folder: { 'readme.md': '', 'readme.ipynb': '' } });
    expect(fileFromRelativePath('readme', 'folder/readme.ipynb')).toEqual('folder/readme.md');
  });
  it('file up a directory', async () => {
    mock({ 'readme.md': '', folder: { 'readme.md': '', 'readme.ipynb': '' } });
    expect(fileFromRelativePath('../readme', 'folder/readme.ipynb')).toEqual('readme.md');
  });
  it('hash passed through', async () => {
    mock({ 'readme.md': '', folder: { 'readme.md': '', 'readme.ipynb': '' } });
    expect(fileFromRelativePath('../readme#target#etc', 'folder/readme.ipynb')).toEqual(
      'readme.md#target#etc',
    );
  });
});
