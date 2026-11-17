// Builds public/content/news/today.json from publishers' public RSS feeds.
// We keep ONLY a headline, a short summary, the source name and a link back —
// never the full article — exactly like a news reader or Google News. Every
// story links out to its source. Runs where there's internet (CI): npm run build:news
//
// Importance = how many independent sources carry the same story (agreement),
// plus how recent it is. We tag each story with a topic so the app can rank it
// to the reader's interests.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reputable feeds that publish RSS for syndication, grouped into language
// editions. Each reader gets news in their own language (Hindi, Nepali,
// Spanish, Portuguese, Russian), falling back to the English edition.
// Several outlets per language, from different countries and owners, so no
// single broadcaster dominates. The
// native editions mostly use BBC's World Service language feeds plus a second
// reputable outlet; any feed that fails is simply skipped. Each item inherits
// its feed's topic. Every edition has topic variety (sport, science, health,
// culture, business) from outlets in that language, for interest-ranking.
const EDITIONS = {
  en: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC News', topic: 'world', weight: 3 },
    { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR', topic: 'world', weight: 3 },
    { url: 'https://www.theguardian.com/world/rss', source: 'The Guardian', topic: 'world', weight: 3 },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC News', topic: 'business', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', source: 'BBC News', topic: 'politics', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/news/health/rss.xml', source: 'BBC News', topic: 'health', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', source: 'BBC News', topic: 'science', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC News', topic: 'technology', weight: 1 },
    { url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', source: 'BBC News', topic: 'entertainment', weight: 1 },
    { url: 'https://www.theguardian.com/science/rss', source: 'The Guardian', topic: 'science', weight: 2 },
    { url: 'https://www.theguardian.com/music/rss', source: 'The Guardian', topic: 'music', weight: 1 },
    { url: 'https://www.theguardian.com/film/rss', source: 'The Guardian', topic: 'film', weight: 1 },
    { url: 'https://www.theguardian.com/sport/rss', source: 'The Guardian', topic: 'sport', weight: 1 },
    { url: 'https://www.cbc.ca/webfeed/rss/rss-world', source: 'CBC News', topic: 'world', weight: 3 },
    { url: 'https://www.cbc.ca/webfeed/rss/rss-canada', source: 'CBC News', topic: 'world', weight: 2 },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', topic: 'world', weight: 2 },
    { url: 'https://rss.dw.com/xml/rss-en-all', source: 'DW', topic: 'world', weight: 2 },
    { url: 'https://www.france24.com/en/rss', source: 'France 24', topic: 'world', weight: 2 },
    { url: 'https://feeds.skynews.com/feeds/rss/world.xml', source: 'Sky News', topic: 'world', weight: 2 },
    { url: 'https://www.abc.net.au/news/feed/2942460/rss.xml', source: 'ABC News (Australia)', topic: 'world', weight: 1 },
    { url: 'https://www.npr.org/rss/rss.php?id=1007', source: 'NPR', topic: 'science', weight: 1 },
    { url: 'https://www.npr.org/rss/rss.php?id=1128', source: 'NPR', topic: 'health', weight: 1 },
    { url: 'https://www.theguardian.com/politics/rss', source: 'The Guardian', topic: 'politics', weight: 2 },
  ],
  es: [
    { url: 'https://feeds.bbci.co.uk/mundo/rss.xml', source: 'BBC Mundo', topic: 'world', weight: 3 },
    { url: 'https://rss.dw.com/xml/rss-es-all', source: 'DW Español', topic: 'world', weight: 2 },
    { url: 'https://www.eldiario.es/rss/', source: 'elDiario.es', topic: 'world', weight: 2 },
    { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', source: 'El País', topic: 'world', weight: 3 },
    { url: 'https://www.france24.com/es/rss', source: 'France 24 Español', topic: 'world', weight: 2 },
    { url: 'https://www.infobae.com/arc/outboundfeeds/rss/', source: 'Infobae', topic: 'world', weight: 2 },
    { url: 'https://www.eltiempo.com/rss/colombia.xml', source: 'El Tiempo', topic: 'world', weight: 1 },
    { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/deportes/portada', source: 'El País', topic: 'sport', weight: 2 },
    { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/ciencia/portada', source: 'El País', topic: 'science', weight: 2 },
    { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/cultura/portada', source: 'El País', topic: 'culture', weight: 2 },
    { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/salud-y-bienestar/portada', source: 'El País', topic: 'health', weight: 2 },
    { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada', source: 'El País', topic: 'business', weight: 1 },
    { url: 'https://feeds.bbci.co.uk/mundo/temas/ciencia/rss.xml', source: 'BBC Mundo', topic: 'science', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/mundo/temas/salud/rss.xml', source: 'BBC Mundo', topic: 'health', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/mundo/temas/cultura/rss.xml', source: 'BBC Mundo', topic: 'culture', weight: 2 },
    { url: 'https://www.20minutos.es/rss/deportes/', source: '20minutos', topic: 'sport', weight: 1 },
    { url: 'https://www.20minutos.es/rss/salud/', source: '20minutos', topic: 'health', weight: 1 },
    { url: 'https://www.clarin.com/rss/deportes/', source: 'Clarín', topic: 'sport', weight: 1 },
    { url: 'https://www.clarin.com/rss/espectaculos/', source: 'Clarín', topic: 'culture', weight: 1 },
  ],
  pt: [
    { url: 'https://feeds.bbci.co.uk/portuguese/rss.xml', source: 'BBC News Brasil', topic: 'world', weight: 3 },
    { url: 'https://rss.dw.com/xml/rss-pt-br-all', source: 'DW Brasil', topic: 'world', weight: 2 },
    { url: 'https://g1.globo.com/rss/g1/', source: 'g1', topic: 'world', weight: 3 },
    { url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', source: 'Folha de S.Paulo', topic: 'world', weight: 2 },
    { url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', source: 'Agência Brasil', topic: 'world', weight: 2 },
    { url: 'https://g1.globo.com/rss/g1/ciencia-e-saude/', source: 'g1', topic: 'health', weight: 2 },
    { url: 'https://g1.globo.com/rss/g1/economia/', source: 'g1', topic: 'business', weight: 1 },
    { url: 'https://g1.globo.com/rss/g1/pop-arte/', source: 'g1', topic: 'culture', weight: 2 },
    { url: 'https://ge.globo.com/rss/ge/', source: 'ge', topic: 'sport', weight: 2 },
    { url: 'https://feeds.folha.uol.com.br/ciencia/rss091.xml', source: 'Folha de S.Paulo', topic: 'science', weight: 2 },
    { url: 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml', source: 'Folha de S.Paulo', topic: 'health', weight: 1 },
    { url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml', source: 'Folha de S.Paulo', topic: 'culture', weight: 1 },
    { url: 'https://feeds.folha.uol.com.br/esporte/rss091.xml', source: 'Folha de S.Paulo', topic: 'sport', weight: 1 },
    { url: 'https://feeds.feedburner.com/PublicoRSS', source: 'Público', topic: 'world', weight: 1 },
  ],
  hi: [
    { url: 'https://feeds.bbci.co.uk/hindi/rss.xml', source: 'BBC News हिंदी', topic: 'world', weight: 3 },
    { url: 'https://rss.dw.com/xml/rss-hi-all', source: 'DW हिन्दी', topic: 'world', weight: 2 },
    { url: 'https://www.amarujala.com/rss/breaking-news.xml', source: 'अमर उजाला', topic: 'world', weight: 2 },
    { url: 'https://www.livehindustan.com/rss/national', source: 'लाइव हिन्दुस्तान', topic: 'world', weight: 2 },
    { url: 'https://feeds.feedburner.com/ndtvkhabar-latest', source: 'NDTV इंडिया', topic: 'world', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/hindi/sport/rss.xml', source: 'BBC News हिंदी', topic: 'sport', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/hindi/science/rss.xml', source: 'BBC News हिंदी', topic: 'science', weight: 2 },
    { url: 'https://feeds.bbci.co.uk/hindi/entertainment/rss.xml', source: 'BBC News हिंदी', topic: 'culture', weight: 2 },
    { url: 'https://feeds.feedburner.com/ndtvkhabar-sports', source: 'NDTV इंडिया', topic: 'sport', weight: 1 },
    { url: 'https://www.amarujala.com/rss/lifestyle.xml', source: 'अमर उजाला', topic: 'health', weight: 1 },
    { url: 'https://www.amarujala.com/rss/entertainment.xml', source: 'अमर उजाला', topic: 'culture', weight: 1 },
    { url: 'https://www.amarujala.com/rss/business.xml', source: 'अमर उजाला', topic: 'business', weight: 1 },
    { url: 'https://www.bhaskar.com/rss-v1--category-1061.xml', source: 'दैनिक भास्कर', topic: 'world', weight: 2 },
  ],
  ne: [
    { url: 'https://feeds.bbci.co.uk/nepali/rss.xml', source: 'BBC News नेपाली', topic: 'world', weight: 3 },
    { url: 'https://www.onlinekhabar.com/feed', source: 'अनलाइनखबर', topic: 'world', weight: 3 },
    { url: 'https://www.setopati.com/feed', source: 'सेतोपाटी', topic: 'world', weight: 2 },
    { url: 'https://ekantipur.com/rss', source: 'कान्तिपुर', topic: 'world', weight: 2 },
    { url: 'https://www.ratopati.com/feed', source: 'रातोपाटी', topic: 'world', weight: 1 },
    { url: 'https://www.bbc.com/nepali/index.xml', source: 'BBC News नेपाली', topic: 'world', weight: 3 },
    { url: 'https://nagariknews.nagariknetwork.com/feed', source: 'नागरिक', topic: 'world', weight: 2 },
    { url: 'https://gorkhapatraonline.com/rss', source: 'गोरखापत्र', topic: 'world', weight: 1 },
    { url: 'https://www.himalkhabar.com/feed', source: 'हिमालखबर', topic: 'world', weight: 1 },
    { url: 'https://www.onlinekhabar.com/content/entertainment/feed', source: 'अनलाइनखबर', topic: 'culture', weight: 2 },
    { url: 'https://www.onlinekhabar.com/content/business/feed', source: 'अनलाइनखबर', topic: 'business', weight: 1 },
    { url: 'https://www.onlinekhabar.com/content/lifestyle/feed', source: 'अनलाइनखबर', topic: 'health', weight: 2 },
    { url: 'https://swasthyakhabar.com/feed', source: 'स्वास्थ्य खबर', topic: 'health', weight: 1 },
  ],
  ru: [
    { url: 'https://feeds.bbci.co.uk/russian/rss.xml', source: 'BBC News Русская служба', topic: 'world', weight: 3 },
    { url: 'https://rss.dw.com/xml/rss-ru-all', source: 'DW на русском', topic: 'world', weight: 2 },
    { url: 'https://meduza.io/rss/all', source: 'Meduza', topic: 'world', weight: 2 },
    { url: 'https://www.svoboda.org/api/zrqiteuuir', source: 'Радио Свобода', topic: 'world', weight: 2 },
    { url: 'https://www.france24.com/ru/rss', source: 'France 24', topic: 'world', weight: 1 },
    { url: 'https://www.svoboda.org/api/z-pqpiev-qpp', source: 'Радио Свобода', topic: 'world', weight: 2 },
    { url: 'https://nplus1.ru/rss', source: 'N + 1', topic: 'science', weight: 2 },
    { url: 'https://naked-science.ru/feed', source: 'Naked Science', topic: 'science', weight: 2 },
    { url: 'https://elementy.ru/rss/news', source: 'Элементы', topic: 'science', weight: 1 },
    { url: 'https://www.championat.com/rss/news/', source: 'Чемпионат', topic: 'sport', weight: 2 },
    { url: 'https://arzamas.academy/feed_v1.rss', source: 'Arzamas', topic: 'culture', weight: 2 },
    { url: 'https://knife.media/feed/', source: 'Нож', topic: 'culture', weight: 1 },
  ],
  de: [
    { url: 'https://www.tagesschau.de/xml/rss2/', source: 'tagesschau', topic: 'world', weight: 3 },
    { url: 'https://rss.dw.com/xml/rss-de-all', source: 'DW Deutsch', topic: 'world', weight: 2 },
    { url: 'https://www.spiegel.de/schlagzeilen/index.rss', source: 'Der Spiegel', topic: 'world', weight: 2 },
    { url: 'https://www.zdf.de/rss/zdf/nachrichten', source: 'ZDFheute', topic: 'world', weight: 2 },
    { url: 'https://www.faz.net/rss/aktuell/', source: 'FAZ', topic: 'world', weight: 1 },
    { url: 'https://www.tagesschau.de/wissen/index~rss2.xml', source: 'tagesschau', topic: 'science', weight: 2 },
    { url: 'https://www.tagesschau.de/wissen/gesundheit/index~rss2.xml', source: 'tagesschau', topic: 'health', weight: 2 },
    { url: 'https://www.tagesschau.de/wirtschaft/index~rss2.xml', source: 'tagesschau', topic: 'business', weight: 1 },
    { url: 'https://www.sportschau.de/index~rss2.xml', source: 'Sportschau', topic: 'sport', weight: 2 },
    { url: 'https://www.spiegel.de/kultur/index.rss', source: 'Der Spiegel', topic: 'culture', weight: 2 },
    { url: 'https://www.spiegel.de/gesundheit/index.rss', source: 'Der Spiegel', topic: 'health', weight: 1 },
    { url: 'https://www.spiegel.de/wissenschaft/index.rss', source: 'Der Spiegel', topic: 'science', weight: 1 },
    { url: 'https://newsfeed.zeit.de/sport/index', source: 'Die Zeit', topic: 'sport', weight: 1 },
  ],
  fr: [
    { url: 'https://www.france24.com/fr/rss', source: 'France 24', topic: 'world', weight: 3 },
    { url: 'https://rss.dw.com/xml/rss-fr-all', source: 'DW', topic: 'world', weight: 2 },
    { url: 'https://www.lemonde.fr/rss/une.xml', source: 'Le Monde', topic: 'world', weight: 3 },
    { url: 'https://www.rfi.fr/fr/rss', source: 'RFI', topic: 'world', weight: 2 },
    { url: 'https://ici.radio-canada.ca/rss/4159', source: 'Radio-Canada', topic: 'world', weight: 2 },
    { url: 'https://www.francetvinfo.fr/titres.rss', source: 'franceinfo', topic: 'world', weight: 2 },
    { url: 'https://www.lemonde.fr/sport/rss_full.xml', source: 'Le Monde', topic: 'sport', weight: 2 },
    { url: 'https://www.lemonde.fr/sciences/rss_full.xml', source: 'Le Monde', topic: 'science', weight: 2 },
    { url: 'https://www.lemonde.fr/culture/rss_full.xml', source: 'Le Monde', topic: 'culture', weight: 2 },
    { url: 'https://www.lemonde.fr/sante/rss_full.xml', source: 'Le Monde', topic: 'health', weight: 2 },
    { url: 'https://www.lemonde.fr/economie/rss_full.xml', source: 'Le Monde', topic: 'business', weight: 1 },
    { url: 'https://www.francetvinfo.fr/sante.rss', source: 'franceinfo', topic: 'health', weight: 1 },
    { url: 'https://www.francetvinfo.fr/culture.rss', source: 'franceinfo', topic: 'culture', weight: 1 },
    { url: 'https://www.francetvinfo.fr/sciences.rss', source: 'franceinfo', topic: 'science', weight: 1 },
    { url: 'https://ici.radio-canada.ca/rss/771', source: 'Radio-Canada', topic: 'sport', weight: 1 },
    { url: 'https://ici.radio-canada.ca/rss/4171', source: 'Radio-Canada', topic: 'health', weight: 1 },
  ],
  it: [
    { url: 'https://www.ansa.it/sito/ansait_rss.xml', source: 'ANSA', topic: 'world', weight: 3 },
    { url: 'https://xml2.corriereobjects.it/rss/homepage.xml', source: 'Corriere della Sera', topic: 'world', weight: 2 },
    { url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml', source: 'la Repubblica', topic: 'world', weight: 2 },
    { url: 'https://www.ilsole24ore.com/rss/italia.xml', source: 'Il Sole 24 Ore', topic: 'world', weight: 1 },
    { url: 'https://rss.dw.com/xml/rss-it-all', source: 'DW', topic: 'world', weight: 1 },
    { url: 'https://www.rainews.it/rss/tutti', source: 'RaiNews', topic: 'world', weight: 3 },
    { url: 'https://www.lastampa.it/rss/copertina.xml', source: 'La Stampa', topic: 'world', weight: 2 },
    { url: 'https://www.corriere.it/rss/homepage.xml', source: 'Corriere della Sera', topic: 'world', weight: 2 },
    { url: 'https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml', source: 'ANSA', topic: 'world', weight: 2 },
    { url: 'https://www.ansa.it/sito/notizie/sport/sport_rss.xml', source: 'ANSA', topic: 'sport', weight: 2 },
    { url: 'https://www.ansa.it/sito/notizie/cultura/cultura_rss.xml', source: 'ANSA', topic: 'culture', weight: 2 },
    { url: 'https://www.ansa.it/canale_saluteebenessere/notizie/saluteebenessere_rss.xml', source: 'ANSA', topic: 'health', weight: 2 },
    { url: 'https://www.ansa.it/canale_scienza_tecnica/notizie/scienzaetecnica_rss.xml', source: 'ANSA', topic: 'science', weight: 2 },
    { url: 'https://www.repubblica.it/rss/spettacoli/rss2.0.xml', source: 'la Repubblica', topic: 'culture', weight: 1 },
    { url: 'https://www.repubblica.it/rss/salute/rss2.0.xml', source: 'la Repubblica', topic: 'health', weight: 1 },
  ],
};

// Decode entities FIRST, then strip tags — otherwise an HTML-encoded "&lt;p&gt;"
// survives tag-stripping and shows up as a literal "<p>" in the summary.
const DECODE = s =>
  (s ?? '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const STRIP = s =>
  DECODE(DECODE(s)) // twice: handles double-encoded feeds
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Publishers syndicate small thumbnails in RSS. Most run a resizing CDN where
// the width is baked into the URL, so we swap in a large width to get a crisp
// photo instead of a 240px thumbnail.
function upscale(url) {
  return url
    // BBC: .../news/240/cpsprodpb/... or .../ace/standard/240/...  → 976 wide
    .replace(/(ichef\.bbci?\.co\.uk\/[^"]*?\/)(\d{2,4})(\/)/, (_, a, n, b) => (+n < 976 ? a + '976' + b : _))
    // BBC iPlayer-style: .../images/ic/240x135/... → 976x549
    .replace(/(ichef\.bbci?\.co\.uk\/images\/ic\/)(\d{2,4})x(\d{2,4})(\/)/, (_, a, w, h, b) =>
      +w < 976 ? a + '976x' + Math.round((976 * +h) / +w) + b : _)
    // Guardian / many WP CDNs: ?width=140 or &w=300  → 1000
    .replace(/([?&](?:width|w))=\d+/i, '$1=1000')
    // generic .../300x200/ or /-300x200. size suffix → strip to full-size
    .replace(/[-/](\d{2,4})x(\d{2,4})(?=\.(?:jpe?g|png|webp))/i, '');
}

// Pull the best image URL from an RSS item. Prefer feeds' largest declared
// image (media:content with a width), then thumbnails, enclosures, inline imgs.
function imageFrom(block) {
  // media:content can repeat with different widths — take the widest.
  const widthed = [...block.matchAll(/<media:content[^>]+url="([^"]+)"[^>]*?(?:width="(\d+)")?[^>]*>/gi)]
    .filter(m => /^https?:/.test(m[1]) && /\.(jpe?g|png|webp)/i.test(m[1]))
    .sort((a, b) => (+(b[2] || 0)) - (+(a[2] || 0)));
  if (widthed.length) return upscale(widthed[0][1]);

  const patterns = [
    /<media:thumbnail[^>]+url="([^"]+)"/i,
    /<enclosure[^>]+url="([^"]+)"[^>]*type="image/i,
    /<img[^>]+src="([^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = block.match(re);
    if (m && /^https?:\/\//.test(m[1])) return upscale(m[1]);
  }
  return '';
}

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? STRIP(m[1]) : '';
};

export function parseItems(xml) {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) ?? [];
  return blocks.map(b => {
    // Atom feeds use <link href="..."/>; RSS uses <link>...</link>.
    let link = tag(b, 'link');
    if (!link) {
      const m = b.match(/<link[^>]*href="([^"]+)"/i);
      link = m ? m[1] : '';
    }
    return {
      title: tag(b, 'title'),
      link,
      summary: tag(b, 'description') || tag(b, 'summary'),
      date: tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated'),
      image: imageFrom(b),
    };
  });
}

const STOP = new Set('the a an and or of to in on for with at by from as is are was were be been it its this that these those his her their our your new says said after over into out up down off than then '.split(' '));
const sig = s =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP.has(w)),
  );

function similar(a, b) {
  const A = sig(a), B = sig(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / Math.min(A.size, B.size);
}

function shared(a, b) {
  const A = sig(a), B = sig(b);
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit;
}

async function fetchFeed(f) {
  try {
    const r = await fetch(f.url, { headers: { 'user-agent': 'HootNewsBot/1.0 (+https://hoot.app)' } });
    if (!r.ok) return [];
    const items = parseItems(await r.text());
    return items
      .filter(i => i.title && i.link)
      .slice(0, 15)
      .map(i => ({ ...i, source: f.source, topic: f.topic, weight: f.weight }));
  } catch {
    return [];
  }
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function buildEdition(feeds) {
  const all = (await Promise.all(feeds.map(fetchFeed))).flat();
  if (!all.length) return null;
  const now = Date.now();
  // Cluster near-duplicate headlines across sources (importance grows with how
  // many sources carry a story and how recent it is).
  const clusters = [];
  for (const it of all) {
    // Need at least two shared keywords too: a short headline sharing one word
    // ("key") with another must not merge, or it lends its photo to the wrong story.
    const c = clusters.find(c => similar(c.rep.title, it.title) >= 0.5 && shared(c.rep.title, it.title) >= 2);
    if (c) {
      c.items.push(it);
      c.sources.add(it.source);
    } else {
      clusters.push({ rep: it, items: [it], sources: new Set([it.source]) });
    }
  }
  const stories = clusters.map(c => {
    const best = c.items.slice().sort((a, b) => (b.summary?.length ?? 0) - (a.summary?.length ?? 0))[0];
    const ageHrs = best.date ? Math.max(0, (now - Date.parse(best.date)) / 3.6e6) : 48;
    const recency = Math.max(0, 1 - ageHrs / 48);
    const weight = Math.max(...c.items.map(i => i.weight));
    const importance = c.sources.size * 2 + weight + recency * 2;
    // The photo must belong to the story shown: the headline's own item first,
    // then only an item from the same publisher about the same story.
    const withImg = best.image ? best
      : c.items.find(i => i.image && i.source === best.source && similar(i.title, best.title) >= 0.6);
    return {
      id: hash(best.title),
      title: best.title,
      summary: best.summary ? best.summary.slice(0, 280) : '',
      image: withImg?.image ?? '',
      source: best.source,
      url: best.link,
      topic: best.topic,
      published: best.date ? new Date(best.date).toISOString() : new Date().toISOString(),
      importance: Math.round(importance * 100) / 100,
    };
  });
  stories.sort((a, b) => b.importance - a.importance);

  // Cap any single topic only when the edition actually spans several topics
  // (the English edition). Native editions are general news, so keep the top N.
  const topics = new Set(stories.map(s => s.topic));
  const perTopic = {};
  const picked = [];
  for (const s of stories) {
    perTopic[s.topic] = (perTopic[s.topic] ?? 0) + 1;
    // General news gets the most room; each other topic up to four stories.
    if (topics.size <= 2 || perTopic[s.topic] <= (s.topic === 'world' ? 10 : 4)) picked.push(s);
    if (picked.length >= 30) break;
  }
  return picked;
}

async function run() {
  const dir = 'public/content/news';
  fs.mkdirSync(dir, { recursive: true });
  let anyEn = null;
  for (const [edition, feeds] of Object.entries(EDITIONS)) {
    const picked = await buildEdition(feeds);
    if (!picked || picked.length < 2) {
      console.warn(`${edition}: too few stories, skipping (readers fall back to English).`);
      continue;
    }
    const out = { built: new Date().toISOString(), stories: picked };
    fs.writeFileSync(path.join(dir, `${edition}.json`), JSON.stringify(out));
    if (edition === 'en') {
      anyEn = out;
      fs.writeFileSync(path.join(dir, 'today.json'), JSON.stringify(out)); // legacy path
    }
    console.log(`${edition}: ${picked.length} stories`);
  }
  if (!anyEn) {
    console.error('English edition failed to build; leaving existing news in place.');
    process.exit(0);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  run().catch(e => {
    console.error(e);
    process.exit(1);
  });
