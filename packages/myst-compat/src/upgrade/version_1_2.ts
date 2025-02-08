import type { Parent } from 'mdast';
import type { Outputs as Outputs2, Output as Output2 } from '../types/v2.js';
import type { Output as Output1 } from '../types/v1.js';
import { visit, SKIP } from 'unist-util-visit';

export function upgrade(ast: Parent) {
  visit(ast as any, 'output', (node: Output1, index: number | null, parent: Parent | null) => {
    // Case 1: convert "classic" AST to "future" AST
    // 1. nest `Output` under `Outputs`
    // 2. lift `identifier` and `html_id` labels to `Outputs`
    // 3. lift `visibility` to `Outputs`
    // assert node.children.length === 1
    const outputsChildren = (node.data ?? []).map((outputData) => {
      const result: Output2 = {
        type: 'output',
        jupyter_data: outputData,
        children: [], // FIXME: ignoring children here
      };
      return result;
    });
    // Nest `output` under `outputs` (1)
    const outputs: Outputs2 = {
      type: 'outputs',
      children: outputsChildren as Parent[],
      // Lift `Output.visibility` to `Outputs` (3)
      visibility: node.visibility,
      // Lift `Output.identifier` and `Output.html_id` to `Outputs` (2)
      identifier: node.identifier,
      html_id: node.html_id,
    };
    if (parent) {
      parent.children[index!] = outputs as any;
    }
    return SKIP;
  });
}
