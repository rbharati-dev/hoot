// Builds the Health tab's "New research" feed: fresh studies and medical news
// (sleep, caffeine, sitting, supplements, new drugs, ageing, the brain...)
// from public science-news RSS feeds. Like the news feed we keep ONLY a
// headline, a short summary, the source and a link back, never the article.
//
// Stories are scored for what fascinates readers aged 50-80 (being stronger,
// sharper, sleeping better, living longer) and anything aimed at children,
// pregnancy or grim/legal/political stories is left out. The feed rolls: new
// stories are added on each run and kept for 30 days, so there are always
// plenty. Titles and summaries are machine-translated into the 8 other app
// languages (cached by story, so each is translated once).
//
// Runs where there's internet (CI): npm run build:health-news
import fs from 'node:fs';
import path from 'node:path';
import probe from 'probe-image-size';
import { parseItems } from './build-news.mjs';

const FEEDS = [
  ['https://www.sciencedaily.com/rss/health_medicine.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/healthy_aging.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/sleep_disorders.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/nutrition.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/fitness.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/heart_disease.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/mind_brain/memory.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/mind_brain/alzheimer\'s.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/menopause.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/obesity.xml', 'ScienceDaily'],
  ['https://medicalxpress.com/rss-feed/', 'Medical Xpress'],
  ['https://medicalxpress.com/rss-feed/breaking/', 'Medical Xpress'],
  ['https://www.sciencedaily.com/rss/health_medicine/diet_and_weight_loss.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/vitamins.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/pharmacology.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/sports_medicine.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/mind_brain/sleep.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/mind_brain/intelligence.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/men\'s_health.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/women\'s_health.xml', 'ScienceDaily'],
  ['https://newatlas.com/health-wellbeing/index.rss', 'New Atlas'],
  ['https://www.sciencealert.com/health/feed', 'ScienceAlert'],
  ['https://www.theguardian.com/society/health/rss', 'The Guardian'],
  ['https://www.theguardian.com/lifeandstyle/health-and-wellbeing/rss', 'The Guardian'],
  ['https://feeds.bbci.co.uk/news/health/rss.xml', 'BBC News'],
  ['https://feeds.npr.org/1128/rss.xml', 'NPR'],
  ['https://www.statnews.com/feed/', 'STAT'],
  ['https://www.sciencedaily.com/rss/health_medicine/dietary_supplement_and_minerals.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/diabetes.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/hypertension.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/cholesterol.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/arthritis.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/osteoporosis.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/hearing_loss.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/eye_care.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/alternative_medicine.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/stroke.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/health_medicine/staying_healthy.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/mind_brain/depression.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/mind_brain/dementia.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/mind_brain/caregiving.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/mind_brain/happiness.xml', 'ScienceDaily'],
  ['https://www.sciencedaily.com/rss/top/health.xml', 'ScienceDaily'],
  ['https://medicalxpress.com/rss-feed/medicine-news/', 'Medical Xpress'],
  ['https://medicalxpress.com/rss-feed/neuroscience-news/', 'Medical Xpress'],
  ['https://medicalxpress.com/rss-feed/health-news/diet-fitness/', 'Medical Xpress'],
  ['https://medicalxpress.com/rss-feed/medicine-news/cardiology/', 'Medical Xpress'],
  ['https://medicalxpress.com/rss-feed/medicine-news/gerontology-geriatrics/', 'Medical Xpress'],
  ['https://www.newscientist.com/subject/health/feed/', 'New Scientist'],
  ['https://www.sciencenews.org/topic/health-medicine/feed', 'Science News'],
  ['https://www.health.harvard.edu/blog/feed', 'Harvard Health'],
  ['https://newsnetwork.mayoclinic.org/feed/', 'Mayo Clinic'],
  ['https://www.futurity.org/category/health-medicine/feed/', 'Futurity'],
  ['https://neurosciencenews.com/feed/', 'Neuroscience News'],
  ['https://rss.nytimes.com/services/xml/rss/nyt/Well.xml', 'The New York Times'],
  ['https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', 'The New York Times'],
  ['https://theconversation.com/global/topics/health-15/articles.atom', 'The Conversation'],
  ['https://www.medicalnewstoday.com/newsfeeds/rss/medical_all.xml', 'Medical News Today'],
  ['https://rss.upi.com/news/health_news.rss', 'UPI'],
  ['https://www.earth.com/category/health/feed/', 'Earth.com'],
  ['https://studyfinds.org/category/health/feed/', 'StudyFinds'],
];

