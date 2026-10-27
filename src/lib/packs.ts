// Themed word packs (Hoot Plus) for the word games: crossword, word search,
// hangman and word scramble. Each pack has a deck in EVERY language, in the
// same "WORD|clue|year" format as wordbank.ts. Unlike the country decks these
// are shared across countries (the World Cup is the World Cup everywhere).
import type { Lang } from './data';

export const PACK_IDS = ['cinema', 'worldcup', 'space', 'music'] as const;
export type ThemePack = (typeof PACK_IDS)[number];

export interface Pack {
  icon: string; // one emoji shown on the chip
  name: Record<Lang, string>;
  decks: Record<Lang, string>;
}

export const PACKS: Record<ThemePack, Pack> = {
  // ------------------------------------------------------------ cinema
  cinema: {
    icon: '🎬',
    name: {
      en: 'Golden-age cinema',
      ru: 'Золотой век кино',
      fr: 'L’âge d’or du cinéma',
      de: 'Das goldene Kinozeitalter',
      it: 'Il cinema dei tempi d’oro',
      pt: 'A era de ouro do cinema',
      es: 'La edad de oro del cine',
      hi: 'सिनेमा का सुनहरा दौर',
      ne: 'सिनेमाको सुनौलो युग',
    },
    decks: {
      en: `
HOLLYWOOD|Californian home of the big film studios
OSCAR|Golden statuette handed out each spring
POPCORN|Buttery snack at the pictures
TICKET|You buy one at the box office
HITCHCOCK|Alfred, master of suspense and director of Psycho|1960
CHAPLIN|Charlie, the Little Tramp
MONROE|Marilyn, star of Some Like It Hot|1959
BOGART|Humphrey, star of Casablanca|1942
CASABLANCA|Film with Bogart and Ingrid Bergman|1942
HEPBURN|Audrey, star of Roman Holiday|1953
BRANDO|Marlon, the Godfather|1972
WAYNE|John, the Duke of Westerns
KELLY|Grace, actress who became Princess of Monaco|1956
FELLINI|Italian director of La Dolce Vita|1960
KUBRICK|Stanley, director of 2001: A Space Odyssey|1968
TECHNICOLOR|Famous colour process of the Wizard of Oz
CURTAIN|Hangs in front of the screen
TRAILER|Preview of coming attractions
USHER|Shows you to your seat
SEQUEL|A follow-up film
`,
      ru: `
ГОЛЛИВУД|Американский город кино
ОСКАР|Золотая статуэтка Киноакадемии
ПОПКОРН|Хрустящее лакомство в кинозале
БИЛЕТ|Его покупают в кассе кинотеатра
ХИЧКОК|Мастер саспенса, режиссёр «Психо»|1960
ЧАПЛИН|Чарли, неизменный бродяга
МОНРО|Мэрилин, звезда «В джазе только девушки»|1959
БОГАРТ|Хамфри, герой «Касабланки»|1942
КАСАБЛАНКА|Фильм с Богартом и Ингрид Бергман|1942
ХЕПБЕРН|Одри, героиня «Римских каникул»|1953
БРАНДО|Марлон, «Крёстный отец»|1972
ФЕЛЛИНИ|Итальянский режиссёр «Сладкой жизни»|1960
КУБРИК|Стэнли, создатель «Космической одиссеи 2001 года»|1968
ТАРКОВСКИЙ|Андрей, режиссёр «Соляриса»|1972
БОНДАРЧУК|Сергей, режиссёр «Войны и мира»|1966
РЯЗАНОВ|Эльдар, режиссёр «Карнавальной ночи»|1956
ГАЙДАЙ|Леонид, режиссёр «Бриллиантовой руки»|1968
ЭКРАН|Белое полотно в зале
РЕЖИССЁР|Тот, кто командует «Мотор!»
ХЛОПУШКА|Хлопает перед началом каждого дубля
`,
      fr: `
CINEMA|La salle où l’on projette les films
OSCAR|Statuette dorée du cinéma américain
POPCORN|Grignotage de la séance
HITCHCOCK|Alfred, maître du suspense|1960
CHAPLIN|Charlot, le célèbre vagabond
MONROE|Marilyn, star de « Certains l’aiment chaud »|1959
BOGART|Humphrey, héros de « Casablanca »|1942
GABIN|Jean, acteur de « La Grande Illusion »
DELON|Alain, héros de « Plein soleil »|1960
BARDOT|Brigitte, « Et Dieu… créa la femme »|1956
BELMONDO|Jean-Paul, « À bout de souffle »|1960
TRUFFAUT|François, « Les Quatre Cents Coups »|1959
TATI|Jacques, créateur de monsieur Hulot|1958
FERNANDEL|Acteur de « Don Camillo »|1952
DENEUVE|Catherine, « Les Parapluies de Cherbourg »|1964
CANNES|Ville de son festival du film
AFFICHE|Grande image à l’entrée du cinéma
FAUTEUIL|Siège rouge de la salle
ENTRACTE|Pause au milieu de la séance
HOLLYWOOD|Capitale américaine du cinéma
`,
      de: `
HOLLYWOOD|Kalifornische Filmstadt
OSCAR|Goldene Statue für die besten Filme
POPCORN|Knabberzeug im Kino
KINO|Hier läuft der Film auf großer Leinwand
HITCHCOCK|Alfred, Meister des Suspense, „Psycho“|1960
CHAPLIN|Charlie, der kleine Tramp
MONROE|Marilyn, Star in „Manche mögen’s heiß“|1959
BOGART|Humphrey, Held von „Casablanca“|1942
DIETRICH|Marlene, „Der blaue Engel“|1930
RÜHMANN|Heinz, „Die Feuerzangenbowle“|1944
ROMY|Schneider, die Sissi-Darstellerin|1955
SISSI|Kaiserin im Heimatfilm mit Romy Schneider|1955
SCHELL|Maximilian, Oscar für „Das Urteil von Nürnberg“|1962
FASSBINDER|Rainer Werner, „Angst essen Seele auf“|1974
HERZOG|Werner, Regisseur von „Fitzcarraldo“|1982
WENDERS|Wim, „Paris, Texas“|1984
LEINWAND|Darauf wird der Film projiziert
VORHANG|Hängt vor der Leinwand
KASSE|Dort kauft man die Karte
TRAILER|Vorschau auf kommende Filme
`,
      it: `
CINEMA|La sala dove si proiettano i film
OSCAR|Statuetta dorata di Hollywood
POPCORN|Lo spuntino della sala
HITCHCOCK|Alfred, maestro del brivido|1960
CHAPLIN|Charlot, il vagabondo
MONROE|Marilyn, star di « A qualcuno piace caldo »|1959
LOREN|Sophia, protagonista de « La ciociara »|1960
MASTROIANNI|Marcello, de « La dolce vita »|1960
FELLINI|Regista di « 8½ »|1963
VISCONTI|Luchino, regista de « Il Gattopardo »|1963
ROSSELLINI|Roberto, regista di « Roma città aperta »|1945
DESICA|Vittorio, regista di « Ladri di biciclette »|1948
LEONE|Sergio, maestro dello spaghetti western
MORRICONE|Ennio, musiche di « C’era una volta il West »|1968
TOTO|Il principe della risata
SORDI|Alberto, « Un americano a Roma »|1954
BIGLIETTO|Si compra alla cassa
SCHERMO|Qui scorre il film
SIPARIO|Si apre prima dello spettacolo
TRAILER|Anteprima del film
`,
      pt: `
CINEMA|Sala onde se projetam os filmes
OSCAR|Estatueta dourada de Hollywood
PIPOCA|Petisco de quem vai ao cinema
BILHETE|Compra-se na bilheteira
HITCHCOCK|Alfred, mestre do suspense|1960
CHAPLIN|Charlot, o vagabundo
MONROE|Marilyn, estrela de « Quanto Mais Quente Melhor »|1959
BOGART|Humphrey, herói de « Casablanca »|1942
CASABLANCA|Filme com Bogart e Ingrid Bergman|1942
HEPBURN|Audrey, de « Férias em Roma »|1953
FELLINI|Diretor italiano de « A Doce Vida »|1960
KUBRICK|Stanley, diretor de « 2001 »|1968
WAYNE|John, o Duque dos westerns
GRANDEOTELO|Grande ___, astro das chanchadas brasileiras
MAZZAROPI|Amácio, comediante caipira do cinema brasileiro
MIRANDA|Carmen, a Pequena Notável|1940
TELA|Onde o filme é projetado
CORTINA|Pende diante da tela
PLATEIA|Onde fica o público
CLAQUETE|Marca o início de cada cena
`,
      es: `
CINE|Sala donde se proyectan las películas
OSCAR|Estatuilla dorada de Hollywood
PALOMITAS|Lo que se come en la butaca
ENTRADA|Se compra en la taquilla
HITCHCOCK|Alfred, maestro del suspense|1960
CHAPLIN|Charlot, el vagabundo
MONROE|Marilyn, de « Con faldas y a lo loco »|1959
BOGART|Humphrey, héroe de « Casablanca »|1942
CASABLANCA|Película con Bogart e Ingrid Bergman|1942
BUNUEL|Luis, director de « Viridiana »|1961
CANTINFLAS|Mario Moreno, de « La vuelta al mundo en 80 días »|1956
INFANTE|Pedro, galán del cine mexicano|1950
ALMODOVAR|Pedro, de « Mujeres al borde de un ataque de nervios »|1988
MONTIEL|Sara, estrella de « El último cuplé »|1957
BERLANGA|Luis García, de « Bienvenido, Mister Marshall »|1953
FELLINI|Director de « La dolce vita »|1960
KUBRICK|Stanley, director de « 2001 »|1968
PANTALLA|Donde se ve la película
TELON|Cae al final de la función
TAQUILLA|Ventanilla donde se compran las entradas
`,
      hi: `
सिनेमा|फ़िल्म देखने का हॉल
टिकट|खिड़की से मिलता है, फ़िल्म देखने के लिए
पॉपकॉर्न|सिनेमा हॉल का कुरकुरा नाश्ता
कलाकार|पर्दे पर कला दिखाने वाला
हॉलीवुड|अमेरिका का फ़िल्मी शहर
बॉलीवुड|मुंबई की हिंदी फ़िल्म नगरी
राजकपूर|आवारा और श्री 420 के नायक|1955
नरगिस|मदर इंडिया की नायिका|1957
दिलीपकुमार|ट्रैजेडी किंग, मुग़ल-ए-आज़म के शहज़ादे|1960
देवआनंद|सदाबहार अभिनेता, गाइड के नायक|1965
मधुबाला|मुग़ल-ए-आज़म की अनारकली|1960
अभिनेता|पर्दे पर भूमिका निभाने वाला
निर्माता|फ़िल्म पर पैसा लगाने वाला
नायक|फ़िल्म का हीरो
कैमरा|फ़िल्म उतारने का यंत्र
पर्दा|जिस पर फ़िल्म दिखती है
इंटरवल|फ़िल्म के बीच की छुट्टी
निर्देशक|फ़िल्म का कप्तान
चैप्लिन|चार्ली, परदे का मशहूर आवारा
मीनाकुमारी|ट्रैजेडी क्वीन, पाकीज़ा की नायिका|1972
`,
      ne: `
सिनेमा|चलचित्र हेर्ने हल
टिकट|हलमा छिर्न चाहिने कागज
हलिउड|अमेरिकाको चलचित्र नगरी
बलिउड|मुम्बईको हिन्दी फिल्म उद्योग
पर्दा|जसमा फिल्म देखाइन्छ
निर्देशक|फिल्मको कप्तान
राजकपूर|आवारा र श्री ४२० का नायक|1955
दिलीपकुमार|ट्रेजेडी किङ भनिने अभिनेता|1960
देवआनन्द|सदाबहार अभिनेता, गाइडका नायक|1965
मधुबाला|मुगले आजमकी अनारकली|1960
नरगिस|मदर इन्डियाकी नायिका|1957
नायक|फिल्मको हिरो
आमा|नेपालको पहिलो चलचित्र|1964
नायिका|फिल्मकी हिरोइन
निर्माता|फिल्ममा लगानी गर्ने
सिनेमाघर|फिल्म हेर्ने ठाउँ
कलाकार|पर्दामा कला देखाउने
अभिनेता|पर्दामा भूमिका निभाउने
अभिनेत्री|पर्दामा भूमिका निभाउने महिला कलाकार
मनोरञ्जन|रमाइलो र मन बहलाउने कुरा
`,
    },
  },

  // ------------------------------------------------------------ world cup
  worldcup: {
    icon: '⚽',
    name: {
      en: 'World Cup',
      ru: 'Чемпионаты мира',
      fr: 'La Coupe du monde',
      de: 'Die Fußball-WM',
      it: 'I Mondiali di calcio',
      pt: 'A Copa do Mundo',
      es: 'El Mundial',
      hi: 'फ़ुटबॉल विश्व कप',
      ne: 'फुटबल विश्वकप',
    },
    decks: {
      en: `
PELE|Brazilian teenager who dazzled the world|1958
MARADONA|Argentine whose Hand of God shocked England|1986
CRUYFF|Johan, Dutch master of total football|1974
BECKENBAUER|Franz, the Kaiser, who lifted the Cup in 1974|1974
EUSEBIO|Portuguese star, top scorer in 1966|1966
YASHIN|Lev, the Soviet goalkeeper in black
ZIDANE|Scored twice with his head in the 1998 final|1998
WEMBLEY|London stadium of the 1966 final|1966
MARACANA|Rio stadium where Uruguay won in 1950|1950
AZTECA|Mexico City stadium of the 1970 and 1986 finals
HURST|Geoff, hat-trick hero of 1966|1966
MOORE|Bobby, England captain in 1966|1966
RIMET|Jules, whose name the first trophy carried
FONTAINE|Just, scored 13 goals in one tournament|1958
BAGGIO|Roberto, missed the decisive penalty in 1994|1994
TROPHY|The golden prize everyone dreams of
PENALTY|Spot kick
REFEREE|Man in the middle with a whistle
STRIKER|Player who scores the goals
OFFSIDE|Flag-raising offence
`,
      ru: `
ПЕЛЕ|Бразильский юноша, покоривший мир|1958
МАРАДОНА|Аргентинец с «рукой Бога»|1986
КРУИФ|Йохан, голландский мастер «тотального футбола»|1974
БЕКЕНБАУЭР|Франц, «Кайзер», поднявший кубок в 1974 году|1974
ЭУЗЕБИО|Португалец, лучший бомбардир ЧМ-1966|1966
ЯШИН|Лев, легендарный вратарь в чёрном
ЗИДАН|Дважды забил головой в финале 1998 года|1998
ВЕМБЛИ|Лондонский стадион финала 1966 года|1966
МАРАКАНА|Стадион в Рио, где в 1950 победил Уругвай|1950
АСТЕКА|Стадион в Мехико, где играли финалы 1970 и 1986
ХЕРСТ|Джефф, автор хет-трика в финале 1966|1966
РИМЕ|Жюль, чьё имя носил первый кубок
КУБОК|Золотой приз, о котором мечтают
ПЕНАЛЬТИ|Удар с одиннадцатиметровой отметки
СУДЬЯ|Человек со свистком на поле
СВИСТОК|Им судья останавливает игру
ГОЛ|То, ради чего играют
ФОНТЕН|Жюст, забивший 13 мячей на одном турнире|1958
БАДЖО|Роберто, не забивший пенальти в 1994 году|1994
ОФСАЙД|Положение «вне игры»
`,
      fr: `
PELE|Jeune prodige brésilien|1958
MARADONA|Argentin de la « main de Dieu »|1986
CRUYFF|Johan, maître du football total|1974
BECKENBAUER|Franz, le Kaiser, vainqueur en 1974|1974
EUSEBIO|Portugais, meilleur buteur en 1966|1966
YACHINE|Lev, gardien soviétique tout en noir
ZIDANE|Deux coups de tête en finale|1998
WEMBLEY|Stade londonien de la finale 1966|1966
MARACANA|Stade de Rio où l’Uruguay a gagné|1950
AZTECA|Stade de Mexico des finales 1970 et 1986
FONTAINE|Just, 13 buts en une seule Coupe|1958
KOPA|Raymond, meneur des Bleus en 1958|1958
PLATINI|Michel, demi-finale de Séville|1982
RIMET|Jules, dont le nom habillait le trophée
BAGGIO|Roberto, penalty raté en finale|1994
COUPE|Le trophée tant désiré
PENALTY|Tir depuis le point de réparation
ARBITRE|Homme au sifflet
SIFFLET|Il arrête le jeu
BUTEUR|Celui qui marque
`,
      de: `
PELE|Brasilianischer Teenager, der die Welt verzauberte|1958
MARADONA|Argentinier mit der „Hand Gottes“|1986
CRUYFF|Johan, Meister des Total Football|1974
BECKENBAUER|Franz, der Kaiser, Weltmeister 1974|1974
EUSEBIO|Portugiese, Torschützenkönig 1966|1966
JASCHIN|Lev, die Schwarze Spinne im Tor
ZIDANE|Zwei Kopfballtore im Finale|1998
WEMBLEY|Londoner Stadion des Finales 1966|1966
MARACANA|Stadion in Rio, 1950 siegte Uruguay|1950
AZTECA|Stadion in Mexiko-Stadt, Finale 1970 und 1986
HURST|Geoff, dreifacher Torschütze 1966|1966
RIMET|Jules, Namensgeber des ersten Pokals
POKAL|Das goldene Ziel aller Spieler
ELFMETER|Strafstoß vom Punkt
SCHIRI|Der Mann mit der Pfeife
PFIFF|Damit beendet er das Spiel
WALTER|Fritz, Kapitän beim Wunder von Bern|1954
RAHN|Helmut, schoss das 3:2 in Bern|1954
HERBERGER|Sepp, Trainer von 1954|1954
MÜLLER|Gerd, Siegtor im Finale 1974|1974
`,
      it: `
PELE|Il giovane fenomeno brasiliano|1958
MARADONA|L’argentino della « mano de Dios »|1986
CRUYFF|Johan, maestro del calcio totale|1974
BECKENBAUER|Franz, il Kaiser|1974
ROSSI|Paolo, capocannoniere nel 1982|1982
ZOFF|Dino, portiere e capitano nel 1982|1982
MEAZZA|Giuseppe, campione del mondo nel 1934 e 1938|1938
TARDELLI|Marco, l’urlo del gol in finale|1982
SCHILLACI|Totò, capocannoniere a Italia ’90|1990
BAGGIO|Roberto, rigore sbagliato nel 1994|1994
ZIDANE|Due colpi di testa in finale|1998
WEMBLEY|Stadio londinese della finale 1966|1966
MARACANA|Stadio di Rio, vinse l’Uruguay|1950
AZTECA|Stadio di Città del Messico
RIMET|Jules, il cui nome ornava il primo trofeo
COPPA|Il trofeo più desiderato
RIGORE|Tiro dal dischetto
ARBITRO|L’uomo col fischietto
FISCHIO|Ferma la partita
PORTIERE|Difende la porta
`,
      pt: `
PELE|Menino brasileiro que encantou o mundo|1958
MARADONA|Argentino da « mão de Deus »|1986
CRUYFF|Johan, mestre do futebol total|1974
BECKENBAUER|Franz, o Kaiser|1974
EUSEBIO|Português, artilheiro em 1966|1966
YASHIN|Lev, o goleiro soviético de preto
ZIDANE|Dois gols de cabeça na final|1998
WEMBLEY|Estádio londrino da final de 1966|1966
MARACANA|Estádio do Rio, onde o Uruguai venceu|1950
AZTECA|Estádio da Cidade do México
GARRINCHA|Alegria do Povo, estrela em 1962|1962
DIDI|Meia brasileiro campeão em 1958 e 1962|1958
ZAGALLO|Mário, campeão como jogador e como técnico|1970
JAIRZINHO|Furacão que marcou em todos os jogos de 1970|1970
RIMET|Jules, nome da primeira taça
TACA|Prêmio dourado dos sonhos
PENALTI|Cobrança da marca da cal
ARBITRO|Homem do apito
APITO|Interrompe o jogo
TRICAMPEAO|Brasil, depois de 1970
`,
      es: `
PELE|Joven brasileño que asombró al mundo|1958
MARADONA|Argentino de la « mano de Dios »|1986
CRUYFF|Johan, maestro del fútbol total|1974
BECKENBAUER|Franz, el Káiser|1974
EUSEBIO|Portugués, goleador en 1966|1966
YASHIN|Lev, el portero soviético de negro
ZIDANE|Dos cabezazos en la final|1998
WEMBLEY|Estadio londinense de la final de 1966|1966
MARACANA|Estadio de Río, ganó Uruguay|1950
AZTECA|Estadio de la Ciudad de México
KEMPES|Mario, goleador de Argentina en 1978|1978
SCHIAFFINO|Juan Alberto, marcó en el Maracanazo|1950
GHIGGIA|Alcides, autor del gol que silenció Maracaná|1950
BUTRAGUENO|Emilio, cuatro goles a Dinamarca|1986
FONTAINE|Just, 13 goles en un solo Mundial|1958
RIMET|Jules, nombre del primer trofeo
COPA|El trofeo soñado
PENALTI|Tiro desde los once metros
ARBITRO|El hombre del silbato
SILBATO|Detiene el juego
`,
      hi: `
पेले|ब्राज़ील का महान खिलाड़ी|1958
मैराडोना|अर्जेंटीना का हैंड ऑफ़ गॉड वाला सितारा|1986
क्राइफ़|हॉलैंड के टोटल फ़ुटबॉल के जादूगर|1974
बेकेनबाउर|जर्मनी के कैसर, कप्तान|1974
ज़िदान|1998 के फ़ाइनल में दो हेडर वाले|1998
वेम्बली|लंदन का स्टेडियम, फ़ाइनल 1966|1966
मराकाना|रियो का स्टेडियम, 1950 में उरुग्वे जीता|1950
यशिन|सोवियत संघ के काली पोशाक वाले गोलकीपर
उरुग्वे|1950 का विश्व चैंपियन|1950
फ़्रांस|1998 का विश्व चैंपियन|1998
विश्वकप|हर चार साल में होने वाला महा-टूर्नामेंट
गोल|खेल का असली मक़सद
पेनल्टी|ग्यारह मीटर से लगाई जाने वाली किक
रेफ़री|सीटी वाला निर्णायक
सीटी|खेल रोकने का इशारा
कप्तान|टीम का नेता
स्टेडियम|जहाँ दर्शक मैच देखते हैं
ट्रॉफ़ी|विजेता को मिलने वाला कप
गोलकीपर|गोल बचाने वाला खिलाड़ी
स्ट्राइकर|गोल दागने वाला खिलाड़ी
`,
      ne: `
पेले|ब्राजिलका महान खेलाडी|1958
माराडोना|हयान्ड अफ गड भन्ने अर्जेन्टिनी तारा|1986
क्रुइफ|हल्यान्डका टोटल फुटबलका जादूगर|1974
बेकेनबाउर|जर्मनीका कैसर, कप्तान|1974
जिदान|सन् १९९८ को फाइनलमा दुई हेडर गर्ने|1998
वेम्बली|लन्डनको स्टेडियम, १९६६ को फाइनल|1966
माराकाना|रियोको स्टेडियम, १९५० मा उरुग्वे जित्यो|1950
उरुग्वे|१९५० को विश्व च्याम्पियन|1950
फ्रान्स|१९९८ को विश्व च्याम्पियन|1998
ब्राजिल|१९७० मा तेस्रो पटक विश्वकप जित्ने देश|1970
विश्वकप|चार वर्षमा हुने ठूलो प्रतियोगिता
गोल|खेलको मुख्य उद्देश्य
पेनाल्टी|एघार मिटरबाट हान्ने किक
रेफ्री|सिटी बजाउने निर्णायक
सिटी|खेल रोक्ने संकेत
कप्तान|टोलीको नेता
स्टेडियम|दर्शकले खेल हेर्ने ठाउँ
ट्रफी|विजेताले पाउने कप
गोलकिपर|गोल जोगाउने खेलाडी
फुटबल|संसारको सबैभन्दा लोकप्रिय खेल
`,
    },
  },

  // ------------------------------------------------------------ space
  space: {
    icon: '🚀',
    name: {
      en: 'The space race',
      ru: 'Космическая гонка',
      fr: 'La conquête spatiale',
      de: 'Der Wettlauf ins All',
      it: 'La corsa allo spazio',
      pt: 'A corrida espacial',
      es: 'La carrera espacial',
      hi: 'अंतरिक्ष की दौड़',
      ne: 'अन्तरिक्षको दौड',
    },
    decks: {
      en: `
SPUTNIK|First artificial satellite|1957
LAIKA|Dog that orbited the Earth|1957
GAGARIN|Yuri, first person in space|1961
SHEPARD|Alan, first American in space|1961
GLENN|John, first American to orbit the Earth|1962
ARMSTRONG|Neil, first to walk on the Moon|1969
ALDRIN|Buzz, second man on the Moon|1969
COLLINS|Michael, stayed in orbit during Apollo 11|1969
EAGLE|Apollo 11 lunar module|1969
LEONOV|Alexei, first spacewalker|1965
KOROLEV|Sergei, chief designer of Soviet rockets
TELSTAR|Satellite that beamed TV across the Atlantic|1962
SATURN|Ringed planet, and the giant Apollo rocket
ROCKET|It lifts a spacecraft skyward
MOON|Apollo astronauts walked on it
ORBIT|Path around a planet
ASTRONAUT|American space traveller
COMET|Icy visitor with a glowing tail
GALAXY|Our Milky Way is one
TELESCOPE|Tool for gazing at the stars
`,
      ru: `
СПУТНИК|Первый искусственный спутник Земли|1957
ЛАЙКА|Собака, облетевшая Землю|1957
ГАГАРИН|Юрий, первый человек в космосе|1961
ТЕРЕШКОВА|Валентина, первая женщина в космосе|1963
ЛЕОНОВ|Алексей, первый вышедший в открытый космос|1965
КОРОЛЁВ|Сергей, главный конструктор ракет
ВОСТОК|Корабль Гагарина|1961
АРМСТРОНГ|Нил, первый человек на Луне|1969
ОЛДРИН|Базз, второй человек на Луне|1969
ТИТОВ|Герман, второй космонавт планеты|1961
БЕЛКА|Собака, вернувшаяся живой из космоса|1960
СТРЕЛКА|Подруга Белки по полёту|1960
РАКЕТА|Поднимает корабль к звёздам
ЛУНА|Спутник Земли
ОРБИТА|Путь вокруг планеты
КОСМОНАВТ|Человек в скафандре на орбите
КОМЕТА|Небесная гостья с хвостом
ГАЛАКТИКА|Огромное звёздное скопление
ТЕЛЕСКОП|Прибор для наблюдения за звёздами
БАЙКОНУР|Космодром в Казахстане
`,
      fr: `
SPOUTNIK|Premier satellite artificiel|1957
LAIKA|Chienne qui a tourné autour de la Terre|1957
GAGARINE|Youri, premier homme dans l’espace|1961
TERECHKOVA|Valentina, première femme dans l’espace|1963
LEONOV|Alexeï, premier homme à marcher dans l’espace|1965
ARMSTRONG|Neil, premier pas sur la Lune|1969
ALDRIN|Buzz, deuxième homme sur la Lune|1969
APOLLO|Programme américain vers la Lune
ASTERIX|Premier satellite français|1965
DIAMANT|Fusée française qui l’a lancé|1965
TELSTAR|Satellite des premières images transatlantiques|1962
FUSEE|Elle quitte la Terre en grondant
LUNE|Notre satellite naturel
ORBITE|Trajectoire autour d’un astre
ASTRONAUTE|Voyageur de l’espace américain
COMETE|Astre à longue chevelure
GALAXIE|Notre Voie lactée en est une
TELESCOPE|Instrument pour observer les étoiles
ECLIPSE|La Lune cache le Soleil
SATURNE|Planète aux anneaux
`,
      de: `
SPUTNIK|Erster künstlicher Erdsatellit|1957
LAIKA|Hündin im Orbit|1957
GAGARIN|Juri, erster Mensch im All|1961
TERESCHKOWA|Walentina, erste Frau im All|1963
LEONOW|Alexei, erster Weltraumspaziergänger|1965
KOROLJOW|Sergei, Chefkonstrukteur sowjetischer Raketen
ARMSTRONG|Neil, erster Mensch auf dem Mond|1969
ALDRIN|Buzz, zweiter Mann auf dem Mond|1969
APOLLO|US-Programm zum Mond
RAKETE|Sie bringt Raumschiffe hinauf
MOND|Unser natürlicher Begleiter
UMLAUFBAHN|Weg um einen Planeten
ASTRONAUT|Amerikanischer Raumfahrer
KOMET|Schweifstern
GALAXIE|Die Milchstraße ist eine
TELESKOP|Gerät für den Blick zu den Sternen
SATURN|Ringplanet und Mondrakete
JÄHN|Sigmund, erster Deutscher im All|1978
BRAUN|Wernher von, Konstrukteur der Saturn V|1969
MONDLANDUNG|Triumph von 1969|1969
`,
      it: `
SPUTNIK|Primo satellite artificiale|1957
LAIKA|La cagnetta in orbita|1957
GAGARIN|Yuri, primo uomo nello spazio|1961
TERESKOVA|Valentina, prima donna nello spazio|1963
LEONOV|Alexei, primo a passeggiare nello spazio|1965
KOROLEV|Sergei, progettista dei razzi sovietici
ARMSTRONG|Neil, primo uomo sulla Luna|1969
ALDRIN|Buzz, secondo uomo sulla Luna|1969
APOLLO|Programma americano per la Luna
TELSTAR|Satellite delle prime immagini transatlantiche|1962
RAZZO|Porta le navicelle in alto
LUNA|Il nostro satellite
ORBITA|Percorso attorno a un pianeta
ASTRONAUTA|Viaggiatore dello spazio
COMETA|Astro con la coda luminosa
GALASSIA|La Via Lattea ne è una
TELESCOPIO|Per osservare le stelle
ECLISSI|La Luna copre il Sole
SATURNO|Il pianeta con gli anelli
GALILEO|Puntò il telescopio al cielo nel 1609|1609
`,
      pt: `
SPUTNIK|Primeiro satélite artificial|1957
LAIKA|A cadelinha em órbita|1957
GAGARIN|Yuri, primeiro homem no espaço|1961
TERESHKOVA|Valentina, primeira mulher no espaço|1963
LEONOV|Alexei, primeiro a caminhar no espaço|1965
KOROLEV|Sergei, projetista dos foguetes soviéticos
ARMSTRONG|Neil, primeiro homem na Lua|1969
ALDRIN|Buzz, segundo homem na Lua|1969
APOLLO|Programa americano rumo à Lua
TELSTAR|Satélite das primeiras imagens transatlânticas|1962
FOGUETE|Leva a nave ao espaço
LUA|Nosso satélite natural
ORBITA|Caminho em torno de um planeta
ASTRONAUTA|Viajante espacial americano
COSMONAUTA|Viajante espacial soviético
COMETA|Astro de cauda luminosa
GALAXIA|A Via Láctea é uma
TELESCOPIO|Instrumento para ver as estrelas
ECLIPSE|A Lua esconde o Sol
SATURNO|Planeta dos anéis
`,
      es: `
SPUTNIK|Primer satélite artificial|1957
LAIKA|La perrita en órbita|1957
GAGARIN|Yuri, primer hombre en el espacio|1961
TERESHKOVA|Valentina, primera mujer en el espacio|1963
LEONOV|Alexei, primero en caminar en el espacio|1965
KOROLEV|Sergei, diseñador de los cohetes soviéticos
ARMSTRONG|Neil, primer hombre en la Luna|1969
ALDRIN|Buzz, segundo hombre en la Luna|1969
APOLLO|Programa estadounidense hacia la Luna
TELSTAR|Satélite de las primeras imágenes transatlánticas|1962
COHETE|Lleva la nave al espacio
LUNA|Nuestro satélite natural
ORBITA|Camino alrededor de un planeta
ASTRONAUTA|Viajero espacial estadounidense
COSMONAUTA|Viajero espacial soviético
COMETA|Astro de cola luminosa
GALAXIA|La Vía Láctea es una
TELESCOPIO|Instrumento para ver las estrellas
ECLIPSE|La Luna tapa el Sol
SATURNO|Planeta de los anillos
`,
      hi: `
स्पुतनिक|पहला कृत्रिम उपग्रह|1957
लाइका|अंतरिक्ष में गई कुतिया|1957
गागरिन|अंतरिक्ष में पहले इंसान|1961
तेरेश्कोवा|अंतरिक्ष की पहली महिला|1963
आर्मस्ट्रांग|चाँद पर पहला क़दम रखने वाले|1969
चाँद|धरती का प्राकृतिक उपग्रह
रॉकेट|यान को अंतरिक्ष में पहुँचाता है
कक्षा|ग्रह के चारों ओर का रास्ता
अंतरिक्ष|धरती के वायुमंडल से परे
धूमकेतु|पूँछ वाला आकाशीय मेहमान
दूरबीन|तारे देखने का यंत्र
आकाशगंगा|हमारी मंदाकिनी
ग्रहण|चाँद या सूरज पर पड़ने वाली छाया
शनि|छल्लों वाला ग्रह
मंगल|लाल ग्रह
राकेशशर्मा|अंतरिक्ष में जाने वाले पहले भारतीय|1984
आर्यभट|भारत का पहला उपग्रह|1975
इसरो|भारत की अंतरिक्ष एजेंसी|1969
उपग्रह|ग्रह के चक्कर लगाने वाला पिंड
चंद्रमा|चाँद का दूसरा नाम
`,
      ne: `
स्पुतनिक|पहिलो कृत्रिम उपग्रह|1957
लाइका|अन्तरिक्षमा पुगेकी कुकुर|1957
गागारिन|अन्तरिक्षमा पुग्ने पहिलो मानिस|1961
आर्मस्ट्रङ|चन्द्रमामा पहिलो पाइला राख्ने|1969
अपोलो|अमेरिकाको चन्द्रमा कार्यक्रम
चन्द्रमा|पृथ्वीको प्राकृतिक उपग्रह
रकेट|यानलाई आकाशमा पुर्‍याउँछ
कक्षा|ग्रहको वरिपरिको बाटो
अन्तरिक्ष|पृथ्वीको वायुमण्डल बाहिरको ठाउँ
धूमकेतु|पुच्छर भएको आकाशीय पाहुना
दूरबीन|ताराहरू हेर्ने यन्त्र
आकाशगंगा|हाम्रो छायापथ
ग्रहण|सूर्य वा चन्द्रमामा पर्ने छाया
शनि|औँठी भएको ग्रह
मंगल|रातो ग्रह
उपग्रह|ग्रहको परिक्रमा गर्ने पिण्ड
सूर्य|हाम्रो ताराे
तारा|रातमा आकाशमा टिलपिल गर्ने
ब्रह्माण्ड|ग्रह, तारा र आकाशगंगा सबै
टेरेश्कोभा|अन्तरिक्षमा पुग्ने पहिलो महिला|1963
`,
    },
  },

  // ------------------------------------------------------------ music
  music: {
    icon: '🎵',
    name: {
      en: 'Music legends',
      ru: 'Легенды музыки',
      fr: 'Légendes de la musique',
      de: 'Musiklegenden',
      it: 'Leggende della musica',
      pt: 'Lendas da música',
      es: 'Leyendas de la música',
      hi: 'संगीत के दिग्गज',
      ne: 'संगीतका दिग्गज',
    },
    decks: {
      en: `
ELVIS|The King of Rock and Roll|1956
BEATLES|The Fab Four from Liverpool|1963
DYLAN|Bob, singer of Blowin’ in the Wind|1963
SINATRA|Ol’ Blue Eyes
ARMSTRONG|Louis, trumpeter nicknamed Satchmo
HENDRIX|Jimi, set his guitar alight at Woodstock|1969
ABBA|Swedish quartet who won Eurovision with Waterloo|1974
BOWIE|David, alias Ziggy Stardust|1972
MARLEY|Bob, king of reggae|1974
PAVAROTTI|Luciano, the great Italian tenor
CALLAS|Maria, opera diva
GUITAR|Six strings, plucked or strummed
PIANO|Black and white keys
DRUMS|Beaten with sticks
TRUMPET|Brass horn of jazz
VIOLIN|Played with a bow
JUKEBOX|Coin-operated record player
VINYL|Black disc with grooves
MICROPHONE|Singer’s companion on stage
WALKMAN|Sony’s pocket cassette player|1979
`,
      ru: `
ЭЛВИС|Король рок-н-ролла|1956
БИТЛЗ|Четвёрка из Ливерпуля|1963
ДИЛАН|Боб, автор «Blowin’ in the Wind»|1963
СИНАТРА|Фрэнк, «Старые голубые глаза»
АРМСТРОНГ|Луи, трубач по прозвищу Сэчмо
ХЕНДРИКС|Джими, гитарист Вудстока|1969
АББА|Шведский квартет, победитель «Евровидения»|1974
БОУИ|Дэвид, он же Зигги Стардаст|1972
ПАВАРОТТИ|Лучано, великий итальянский тенор
КАЛЛАС|Мария, примадонна оперы
ВЫСОЦКИЙ|Владимир, поэт с гитарой
ПУГАЧЁВА|Алла, исполнительница «Арлекино»|1975
ГИТАРА|Семь струн у русской, шесть у любой
БАРАБАН|В него бьют палочками
СКРИПКА|Играют смычком
ГАРМОНЬ|Меха и кнопки, душа праздника
БАЯН|Родственник гармони
ПЛАСТИНКА|Чёрный диск с бороздками
МИКРОФОН|Спутник певца на сцене
МАГНИТОФОН|Бобинный аппарат для записи
`,
      fr: `
ELVIS|Le roi du rock and roll|1956
BEATLES|Le quatuor de Liverpool|1963
DYLAN|Bob, auteur de « Blowin’ in the Wind »|1963
SINATRA|Frank, « The Voice »
ARMSTRONG|Louis, trompettiste surnommé Satchmo
HENDRIX|Jimi, guitariste de Woodstock|1969
ABBA|Quatuor suédois vainqueur avec Waterloo|1974
BOWIE|David, alias Ziggy Stardust|1972
CALLAS|Maria, diva de l’opéra
PIAF|Édith, la Môme|1950
BREL|Jacques, « Ne me quitte pas »|1959
AZNAVOUR|Charles, « La Bohème »|1965
BRASSENS|Georges, « Les copains d’abord »|1964
GUITARE|Six cordes à pincer
PIANO|Touches noires et blanches
BATTERIE|On la frappe avec des baguettes
TROMPETTE|Cuivre du jazz
VIOLON|Se joue avec un archet
ACCORDEON|Instrument du bal musette
TOURNEDISQUE|Il fait tourner le vinyle
`,
      de: `
ELVIS|Der King des Rock ’n’ Roll|1956
BEATLES|Die Pilzköpfe aus Liverpool|1963
DYLAN|Bob, Sänger von „Blowin’ in the Wind“|1963
SINATRA|Frank, „Ol’ Blue Eyes“
ARMSTRONG|Louis, Trompeter namens Satchmo
HENDRIX|Jimi, Gitarrengott in Woodstock|1969
ABBA|Schwedisches Quartett mit „Waterloo“|1974
BOWIE|David, alias Ziggy Stardust|1972
PAVAROTTI|Luciano, großer Tenor
CALLAS|Maria, Operndiva
KRAFTWERK|Düsseldorfer Pioniere der elektronischen Musik|1974
JÜRGENS|Udo, „Griechischer Wein“|1974
GITARRE|Sechs Saiten zum Zupfen
KLAVIER|Schwarze und weiße Tasten
SCHLAGZEUG|Wird mit Stöcken gespielt
TROMPETE|Blechblasinstrument des Jazz
GEIGE|Wird mit dem Bogen gestrichen
SCHALLPLATTE|Schwarze Scheibe mit Rillen
MIKROFON|Begleiter des Sängers
POSAUNE|Blasinstrument mit Zug
`,
      it: `
ELVIS|Il re del rock and roll|1956
BEATLES|Il quartetto di Liverpool|1963
DYLAN|Bob, « Blowin’ in the Wind »|1963
SINATRA|Frank, « The Voice »
ARMSTRONG|Louis, trombettista detto Satchmo
HENDRIX|Jimi, chitarrista a Woodstock|1969
BOWIE|David, alias Ziggy Stardust|1972
PAVAROTTI|Luciano, grande tenore
CALLAS|Maria, regina dell’opera
MODUGNO|Domenico, « Nel blu dipinto di blu »|1958
MINA|La Tigre di Cremona
BATTISTI|Lucio, « Emozioni »|1970
CHITARRA|Sei corde da pizzicare
PIANOFORTE|Tasti bianchi e neri
BATTERIA|Si suona con le bacchette
TROMBA|Ottone del jazz
VIOLINO|Si suona con l’archetto
FISARMONICA|Strumento a mantice
GIRADISCHI|Fa girare il vinile
MICROFONO|Compagno del cantante
`,
      pt: `
ELVIS|O Rei do rock|1956
BEATLES|O quarteto de Liverpool|1963
DYLAN|Bob, de « Blowin’ in the Wind »|1963
SINATRA|Frank, « A Voz »
ARMSTRONG|Louis, trompetista apelidado Satchmo
HENDRIX|Jimi, guitarrista de Woodstock|1969
BOWIE|David, alias Ziggy Stardust|1972
CALLAS|Maria, diva da ópera
JOBIM|Tom, de « Garota de Ipanema »|1962
GILBERTO|João, voz e violão da bossa nova|1958
CAETANO|Veloso, símbolo do Tropicalismo|1968
AMALIA|Rodrigues, rainha do fado
FADO|Canção de Lisboa
GUITARRA|Seis cordas para dedilhar
BATERIA|Toca-se com baquetas
TROMPETE|Metal do jazz
VIOLINO|Toca-se com arco
VITROLA|Toca os discos antigos
MICROFONE|Companheiro do cantor
SAMBA|Ritmo do carnaval
`,
      es: `
ELVIS|El rey del rock and roll|1956
BEATLES|El cuarteto de Liverpool|1963
DYLAN|Bob, de « Blowin’ in the Wind »|1963
SINATRA|Frank, « La Voz »
ARMSTRONG|Louis, trompetista apodado Satchmo
HENDRIX|Jimi, guitarrista en Woodstock|1969
BOWIE|David, alias Ziggy Stardust|1972
PAVAROTTI|Luciano, gran tenor
CALLAS|Maria, diva de la ópera
GARDEL|Carlos, el zorzal criollo del tango
SOSA|Mercedes, la voz de « Gracias a la vida »|1971
PIAZZOLLA|Astor, creador del nuevo tango|1960
SANTANA|Carlos, guitarrista en Woodstock|1969
GUITARRA|Seis cuerdas para rasguear
PIANO|Teclas blancas y negras
BATERIA|Se toca con baquetas
TROMPETA|Metal del jazz
VIOLIN|Se toca con arco
TOCADISCOS|Hace girar el vinilo
MARIACHI|Música de trompetas y guitarrón
`,
      hi: `
तार|वाद्य में कसा धागा
संगीत|सुरों की कला
लता|स्वर कोकिला, मंगेशकर
रफ़ी|मोहम्मद ___, अमर गायक
किशोर|___ कुमार, हरफ़नमौला गायक
गीतकार|गीत के बोल लिखने वाला
गायक|गीत गाने वाला कलाकार
रविशंकर|सितार के जादूगर|1969
सितार|रविशंकर का वाद्य
तबला|दो हाथों से बजने वाली जोड़ी
हारमोनियम|धौंकनी वाला बाजा
कलाकार|मंच पर कला दिखाने वाला
गिटार|छह तारों वाला वाद्य
संगीतकार|धुनें रचने वाला
वायलिन|गज से बजता है
तानसेन|अकबर के दरबार के महान गायक
ग्रामोफ़ोन|रिकॉर्ड बजाने की मशीन
स्वर|गायक की आवाज़
सुर|संगीत की बुनियाद, सा रे ग म
संतूर|कश्मीर का तारों वाला वाद्य
`,
      ne: `
नारायणगोपाल|स्वर सम्राट
अरुणालामा|नेपाली गायिका
तारादेवी|नेपाली लोकगीतकी लोकप्रिय गायिका
अम्बरगुरुङ|राष्ट्रिय गानका संगीतकार|2007
सारङ्गी|चार तारको लोकवाद्य
मादल|पहाडी गीतको ताल दिने बाजा
कलाकार|मञ्चमा कला देखाउने
हार्मोनियम|धौँकनी भएको बाजा
गिटार|छ तारको वाद्य
गायक|गीत गाउने मानिस
तबला|दुई हातले बजाइने जोडी
सितार|तार भएको भारतीय वाद्य
रेडियो|गीत सुनाउने पुरानो साधन
रेकर्ड|गोलो कालो तावा
संगीतकार|धुन बनाउने
गीतकार|गीतका शब्द लेख्ने
लता|स्वर कोकिला
रफी|मोहम्मद ___, अमर गायक
किशोर|___ कुमार, लोकप्रिय गायक
तार|बाजामा कसिने धागो
`,
    },
  },
};
