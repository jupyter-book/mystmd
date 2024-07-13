import type { Code } from 'myst-spec-ext';
import { nanoid } from 'nanoid';
import type { DirectiveSpec, GenericNode } from 'myst-common';
import { fileError, normalizeLabel, NotebookCell } from 'myst-common';

export const pyvistaDirective: DirectiveSpec = {
  name: 'pyvista',
  doc: 'PyVista figure available offline',
  options: {
    label: {
      type: String,
    },
  },
  body: {
    type: 'myst',
    doc: 'The pyvista code and caption',
  },
  run(data, vfile): GenericNode[] {
    const body = data.body as GenericNode[];
    const codes = body.filter((node) => node.type === 'code');
    const notCodes = body.filter((node) => node.type !== 'code');
    if (codes.length !== 1 || !codes[0].value) {
      fileError(vfile, 'pyvista directive must have one code cell');
      return [];
    }
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const code: Code = {
      type: 'code',
      lang: 'python',
      executable: true,
      value: `${codes[0].value}\nimport pyvista\n[p for p in pyvista.plotting.plotter._ALL_PLOTTERS.values()][-1].export_vtksz('_build/site/public/output.vtksz')`,
    };
    const output = {
      type: 'output',
      id: nanoid(),
      data: [],
    };
    const block: GenericNode = {
      type: 'block',
      kind: NotebookCell.code,
      label,
      identifier,
      children: [code, output, ...notCodes],
      data: {
        tags: ['pyvista'],
      },
    };

    return [block];
  },
};
