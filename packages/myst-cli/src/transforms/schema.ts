import { selectAll } from 'unist-util-select';
import { visit, SKIP } from 'unist-util-visit';
import type { GenericNode, GenericParent } from 'myst-common';
import type { IOutput } from '@jupyterlab/nbformat';

/**
 * Convert from a "published" external MyST AST to our internal representation.
 *
 * Sometimes we may need to introduce new features in our AST whose naive implementation would
 * break existing AST consumers. An example is the Output AST refactoring, which exposes individual code-cell
 * outputs to MyST's AST transforms; if we publish this updated AST, consumers may not understand
 * the new node types or renamed fields.
 *
 * In the MDAST world, the only non-breaking change for AST consumers is to _add_ a new field. We can therefore
 * represent new features in our published AST through temporary fields, allowing for new features to be deployed,
 * before actually introducing a breaking schema evolution.
 *
 * This routine presently handles mapping from a "classic" MyST AST (that represents multiple outputs as a single Output node)
 * to a "future" AST that will represent these outputs as individual Output nodes. In order to defer this breaking change as long
 * as is possible, we will externally publish a "backwards & forwards compatible" AST that encodes this new state in a temporary field.
 *
 * Once the "future" AST becomes "contemporary" AST, this routine can be removed.
 *
 * type CodeBlock = {
 *   type: "block";
 *   kind: "notebook-code",
 *   children: [
 *     Code,
 *     Outputs
 *   ]
 * }
 *
 * type Outputs = {
 *   type: "outputs";
 *   children: Output[];
 *   visibility: ...;
 *   identifier: ...;
 *   html_id: ...;
 * }
 *
 * type Output = {
 *   type: "output";
 *   children: GenericNode[];
 *   jupyter_data: IOutput;
 * }
 *
 */
export function externalASTToInternal(ast: GenericParent) {
  visit(
    ast as any,
    'output',
    (node: GenericNode, index: number | null, parent: GenericParent | null) => {
      // Case 1: convert "classic" AST to "future" AST
      // 1. nest `Output` under `Outputs`
      // 2. lift `identifier` and `html_id` labels to `Outputs`
      // 3. lift `visibility` to `Outputs`
      if (parent && parent.type !== 'outputs' && !('_future_ast' in node)) {
        // assert node.children.length === 1
        const outputsChildren = node.data.map((outputData: IOutput) => {
          return {
            type: 'output',
            jupyter_data: outputData,
            children: [], // FIXME: ignoring children here
          };
        });
        // Nest `output` under `outputs` (1)
        const outputs = {
          type: 'outputs',
          children: outputsChildren,
          // Lift `Output.visibility` to `Outputs` (3)
          visibility: node.visibility,
          // Lift `Output.identifier` and `Output.html_id` to `Outputs` (2)
          identifier: node.identifier,
          html_id: node.html_id,
        };
        parent.children[index!] = outputs;
        return SKIP;
      }
      // Case 2: "compatible" AST
      else if (parent && parent.type !== 'outputs' && '_future_ast' in node) {
        parent.children[index!] = node._future_ast;
        return SKIP;
      }
      // Case 3: "future" AST
      else {
        // Don't do anything!
      }
    },
  );
}

/**
 * Convert from an internal MyST AST to a "published" external representation.
 *
 * See the docstring for externalASTToInternal
 *
 * type Output = {
 *   type: "output";
 *   children: GenericNode[];
 *   data: IOutput[];
 *   visibility: ...;
 *   identifier: ...;
 *   html_id: ...;
 * }
 *
 */
export function internalASTToExternal(ast: GenericParent) {
  const outputsNodes = selectAll('outputs', ast) as GenericParent[];
  outputsNodes.forEach((outputsNode) => {
    outputsNode._future_ast = structuredClone(outputsNode);

    outputsNode.type = 'output';
    outputsNode.data = outputsNode.children
      .map((output) => output.jupyter_data)
      .filter((datum) => !!datum);
    // Do not publish any children
    outputsNode.children = [];
  });
}
