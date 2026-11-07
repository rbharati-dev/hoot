// The morning email, run hourly by .github/workflows/email.yml.
//
// Every run: sends a "please confirm" email to new sign-ups (and forgets
// sign-ups never confirmed after 14 days). The run at 6am Toronto time also
// sends the morning email to confirmed subscribers (weekly ones on Sundays).
//
// Content comes from Hoot's own published files (top headline, a health study,
// the reflection of the day), in each subscriber's language. Sending uses
// Resend (resend.com): add RESEND_API_KEY as a GitHub secret to switch it on;
// without it this job explains what's missing and stops.
import fs from 'node:fs';

const PROJECT = process.env.FIREBASE_PROJECT || 'project-b9f72b7f-699d-46ed-aec';
const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const SITE = 'https://hootdaily.com';
const FROM = process.env.EMAIL_FROM || 'Hoot <morning@hootdaily.com>';
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'; // Firebase CLI's public OAuth client
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

const PREVIEW = process.env.EMAIL_PREVIEW; // a folder: write sample emails there and stop
if (!PREVIEW && !process.env.RESEND_API_KEY) {
  console.log('RESEND_API_KEY is not set: emails are off. Create a free Resend account, verify hootdaily.com, and add the key as a GitHub secret.');
  process.exit(0);
}

const W = {
  en: { subject: 'Your morning Hoot', hello: 'Good morning!', headline: "Today's headline", health: 'New in health', thought: 'A thought for today', play: "Play today's puzzles", read: 'Read more', why: 'You asked for this email at hootdaily.com.', stop: 'Unsubscribe', confirmSubject: 'Please confirm your morning email from Hoot', confirmBody: 'Tap the button to start receiving your morning email from Hoot. If you didn’t ask for this, just ignore this email.', confirm: 'Yes, send me the morning email' },
  fr: { subject: 'Votre Hoot du matin', hello: 'Bonjour !', headline: 'Le titre du jour', health: 'Du nouveau en santé', thought: 'Une pensée pour aujourd’hui', play: 'Jouer aux jeux du jour', read: 'Lire la suite', why: 'Vous avez demandé ce courriel sur hootdaily.com.', stop: 'Se désabonner', confirmSubject: 'Confirmez votre courriel du matin de Hoot', confirmBody: 'Touchez le bouton pour recevoir le courriel du matin de Hoot. Si vous ne l’avez pas demandé, ignorez simplement ce message.', confirm: 'Oui, envoyez-le-moi' },
  es: { subject: 'Tu Hoot de la mañana', hello: '¡Buenos días!', headline: 'El titular del día', health: 'Novedades de salud', thought: 'Un pensamiento para hoy', play: 'Jugar a los juegos de hoy', read: 'Leer más', why: 'Pediste este correo en hootdaily.com.', stop: 'Darse de baja', confirmSubject: 'Confirma tu correo de la mañana de Hoot', confirmBody: 'Toca el botón para empezar a recibir el correo de la mañana de Hoot. Si no lo pediste, ignora este mensaje.', confirm: 'Sí, envíamelo' },
  de: { subject: 'Ihr Hoot am Morgen', hello: 'Guten Morgen!', headline: 'Schlagzeile des Tages', health: 'Neu in Gesundheit', thought: 'Ein Gedanke für heute', play: 'Die Rätsel von heute spielen', read: 'Weiterlesen', why: 'Sie haben diese E-Mail auf hootdaily.com bestellt.', stop: 'Abmelden', confirmSubject: 'Bitte bestätigen Sie Ihre Morgen-E-Mail von Hoot', confirmBody: 'Tippen Sie auf den Knopf, um die Morgen-E-Mail von Hoot zu erhalten. Wenn Sie das nicht wollten, ignorieren Sie diese E-Mail einfach.', confirm: 'Ja, bitte schicken' },
  it: { subject: 'Il tuo Hoot del mattino', hello: 'Buongiorno!', headline: 'Il titolo del giorno', health: 'Novità sulla salute', thought: 'Un pensiero per oggi', play: 'Gioca ai giochi di oggi', read: 'Leggi di più', why: 'Hai chiesto questa email su hootdaily.com.', stop: 'Annulla iscrizione', confirmSubject: 'Conferma la tua email del mattino di Hoot', confirmBody: 'Tocca il pulsante per ricevere l’email del mattino di Hoot. Se non l’hai chiesta, ignora questo messaggio.', confirm: 'Sì, mandamela' },
  pt: { subject: 'Seu Hoot da manhã', hello: 'Bom dia!', headline: 'A manchete do dia', health: 'Novidades de saúde', thought: 'Um pensamento para hoje', play: 'Jogar os jogos de hoje', read: 'Ler mais', why: 'Você pediu este e-mail em hootdaily.com.', stop: 'Cancelar inscrição', confirmSubject: 'Confirme seu e-mail da manhã do Hoot', confirmBody: 'Toque no botão para começar a receber o e-mail da manhã do Hoot. Se você não pediu, ignore esta mensagem.', confirm: 'Sim, quero receber' },
  ru: { subject: 'Ваш утренний Hoot', hello: 'Доброе утро!', headline: 'Главная новость дня', health: 'Новое о здоровье', thought: 'Мысль дня', play: 'Сыграть в игры дня', read: 'Читать дальше', why: 'Вы подписались на это письмо на hootdaily.com.', stop: 'Отписаться', confirmSubject: 'Подтвердите утреннее письмо от Hoot', confirmBody: 'Нажмите кнопку, чтобы получать утреннее письмо от Hoot. Если вы не подписывались, просто проигнорируйте это письмо.', confirm: 'Да, присылайте' },
  hi: { subject: 'आपका सुबह का Hoot', hello: 'सुप्रभात!', headline: 'आज की बड़ी ख़बर', health: 'सेहत में नया', thought: 'आज का विचार', play: 'आज की पहेलियाँ खेलें', read: 'और पढ़ें', why: 'आपने यह ईमेल hootdaily.com पर माँगा था।', stop: 'सदस्यता छोड़ें', confirmSubject: 'Hoot का सुबह का ईमेल पक्का करें', confirmBody: 'Hoot का सुबह का ईमेल पाने के लिए बटन दबाएँ। अगर आपने यह नहीं माँगा, तो इस ईमेल को अनदेखा करें।', confirm: 'हाँ, मुझे भेजें' },
  ne: { subject: 'तपाईंको बिहानको Hoot', hello: 'शुभ प्रभात!', headline: 'आजको मुख्य समाचार', health: 'स्वास्थ्यमा नयाँ', thought: 'आजको विचार', play: 'आजका पजल खेल्नुहोस्', read: 'थप पढ्नुहोस्', why: 'तपाईंले यो इमेल hootdaily.com मा माग्नुभएको थियो।', stop: 'सदस्यता छोड्नुहोस्', confirmSubject: 'Hoot को बिहानको इमेल पुष्टि गर्नुहोस्', confirmBody: 'Hoot को बिहानको इमेल पाउन बटन थिच्नुहोस्। यदि तपाईंले मागेको होइन भने यो इमेल बेवास्ता गर्नुहोस्।', confirm: 'हो, पठाउनुहोस्' },
};

