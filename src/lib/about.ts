// The About, Privacy and Contact page, in all 9 languages. The privacy text
// must stay true to what the code does: if you change what Hoot stores or
// sends, change this too.
import type { Lang } from './data';

export const CONTACT_EMAIL = 'hello@hootdaily.com';

export interface AboutText {
  title: string;
  about: string;
  aboutBody: string[];
  privacy: string;
  privacyIntro: string;
  privacyPoints: [string, string][]; // [heading, detail]
  contact: string;
  contactBody: string;
  contactEmail: string;
  updated: string;
}

const en: AboutText = {
  title: 'About Hoot',
  about: 'What Hoot is',
  aboutBody: [
    'Hoot is a daily companion for people in the second half of life: memories from the years you lived through, a few puzzles to keep the mind sharp, the latest health research, today’s news and a quiet thought to end on.',
    'It is free for everyone and has no ads. It is kept going by small donations from people who enjoy it.',
    'Hoot is made independently in Canada. We read every message, and many of Hoot’s features came from suggestions.',
  ],
  privacy: 'Your privacy',
  privacyIntro: 'In plain words, here is what Hoot keeps and why.',
  privacyPoints: [
    ['No ads, no selling, no tracking', 'Hoot shows no adverts, never sells or shares your information, and uses no tracking cookies.'],
    ['Stays on your device by default', 'Your birth year, country, likes, saved memories, notes and game progress are kept in this browser, on this device.'],
    ['If you make an account', 'We keep your email address, your username and your progress so it follows you to other devices. It is stored with Google Firebase in Canada (Montréal). You can delete your account and everything in it at any time in Settings.'],
    ['Anonymous counts', 'To learn what people use, Hoot counts things like “a game was played” or “a memory was shared” — just the totals for each day, never who did it.'],
    ['Error reports', 'If something breaks, Hoot sends us a short technical note (what failed, on which page) so we can fix it. It never includes your name, email or what you wrote.'],
    ['Donations', 'Donations are handled by Stripe. Hoot never sees your card details.'],
    ['Links and videos', 'News and health stories link to the publishers’ own websites, which have their own privacy rules. Music plays through YouTube in its privacy-enhanced mode.'],
  ],
  contact: 'Contact us',
  contactBody: 'Questions, ideas, something not working, or just to say hello — we would love to hear from you.',
  contactEmail: 'Email us',
  updated: 'Last updated November 2026.',
};

const fr: AboutText = {
  title: 'À propos de Hoot',
  about: 'Qu’est-ce que Hoot',
  aboutBody: [
    'Hoot est un compagnon quotidien pour la deuxième moitié de la vie : des souvenirs des années que vous avez vécues, quelques jeux pour garder l’esprit vif, les dernières recherches sur la santé, l’actualité du jour et une pensée paisible pour finir.',
    'Il est gratuit pour tous et sans publicité. Il vit grâce aux petits dons de celles et ceux qui l’apprécient.',
    'Hoot est fait de façon indépendante au Canada. Nous lisons chaque message, et beaucoup de fonctions de Hoot viennent de vos suggestions.',
  ],
  privacy: 'Votre vie privée',
  privacyIntro: 'En termes simples, voici ce que Hoot garde et pourquoi.',
  privacyPoints: [
    ['Ni publicité, ni vente, ni pistage', 'Hoot n’affiche aucune publicité, ne vend ni ne partage jamais vos informations et n’utilise aucun témoin de pistage.'],
    ['Sur votre appareil par défaut', 'Votre année de naissance, votre pays, vos goûts, vos souvenirs enregistrés, vos notes et vos jeux restent dans ce navigateur, sur cet appareil.'],
    ['Si vous créez un compte', 'Nous gardons votre adresse courriel, votre nom d’utilisateur et votre progression pour les retrouver sur vos autres appareils. Ils sont stockés chez Google Firebase au Canada (Montréal). Vous pouvez supprimer votre compte et tout son contenu à tout moment dans les Réglages.'],
    ['Des comptes anonymes', 'Pour savoir ce qui est utilisé, Hoot compte des choses comme « une partie a été jouée » ou « un souvenir a été partagé » — seulement les totaux de chaque jour, jamais qui l’a fait.'],
    ['Rapports d’erreur', 'Si quelque chose ne marche pas, Hoot nous envoie une courte note technique (ce qui a échoué, sur quelle page) pour que nous puissions corriger. Elle ne contient jamais votre nom, votre courriel ni ce que vous avez écrit.'],
    ['Dons', 'Les dons passent par Stripe. Hoot ne voit jamais votre carte.'],
    ['Liens et vidéos', 'Les articles mènent aux sites des éditeurs, qui ont leurs propres règles. La musique passe par YouTube en mode confidentialité renforcée.'],
  ],
  contact: 'Nous écrire',
  contactBody: 'Une question, une idée, quelque chose qui ne marche pas, ou simplement pour dire bonjour — nous serions ravis d’avoir de vos nouvelles.',
  contactEmail: 'Nous écrire par courriel',
  updated: 'Mis à jour en novembre 2026.',
};

