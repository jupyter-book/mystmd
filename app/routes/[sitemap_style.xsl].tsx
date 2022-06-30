import type { LoaderFunction } from '@remix-run/node';
import { sitemapStylesheetResponse } from '@curvenote/site';

export const loader: LoaderFunction = async () => sitemapStylesheetResponse();
