import { fromDTO } from './notebook';
import { JsonObject } from '../types';

describe('Notebook Blocks', () => {
  let notebookJson: JsonObject;

  beforeAll(() => {
    notebookJson = {
      language: 'python',
      order: ['clientid1', 'clientid2'],
      children: {
        clientid1: {
          id: 'clientid1',
          src: {
            project: 'MPzgUYrIImy3I5EOD4S1',
            block: 'FuzUCuKyl0Wm6gs7TThW',
            version: 1,
          },
        },
        clientid2: {
          id: 'clientid2',
          src: {
            project: 'MPzgUYrIImy3I5EOD4S1',
            block: 'gJkIKsrXHx9cbp01W2QR',
            version: 1,
          },
          output: {
            project: 'MPzgUYrIImy3I5EOD4S1',
            block: 'gs5cCPWIMhe9pZv0sFhM',
            version: 2,
          },
        },
      },
      metadata: {
        kernelspec: {
          display_name: 'Python 3',
          language: 'python',
          name: 'python3',
        },
        language_info: {
          codemirror_mode: {
            name: 'ipython',
            version: 3,
          },
          file_extension: '.py',
          mimetype: 'text/x-python',
          name: 'python',
          nbconvert_exporter: 'python',
          pygments_lexer: 'ipython3',
          version: '3.7.6',
        },
      },
    };
  });

  describe('Name of the group', () => {
    it('Given an empty object, fromDTO applies defaults', () => {
      expect(fromDTO({})).toEqual(
        expect.objectContaining({
          language: '',
          order: [],
          children: {},
        }),
      );
    });

    it('Given a well formed object, fromDTO', () => {
      expect(fromDTO(notebookJson)).toEqual(expect.objectContaining(notebookJson));
    });
  });
});
