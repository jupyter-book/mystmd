import fs from 'node:fs';
import { Footer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';

export function createFooter(logo: string) {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun('Created with '),
          new ImageRun({
            data: fs.readFileSync(logo).buffer,
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