// What makes a story irresistible to this audience, with weights.
const HOOKS = [
  [/\b(sleep|insomnia|nap|melatonin)/i, 3, 'sleep'],
  [/\b(coffee|caffeine|tea\b|cocoa|chocolate|wine|alcohol)/i, 3, 'eating'],
  [/\b(nicotine|smok|vap)/i, 2, 'lungs'],
  [/\b(sitting|sedentary|steps|walking|walk\b|exercise|workout|fitness|strength|muscle|resistance training|yoga|tai chi|stretch)/i, 3, 'strength'],
  [/\b(supplement|vitamin|creatine|omega-3|fish oil|magnesium|probiotic|collagen|zinc|curcumin|nmn|nad\+?|resveratrol)/i, 4, 'eating'],
  [/\b(drug|pill|ozempic|wegovy|semaglutide|tirzepatide|mounjaro|glp-1|peptide|statin|aspirin|metformin|rapamycin|trial|fda approv|approved)/i, 4, 'staywell'],
  [/\b(ageing|aging|longevity|live longer|lifespan|biological age|older adults|over 50|over 60|over 65|seniors?|midlife|middle age|retire)/i, 4, 'longevity'],
  [/\b(dementia|alzheimer|memory|cognitive|brain|mental sharpness|stroke)/i, 4, 'memory'],
  [/\b(heart|blood pressure|cholesterol|cardio)/i, 3, 'heart'],
  [/\b(menopause|hrt|hormone|testosterone|estrogen|oestrogen)/i, 4, 'menopause'],
  [/\b(sex|libido|erectile|intimacy)/i, 3, 'intimacy'],
  [/\b(diet|fasting|mediterranean|protein|fibre|fiber|sugar|ultra-processed|gut|microbiome)/i, 3, 'eating'],
  [/\b(weight|obesity|belly fat)/i, 2, 'weight'],
  [/\b(arthritis|joint|knee|hip|back pain|bone|osteopor)/i, 3, 'joints'],
  [/\b(hearing|vision|eyes?\b|cataract|teeth|gum)/i, 2, 'senses'],
  [/\b(lonel|happiness|depress|anxiety|stress|optimis|purpose|social)/i, 2, 'mood'],
  [/\b(skin|wrinkle|sunscreen)/i, 2, 'skin'],
  [/\b(energy|fatigue|tired)/i, 2, 'energy'],
  [/\b(study|studies|research|researchers|scientists|found|discover|breakthrough|surprising|new)/i, 1, null],
];
// Left out: not for this audience, or not the mood of a "be your best" feed.
const DROP = /\b(child|children|kids?|teen|adolescen|infant|baby|babies|newborn|pregnan|fetal|foetal|prenatal|abortion|ivf|school|student|lawsuit|sued|court|trump|election|congress|senate|tariff|funding cuts?|layoff|shooting|murder|killed|dies|died|death of|suicide|overdose|fentanyl|opioid|stock|shares|investor|earnings|ceo|merger|acquisition|podcast|newsletter|quiz|webinar|opinion)\b/i;

