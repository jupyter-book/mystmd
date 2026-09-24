import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import type { GenericParent } from 'myst-common';
import { abbreviationTransform } from './abbreviations';

describe('abbreviationTransform', () => {
  test('expands the first abbreviation instance', () => {
    const mdast = u('root', [
      u('paragraph', [u('text', 'MyST is used here, and MyST is used again.')]),
    ]) as GenericParent;
    abbreviationTransform(mdast, {
      firstTimeLong: true,
      abbreviations: { MyST: 'Markedly Structured Text' },
    });
    expect(mdast).toEqual(
      u('root', [
        u('paragraph', [
          u('abbreviation', { title: 'Markedly Structured Text' }, [
            u('text', 'Markedly Structured Text (MyST)'),
          ]),
          u('text', ' is used here, and '),
          u('abbreviation', { title: 'Markedly Structured Text' }, [u('text', 'MyST')]),
          u('text', ' is used again.'),
        ]),
      ]),
    );
  });

  test('expands the first abbreviation instance from abbreviations.firstTimeLong', () => {
    const mdast = u('root', [
      u('paragraph', [u('text', 'Use TLA now and TLA later')]),
    ]) as GenericParent;
    abbreviationTransform(mdast, {
      abbreviations: { firstTimeLong: true, TLA: 'Three Letter Acronym' },
    });
    expect(mdast).toEqual(
      u('root', [
        u('paragraph', [
          u('text', 'Use '),
          u('abbreviation', { title: 'Three Letter Acronym' }, [
            u('text', 'Three Letter Acronym (TLA)'),
          ]),
          u('text', ' now and '),
          u('abbreviation', { title: 'Three Letter Acronym' }, [u('text', 'TLA')]),
          u('text', ' later'),
        ]),
      ]),
    );
  });

  test('expands the first abbreviation instance of existing abbreviation nodes', () => {
    const mdast = u('root', [
      u('paragraph', [
        u('abbreviation', { title: 'Heart Rate' }, [u('text', 'HR')]),
        u('text', ' then '),
        u('abbreviation', { title: 'Heart Rate' }, [u('text', 'HR')]),
      ]),
    ]) as GenericParent;
    abbreviationTransform(mdast, { firstTimeLong: true });
    expect(mdast).toEqual(
      u('root', [
        u('paragraph', [
          u('abbreviation', { title: 'Heart Rate' }, [u('text', 'Heart Rate (HR)')]),
          u('text', ' then '),
          u('abbreviation', { title: 'Heart Rate' }, [u('text', 'HR')]),
        ]),
      ]),
    );
  });

  test('expands the first abbreviation instance of each distinct abbreviation', () => {
    const mdast = u('root', [
      u('paragraph', [u('text', 'MyST and AST then MyST and AST')]),
    ]) as GenericParent;
    abbreviationTransform(mdast, {
      firstTimeLong: true,
      abbreviations: {
        MyST: 'Markedly Structured Text',
        AST: 'Abstract Syntax Tree',
      },
    });
    expect(mdast).toEqual(
      u('root', [
        u('paragraph', [
          u('abbreviation', { title: 'Markedly Structured Text' }, [
            u('text', 'Markedly Structured Text (MyST)'),
          ]),
          u('text', ' and '),
          u('abbreviation', { title: 'Abstract Syntax Tree' }, [
            u('text', 'Abstract Syntax Tree (AST)'),
          ]),
          u('text', ' then '),
          u('abbreviation', { title: 'Markedly Structured Text' }, [u('text', 'MyST')]),
          u('text', ' and '),
          u('abbreviation', { title: 'Abstract Syntax Tree' }, [u('text', 'AST')]),
        ]),
      ]),
    );
  });

  test('does not expand abbreviation instances by default', () => {
    const mdast = u('root', [u('paragraph', [u('text', 'MyST and MyST')])]) as GenericParent;
    abbreviationTransform(mdast, {
      abbreviations: { MyST: 'Markedly Structured Text' },
    });
    expect(mdast).toEqual(
      u('root', [
        u('paragraph', [
          u('abbreviation', { title: 'Markedly Structured Text' }, [u('text', 'MyST')]),
          u('text', ' and '),
          u('abbreviation', { title: 'Markedly Structured Text' }, [u('text', 'MyST')]),
        ]),
      ]),
    );
  });
});
