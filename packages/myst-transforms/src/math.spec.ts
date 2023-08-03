import { describe, expect, test } from 'vitest';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { mathTransform, mathPlugin, mathNestingTransform } from './math';
import { codeBlockToDirectiveTransform } from './code';

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
  test('Array alignment', () => {
    const file = new VFile();
    const mathNode = { type: 'math', value: ARRAY_ALIGN } as any;
    const mdast = { children: [mathNode] } as any;
    mathTransform(mdast, file);
    expect(mathNode.error).toBeUndefined();
    expect(mathNode.html).toBeTruthy();
  });
  test('Array alignment -- error', () => {
    const file = new VFile();
    const mathNode = {
      type: 'math',
      // Replace the expression with something that isn't caught
      value: ARRAY_ALIGN.replace('{array}{*{16}c}', '{array}{*c}'),
    } as any;
    const mdast = { children: [mathNode] } as any;
    mathTransform(mdast, file);
    expect(mathNode.error).toBe(true);
    expect(mathNode.message.includes('Unknown column alignment')).toBe(true);
  });
  test('\\begin{eqnarray}', () => {
    const file = new VFile();
    const mathNode = { type: 'math', value: EQNARRAY } as any;
    const mdast = { children: [mathNode] } as any;
    mathTransform(mdast, file);
    expect(file.messages[0].message.includes('\\begin{align*}')).toBe(true);
    expect(file.messages[0].note?.includes("Expected 'EOF'")).toBe(true);
    expect(mathNode.error).toBeUndefined();
    expect(mathNode.html).toBeTruthy();
  });
  test('Test raises warning', () => {
    const file = new VFile();
    const mathNode = { type: 'math', value: '\\x' } as any;
    const mdast = { children: [mathNode] } as any;
    mathTransform(mdast, file);
    expect(file.messages.length).toBe(1);
    expect(file.messages[0].message.includes('Undefined control sequence: \\x')).toBe(true);
    expect(file.messages[0].fatal).toBe(true);
  });
  test('Test no warning on macro replacement', () => {
    const file = new VFile();
    const mathNode = { type: 'math', value: '\\bf{y}' } as any;
    const mdast = { children: [mathNode] } as any;
    mathTransform(mdast, file, { macros: { '\\bf': '{\\mathbf #1}' } });
    expect(file.messages.length).toBe(0);
  });
});

describe('Test math transform as a plugin', () => {
  test('Test basic pipeline', () => {
    const file = new VFile();
    const mathNode = { type: 'math', value: '\\bf{y}' } as any;
    const mdast = { type: 'root', children: [mathNode] } as any;
    unified()
      .use(mathPlugin, { macros: { '\\bf': '{\\mathbf #1}' } })
      .runSync(mdast, file);
    expect(file.messages.length).toBe(0);
  });
  test('Test basic pipeline with error', () => {
    const file = new VFile();
    const mathNode = { type: 'math', value: '\\x' } as any;
    const mdast = { type: 'root', children: [mathNode] } as any;
    unified().use(mathPlugin).runSync(mdast, file);
    expect(file.messages.length).toBe(1);
    expect(file.messages[0].message.includes('Undefined control sequence: \\x')).toBe(true);
    expect(file.messages[0].fatal).toBe(true);
  });
});

describe('Test math nesting transformation', () => {
  test('Unnest a single math paragraph', () => {
    const file = new VFile();
    const paragraph = {
      type: 'paragraph',
      children: [{ type: 'math', value: '' }],
    } as any;
    const mdast = { children: [paragraph] } as any;
    expect(mdast.children[0].type).toBe('paragraph');
    mathNestingTransform(mdast, file);
    expect(mdast.children[0].type).toBe('math');
  });
  test('Unnest math in paragraph with other content', () => {
    const file = new VFile();
    const paragraph = {
      type: 'paragraph',
      class: 'importantClass',
      children: [
        { type: 'text', value: 'Hello' },
        { type: 'math', value: '' },
        { type: 'text', value: 'math!' },
      ],
    } as any;
    const mdast = { type: 'root', children: [{ type: 'block', children: [paragraph] }] } as any;
    expect(mdast.children[0].children[0].type).toBe('paragraph');
    mathNestingTransform(mdast, file);
    expect(mdast.children[0].children[0].type).toBe('paragraph');
    expect(mdast.children[0].children[0].class).toBe('importantClass');
    expect(mdast.children[0].children[1].type).toBe('math');
    expect(mdast.children[0].children[2].type).toBe('paragraph');
    expect(mdast.children[0].children[2].class).toBe('importantClass');
  });
});

describe('Test math code block transformation', () => {
  test('Block paragraph', () => {
    const file = new VFile();
    const mdast = { children: [{ type: 'code', lang: 'math', value: 'Ax = b' }] } as any;
    codeBlockToDirectiveTransform(mdast, file, { translate: ['math'] });
    expect(mdast.children[0].type).toBe('math');
    expect(mdast.children[0].lang).toBeUndefined();
    expect(mdast.children[0].value).toBe('Ax = b');
  });
});