// Paywalled teasers and policy/politics pieces read as noise here.
const PAYWALL = /^(STAT\+|Pharmalittle)|\b(MPs|ministers?|NHS (board|trust)s?|misogyn|manosphere|policy|policies|insurer|medicaid|medicare)\b/i;
// Feeds often carry small thumbnails: switch to the full-size copy.
// (Medical Xpress serves /tmb/ at ~100px wide; /800a/ is the 800px version.)
export function bigImage(url) {
  return (url || '')
    .replace(/&amp;/g, '&')
    .replace(/(b-cdn\.net\/csz\/news\/)tmb\//, '$1800a/')
    .replace(/-mediumSquareAt3X\.jpg/, '-superJumbo.jpg');
}
// Only very high-resolution photos are shown. The card is up to ~900px wide
// and most readers' screens draw it at 2x, so a photo must really be at least
// 1200px wide (and roughly landscape, so the 16:9 crop doesn't blow up a sliver).
// We measure the actual file, trying the biggest copy each publisher offers first.
export const MIN_W = 1200;
export const MIN_H = 600;
function candidates(url) {
  const u = bigImage(url);
  if (!u) return [];
  const out = [];
  const add = x => x && !out.includes(x) && out.push(x);
  add(u.replace(/(b-cdn\.net\/csz\/news\/)(?:800a|800w|tmb)\//, '$1hires/'));
  add(u.replace(/(ichef\.bbci?\.co\.uk\/ace\/standard\/)\d+\//, '$12048/'));
  add(u.replace(/(ichef\.bbci?\.co\.uk\/ace\/standard\/)\d+\//, '$11536/'));
  add(u.replace(/([?&]w)=\d+/, '$1=2000'));
  add(u.replace(/\/resize\/\d+x\d+!?\//, '/resize/2000x1333/'));
  add(u.replace(/-\d{2,4}x\d{2,4}(?=\.(?:jpe?g|png|webp))/i, ''));
  add(u);
  return out;
}
async function measure(url) {
  try {
    const r = await probe(url, { timeout: 15000, headers: { 'user-agent': 'Mozilla/5.0 HootBot' } });
    return { w: r.width, h: r.height };
  } catch {
    return null;
  }
}
/** The largest copy of a feed photo that clears the bar, or '' if none does. */
export async function sharpImage(url) {
  for (const c of candidates(url)) {
    const m = await measure(c);
    if (m && m.w >= MIN_W && m.h >= MIN_H && m.w / m.h <= 2.4 && m.w / m.h >= 1.1) return { image: c, w: m.w, h: m.h };
  }
  return { image: '', w: 0, h: 0 };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function score(text) {
  let s = 0;
  const topics = {};
  for (const [re, w, topic] of HOOKS)
    if (re.test(text)) {
      s += w;
      if (topic) topics[topic] = (topics[topic] ?? 0) + w;
    }
  const topic = Object.entries(topics).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'longevity';
  return { s, topic };
}
/** A clean one-to-two sentence summary, cut on a sentence end where possible. */
function tidy(summary) {
  const s = summary.replace(/\s*(The post .*appeared first on.*|Continue reading.*|Read more.*)$/i, '').trim();
  if (s.length <= 300) return s;
  const cut = s.slice(0, 300);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s\S*$/, '') + '…';
}

async function fetchFeed([url, source]) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'HootNewsBot/1.0 (+https://hoot.app)' } });
    if (!r.ok) {
      console.warn(`skip ${source} ${url}: ${r.status}`);
      return [];
    }
    const items = parseItems(await r.text()).filter(i => i.title && i.link).slice(0, 60);
    console.log(`${source}: ${items.length} items (${url})`);
    return items.map(i => ({ ...i, source, feed: url }));
  } catch (e) {
    console.warn(`skip ${source} ${url}: ${e.message}`);
    return [];
  }
}

const LANGS = process.env.HEALTH_NEWS_EN_ONLY ? [] : ['ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne'];
async function google(text, to) {
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 HootBot' } });
  if (!r.ok) throw new Error('google ' + r.status);
  const j = await r.json();
  return (j[0] || []).map(s => s[0]).join('');
}
async function tr(text, to) {
  for (let a = 0; a < 3; a++) {
    try {
      return await google(text, to);
    } catch {
      await sleep(1000 * (a + 1));
    }
  }
  return null;
}

async function run() {
  const dir = 'public/content/research';
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'en.json');
  const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).stories : [];
  const now = Date.now();
  const MONTH = 60 * 864e5; // keep each study two months

  const items = (await Promise.all(FEEDS.map(fetchFeed))).flat();
  const fresh = [];
  const seenTitle = new Set(prev.map(s => s.title.toLowerCase()));
  for (const it of items) {
    const title = it.title.trim();
    const summary = tidy(it.summary ?? '');
    const text = `${title} ${summary}`;
    if (DROP.test(text) || PAYWALL.test(title) || summary.length < 60 || seenTitle.has(title.toLowerCase())) continue;
    const { s, topic } = score(text);
    if (s < 6) continue; // not one of the things people find fascinating
    const published = it.date && !isNaN(Date.parse(it.date)) ? new Date(it.date).toISOString() : new Date().toISOString();
    if (now - Date.parse(published) > MONTH) continue;
    seenTitle.add(title.toLowerCase());
    fresh.push({ feed: it.feed, id: 'n' + hash(title), title, summary, image: bigImage(it.image), source: it.source, url: it.link, topic, published, score: s, animal: /\b(mice|mouse|rats?|in animals|worms|fruit flies)\b/i.test(text) || undefined });
  }
  // Keep the best few per feed per run, so one prolific feed can't flood it.
  fresh.sort((a, b) => b.score - a.score);
  const perFeed = {};
  const kept = fresh.filter(s => (perFeed[s.feed] = (perFeed[s.feed] ?? 0) + 1) <= 15).map(({ feed: _f, ...s }) => s);

  const stories = [...kept, ...prev.map(s => ({ ...s, image: bigImage(s.image) })).filter(s => now - Date.parse(s.published) <= MONTH)]
    .filter((s, i, a) => a.findIndex(x => x.id === s.id) === i)
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published))
    .slice(0, 600);
  if (stories.length < 5) {
    console.error(`Only ${stories.length} health stories; leaving the feed as it was.`);
    return;
  }
  const built = new Date().toISOString();
  // Measure every photo not measured yet (and remeasure ones that failed the
  // older, laxer rule); anything below the bar is dropped, never shown soft.
  for (const st of stories) {
    if (st.imgChecked === MIN_W) continue;
    const src = st.origImage || st.image;
    const got = src ? await sharpImage(src) : { image: '', w: 0 };
    st.origImage = src || undefined;
    st.image = got.image;
    st.imgW = got.w || undefined;
    st.imgChecked = MIN_W;
  }
  console.log(`photos: ${stories.filter(s => s.image).length}/${stories.length} pass the ${MIN_W}px bar`);
  fs.writeFileSync(file, JSON.stringify({ built, stories }));
  console.log(`en: ${stories.length} health stories (${kept.length} new)`);

  // Other languages: translate each story once and reuse it on later runs.
  for (const lang of LANGS) {
    const f = path.join(dir, `${lang}.json`);
    const old = new Map(fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).stories.map(s => [s.id, s]) : []);
    const out = [];
    for (const s of stories) {
      const had = old.get(s.id);
      if (had && !had.en) {
        out.push({ ...s, title: had.title, summary: had.summary });
        continue;
      }
      const [title, summary] = [await tr(s.title, lang), await tr(s.summary, lang)];
      out.push(title && summary ? { ...s, title, summary } : { ...s, en: true });
      await sleep(150);
    }
    fs.writeFileSync(f, JSON.stringify({ built, stories: out }));
    console.log(`${lang}: ${out.filter(s => !s.en).length}/${out.length} translated`);
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