const es: AboutText = {
  title: 'Sobre Hoot',
  about: 'Qué es Hoot',
  aboutBody: [
    'Hoot es un compañero diario para la segunda mitad de la vida: recuerdos de los años que viviste, algunos juegos para mantener la mente ágil, las últimas investigaciones de salud, las noticias del día y un pensamiento tranquilo para terminar.',
    'Es gratis para todos y no tiene anuncios. Se mantiene gracias a pequeñas donaciones de quienes lo disfrutan.',
    'Hoot se hace de forma independiente en Canadá. Leemos cada mensaje, y muchas de sus funciones salieron de sugerencias.',
  ],
  privacy: 'Tu privacidad',
  privacyIntro: 'En palabras sencillas, esto es lo que Hoot guarda y por qué.',
  privacyPoints: [
    ['Sin anuncios, sin venta, sin rastreo', 'Hoot no muestra anuncios, nunca vende ni comparte tu información y no usa cookies de rastreo.'],
    ['En tu dispositivo por defecto', 'Tu año de nacimiento, país, gustos, recuerdos guardados, notas y juegos se quedan en este navegador, en este dispositivo.'],
    ['Si creas una cuenta', 'Guardamos tu correo, tu nombre de usuario y tu progreso para que te acompañen en otros dispositivos. Se almacenan en Google Firebase en Canadá (Montreal). Puedes borrar tu cuenta y todo su contenido cuando quieras en Ajustes.'],
    ['Recuentos anónimos', 'Para saber qué se usa, Hoot cuenta cosas como «se jugó una partida» o «se compartió un recuerdo»: solo los totales de cada día, nunca quién lo hizo.'],
    ['Informes de errores', 'Si algo falla, Hoot nos envía una breve nota técnica (qué falló y en qué página) para arreglarlo. Nunca incluye tu nombre, tu correo ni lo que escribiste.'],
    ['Donaciones', 'Las donaciones se gestionan con Stripe. Hoot nunca ve tu tarjeta.'],
    ['Enlaces y vídeos', 'Las noticias enlazan a las webs de los medios, que tienen sus propias normas. La música suena a través de YouTube en su modo de privacidad mejorada.'],
  ],
  contact: 'Escríbenos',
  contactBody: 'Preguntas, ideas, algo que no funciona o simplemente para saludar: nos encantará saber de ti.',
  contactEmail: 'Escríbenos un correo',
  updated: 'Actualizado en noviembre de 2026.',
};