// ---- Firestore (admin, via the deploy token) ----
async function accessToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: process.env.FIREBASE_TOKEN, client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!r.ok) throw new Error(`token ${r.status}`);
  return (await r.json()).access_token;
}
let auth = {}; // set once we have a token (below)
async function subscribers() {
  const out = [];
  let page = '';
  do {
    const r = await fetch(`${DOCS}/subscribers?pageSize=300${page ? `&pageToken=${page}` : ''}`, { headers: auth });
    if (!r.ok) throw new Error(`list ${r.status}`);
    const j = await r.json();
    for (const d of j.documents ?? []) {
      const f = d.fields ?? {};
      out.push({ name: d.name, token: d.name.split('/').pop(), email: f.email?.stringValue, lang: f.lang?.stringValue ?? 'en', freq: f.freq?.stringValue ?? 'daily', confirmed: !!f.confirmed?.booleanValue, confirmSent: !!f.confirmSent?.booleanValue, created: f.created?.timestampValue });
    }
    page = j.nextPageToken ?? '';
  } while (page);
  return out;
}
const setField = (name, field, value) => fetch(`https://firestore.googleapis.com/v1/${name}?updateMask.fieldPaths=${field}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ fields: { [field]: value } }) });
const remove = name => fetch(`https://firestore.googleapis.com/v1/${name}`, { method: 'DELETE', headers: auth });

// ---- content ----
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const readJson = p => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);
const dayIndex = Math.floor(Date.now() / 864e5);
function contentFor(lang) {
  const news = readJson(`public/content/news/${lang}.json`) ?? readJson('public/content/news/en.json');
  const headline = news?.stories?.slice().sort((a, b) => b.importance - a.importance)[0];
  const research = readJson(`public/content/research/${lang}.json`) ?? readJson('public/content/research/en.json');
  const studies = (research?.stories ?? []).filter(s => !s.intimate && s.topic !== 'intimacy').sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 10);
  const study = studies[dayIndex % Math.max(1, studies.length)];
  const wisdom = readJson('public/content/wisdom/all.json') ?? [];
  const w = wisdom[dayIndex % Math.max(1, wisdom.length)];
  const thought = w ? { title: w.t?.[lang]?.title ?? w.title, text: w.t?.[lang]?.text ?? w.text } : null;
  return { headline, study, thought };
}

const button = (href, label) => `<a href="${href}" style="display:inline-block;background:#B4532A;color:#fff;text-decoration:none;font-weight:700;font-size:18px;padding:14px 22px;border-radius:12px">${esc(label)}</a>`;
const block = (label, title, text, href, more) => `
  <tr><td style="padding:22px 0;border-top:1px solid #e7e1d8">
    <p style="margin:0 0 6px;color:#B4532A;font-weight:700;font-size:14px;letter-spacing:.04em;text-transform:uppercase">${esc(label)}</p>
    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;line-height:1.3;color:#1C1B1A">${esc(title)}</p>
    ${text ? `<p style="margin:0 0 10px;font-size:17px;line-height:1.55;color:#3d3935">${esc(text)}</p>` : ''}
    ${href ? `<a href="${href}" style="color:#B4532A;font-size:17px;font-weight:600">${esc(more)} →</a>` : ''}
  </td></tr>`;
