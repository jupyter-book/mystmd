import {
  VersionId,
  KINDS,
  TARGET,
  CodeFormatTypes,
  Blocks,
  CellOutput,
  CELL_TYPE,
  CodeCell,
} from '@curvenote/blocks';
import { toJupyter, fromJupyter } from '../src/translators/codeCell';

describe('translators.codeCell', () => {
  let iooxaId: VersionId;
  let iooxaCodeBlock: Blocks.Code;
  let outputVersionId: VersionId;

  let jupyterCodeCell: CodeCell;
  let jupyterCellOutputs: CellOutput[];

  beforeEach(() => {
    iooxaId = {
      project: 'a',
      block: 'b',
      version: 1,
    };

    outputVersionId = {
      project: 'x',
      block: 'y',
      version: 2,
    };

    jupyterCellOutputs = [
      {
        output_type: 'stream',
        name: 'text',
        text: 'Hello Iooxa!',
      },
      {
        output_type: 'stream',
        name: 'ndarray',
        text: 'array([0,1,2,3,4,5])',
      },
    ];

    // TODO: get from factory
    jupyterCodeCell = {
      cell_type: CELL_TYPE.Code,
      metadata: {
        collapsed: true,
        scrolled: false,
        something: 'unknown',
      },
      source: 'print("Hello Jupyter Versioning!")',
      execution_count: 2,
      outputs: [...jupyterCellOutputs],
    } as CodeCell;

    iooxaCodeBlock = {
      id: { ...iooxaId },
      targets: [TARGET.JupyterCode],
      content: 'print("Hello Versions!")',
      language: 'python',
      metadata: {
        jupyter: {
          scrolled: false,
          collapsed: true,
          something: 'unknown',
        },
      },
      execution_count: 101,
      output: { ...outputVersionId },
      // end of partial
      kind: KINDS.Code,
      format: CodeFormatTypes.txt,
      title: 'Iooxa Code Block',
      description: 'That came from the database',
      caption: '<p>That came from the database</p>',
      published: false,
      created_by: 'steve',
      date_created: new Date('2020-06-18T10:17:07.348Z'),
      version: 2,
      parent: null, // TODO: what would be realistic here for a code cell? an article...
      links: {
        self: 'base/a/b',
        download: '',
        project: 'base/projects/a',
        block: 'base/blocks/a/b',
        // comments: 'base/blocks/a/b/comments' // not in type :?
        versions: 'base/blocks/a/b/versions',
        created_by: 'base/users/steve',
        drafts: 'base/drafts/a/b',
        // default_draft: 'base/drafts}/a/b/default-draft-id', // not in type :?
        // latest: 'base/blocks/a/b/versions/id', // not in type :?
        // published: 'base/blocks/a/b/versions/99', // not in type :?
      },
    };
  });

  describe('Jupyter', () => {
    it('given a Iooxa Code block, fromIooxa returns a populated Jupyter CodeCell', () => {
      const cell = toJupyter(iooxaCodeBlock);

      // assert on PartialCode fields, except metadata
      expect(cell).toEqual(
        expect.objectContaining({
          cell_type: CELL_TYPE.Code,
          source: 'print("Hello Versions!")',
          execution_count: iooxaCodeBlock.execution_count,
          metadata: {
            ...jupyterCodeCell.metadata,
            iooxa: {
              outputId: { ...outputVersionId },
            },
          },
          outputs: [...jupyterCellOutputs],
        }),
      );
    });

    it.only('Given a Jupyter CodeCell, toIooxa returns a populated Iooxa Code block', () => {
      const blocks = fromJupyter(jupyterCodeCell, 'python');

      expect(blocks).toHaveLength(2);

      expect(blocks[0]).toEqual(
        expect.objectContaining({
          content: `${jupyterCodeCell.source}`,
          language: 'python',
          metadata: {
            jupyter: {
              collapsed: true,
              scrolled: false,
              something: 'unknown',
            },
          },
          execution_count: jupyterCodeCell.execution_count,
        }),
      );
      expect(blocks[1]).toEqual(
        expect.objectContaining({
          kind: KINDS.Output,
          original: jupyterCellOutputs,
        }),
      );
    });
  });
});
