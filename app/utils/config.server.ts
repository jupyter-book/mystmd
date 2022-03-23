import { URL } from 'url';
import config from '~/config.json';

export type Config = {
  site: {
    name: string;
    sections: { title: string; folder: string }[];
    twitter?: string;
    actions: { title: string; url: string }[];
    logo?: string;
    logoText?: string;
  };
  folders: Record<
    string,
    {
      title: string;
      index: string;
      pages: { title: string; slug?: string; level: number }[];
    }
  >;
};

export async function getConfig(request: Request): Promise<Config> {
  const url = new URL(request.url);
  console.log(url.hostname);
  return config;
}
