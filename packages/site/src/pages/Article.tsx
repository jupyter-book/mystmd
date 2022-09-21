import type { PageLoader } from '@curvenote/site-common';
import {
  ReferencesProvider,
  useHideDesignElement,
  useUpdateSiteDesign,
} from '@curvenote/ui-providers';
import { useLoaderData } from '@remix-run/react';
import { Bibliography } from 'myst-to-react';
import { ContentBlocks, FooterLinksBlock, FrontmatterBlock } from '../components';
import { ErrorDocumentNotFound } from './ErrorDocumentNotFound';

export function ArticlePage() {
  const article = useLoaderData<PageLoader>();
  const [setDesign] = useUpdateSiteDesign();
  setDesign(article.frontmatter?.design);
  const [hide_title_block] = useHideDesignElement('hide_title_block');
  const [hide_footer_links] = useHideDesignElement('hide_footer_links');
  return (
    <ReferencesProvider references={{ ...article.references, article: article.mdast }}>
      {!hide_title_block && (
        <FrontmatterBlock kind={article.kind} frontmatter={article.frontmatter} />
      )}
      <ContentBlocks mdast={article.mdast} />
      <Bibliography />
      {!hide_footer_links && <FooterLinksBlock links={article.footer} />}
    </ReferencesProvider>
  );
}

export function ArticlePageCatchBoundary() {
  return <ErrorDocumentNotFound />;
}
