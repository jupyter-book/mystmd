export type Options = {
  buildPath?: string;
  force?: boolean;
};

export interface CurvenoteYML {
  site: {
    name: string;
    sections: { title: string; folder: string }[];
    actions: { title: string; url: string }[];
    logo: string;
    logoText: string;
  };
  folders: Record<
    string,
    {
      title: string;
      index: string;
      pages: { slug: string; title: string; level: number }[];
      references: string | string[];
    }
  >;
}
