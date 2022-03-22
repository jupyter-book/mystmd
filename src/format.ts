/* eslint-disable import/no-cycle */
import { OutputSummaryEntry } from '@curvenote/blocks';
import { IFileObjectFactoryFn } from './files';

/**
 * TODO move back into database?
 *
 * @param createFileObject
 * @param summary
 * @returns
 */

export const format = async (
  createFileObject: IFileObjectFactoryFn,
  summary: OutputSummaryEntry,
): Promise<OutputSummaryEntry> => {
  let link: string | undefined;
  if (summary.path) {
    link = await createFileObject(summary.path).url(); // TODO - change to url()? i.e. signing is a conern of the files backend
  }

  return {
    kind: summary.kind,
    content_type: summary.content_type,
    content: summary.content,
    link,
  };
};

/**
 * 
 * TODO probably delete - API no longer serves tex back
export const LatexCompatibleMimeTypes = [
  CellOutputMimeTypes.TextLatex,
  CellOutputMimeTypes.ImagePng,
  CellOutputMimeTypes.ImageJpeg,
  CellOutputMimeTypes.ImageGif,
  CellOutputMimeTypes.ImageBmp,
  CellOutputMimeTypes.ImageSvg,
  CellOutputMimeTypes.TextPlain,
];

export const LatexCompatibleOutputSummaryKinds = [
  OutputSummaryKind.plotly,
  OutputSummaryKind.bokeh,
  OutputSummaryKind.latex,
  OutputSummaryKind.image,
  OutputSummaryKind.text,
  OutputSummaryKind.error,
  OutputSummaryKind.stream,
];

type OutputTexFormats = OutputFormatTypes.tex | OutputFormatTypes.tex_curvenote;

const formatTex = (
  fmt: OutputTexFormats,
  id: VersionId,
  content: string,
  content_type: CellOutputMimeTypes,
  index: number,
  caption: string | null,
  labelId: string,
  styles: FigureStyles,
) => {
  const oxa = oxaLink('', id, { pinned: true }) ?? 'oxa:';
  switch (content_type) {
    case CellOutputMimeTypes.ImagePng:
    case CellOutputMimeTypes.ImageJpeg:
    case CellOutputMimeTypes.ImageGif:
    case CellOutputMimeTypes.ImageBmp:
    case CellOutputMimeTypes.ImageSvg: {
      return formatLatexLineWidthFigure(fmt, oxa, content_type, index, caption, labelId, styles);
    }
    case CellOutputMimeTypes.TextHtml: // we would neeed to convert html2latex ??
    case CellOutputMimeTypes.TextPlain:
    case CellOutputMimeTypes.TextLatex:
    default: {
      return content;
    }
  }
};
 */
/*
\begin{figure}[!htbp]
  \centering
  \includegraphics[width=0.7\linewidth]{images/YHtoK5YlF9FKVewFfVsg_I6W7Fd2XC9rWWFtQswXU.1.png}
  \caption{spie\_template\_options.png
  \label{jsyTFVaM9m}
\end{figure}

\begin{figure}[ht]
  \centering
  \includegraphics[width=1.0\linewidth]{images/YHtoK5YlF9FKVewFfVsg_I6W7Fd2XC9rWWFtQswXU_1.png}
  \caption{spie\_template\_options.png}
  \label{16ba757443fe9f69}
\end{figure}
 */

/*
*
const formatLatexLineWidthFigure = (
  fmt: OutputTexFormats,
  oxa_path: string,
  content_type: CellOutputMimeTypes,
  index: number,
  caption: string | null,
  labelId: string,
  styles: FigureStyles,
) => {
  const { width, numbered } = styles;
  const star = numbered ? '' : '*';
  const cmd = content_type === CellOutputMimeTypes.ImageSvg ? 'includesvg' : 'includegraphics';
  // note using adjustbox align method
  // https://tex.stackexchange.com/questions/91566/syntax-similar-to-centering-for-right-and-left

  const theWidth = width ? width / 100.0 : 1.0;

  // TODO fix alignment
  //   const opening = `
  // \\begin{figure}[ht]
  //   \\${cmd}[width=${theWidth.toFixed(1)}\\linewidth,${
  //     align ?? 'center'
  //   }]{${oxa_path}-output-${index}}`;
  //   const caption_str =
  //     caption != null
  //       ? `\n  \\caption{${renderContent(
  //           'paragraph',
  //           caption,
  //           fmt as unknown as ContentFormatTypes,
  //         )}}`
  //       : '';
  const opening = `
  \\begin{figure}[ht]
    \\centering
    \\${cmd}[width=${theWidth.toFixed(1)}\\linewidth]{${oxa_path}-output-${index}}`;
  const caption_str =
    caption != null
      ? `\n  \\caption{${renderContent(
          'paragraph',
          caption,
          fmt as unknown as ContentFormatTypes,
        )}}`
      : '';
  const label_str = labelId.length > 0 ? `\n  \\label${star}{${labelId}}` : '';
  const closing = '\n\\end{figure}';
  return opening + caption_str + label_str + closing;
};

function renderContent(arg0: string, caption: string, arg2: ContentFormatTypes) {
  throw new Error('Function not implemented.');
}
*/
