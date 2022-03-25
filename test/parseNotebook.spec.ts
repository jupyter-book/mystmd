import { JupyterNotebook, KINDS } from '@curvenote/blocks';
import {
  clearEmulator,
  createUsers,
  createProjects,
  projects,
  mockStorage,
  users,
  createFixture,
} from '../../src/helpers';
import NotebookImportTask from '../../src/processing/tasks/notebook';
import exampleNotebookAsJson from '../data/example_lab.ipynb.json';
import { parseNotebook } from '../../src/processing/import/notebook';
import { database as db, errors } from '../../src';
import { getConfigAndSecrets } from '../getConfigAndSecrets';

const { backend } = createFixture(...getConfigAndSecrets());

const upload_path = `uploads/${users.u1.id}/${'x'.repeat(36)}`;

describe('processing.notebook', () => {
  beforeAll(async () => {
    await clearEmulator(backend);
    await createUsers(backend);
    await createProjects(backend);
    mockStorage(backend);
  });

  describe('task', () => {
    test('validation - file does not exist', async () => {
      mockStorage(backend, false);
      const task = new NotebookImportTask(new db.Context(backend, users.u1.id), projects.u1.id);
      await expect(() => task.downloadAndValidate(upload_path)).rejects.toBe(
        errors.fileDoesNotExist,
      );
    });
    test('validation - invalid json', async () => {
      mockStorage(backend, true, [{ toString: () => '{ bad:' }]);
      const task = new NotebookImportTask(new db.Context(backend, users.u1.id), projects.u1.id);
      await expect(() => task.downloadAndValidate(upload_path)).rejects.toThrow('Invalid Notebook');
    });
  });

  describe('processing', () => {
    test('test data is well formed', () => {
      expect(() => JSON.stringify(exampleNotebookAsJson)).not.toThrow();
    });

    test('parse notebook', () => {
      const { notebook, blocks } = parseNotebook(exampleNotebookAsJson as JupyterNotebook);

      expect(notebook).toBeDefined();
      expect(notebook.kind).toEqual(KINDS.Notebook);
      expect(notebook.language).toEqual('python');
      expect(notebook).toHaveProperty('metadata');
      expect(notebook.order).toEqual([]);
      expect(notebook.children).toEqual({});

      expect(blocks).toBeDefined();
      expect(blocks).toHaveLength(7);
      expect(blocks.filter((b) => b.output)).toHaveLength(2);
    });
  });
});
