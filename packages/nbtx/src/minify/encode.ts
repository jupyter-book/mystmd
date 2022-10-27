import type { IMimeBundle, IOutput } from '@jupyterlab/nbformat';

async function requestImageAsBase64String(src: string) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';

  const base64String = new Promise<string>((resolve, reject) => {
    img.onload = function ol() {
      const canvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // eslint-disable-next-line no-console
        console.error('Could not get canvas context');
        return reject();
      }
      canvas.height = (this as HTMLImageElement).naturalHeight;
      canvas.width = (this as HTMLImageElement).naturalWidth;
      ctx.drawImage(this as HTMLImageElement, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      const [, base64] = dataURL.split(';base64,');
      resolve(base64);
    };

    // trigger the load
    try {
      // attempt to properly resolve the url
      const url = new URL(document.referrer);
      img.src = `${url.origin}${src}`;
    } catch (err: any) {
      // if not best we can do is to try and load the src directly
      console.error(`Could not get origin from referrer: ${document.referrer}, for: ${src}`);
      img.src = src;
    }
  });

  return base64String;
}

function isUrl(maybeUrl: string) {
  return maybeUrl.startsWith('http') || maybeUrl.startsWith('/');
}

export async function fetchAndEncodeOutputImages(outputs: IOutput[]) {
  return Promise.all(
    outputs.map(async (output) => {
      if (!('data' in output)) return output;

      const imageMimetypes = Object.keys(output.data as IMimeBundle).filter(
        (mimetype) => mimetype !== 'image/svg' && mimetype.startsWith('image/'),
      );
      if (imageMimetypes.length === 0) return output;
      // this is an async fetch, so we need to await the result
      const images = await Promise.all(
        imageMimetypes.map(async (mimetype) => {
          /*
            image/* types can be either raw svg, base64 encoded or a URL.
            base64 encoded images can include data:image/*;base64, or be naked
            svgs can also be base64 encoded, or plain '<svg ...></svg>'.
            URLs can be relative or absolute
          */
          const data = (output.data as IMimeBundle)[mimetype] as string;
          if (isUrl(data)) return requestImageAsBase64String(data);
          return data;
        }),
      );

      imageMimetypes.forEach((mimetype, i) => {
        // eslint-disable-next-line no-param-reassign
        (output.data as IMimeBundle)[mimetype] = images[i];
      });

      return output;
    }),
  );
}
