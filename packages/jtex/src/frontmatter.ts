import type { PageFrontmatter } from '@curvenote/frontmatter';

export function extendJtexFrontmatter(frontmatter: PageFrontmatter) {
  const datetime = frontmatter.date ? new Date(frontmatter.date) : new Date();
  return {
    day: String(datetime.getDate()),
    month: String(datetime.getMonth() + 1),
    year: String(datetime.getFullYear()),
    ...frontmatter,
  };
}
