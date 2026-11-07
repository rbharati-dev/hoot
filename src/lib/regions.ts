// Local news: regions with a reliable public regional news feed. Shared by the
// app (the "Where do you live now?" setting) and scripts/build-local-news.mjs.
export interface Region {
  id: string;
  name: string;
  country: 'ca' | 'gb';
  feeds: { url: string; source: string }[];
}
const cbc = (id: string, name: string, slug: string): Region => ({ id, name, country: 'ca', feeds: [{ url: `https://www.cbc.ca/webfeed/rss/rss-canada-${slug}`, source: 'CBC News' }] });
const bbc = (id: string, name: string, path: string): Region => ({ id, name, country: 'gb', feeds: [{ url: `https://feeds.bbci.co.uk/news/${path}/rss.xml`, source: 'BBC News' }] });

export const REGIONS: Region[] = [
  cbc('ca-bc', 'British Columbia', 'britishcolumbia'),
  cbc('ca-calgary', 'Calgary', 'calgary'),
  cbc('ca-edmonton', 'Edmonton', 'edmonton'),
  cbc('ca-sk', 'Saskatchewan', 'saskatchewan'),
  cbc('ca-mb', 'Manitoba', 'manitoba'),
  cbc('ca-toronto', 'Toronto', 'toronto'),
  cbc('ca-ottawa', 'Ottawa', 'ottawa'),
  cbc('ca-hamilton', 'Hamilton', 'hamilton'),
  cbc('ca-kw', 'Kitchener-Waterloo', 'kitchener-waterloo'),
  cbc('ca-london', 'London, Ontario', 'london'),
  cbc('ca-windsor', 'Windsor', 'windsor'),
  cbc('ca-sudbury', 'Sudbury', 'sudbury'),
  cbc('ca-thunderbay', 'Thunder Bay', 'thunderbay'),
  cbc('ca-montreal', 'Montréal', 'montreal'),
  cbc('ca-nb', 'New Brunswick', 'newbrunswick'),
  cbc('ca-ns', 'Nova Scotia', 'novascotia'),
  cbc('ca-pei', 'Prince Edward Island', 'pei'),
  cbc('ca-nl', 'Newfoundland and Labrador', 'newfoundland'),
  cbc('ca-north', 'The North', 'north'),
  bbc('gb-london', 'London', 'england/london'),
  bbc('gb-se', 'South East England', 'england/south_east'),
  bbc('gb-sw', 'South West England', 'england/south_west'),
  bbc('gb-east', 'East of England', 'england/east_of_england'),
  bbc('gb-wm', 'West Midlands', 'england/west_midlands'),
  bbc('gb-em', 'East Midlands', 'england/east_midlands'),
  bbc('gb-nw', 'North West England', 'england/north_west'),
  bbc('gb-ne', 'North East England', 'england/north_east'),
  bbc('gb-yorks', 'Yorkshire', 'england/york_and_north_yorkshire'),
  bbc('gb-scotland', 'Scotland', 'scotland'),
  bbc('gb-wales', 'Wales', 'wales'),
  bbc('gb-ni', 'Northern Ireland', 'northern_ireland'),
];
export const regionById = (id: string | undefined) => REGIONS.find(r => r.id === id);
