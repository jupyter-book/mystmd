import { MinifiedMimeOutput, MinifiedOutput, MinifiedStreamOutput } from '../src/minify/types';
import { formatMinifiedPaths } from '../src/minify';

describe('minify.format', () => {
  test('formatMinifiedPaths - stream', () => {
    const A = [{} as MinifiedOutput];
    formatMinifiedPaths(A, (p: string) => `/${p}`);
    expect((A[0] as MinifiedStreamOutput).path).toBeUndefined();

    const B = [{ path: 'a/b/c' } as MinifiedOutput];
    formatMinifiedPaths(B, (p: string) => `/${p}`);
    expect((B[0] as MinifiedStreamOutput).path).toEqual('/a/b/c');
  });
  test('formatMinifiedPaths - multiple items', () => {
    const A = [{ path: 'a/b/c' } as MinifiedOutput, { path: 'x/y/z' } as MinifiedOutput];
    formatMinifiedPaths(A, (p: string) => `/${p}`);
    expect((A[0] as MinifiedStreamOutput).path).toEqual('/a/b/c');
    expect((A[1] as MinifiedStreamOutput).path).toEqual('/x/y/z');
  });
  test('formatMinifiedPaths - mime', () => {
    const A = [
      {
        data: {
          'text/plain': { content: 'blah' },
        },
      } as unknown as MinifiedMimeOutput,
    ];
    formatMinifiedPaths(A, (p: string) => `/${p}`);
    expect((A[0].data['text/plain'] as any).path).toBeUndefined();

    const B = [
      {
        data: {
          'text/plain': { path: 'a/b/c' },
        },
      } as unknown as MinifiedMimeOutput,
    ];
    formatMinifiedPaths(B, (p: string) => `/${p}`);
    expect((B[0] as any).data['text/plain'].path).toEqual('/a/b/c');
  });
});
