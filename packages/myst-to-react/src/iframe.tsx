import type { NodeRenderer } from './types';

export const IFrame: NodeRenderer = (node) => {
  return (
    <figure
      key={node.key}
      id={node.label || undefined}
      style={{ textAlign: node.align || 'center' }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          paddingBottom: '60%',
          width: `min(max(${node.width || 70}%, 500px), 100%)`,
        }}
      >
        <iframe
          width="100%"
          height="100%"
          src={node.src}
          allowFullScreen
          allow="autoplay"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            border: 'none',
          }}
        ></iframe>
      </div>
    </figure>
  );
};

const IFRAME_RENDERERS = {
  iframe: IFrame,
};

export default IFRAME_RENDERERS;
