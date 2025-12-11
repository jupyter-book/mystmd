import { describe, expect, it } from 'vitest';
import { unnestKernelSpec } from './unnestKernelSpec';

describe('unnestKernelSpec', () => {
  it('jupyter.kernelspec unnests to kernelspec', async () => {
    const frontmatter = {
      jupyter: {
        kernelspec: {
          name: 'python3',
          language: 'python',
        },
      },
    };
    unnestKernelSpec(frontmatter);
    expect(frontmatter).toEqual({
      kernelspec: {
        name: 'python3',
        language: 'python',
      },
    });
  });
  it('jupyter keeps extra keys after kernelspec unnest', async () => {
    const frontmatter = {
      jupyter: {
        kernelspec: {
          name: 'python3',
          language: 'python',
        },
        extra: '',
      },
    };
    unnestKernelSpec(frontmatter);
    expect(frontmatter).toEqual({
      kernelspec: {
        name: 'python3',
        language: 'python',
      },
      jupyter: {
        extra: '',
      },
    });
  });
});
