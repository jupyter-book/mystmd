import { KINDS, TARGET, OutputFormatTypes, Blocks, CellOutput } from '@curvenote/blocks';
import { fromJupyter } from '../src/translators/outputData';

describe('Output Data translators', () => {
  describe('fromJupyter', () => {
    let exampleOutputs: CellOutput[];
    beforeAll(() => {
      exampleOutputs = [
        {
          name: 'stdout',
          output_type: 'stream',
          text: [
            'Some Text\n',
            '[[0.33443675 0.23975405 0.18086117 0.80326382 0.4381933  0.24269873]]',
          ],
        },
        {
          data: {
            'text/plain': ['<matplotlib.colorbar.Colorbar at 0x7f94c70fef90>'],
          },
          execution_count: 2,
          metadata: {},
          output_type: 'execute_result',
        },
        {
          data: {
            // notebooks add a newline! to the image code
            'image/png': 'iVBORw0KGgoAAAANSUhEUgAAAScAAAD5CAYAAABlGfOq',
            'text/plain': ['<Figure size 432x288 with 2 Axes>'],
          },
          metadata: {
            needs_background: 'light',
          },
          output_type: 'display_data',
        },
        {
          data: {
            'text/html': [
              '<p>Visit <a href="http://www.iooxa.com">www.iooxa.com</a>\n',
              'right now!</p>\n',
            ],
            'text/plain': ['<IPython.core.display.HTML object>'],
          },
          metadata: {},
          output_type: 'display_data',
        },
      ];
    });

    it('converts outputs to list of fragments and original', () => {
      const block = fromJupyter(exampleOutputs) as Blocks.Output;
      expect(block).toEqual(
        expect.objectContaining({
          kind: KINDS.Output,
          targets: [TARGET.JupyterOutput],
          format: OutputFormatTypes.jupyter,
          original: exampleOutputs,
        }),
      );
    });
  });
});
