import { writeTexLabelledComment } from 'myst-common';
import { TexProofSerializer } from './proof.js';
import type { PreambleData } from './types.js';

class TexGlossaryAndAcronymSerializer {
  static COMMENT_LENGTH = 50;

  preamble: string;
  printedDefinitions: string;

  constructor(
    glossaryDefinitions: Record<string, [string, string]>,
    acronymDefinitions: Record<string, [string, string]>,
  ) {
    const withGlossary = Object.keys(glossaryDefinitions).length > 0;
    const withAcronym = Object.keys(acronymDefinitions).length > 0;
    if (!withGlossary && !withAcronym) {
      this.printedDefinitions = '';
      this.preamble = '';
    } else {
      this.printedDefinitions = this.renderGlossary();
      this.preamble = [
        this.renderCommonImports(withAcronym),
        this.renderImports('glossary', this.createGlossaryDirectives(glossaryDefinitions)),
        this.renderImports('acronyms', this.createAcronymDirectives(acronymDefinitions)),
      ]
        .filter((item) => !!item)
        .join('\n');
    }
  }

  private renderGlossary(): string {
    const block = writeTexLabelledComment(
      'acronyms & glossary',
      ['\\printglossaries'], // Will print both glossary and abbreviations
      TexGlossaryAndAcronymSerializer.COMMENT_LENGTH,
    );
    const percents = ''.padEnd(TexGlossaryAndAcronymSerializer.COMMENT_LENGTH, '%');
    return `${percents}\n${block}${percents}\n`;
  }

  private renderCommonImports(withAcronym?: boolean): string {
    const usepackage = withAcronym
      ? '\\usepackage[acronym]{glossaries}'
      : '\\usepackage{glossaries}';
    const makeglossaries = '\\makeglossaries';
    return `${usepackage}\n${makeglossaries}\n`;
  }

  private renderImports(commentTitle: string, directives: string[]): string | undefined {
    if (!directives) return '';
    const block = writeTexLabelledComment(
      commentTitle,
      directives,
      TexGlossaryAndAcronymSerializer.COMMENT_LENGTH,
    );
    if (!block) return;
    const percents = ''.padEnd(TexGlossaryAndAcronymSerializer.COMMENT_LENGTH, '%');
    return `${percents}\n${block}${percents}\n`;
  }

  private createGlossaryDirectives(
    glossaryDefinitions: Record<string, [string, string]>,
  ): string[] {
    const directives = Object.keys(glossaryDefinitions).map((k) => ({
      key: k,
      name: glossaryDefinitions[k][0],
      description: glossaryDefinitions[k][1],
    }));

    const entries = directives.map(
      (entry) =>
        `\\newglossaryentry{${entry.key}}{name=${entry.name},description={${entry.description}}}`,
    );
    return entries;
  }

  private createAcronymDirectives(acronymDefinitions: Record<string, [string, string]>): string[] {
    const directives = Object.keys(acronymDefinitions).map((k) => ({
      key: k,
      acronym: acronymDefinitions[k][0],
      expansion: acronymDefinitions[k][1],
    }));

    return directives.map(
      (entry) => `\\newacronym{${entry.key}}{${entry.acronym}}{${entry.expansion}}`,
    );
  }
}

export function generatePreamble(data: PreambleData): { preamble: string; suffix: string } {
  const preambleLines: string[] = [];
  let suffix = '';
  if (data.hasProofs) {
    preambleLines.push(new TexProofSerializer().preamble);
  }
  if (data.hasIndex) {
    preambleLines.push('\\makeindex');
  }
  if (data.printGlossaries) {
    const glossaryState = new TexGlossaryAndAcronymSerializer(data.glossary, data.abbreviations);
    preambleLines.push(glossaryState.preamble);
    if (glossaryState.printedDefinitions) {
      suffix = `\n${glossaryState.printedDefinitions}`;
    }
  }
  return { preamble: preambleLines.join('\n'), suffix };
}

export function mergePreambles(
  current: PreambleData,
  next: PreambleData,
  warningLogFn: (message: string) => void,
) {
  const hasProofs = current.hasProofs || next.hasProofs;
  const hasIndex = current.hasIndex || next.hasIndex;
  const printGlossaries = current.printGlossaries || next.printGlossaries;
  Object.keys(next.glossary).forEach((key) => {
    if (Object.keys(current.glossary).includes(key)) {
      warningLogFn(`duplicate glossary entry for '${key}'`);
    }
  });
  Object.keys(next.abbreviations).forEach((key) => {
    if (Object.keys(current.abbreviations).includes(key)) {
      warningLogFn(`duplicate abbreviation definition for '${key}'`);
    }
  });
  const glossary = { ...next.glossary, ...current.glossary };
  const abbreviations = { ...next.abbreviations, ...current.abbreviations };
  return { hasProofs, hasIndex, printGlossaries, glossary, abbreviations };
}
