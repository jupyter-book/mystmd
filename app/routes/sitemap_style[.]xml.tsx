import { LoaderFunction } from '@remix-run/node';
import { sitemapStylesheet } from '../utils/sitemap';

export const loader: LoaderFunction = async (): Promise<Response> => {
  return new Response(sitemapStylesheet(), {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
};