const de: AboutText = {
  title: 'Über Hoot',
  about: 'Was Hoot ist',
  aboutBody: [
    'Hoot ist ein täglicher Begleiter für die zweite Lebenshälfte: Erinnerungen an die Jahre, die Sie erlebt haben, ein paar Rätsel für einen wachen Kopf, die neueste Gesundheitsforschung, die Nachrichten des Tages und zum Schluss ein ruhiger Gedanke.',
    'Hoot ist für alle kostenlos und werbefrei. Es lebt von kleinen Spenden der Menschen, die es mögen.',
    'Hoot wird unabhängig in Kanada gemacht. Wir lesen jede Nachricht, und viele Funktionen stammen aus Vorschlägen.',
  ],
  privacy: 'Ihre Privatsphäre',
  privacyIntro: 'In einfachen Worten: Das speichert Hoot und warum.',
  privacyPoints: [
    ['Keine Werbung, kein Verkauf, kein Tracking', 'Hoot zeigt keine Werbung, verkauft oder teilt Ihre Daten nie und nutzt keine Tracking-Cookies.'],
    ['Standardmäßig auf Ihrem Gerät', 'Geburtsjahr, Land, Vorlieben, gespeicherte Erinnerungen, Notizen und Spielstände bleiben in diesem Browser auf diesem Gerät.'],
    ['Wenn Sie ein Konto anlegen', 'Wir speichern Ihre E-Mail-Adresse, Ihren Benutzernamen und Ihren Fortschritt, damit er Sie auf andere Geräte begleitet – bei Google Firebase in Kanada (Montréal). Sie können Ihr Konto mit allem Inhalt jederzeit in den Einstellungen löschen.'],
    ['Anonyme Zählungen', 'Um zu sehen, was genutzt wird, zählt Hoot Dinge wie „ein Spiel wurde gespielt“ oder „eine Erinnerung wurde geteilt“ – nur die Tagessummen, nie wer es war.'],
    ['Fehlerberichte', 'Wenn etwas nicht klappt, schickt uns Hoot eine kurze technische Notiz (was fehlschlug, auf welcher Seite), damit wir es beheben können. Sie enthält nie Ihren Namen, Ihre E-Mail oder Ihre Texte.'],
    ['Spenden', 'Spenden laufen über Stripe. Hoot sieht Ihre Kartendaten nie.'],
    ['Links und Videos', 'Nachrichten verlinken auf die Seiten der Verlage mit eigenen Datenschutzregeln. Musik läuft über YouTube im erweiterten Datenschutzmodus.'],
  ],
  contact: 'Kontakt',
  contactBody: 'Fragen, Ideen, etwas funktioniert nicht oder einfach ein Hallo – wir freuen uns von Ihnen zu hören.',
  contactEmail: 'E-Mail schreiben',
  updated: 'Stand: November 2026.',
};

const it: AboutText = {
  title: 'Su Hoot',
  about: 'Che cos’è Hoot',
  aboutBody: [
    'Hoot è un compagno quotidiano per la seconda metà della vita: ricordi degli anni che hai vissuto, qualche gioco per tenere la mente allenata, le ultime ricerche sulla salute, le notizie del giorno e un pensiero tranquillo per finire.',
    'È gratuito per tutti e senza pubblicità. Vive grazie alle piccole donazioni di chi lo apprezza.',
    'Hoot è fatto in modo indipendente in Canada. Leggiamo ogni messaggio, e molte funzioni sono nate da suggerimenti.',
  ],
  privacy: 'La tua privacy',
  privacyIntro: 'In parole semplici, ecco cosa conserva Hoot e perché.',
  privacyPoints: [
    ['Niente pubblicità, vendita o tracciamento', 'Hoot non mostra pubblicità, non vende né condivide mai i tuoi dati e non usa cookie di tracciamento.'],
    ['Sul tuo dispositivo, di base', 'Anno di nascita, paese, preferenze, ricordi salvati, note e giochi restano in questo browser, su questo dispositivo.'],
    ['Se crei un account', 'Conserviamo email, nome utente e progressi perché ti seguano sugli altri dispositivi, su Google Firebase in Canada (Montréal). Puoi eliminare l’account e tutto il suo contenuto in qualsiasi momento nelle Impostazioni.'],
    ['Conteggi anonimi', 'Per capire cosa si usa, Hoot conta cose come «è stata giocata una partita» o «è stato condiviso un ricordo»: solo i totali del giorno, mai chi è stato.'],
    ['Segnalazioni di errore', 'Se qualcosa non va, Hoot ci invia una breve nota tecnica (cosa è andato storto e in quale pagina) per sistemarlo. Non contiene mai il tuo nome, la tua email o ciò che hai scritto.'],
    ['Donazioni', 'Le donazioni passano da Stripe. Hoot non vede mai la tua carta.'],
    ['Link e video', 'Le notizie rimandano ai siti degli editori, con le loro regole. La musica passa da YouTube in modalità privacy avanzata.'],
  ],
  contact: 'Contattaci',
  contactBody: 'Domande, idee, qualcosa che non funziona o solo un saluto: ci farà piacere sentirti.',
  contactEmail: 'Scrivici',
  updated: 'Aggiornato a novembre 2026.',
};

