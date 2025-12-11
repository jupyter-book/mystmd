import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { VFile } from 'vfile';
import type { GenericNode, GenericParent } from 'myst-common';
import { containerChildrenTransform } from './containers';

function caption() {
  return u('caption', [u('paragraph', [u('text', 'my caption')])]);
}

function image(placeholder = false) {
  return u('image', { url: 'my-image.png', placeholder });
}

function container(children: GenericNode[], kind = 'figure'): GenericParent {
  children.forEach((child) => {
    if (child.type === 'container') child.subcontainer = true;
  });
  return u('container', { kind }, children);
}

function rootContainer(children: GenericNode[]): GenericParent {
  return u('root', [u('block', [container(children)])]);
}

describe('Test containerChildrenTransform', () => {
  test('figure with one image is unchanged', async () => {
    const mdast = rootContainer([image()]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(rootContainer([image()]));
  });
  test('figure with one image and caption is unchanged', async () => {
    const mdast = rootContainer([image(), caption()]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(rootContainer([image(), caption()]));
  });
  test('figure with caption and one image is reordered', async () => {
    const mdast = rootContainer([caption(), image()]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(rootContainer([image(), caption()]));
  });
  test('figure with image and placeholder is unchanged', async () => {
    const mdast = rootContainer([image(), image(true), caption()]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(rootContainer([image(), image(true), caption()]));
  });
  test('figure with two images creates sub-figures', async () => {
    const mdast = rootContainer([image(), image()]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(rootContainer([container([image()]), container([image()])]));
  });
  test('figure with two figures remains sub-figures', async () => {
    const mdast = rootContainer([container([image()]), container([image()])]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(rootContainer([container([image()]), container([image()])]));
  });
  test('figure with images, placeholder, and caption creates sub-figures', async () => {
    const mdast = rootContainer([image(true), image(), caption(), image()]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(
      rootContainer([container([image()]), container([image()]), image(true), caption()]),
    );
  });
  test('figure with paragraph creates caption', async () => {
    const mdast = rootContainer([image(true), image(), u('paragraph', [u('text', 'my caption')])]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(rootContainer([image(), image(true), caption()]));
  });
  test('figure with multiple paragraphs creates caption and legend', async () => {
    const mdast = rootContainer([
      image(true),
      image(),
      u('paragraph', [u('text', 'my caption')]),
      u('paragraph', [u('text', 'my legend')]),
      u('paragraph', [u('text', 'more legend')]),
    ]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(
      rootContainer([
        image(),
        image(true),
        caption(),
        u('legend', [
          u('paragraph', [u('text', 'my legend')]),
          u('paragraph', [u('text', 'more legend')]),
        ]),
      ]),
    );
  });
  test('figure with images on consecutive lines creates subfiures', async () => {
    const mdast = rootContainer([
      image(true),
      u('paragraph', [u('text', 'my caption')]),
      u('paragraph', [image(), u('text', '\n'), image(), u('text', '\n'), image()]),
      u('paragraph', [u('text', 'my legend')]),
    ]);
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(
      rootContainer([
        container([image()]),
        container([image()]),
        container([image()]),
        image(true),
        caption(),
        u('legend', [u('paragraph', [u('text', 'my legend')])]),
      ]),
    );
  });
  test('figure with noSubcontainers sorts without creating subcontainers', async () => {
    const mdast = rootContainer([
      image(true),
      image(),
      u('paragraph', [u('text', 'my caption')]),
      image(),
    ]);
    const fig = mdast.children[0]?.children?.[0];
    if (fig) fig.noSubcontainers = true;
    containerChildrenTransform(mdast, new VFile());
    const result = rootContainer([image(), image(), image(true), caption()]);
    const resultFig = result.children[0]?.children?.[0];
    if (resultFig) resultFig.noSubcontainers = true;
    expect(mdast).toEqual(result);
  });
  test('table container puts caption first and legend at end', async () => {
    const mdast = rootContainer([
      image(true),
      image(),
      image(),
      u('paragraph', [u('text', 'my caption')]),
      u('paragraph', [u('text', 'my legend')]),
      u('paragraph', [u('text', 'more legend')]),
    ]);
    const fig = mdast.children[0]?.children?.[0];
    if (fig) fig.kind = 'table';
    containerChildrenTransform(mdast, new VFile());
    expect(mdast).toEqual(
      u('root', [
        u('block', [
          container(
            [
              caption(),
              container([image()], 'table'),
              container([image()], 'table'),
              image(true),
              u('legend', [
                u('paragraph', [u('text', 'my legend')]),
                u('paragraph', [u('text', 'more legend')]),
              ]),
            ],
            'table',
          ),
        ]),
      ]),
    );
  });
});
