import { silentLogger } from '../logging';
import { Session } from '../session';
import { transformMath } from './math';
import { selectFileWarnings } from '../store/build/selectors';

const ARRAY_ALIGN = `\\begin{align*}
  L=
  \\left(
    \\begin{array}{*{16}c}
       . &  &   &   &  &   &   &   \\\\
      1 & .  &  &   &   &  &   &   \\\\
        & 1 & . &  &   &   &  &   \\\\
        &   & 1 & . &   &   &   &  \\\\
      1 &   &   &   & . &  &   &     \\\\
        & 1 &   &   & 1 & . &  &      \\\\
        &   & 1 &   &   & 1 & . &    \\\\
        &   &   & 1 &   &   & 1 & .   \\\\
    \\end{array}
  \\right),
\\end{align*}`;

const EQNARRAY = `\\mathbb{E}(\\hat{U}_{ij}) &=& (1-4 \\alpha) \\mathbb{E}(F_{ij}) + \\alpha( \\mathbb{E}(F_{i-1j}) + \\mathbb{E}(F_{i+1j}) + \\mathbb{E}(F_{ij-1}) + \\mathbb{E}(F_{ij+1})) \\\\ &=& (1-4 \\alpha) \\hat F_{ij} + \\alpha( \\hat F_{i-1j} + \\hat F_{i+1j} + \\hat F_{ij-1} + \\hat F_{ij+1}),`;

let session: Session;

beforeEach(() => {
  session = new Session(undefined, { logger: silentLogger() });
});

describe('Test math trasformations', () => {
  test('Array alignment', async () => {
    const mathNode = { type: 'math', value: ARRAY_ALIGN } as any;
    const mdast = { children: [mathNode] } as any;
    transformMath(session, 'file', mdast);
    expect(mathNode.error).toBeUndefined();
    expect(mathNode.html).toBeTruthy();
  });
  test('Array alignment -- error', async () => {
    const mathNode = {
      type: 'math',
      // Replace the expression with something that isn't caught
      value: ARRAY_ALIGN.replace('{array}{*{16}c}', '{array}{*c}'),
    } as any;
    const mdast = { children: [mathNode] } as any;
    transformMath(session, 'file', mdast);
    expect(mathNode.error).toBe(true);
    expect(mathNode.message.includes('Unknown column alignment')).toBe(true);
  });
  test('\\begin{eqnarray}', async () => {
    const mathNode = { type: 'math', value: EQNARRAY } as any;
    const mdast = { children: [mathNode] } as any;
    expect.assertions(5);
    session.log.warn = jest.fn((w) => {
      expect(w.includes('\\begin{align*}')).toBe(true);
      expect(w.includes("Expected 'EOF'")).toBe(true);
    });
    transformMath(session, 'file', mdast);
    expect(session.log.warn).toBeCalledTimes(1);
    expect(mathNode.error).toBeUndefined();
    expect(mathNode.html).toBeTruthy();
  });
  test('Test raises warning', async () => {
    const fileName = 'file';
    const mathNode = { type: 'math', value: '\\x' } as any;
    const mdast = { children: [mathNode] } as any;
    transformMath(session, fileName, mdast);
    const warnings = selectFileWarnings(session.store.getState(), fileName);
    expect(warnings?.length).toBe(1);
  });
  test('Test no warning on macro replacement', async () => {
    const fileName = 'file';
    const mathNode = { type: 'math', value: '\\bf{y}' } as any;
    const mdast = { children: [mathNode] } as any;
    transformMath(session, fileName, mdast, { math: { '\\bf': '{\\mathbf #1}' } });
    const warnings = selectFileWarnings(session.store.getState(), fileName);
    expect(warnings).toBe(undefined);
  });
});