const pt: AboutText = {
  title: 'Sobre o Hoot',
  about: 'O que é o Hoot',
  aboutBody: [
    'O Hoot é um companheiro diário para a segunda metade da vida: lembranças dos anos que você viveu, alguns jogos para manter a mente afiada, as pesquisas de saúde mais recentes, as notícias do dia e um pensamento tranquilo para fechar.',
    'É gratuito para todos e não tem anúncios. Se mantém com pequenas doações de quem gosta dele.',
    'O Hoot é feito de forma independente no Canadá. Lemos todas as mensagens, e muitos recursos vieram de sugestões.',
  ],
  privacy: 'Sua privacidade',
  privacyIntro: 'Em palavras simples, veja o que o Hoot guarda e por quê.',
  privacyPoints: [
    ['Sem anúncios, sem venda, sem rastreamento', 'O Hoot não mostra anúncios, nunca vende nem compartilha seus dados e não usa cookies de rastreamento.'],
    ['No seu aparelho, por padrão', 'Seu ano de nascimento, país, gostos, lembranças salvas, notas e jogos ficam neste navegador, neste aparelho.'],
    ['Se você criar uma conta', 'Guardamos seu e-mail, nome de usuário e progresso para acompanhar você em outros aparelhos, no Google Firebase no Canadá (Montreal). Você pode apagar a conta e tudo nela a qualquer momento em Ajustes.'],
    ['Contagens anônimas', 'Para saber o que é usado, o Hoot conta coisas como “um jogo foi jogado” ou “uma lembrança foi compartilhada” — só os totais de cada dia, nunca quem fez.'],
    ['Relatórios de erro', 'Se algo der errado, o Hoot nos envia uma nota técnica curta (o que falhou e em qual página) para corrigirmos. Nunca inclui seu nome, seu e-mail ou o que você escreveu.'],
    ['Doações', 'As doações são feitas pela Stripe. O Hoot nunca vê seu cartão.'],
    ['Links e vídeos', 'As notícias levam aos sites das próprias publicações, com regras próprias. A música toca pelo YouTube no modo de privacidade aprimorada.'],
  ],
  contact: 'Fale conosco',
  contactBody: 'Dúvidas, ideias, algo que não funciona ou só para dar um oi — vamos adorar ter notícias suas.',
  contactEmail: 'Mande um e-mail',
  updated: 'Atualizado em novembro de 2026.',
};

const ru: AboutText = {
  title: 'О Hoot',
  about: 'Что такое Hoot',
  aboutBody: [
    'Hoot — ежедневный спутник для второй половины жизни: воспоминания о годах, которые вы прожили, несколько игр для ясного ума, свежие исследования о здоровье, новости дня и спокойная мысль напоследок.',
    'Он бесплатный для всех и без рекламы. Его поддерживают небольшие пожертвования тех, кому он нравится.',
    'Hoot делается независимо в Канаде. Мы читаем каждое письмо, и многие возможности появились из ваших предложений.',
  ],
  privacy: 'Ваша конфиденциальность',
  privacyIntro: 'Простыми словами: что хранит Hoot и зачем.',
  privacyPoints: [
    ['Без рекламы, продажи и слежки', 'Hoot не показывает рекламу, никогда не продаёт и не передаёт ваши данные и не использует отслеживающие cookie.'],
    ['По умолчанию — на вашем устройстве', 'Год рождения, страна, предпочтения, сохранённые воспоминания, заметки и игры хранятся в этом браузере на этом устройстве.'],
    ['Если вы создаёте аккаунт', 'Мы храним ваш адрес эл. почты, имя пользователя и прогресс, чтобы они были доступны на других устройствах, — в Google Firebase в Канаде (Монреаль). Вы можете удалить аккаунт со всем содержимым в любой момент в Настройках.'],
    ['Анонимная статистика', 'Чтобы понимать, чем пользуются, Hoot считает события вроде «сыграна игра» или «поделились воспоминанием» — только итоги за день, никогда не кто это сделал.'],
    ['Сообщения об ошибках', 'Если что-то ломается, Hoot присылает нам короткую техническую заметку (что не сработало и на какой странице), чтобы мы исправили. В ней нет вашего имени, адреса или того, что вы написали.'],
    ['Пожертвования', 'Пожертвования обрабатывает Stripe. Hoot никогда не видит данные вашей карты.'],
    ['Ссылки и видео', 'Новости ведут на сайты изданий со своими правилами. Музыка играет через YouTube в режиме повышенной конфиденциальности.'],
  ],
  contact: 'Связаться с нами',
  contactBody: 'Вопросы, идеи, что-то не работает или просто хотите поздороваться — будем рады вашему письму.',
  contactEmail: 'Написать нам',
  updated: 'Обновлено в ноябре 2026 г.',
};

