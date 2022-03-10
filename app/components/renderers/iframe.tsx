import { GenericNode } from 'mystjs';

export const IFrame = (node: GenericNode) => {
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
          width: `${node.width || 70}%`,
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

export const iframeRenderers = {
  iframe: IFrame,
};