function page(inner, w, unsub) {
  return `<!doctype html><html><body style="margin:0;background:#FAF8F4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 14px">
<table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:18px;padding:28px" cellpadding="0" cellspacing="0">
<tr><td style="padding-bottom:12px"><img src="${SITE}/icons/icon-192.png" width="52" height="52" alt="Hoot" style="border-radius:12px;vertical-align:middle"> <span style="font-family:Georgia,serif;font-size:28px;vertical-align:middle;margin-left:8px;color:#1C1B1A">Hoot</span></td></tr>
${inner}
</table>
<p style="max-width:600px;color:#7a736b;font-size:14px;line-height:1.5;margin:18px auto 0">${esc(w.why)}${unsub ? ` <a href="${unsub}" style="color:#7a736b">${esc(w.stop)}</a>` : ''}</p>
</td></tr></table></body></html>`;
}
function morningEmail(sub) {
  const w = W[sub.lang] ?? W.en;
  const c = contentFor(sub.lang);
  const unsub = `${SITE}/?unsubscribe=${sub.token}`;
  const inner = `<tr><td style="padding:4px 0 18px;font-size:20px;color:#1C1B1A">${esc(w.hello)}</td></tr>
${c.headline ? block(w.headline, c.headline.title, c.headline.summary, c.headline.url, w.read) : ''}
${c.study ? block(w.health, c.study.title, c.study.summary, c.study.url, w.read) : ''}
${c.thought ? block(w.thought, c.thought.title, c.thought.text, `${SITE}/?source=email`, w.read) : ''}
<tr><td style="padding:26px 0 6px;border-top:1px solid #e7e1d8;text-align:center">${button(`${SITE}/?source=email`, w.play)}</td></tr>`;
  const text = [w.hello, c.headline && `${w.headline}: ${c.headline.title}\n${c.headline.url}`, c.study && `${w.health}: ${c.study.title}\n${c.study.url}`, c.thought && `${w.thought}: ${c.thought.title}`, `${w.play}: ${SITE}`, `${w.stop}: ${unsub}`].filter(Boolean).join('\n\n');
  return { to: sub.email, subject: w.subject, html: page(inner, w, unsub), text, headers: { 'List-Unsubscribe': `<${unsub}>` } };
}
function confirmEmail(sub) {
  const w = W[sub.lang] ?? W.en;
  const link = `${SITE}/?confirm=${sub.token}`;
  const inner = `<tr><td style="padding:8px 0 20px;font-size:18px;line-height:1.55;color:#1C1B1A">${esc(w.confirmBody)}</td></tr><tr><td style="padding:0 0 10px">${button(link, w.confirm)}</td></tr>`;
  return { to: sub.email, subject: w.confirmSubject, html: page(inner, w, null), text: `${w.confirmBody}\n\n${link}` };
}

async function send(emails) {
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100).map(e => ({ from: FROM, ...e }));
    const r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(batch) });
    if (!r.ok) throw new Error(`resend ${r.status} ${await r.text()}`);
  }
}

// ---- run ----
if (PREVIEW) {
  fs.mkdirSync(PREVIEW, { recursive: true });
  for (const lang of ['en', 'fr']) {
    const sub = { token: '0'.repeat(36), email: 'reader@example.com', lang };
    fs.writeFileSync(`${PREVIEW}/morning-${lang}.html`, morningEmail(sub).html);
    fs.writeFileSync(`${PREVIEW}/confirm-${lang}.html`, confirmEmail(sub).html);
  }
  console.log('previews written to', PREVIEW);
  process.exit(0);
}
auth = { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json' };
const subs = await subscribers();
const now = new Date();
const toConfirm = subs.filter(s => !s.confirmed && !s.confirmSent && s.email);
if (toConfirm.length) {
  await send(toConfirm.map(confirmEmail));
  for (const s of toConfirm) await setField(s.name, 'confirmSent', { booleanValue: true });
}
for (const s of subs.filter(s => !s.confirmed && s.created && now - new Date(s.created) > 14 * 864e5)) await remove(s.name);
console.log(`confirmations sent: ${toConfirm.length}`);

// The morning send: once a day, at the 6am (Toronto) run, or when asked.
const torontoHour = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', hour12: false }).format(now));
const sunday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', weekday: 'short' }).format(now) === 'Sun';
if (torontoHour === 6 || process.env.SEND_NOW === '1') {
  const due = subs.filter(s => s.confirmed && s.email && (s.freq === 'daily' || sunday));
  await send(due.map(morningEmail));
  console.log(`morning emails sent: ${due.length}`);
}