const hi: AboutText = {
  title: 'Hoot के बारे में',
  about: 'Hoot क्या है',
  aboutBody: [
    'Hoot जीवन के दूसरे पड़ाव का रोज़ का साथी है: आपके बीते सालों की यादें, दिमाग़ तेज़ रखने के लिए कुछ खेल, सेहत पर ताज़ा शोध, आज की ख़बरें और अंत में एक शांत विचार।',
    'यह सबके लिए मुफ़्त है और इसमें कोई विज्ञापन नहीं। इसे पसंद करने वालों के छोटे-छोटे दान से यह चलता है।',
    'Hoot कनाडा में स्वतंत्र रूप से बनाया जाता है। हम हर संदेश पढ़ते हैं, और Hoot की कई सुविधाएँ आपके सुझावों से आई हैं।',
  ],
  privacy: 'आपकी निजता',
  privacyIntro: 'सीधे शब्दों में: Hoot क्या रखता है और क्यों।',
  privacyPoints: [
    ['न विज्ञापन, न बिक्री, न ट्रैकिंग', 'Hoot कोई विज्ञापन नहीं दिखाता, आपकी जानकारी कभी बेचता या साझा नहीं करता, और ट्रैकिंग कुकीज़ का उपयोग नहीं करता।'],
    ['डिफ़ॉल्ट रूप से आपके डिवाइस पर', 'आपका जन्म वर्ष, देश, पसंद, सहेजी यादें, नोट्स और खेल इसी ब्राउज़र में, इसी डिवाइस पर रहते हैं।'],
    ['अगर आप खाता बनाते हैं', 'हम आपका ईमेल, यूज़रनेम और प्रगति रखते हैं ताकि वे दूसरे डिवाइस पर भी मिलें — कनाडा (मॉन्ट्रियल) में Google Firebase पर। आप कभी भी सेटिंग्स में खाता और उसका सब कुछ मिटा सकते हैं।'],
    ['गुमनाम गिनती', 'क्या इस्तेमाल होता है यह जानने के लिए Hoot गिनता है जैसे “एक खेल खेला गया” या “एक याद साझा की गई” — सिर्फ़ हर दिन का कुल, कभी यह नहीं कि किसने किया।'],
    ['त्रुटि रिपोर्ट', 'अगर कुछ बिगड़ता है, तो Hoot हमें एक छोटा तकनीकी नोट भेजता है (क्या और किस पेज पर बिगड़ा) ताकि हम ठीक कर सकें। उसमें आपका नाम, ईमेल या लिखा हुआ कभी नहीं होता।'],
    ['दान', 'दान Stripe के ज़रिए होते हैं। Hoot आपका कार्ड कभी नहीं देखता।'],
    ['लिंक और वीडियो', 'ख़बरें प्रकाशकों की अपनी वेबसाइटों पर ले जाती हैं, जिनके अपने नियम हैं। संगीत YouTube के निजता-सुरक्षित मोड में चलता है।'],
  ],
  contact: 'हमसे संपर्क करें',
  contactBody: 'सवाल, सुझाव, कुछ काम नहीं कर रहा, या बस नमस्ते कहना हो — हमें आपसे सुनकर ख़ुशी होगी।',
  contactEmail: 'हमें ईमेल करें',
  updated: 'नवंबर 2026 में अपडेट किया गया।',
};

