import { CrossReference } from 'myst-spec';
import { InlineError } from './inlineError';
import { NodeRenderer } from './types';

const CrossReference: NodeRenderer<CrossReference> = (node, children) => {
  if (!children) {
    return (
      <InlineError
        key={node.key}
        value={node.label || node.identifier || 'No Label'}
        message="Cross Reference Not Found"
      />
    );
  }
  return (
    <a key={node.key} href={`#${node.identifier}`}>
      {children}
    </a>
  );
};

const CROSS_REFERENCE_RENDERERS = {
  crossReference: CrossReference,
};

export default CROSS_REFERENCE_RENDERERS;
