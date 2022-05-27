import * as fs from 'fs';
import { Footer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import pkgpath from '../../utils';

export function createCurvenoteFooter() {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun('Created in '),
          new ImageRun({
            data: fs.readFileSync(pkgpath('images/logo-blue-text.png')).toString('base64'),
            transformation: {
              width: 1150 / 18,
              height: 200 / 18,
            },
          }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    ],
  });
}