const ne: AboutText = {
  title: 'Hoot बारे',
  about: 'Hoot के हो',
  aboutBody: [
    'Hoot जीवनको दोस्रो भागको दैनिक साथी हो: तपाईंले बिताएका वर्षहरूका सम्झना, दिमाग तिखो राख्न केही खेल, स्वास्थ्यबारे नयाँ अनुसन्धान, आजका समाचार र अन्त्यमा एउटा शान्त विचार।',
    'यो सबैका लागि निःशुल्क छ र यसमा विज्ञापन छैन। यसलाई मन पराउनेहरूको सानो दानले यो चल्छ।',
    'Hoot क्यानडामा स्वतन्त्र रूपमा बनाइन्छ। हामी हरेक सन्देश पढ्छौं, र Hoot का धेरै सुविधा तपाईंका सुझावबाट आएका हुन्।',
  ],
  privacy: 'तपाईंको गोपनीयता',
  privacyIntro: 'सरल शब्दमा: Hoot ले के राख्छ र किन।',
  privacyPoints: [
    ['न विज्ञापन, न बिक्री, न ट्र्याकिङ', 'Hoot ले विज्ञापन देखाउँदैन, तपाईंको जानकारी कहिल्यै बेच्दैन वा बाँड्दैन, र ट्र्याकिङ कुकी प्रयोग गर्दैन।'],
    ['पूर्वनिर्धारित रूपमा तपाईंकै डिभाइसमा', 'तपाईंको जन्म वर्ष, देश, रुचि, सेभ गरिएका सम्झना, नोट र खेल यही ब्राउजरमा, यही डिभाइसमा रहन्छन्।'],
    ['यदि तपाईंले खाता बनाउनुभयो भने', 'हामी तपाईंको इमेल, युजरनेम र प्रगति राख्छौं ताकि अरू डिभाइसमा पनि पाउनुहोस् — क्यानडा (मोन्ट्रियल) मा Google Firebase मा। तपाईं जुनसुकै बेला सेटिङमा खाता र त्यसको सबै मेटाउन सक्नुहुन्छ।'],
    ['बेनामी गणना', 'के प्रयोग हुन्छ भनेर बुझ्न Hoot ले “एउटा खेल खेलियो” वा “एउटा सम्झना सेयर गरियो” जस्ता कुरा गन्छ — हरेक दिनको जम्मा मात्र, कसले गर्‍यो कहिल्यै होइन।'],
    ['त्रुटि रिपोर्ट', 'केही बिग्रियो भने Hoot ले हामीलाई छोटो प्राविधिक नोट पठाउँछ (के र कुन पेजमा बिग्रियो) ताकि हामी मिलाउन सकौं। त्यसमा तपाईंको नाम, इमेल वा लेखेको कुरा कहिल्यै हुँदैन।'],
    ['दान', 'दान Stripe मार्फत हुन्छ। Hoot ले तपाईंको कार्ड कहिल्यै देख्दैन।'],
    ['लिंक र भिडियो', 'समाचारहरू प्रकाशकहरूको आफ्नै वेबसाइटमा लैजान्छन्, जसका आफ्नै नियम छन्। संगीत YouTube को गोपनीयता-सुरक्षित मोडमा बज्छ।'],
  ],
  contact: 'सम्पर्क गर्नुहोस्',
  contactBody: 'प्रश्न, सुझाव, केही नचलेको, वा नमस्ते भन्न मात्र — तपाईंबाट सुन्न पाउँदा हामी खुसी हुनेछौं।',
  contactEmail: 'इमेल गर्नुहोस्',
  updated: 'नोभेम्बर २०२६ मा अद्यावधिक।',
};

export const ABOUT: Record<Lang, AboutText> = { en, fr, es, de, it, pt, ru, hi, ne };
