import { JsonObject } from '@curvenote/blocks';
import { notebookFromJupyter } from '../src';

describe('translators.notebook', () => {
  describe('fromJupyter', () => {
    it('should produce a iooxa notebook container object', () => {
      const json = {
        metadata: {
          someone: "else's stuff",
          kernelspec: {
            language: 'python',
          },
        },
        nbformat: 9,
        nbformat_minor: 9,
      } as JsonObject;

      const notebook = notebookFromJupyter(json);

      expect(notebook).toEqual(
        expect.objectContaining({
          metadata: {
            someone: "else's stuff",
            kernelspec: {
              language: 'python',
            },
            nbformat: 9,
            nbformat_minor: 9,
          },
          language: 'python',
          order: [],
          children: {},
        }),
      );
    });
    it('given unknown language, value passes through', () => {
      const json = {
        metadata: {
          someone: "else's stuff",
          kernelspec: {
            language: 'scala',
          },
        },
        nbformat: 9,
        nbformat_minor: 9,
      } as JsonObject;

      const notebook = notebookFromJupyter(json);

      expect(notebook).toEqual(
        expect.objectContaining({
          // question keep language enum handling,
          // how ot handle many different languages, just allow passthough
          // and enable syntax highlighting for all that is supported by the
          // front end?
          language: 'scala',
        }),
      );
    });
    it('given no kernelspec language, the translation still succeeds', () => {
      const json = {
        metadata: {
          someone: "else's stuff",
        },
        nbformat: 9,
        nbformat_minor: 9,
      } as JsonObject;

      const notebook = notebookFromJupyter(json);

      expect(notebook).toEqual(
        expect.objectContaining({
          language: '',
        }),
      );
    });
  });
});
