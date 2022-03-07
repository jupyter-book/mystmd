import { ISession } from '../../session/types';
import { writeImagesToFiles, ArticleState } from '../utils';
import { TexExportOptions } from './types';
import * as inkscape from '../utils/inkscape';
import * as imagemagick from '../utils/imagemagick';
import { filterFilenamesByExtension, processImages } from './utils';

export async function localizeAndProcessImages(
  session: ISession,
  article: ArticleState,
  opts: TexExportOptions,
  buildPath: string,
): Promise<Record<string, string>> {
  session.log.debug('Start localizing images..');
  const imageFilenames = await writeImagesToFiles(session.log, article.images, {
    basePath: opts?.images ?? 'images',
    buildPath,
  });

  session.log.debug('Processing GIFS if present...');
  const gifs = filterFilenamesByExtension(imageFilenames, '.gif');
  if (gifs.length > 0) {
    if (!imagemagick.isImageMagickAvailable()) {
      session.log.warn(
        'GIF images are references, but Imagemagick.convert not available to convert them. This may result in invalid output and/or an invalid pdf file',
      );
    } else {
      session.log.debug(`Processing ${gifs.length} GIFs`);
      await processImages(
        session,
        imageFilenames,
        gifs,
        imagemagick.extractFirstFrameOfGif,
        buildPath,
      );
    }
  }

  session.log.debug('Processing SVGs if present');
  const svgs = filterFilenamesByExtension(imageFilenames, '.svg');
  if (svgs.length > 0) {
    if (opts.converter === 'imagemagick') {
      if (!imagemagick.isImageMagickAvailable()) {
        session.log.warn(
          'SVGs need to be converted to pdf images, but imagemagick is not available to convert them. This may result in invalid output and/or an invalid pdf file',
        );
      } else {
        session.log.debug(`Processing ${svgs.length} SVGs with IMAGEMAGICK to PNG`);
      }
      await processImages(session, imageFilenames, svgs, imagemagick.convertSVGToPNG, buildPath);
    } else {
      if (!inkscape.isInkscapeAvailable()) {
        session.log.warn(
          'SVGs need to be converted to pdf images, but inkscape is not available to convert them. This may result in invalid output and/or an invalid pdf file',
        );
      } else {
        session.log.debug(`Processing ${svgs.length} SVGs with INKSCAPE to PDF`);
      }
      await processImages(session, imageFilenames, svgs, inkscape.convertSVGToPDF, buildPath);
    }
  }

  return imageFilenames;
}
