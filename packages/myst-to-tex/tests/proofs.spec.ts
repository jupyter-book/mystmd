import { describe, test, expect } from 'vitest';
import { TexProofSerializer } from '../src/proof';

describe('TexProofSerializer preamble', () => {
  test.each(['algorithm', 'assumption', 'criterion', 'property'])(
    'declares a \\newtheorem environment for %s',
    (env) => {
      const { preamble } = new TexProofSerializer();
      expect(preamble).toContain(`\\newtheorem{${env}}`);
    },
  );
});
