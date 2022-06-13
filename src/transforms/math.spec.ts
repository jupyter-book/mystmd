import { silentLogger } from '../logging';
import { transformMath } from './math';

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

describe('Test math trasformations', () => {
  test('Array alignment', async () => {
    const mathNode = { type: 'math', value: ARRAY_ALIGN } as any;
    const mdast = { children: [mathNode] } as any;
    transformMath(silentLogger(), mdast, {}, '');
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
    transformMath(silentLogger(), mdast, {}, '');
    expect(mathNode.error).toBe(true);
    expect(mathNode.message.includes('Unknown column alignment')).toBe(true);
  });
  test('\\begin{eqnarray}', async () => {
    const mathNode = { type: 'math', value: EQNARRAY } as any;
    const mdast = { children: [mathNode] } as any;
    const log = silentLogger();
    expect.assertions(5);
    log.warn = jest.fn((w) => {
      expect(w.includes('\\begin{align*}')).toBe(true);
      expect(w.includes("Expected 'EOF'")).toBe(true);
    });
    transformMath(log, mdast, {}, '');
    expect(log.warn).toBeCalledTimes(1);
    expect(mathNode.error).toBeUndefined();
    expect(mathNode.html).toBeTruthy();
  });
});
