export type Biblio = {
  // https://docs.openalex.org/about-the-data/work#biblio
  volume?: string | number; // sometimes you'll get fun values like "Spring" and "Inside cover."
  issue?: string | number;
  first_page?: string | number;
  last_page?: string | number;
};
