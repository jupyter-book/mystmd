import type { Plugin } from 'unified';
import type { Container, Paragraph, PhrasingContent, Image } from 'myst-spec';
import type { VFile } from 'vfile';
import { select, selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';
import { fileWarn, toText, RuleId } from 'myst-common';

const TRANSFORM_SOURCE = 'myst-transforms:images';

/**
 * Generate image alt text from figure caption
 */
export function imageAltTextTransform(tree: GenericParent) {
  const containers = selectAll('container', tree) as Container[];
  // Go through containers in reverse so subfigures captions are preferentially applied
  containers.reverse().forEach((container) => {
    const images = selectAll('image', container) as Image[];
    images.forEach((image) => {
      if (!image || image.alt) return;
      // Only look at direct child captions
      const para = select(
        'paragraph',
        container.children.find((child) => child.type === 'caption'),
      ) as Paragraph;
      if (!para) return;
      // Do not write the captionNumber to image alt text
      const content = para.children?.filter((n) => (n.type as string) !== 'captionNumber');
      if (!content || content.length < 1) return;
      image.alt = toText(content as PhrasingContent[]);
      (image.data ??= {}).altTextIsAutoGenerated = true;
    });
  });
}

export function imageNoAltTextTransform(tree: GenericParent, file: VFile) {
  const imageNodes = selectAll('image', tree) as Image[];
  imageNodes.forEach((image, index) => {
    if (image.alt == null) {
      fileWarn(file, `missing alt text for ${image.url}`, {
        ruleId: RuleId.imageHasAltText,
        node: image,
        source: TRANSFORM_SOURCE,
      });
    }
    if (image.data?.altTextIsAutoGenerated) {
      fileWarn(file, `alt text for ${image.url} was auto-generated`, {
        ruleId: RuleId.imageAltTextGenerated,
        node: image,
        source: TRANSFORM_SOURCE,
        note: 'You can remove this warning by writing your own altxtext',
      });
    }
  });
}

export const imageAltTextPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree, file) => {
  imageAltTextTransform(tree);
  imageNoAltTextTransform(tree, file);
};
