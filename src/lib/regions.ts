// Local news: regions with a reliable public regional news feed. Shared by the
// app (the "Where do you live now?" setting) and scripts/build-local-news.mjs.
export interface Region {
  id: string;
  name: string;
  country: 'ca' | 'gb';
  feeds: { url: string; source: string }[];
}
// CBC's feeds can't be reached from the servers that build the news, so
// Canada uses Global News's regional feeds. England uses the BBC's county and
// city feeds (the BBC has no wider England-region feeds).
const glb = (id: string, name: string, slug: string): Region => ({ id, name, country: 'ca', feeds: [{ url: `https://globalnews.ca/${slug}/feed/`, source: 'Global News' }] });
const bbc = (id: string, name: string, path: string): Region => ({ id, name, country: 'gb', feeds: [{ url: `https://feeds.bbci.co.uk/news/${path}/rss.xml`, source: 'BBC News' }] });

export const REGIONS: Region[] = [
  glb('ca-bc', 'British Columbia', 'bc'),
  glb('ca-okanagan', 'Okanagan', 'okanagan'),
  glb('ca-calgary', 'Calgary', 'calgary'),
  glb('ca-edmonton', 'Edmonton', 'edmonton'),
  glb('ca-lethbridge', 'Lethbridge', 'lethbridge'),
  glb('ca-saskatoon', 'Saskatoon', 'saskatoon'),
  glb('ca-regina', 'Regina', 'regina'),
  glb('ca-mb', 'Winnipeg and Manitoba', 'winnipeg'),
  glb('ca-toronto', 'Toronto', 'toronto'),
  glb('ca-london', 'London, Ontario', 'london'),
  glb('ca-guelph', 'Guelph', 'guelph'),
  glb('ca-kingston', 'Kingston', 'kingston'),
  glb('ca-peterborough', 'Peterborough', 'peterborough'),
  glb('ca-montreal', 'Montréal', 'montreal'),
  glb('ca-nb', 'New Brunswick', 'new-brunswick'),
  glb('ca-ns', 'Halifax and Nova Scotia', 'halifax'),
  bbc('gb-london', 'London', 'england/london'),
  bbc('gb-kent', 'Kent', 'england/kent'),
  bbc('gb-sussex', 'Sussex', 'england/sussex'),
  bbc('gb-surrey', 'Surrey', 'england/surrey'),
  bbc('gb-hampshire', 'Hampshire', 'england/hampshire'),
  bbc('gb-essex', 'Essex', 'england/essex'),
  bbc('gb-oxford', 'Oxford', 'england/oxford'),
  bbc('gb-cambs', 'Cambridgeshire', 'england/cambridgeshire'),
  bbc('gb-norfolk', 'Norfolk', 'england/norfolk'),
  bbc('gb-suffolk', 'Suffolk', 'england/suffolk'),
  bbc('gb-bristol', 'Bristol', 'england/bristol'),
  bbc('gb-somerset', 'Somerset', 'england/somerset'),
  bbc('gb-devon', 'Devon', 'england/devon'),
  bbc('gb-cornwall', 'Cornwall', 'england/cornwall'),
  bbc('gb-birmingham', 'Birmingham and the Black Country', 'england/birmingham_and_black_country'),
  bbc('gb-coventry', 'Coventry and Warwickshire', 'england/coventry_and_warwickshire'),
  bbc('gb-hereford', 'Hereford and Worcester', 'england/hereford_and_worcester'),
  bbc('gb-stoke', 'Stoke and Staffordshire', 'england/stoke_and_staffordshire'),
  bbc('gb-leicester', 'Leicester', 'england/leicester'),
  bbc('gb-nottingham', 'Nottingham', 'england/nottingham'),
  bbc('gb-lincs', 'Lincolnshire', 'england/lincolnshire'),
  bbc('gb-manchester', 'Manchester', 'england/manchester'),
  bbc('gb-merseyside', 'Merseyside', 'england/merseyside'),
  bbc('gb-lancs', 'Lancashire', 'england/lancashire'),
  bbc('gb-cumbria', 'Cumbria', 'england/cumbria'),
  bbc('gb-tees', 'Teesside', 'england/tees'),
  bbc('gb-syorks', 'South Yorkshire', 'england/south_yorkshire'),
  bbc('gb-yorks', 'York and North Yorkshire', 'england/york_and_north_yorkshire'),
  bbc('gb-scotland', 'Scotland', 'scotland'),
  bbc('gb-wales', 'Wales', 'wales'),
  bbc('gb-ni', 'Northern Ireland', 'northern_ireland'),
];
export const regionById = (id: string | undefined) => REGIONS.find(r => r.id === id);
