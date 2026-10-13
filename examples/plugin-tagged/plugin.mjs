// A node type used as a placeholder by the directive, later replaced by the
// project-stage transform once project-wide page information is available.
const PAGE_LIST_NODE = 'taggedPageList';

/**
 * `{tagged} <tag>` directive
 *
 * Emits a placeholder node carrying the requested tag. The actual cards are
 * filled in by the transform below, which has access to the full project via
 * the (unstable) session API.
 */
const taggedDirective = {
  name: 'tagged',
  doc: 'Show a grid of cards for every page in the project that has the given tag.',
  arg: {
    type: String,
    required: true,
    doc: 'The tag to filter project pages by.',
  },
  run(data) {
    return [{ type: PAGE_LIST_NODE, tag: `${data.arg}`.trim() }];
  },
};

/** Build a card node for a single page. */
function makeCard(page) {
  const children = [];

  // Thumbnail (rendered at the top of the card via the header slot)
  const thumbnail = page.thumbnailOptimized ?? page.thumbnail;
  if (thumbnail) {
    children.push({
      type: 'header',
      children: [{ type: 'image', url: thumbnail, alt: page.title ?? '' }],
    });
  }

  // Title
  const title = page.title ?? page.slug ?? page.filename ?? 'Untitled';
  children.push({ type: 'cardTitle', children: [{ type: 'text', value: title }] });

  // Subtitle (body)
  const subtitle = page.short_title ?? page.description;
  if (subtitle) {
    children.push({ type: 'paragraph', children: [{ type: 'text', value: subtitle }] });
  }

  // Author names (footer)
  const authorNames = (page.authors ?? [])
    .map((author) => author?.name)
    .filter(Boolean)
    .join(', ');
  if (authorNames) {
    children.push({
      type: 'footer',
      children: [{ type: 'emphasis', children: [{ type: 'text', value: `by ${authorNames}` }] }],
    });
  }

  return { type: 'card', url: page.url, children };
}

/**
 * Project-stage transform that replaces each placeholder node with a grid of
 * cards for every page in the project carrying the requested tag.
 */
function taggedTransform(opts, utils) {
  return async (mdast) => {
    const { selectAll, unstableSession } = utils;
    const placeholders = selectAll(PAGE_LIST_NODE, mdast);
    if (placeholders.length === 0) return;
    const pages = unstableSession?.project?.pages ?? [];
    placeholders.forEach((node) => {
      const { tag } = node;
      const matching = pages.filter((page) => (page.tags ?? []).includes(tag));
      delete node.tag;
      if (matching.length === 0) {
        node.type = 'paragraph';
        node.children = [{ type: 'text', value: `No pages tagged "${tag}".` }];
        return;
      }
      // Mutate the placeholder in place into a grid of cards
      node.type = 'grid';
      node.kind = 'listing';
      node.columns = [1, 2, 2, 3];
      node.children = matching.map((page) => makeCard(page));
    });
  };
}

const taggedTransformPlugin = {
  name: 'Tagged pages cards',
  // 'project' stage runs after all pages are processed, so every page's tags,
  // frontmatter, and resolved url are available on the session.
  stage: 'project',
  plugin: taggedTransform,
};

const plugin = {
  name: 'Tagged Pages Plugin',
  directives: [taggedDirective],
  transforms: [taggedTransformPlugin],
};

export default plugin;
