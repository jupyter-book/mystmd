export type PublicationMeta = {
  number?: string | number; // sometimes you'll get fun values like "Spring" and "Inside cover."
  doi?: string;
  first_page?: string | number;
  last_page?: string | number;
  title?: string;
  subject?: string;
};
