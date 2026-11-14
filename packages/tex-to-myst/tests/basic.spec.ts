import { describe, expect, it } from 'vitest';
import { u } from 'unist-builder';
import { VFile } from 'vfile';
import { TexParser } from '../src';
import { stripPositions } from '../src/utils';

describe('tex-to-myst', () => {
  it('Basic latex parsing', () => {
    const text = 'This text is \\textbf{bold \\emph{and emphasized}}.';
    const file = new VFile();
    const tex = new TexParser(text, file);
    expect(tex.raw.type).toEqual('root');
    expect(tex.raw.content.length).toEqual(8);
    expect(tex.raw.position?.start.offset).toEqual(0);
    expect(stripPositions(tex.ast)).toEqual(
      u('root', [
        u('paragraph', [
          u('text', 'This text is '),
          u('strong', [u('text', 'bold '), u('emphasis', [u('text', 'and emphasized')])]),
          u('text', '.'),
        ]),
      ]),
    );
  });
  it('emits a value-based inline code node for texttt', () => {
    const tex = new TexParser('\\texttt{a\\_b}', new VFile());
    expect(stripPositions(tex.ast)).toEqual(
      u('root', [u('paragraph', [u('inlineCode', 'a_b')])]),
    );
  });
  it('preserves listings from the unified-latex environment representation', () => {
    const file = new VFile();
    const tex = new TexParser('\\begin{lstlisting}[language=python]\nprint(1)\n\\end{lstlisting}', file);
    expect(stripPositions(tex.ast)).toEqual(u('root', [u('code', { lang: 'python', value: 'print(1)' })]));
    expect(file.messages).toHaveLength(0);
  });
  it('Basic citations parsing', () => {
    const text = '\\cite{something}';
    const file = new VFile();
    const tex = new TexParser(text, file);
    expect(tex.raw.type).toEqual('root');
  });
});
