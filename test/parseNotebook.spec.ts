import { JupyterNotebook, KINDS } from '@curvenote/blocks';
import exampleNotebookAsJson from './example_lab.ipynb.json';
import { parseNotebook } from '../src';

describe('processing.notebook', () => {
  describe('processing', () => {
    test('test data is well formed', () => {
      expect(() => JSON.stringify(exampleNotebookAsJson)).not.toThrow();
    });

    test('parse notebook', () => {
      const { notebook, children } = parseNotebook(exampleNotebookAsJson as JupyterNotebook);

      expect(notebook).toBeDefined();
      expect(notebook.kind).toEqual(KINDS.Notebook);
      expect(notebook.language).toEqual('python');
      expect(notebook).toHaveProperty('metadata');
      expect(notebook.order).toEqual([]);
      expect(notebook.children).toEqual({});

      expect(children).toBeDefined();
      expect(children).toHaveLength(7);
      expect(children.filter((b) => b.output)).toHaveLength(2);
    });

    test('parse notebook with invalid cell', () => {
      const invalidCellNotebook = { ...exampleNotebookAsJson }
      invalidCellNotebook.cells = [{} as any, ...invalidCellNotebook.cells]
      const { notebook, children } = parseNotebook(invalidCellNotebook as JupyterNotebook);

      expect(notebook).toBeDefined();
      expect(notebook.kind).toEqual(KINDS.Notebook);
      expect(notebook.language).toEqual('python');
      expect(notebook).toHaveProperty('metadata');
      expect(notebook.order).toEqual([]);
      expect(notebook.children).toEqual({});

      expect(children).toBeDefined();
      expect(children).toHaveLength(7);
      expect(children.filter((b) => b.output)).toHaveLength(2);
    });
  });
});
