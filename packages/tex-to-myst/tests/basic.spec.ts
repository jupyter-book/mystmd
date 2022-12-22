import { u } from 'unist-builder';
import { VFile } from 'vfile';
import { TexParser } from '../src';

describe('tex-to-myst', () => {
  it('Basic latex parsing', () => {
    const text = 'This text is \\textbf{bold \\emph{and emphasized}}.';
    const file = new VFile();
    const tex = new TexParser(text, file);
    expect(tex.raw.type).toEqual('root');
    expect(tex.raw.content.length).toEqual(8);
    expect(tex.raw.position?.start.offset).toEqual(0);
    expect(tex.ast).toEqual(
      u('root', [
        u('paragraph', [
          u('text', 'This text is '),
          u('strong', [u('text', 'bold '), u('emphasis', [u('text', 'and emphasized')])]),
          u('text', '.'),
        ]),
      ]),
    );
  });
  it('Basic citations parsing', () => {
    const text = '\\cite{something}';
    const file = new VFile();
    const tex = new TexParser(text, file);
    expect(tex.raw.type).toEqual('root');
  });
});
