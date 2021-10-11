import * as fs from 'fs';
import path from 'path';
import { Footer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';

export function createCurvenoteFooter() {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun('Created in '),
          new ImageRun({
            data: fs
              .readFileSync(path.join(__dirname, '../images/logo-blue-text.png'))
              .toString('base64'),
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
