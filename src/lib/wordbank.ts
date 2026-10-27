// Word bank for the word games (crossword, word search, hangman, scramble).
//
// Words and clues are written in the person's chosen language and drawn from
// the culture of their birth country, filtered to the years they were young.
// Each deck line is "WORD|clue|year" (year optional = timeless).
//
// Lookup for (language, country):
//   1. the country's deck in that language, if one exists
//   2. plus the everyday deck in that language (radios, stamps, trams…)
// So a Russian speaker born in the USSR gets Soviet words in Russian; an
// English speaker born in the USSR gets Soviet words in English; a language
// with no deck for that country still gets everyday words in its own language
// (never another country's pop culture).
import type { Lang } from './data';
import { MORE } from './wordbank-more';
import { EXTRA } from './words';
import { PACKS, PACK_IDS, type ThemePack } from './packs';

export interface Entry {
  word: string; // normalised, as it appears in the grid
  units: string[]; // one per grid cell (a letter, or a Devanagari syllable)
  clue: string;
  year?: number;
}

type Deck = string;

// ---------------------------------------------------------------- everyday
const EVERYDAY: Record<Lang, Deck> = {
  en: `
RADIO|Families gathered round it before television
TYPEWRITER|Machine with keys, a ribbon and a bell
TELEGRAM|Urgent message brought by a messenger
RECORD|Vinyl disc played on a turntable
STAMP|You licked it before mailing a letter
ROTARY|Kind of telephone with a dial
MILKMAN|He left glass bottles on your doorstep
MARBLES|Glass balls children played with in the schoolyard
CAMERA|You took it on holiday with a roll of film
TELEVISION|The new box in the living room
TRAM|Streetcar running on rails
POSTCARD|Picture card sent home from holiday
KITE|Flown on a windy day on a long string
BICYCLE|Two wheels, pedals and a bell
SKIPPING|___ rope, a playground game
`,
  ru: `
РАДИО|Его слушала вся семья до телевизора
ТЕЛЕГРАММА|Срочное сообщение, которое приносил почтальон
ПЛАСТИНКА|Её ставили на проигрыватель
ПРОИГРЫВАТЕЛЬ|Аппарат для пластинок
МАРКА|Её наклеивали на конверт
ТЕЛЕФОН|Аппарат с диском в коридоре
ТРАМВАЙ|Ходит по рельсам и звенит
ОТКРЫТКА|Её посылали к празднику
ФОТОАППАРАТ|«Зенит» или «Смена», например
ТЕЛЕВИЗОР|Чудо-ящик в гостиной
ВЕЛОСИПЕД|Два колеса, педали и звонок
КЛАССИКИ|Игра: прыгать по клеткам, начерченным мелом
СКАКАЛКА|Верёвка для прыжков во дворе
ПРИМУС|Керосиновая плитка
ЗМЕЙ|Воздушный ___ на длинной нитке
`,
  fr: `
RADIO|Toute la famille l'écoutait avant la télévision
TELEGRAMME|Message urgent apporté par un facteur
DISQUE|Vinyle posé sur le tourne-disque
MACHINE|___ à écrire, avec un ruban et une sonnette
TIMBRE|On le collait sur l'enveloppe
CADRAN|Téléphone à ___, qu'on tournait du doigt
TRAMWAY|Il roule sur des rails en ville
CARTEPOSTALE|Envoyée de vacances
BILLES|Petites boules de verre de la cour d'école
TELEVISION|La nouvelle boîte du salon
VELO|Deux roues, un guidon et une sonnette
MARELLE|Jeu où l'on saute dans des cases à la craie
CERFVOLANT|Il vole au bout d'une ficelle
LAITIER|Il déposait les bouteilles devant la porte
APPAREIL|___ photo, emporté en vacances
`,
  de: `
RADIO|Vor dem Fernsehen hörte die Familie es gemeinsam
TELEGRAMM|Eilige Nachricht, vom Boten gebracht
SCHALLPLATTE|Sie drehte sich auf dem Plattenspieler
SCHREIBMASCHINE|Gerät mit Tasten, Farbband und Klingel
BRIEFMARKE|Man leckte sie, bevor man den Brief einwarf
WÄHLSCHEIBE|Damit wählte man am Telefon
STRASSENBAHN|Sie fährt auf Schienen durch die Stadt
POSTKARTE|Gruß aus dem Urlaub
MURMELN|Glaskugeln für den Schulhof
FERNSEHER|Der neue Kasten im Wohnzimmer
FAHRRAD|Zwei Räder, Pedale und eine Klingel
HÜPFKASTEN|Spiel mit Kreidekästchen auf dem Gehweg
DRACHEN|Im Herbst lässt man ihn steigen
MILCHMANN|Er brachte Flaschen bis vor die Tür
KAMERA|Mit Film im Urlaub dabei
KINO|Samstags lief dort der Film
ZEITUNG|Sie lag jeden Morgen vor der Tür
FÜLLER|Damit schrieb man in der Schule
TINTE|Blau, im Fass oder in der Patrone
ROLLER|Kinder fuhren damit über den Hof
PUPPE|Spielzeug mit Kleid und Zöpfen
BRIEF|Er kam mit der Post
SCHULRANZEN|Den trug man auf dem Rücken
`,
  it: `
RADIO|La famiglia lo ascoltava prima della televisione
TELEGRAMMA|Messaggio urgente portato dal postino
DISCO|Si metteva sul giradischi
GIRADISCHI|Apparecchio per i dischi in vinile
FRANCOBOLLO|Si incollava sulla busta
GETTONE|Serviva per il telefono pubblico
TRAM|Corre sui binari in città
CARTOLINA|Si spediva dalle vacanze
BIGLIE|Palline di vetro del cortile
TELEVISIONE|La nuova scatola in salotto
BICICLETTA|Due ruote, pedali e campanello
CAMPANA|Gioco da saltare nei riquadri di gesso
AQUILONE|Vola legato a un filo
LATTAIO|Portava le bottiglie fino alla porta
MACCHINA|___ da scrivere, con nastro e campanello
`,
  pt: `
RADIO|A família ouvia junta antes da televisão
TELEGRAMA|Mensagem urgente entregue pelo carteiro
DISCO|Tocava na vitrola
VITROLA|Aparelho de tocar discos
SELO|Colava-se no envelope
FICHA|Usada no telefone público
BONDE|Corria sobre trilhos na cidade
POSTAL|Cartão enviado das férias
BOLINHA|___ de gude, jogo de criança
TELEVISAO|A nova caixa da sala
BICICLETA|Duas rodas, pedais e campainha
AMARELINHA|Brincadeira de pular nas casas de giz
PIPA|Sobe ao vento presa num fio
LEITEIRO|Deixava garrafas na porta
MAQUINA|___ de escrever, com fita e sininho
`,
  es: `
RADIO|La familia la escuchaba antes de la tele
TELEGRAMA|Mensaje urgente que traía el cartero
DISCO|Se ponía en el tocadiscos
TOCADISCOS|Aparato para los discos de vinilo
ESTAMPILLA|Se pegaba en el sobre
TELEFONO|Aparato de disco en el pasillo
TRANVIA|Corre sobre rieles por la ciudad
POSTAL|Tarjeta enviada desde las vacaciones
CANICAS|Bolitas de vidrio del recreo
TELEVISOR|La nueva caja de la sala
BICICLETA|Dos ruedas, pedales y timbre
RAYUELA|Juego de saltar casillas de tiza
COMETA|Vuela atada a un hilo
LECHERO|Dejaba las botellas en la puerta
MAQUINA|___ de escribir, con cinta y campanilla
`,
  hi: `
रेडियो|टीवी से पहले पूरा परिवार इसे सुनता था
तार|ज़रूरी ख़बर, डाकिया लाता था
टिकट|डाक ___, लिफ़ाफ़े पर चिपकाते थे
पोस्टकार्ड|पीला कार्ड जिस पर चिट्ठी लिखते थे
टेलीविज़न|बैठक का नया डिब्बा
साइकिल|दो पहिए, पैडल और घंटी
पतंग|मकर संक्रांति पर उड़ाई जाती है
कंचे|काँच की गोलियाँ, गली का खेल
लालटेन|मिट्टी के तेल से जलने वाली रोशनी
ग्रामोफ़ोन|रिकॉर्ड बजाने की मशीन
टाइपराइटर|चाबियों और रिबन वाली मशीन
लट्टू|डोरी से घुमाया जाने वाला खिलौना
गिल्लीडंडा|लकड़ी के दो टुकड़ों का खेल
ताँगा|घोड़े से खींची जाने वाली सवारी
`,
  ne: `
रेडियो|टिभीअघि पूरै परिवार यही सुन्थ्यो
हुलाक|चिठी पठाउने ठाउँ
टिकट|हुलाक ___, खाममा टाँसिन्थ्यो
चिठी|हातले लेखेर पठाइने सन्देश
टेलिभिजन|बैठकको नयाँ बाकस
साइकल|दुई पाङ्ग्रा, प्याडल र घण्टी
चङ्गा|दसैँमा उडाइने
गुच्चा|सिसाका गोली, गल्लीको खेल
लालटिन|मट्टितेलले बल्ने बत्ती
टुकी|मट्टितेलको सानो बत्ती
टाइपराइटर|कुञ्जी र रिबन भएको मेसिन
पिङ|दसैँमा बाँसले बनाइने झुलुङ्गो
डण्डीबियो|काठका दुई टुक्राको खेल
कोदो|मिलको रोटी बनाइने अन्न
`,
};

// ---------------------------------------------------------------- countries
const COUNTRY: Record<string, Partial<Record<Lang, Deck>>> = {
  su: {
    ru: `
ГАГАРИН|Первый человек в космосе|1961
СПУТНИК|Первый искусственный спутник Земли|1957
ЛАЙКА|Собака, облетевшая Землю|1957
ТЕРЕШКОВА|Первая женщина в космосе|1963
ВОСТОК|Корабль Гагарина|1961
ЧЕБУРАШКА|Ушастый друг крокодила Гены|1969
ГЕНА|Крокодил, игравший на гармошке|1969
ПОГОДИ|«Ну, ___!» — кричал волк зайцу|1969
ЖИГУЛИ|Народное имя «копейки» ВАЗ-2101|1970
МОСКВИЧ|Автомобиль московского завода|1950
ВЫСОЦКИЙ|Поэт и актёр с хриплым голосом|1965
ПУГАЧЕВА|«Миллион алых роз» пела она|1982
МИШКА|Талисман Олимпиады-80|1980
ОЛИМПИАДА|Москва принимала её в 1980 году|1980
ПИОНЕР|Школьник в красном галстуке
КОПЕЙКА|Пять таких стоил проезд в метро
ТЕТРИС|Игру с падающими фигурками придумали в Москве|1984
ГАЗИРОВКА|Её наливал автомат за три копейки
ТРЕТЬЯК|Легендарный вратарь сборной|1972
ИРОНИЯ|«___ судьбы, или С лёгким паром!»|1975
БРЕЖНЕВ|Генсек с 1964 по 1982 год|1964
ХРУЩЕВ|Первый секретарь ЦК до 1964 года, «оттепель»|1955
КВАС|Его продавали из жёлтой бочки
АВОСЬКА|Сетчатая сумка «на всякий случай»
ЭСКИМО|Мороженое на палочке
БАМ|Великая стройка века в Сибири|1974
МИР|Орбитальная станция|1986
ЛУНОХОД|Советский самоходный аппарат на Луне|1970
`,
    en: `
GAGARIN|First person in space|1961
SPUTNIK|First artificial satellite|1957
LAIKA|Dog that orbited the Earth|1957
TERESHKOVA|First woman in space|1963
VOSTOK|Gagarin’s spacecraft|1961
CHEBURASHKA|Big-eared friend of Gena the crocodile|1969
ZHIGULI|Popular name for the Lada VAZ-2101|1970
MOSKVICH|Car from a Moscow factory|1950
VYSOTSKY|Poet and actor with a husky voice|1965
PUGACHEVA|She sang “A Million Scarlet Roses”|1982
MISHA|Bear mascot of the 1980 Olympics|1980
MOSCOW|Host city of the 1980 Olympics|1980
PIONEER|Schoolchild in a red neckerchief
KOPECK|Five of these paid a Metro ride
TETRIS|Falling-block game invented in Moscow|1984
TRETIAK|Legendary Soviet goalkeeper|1972
BREZHNEV|Party leader 1964 to 1982|1964
KHRUSHCHEV|Party leader until 1964|1955
KVASS|Bread drink sold from yellow barrels
ESKIMO|Ice cream on a stick
LUNOKHOD|Soviet rover on the Moon|1970
VOLGA|Big river, and a big car for officials
`,
  },
  ca: {
    en: `
EXPO|Montreal’s 1967 world’s fair: ___ 67|1967
CENTENNIAL|Canada’s 100th birthday year|1967
HOCKEY|Canada’s great winter passion
HENDERSON|Paul who scored the winning goal in 1972|1972
GRETZKY|“The Great One” of hockey|1979
LOONIE|Canada’s dollar coin|1987
TOONIE|Canada’s two-dollar coin|1996
TRUDEAU|Prime Minister of 1968’s “mania”|1968
PEARSON|Lester who won the Nobel Peace Prize|1957
ARROW|Avro ___, the cancelled Canadian jet|1959
ANKA|Paul who sang “Diana”|1957
LIGHTFOOT|Gordon who sang of the Edmund Fitzgerald|1976
MURRAY|Anne who sang “Snowbird”|1970
DRESSUP|Mr. ___, TV host with the Tickle Trunk|1967
CANADARM|Robotic arm on the Space Shuttle|1981
MOUNTIE|Red-coated police officer on horseback
HORTONS|Tim ___, coffee and doughnuts|1964
FLAG|The maple leaf ___ was raised in 1965|1965
MONTREAL|Host city of the 1976 Olympics|1976
`,
    fr: `
EXPO|Exposition universelle de Montréal|1967
HOCKEY|La grande passion de l'hiver
RICHARD|Maurice « Rocket » ___, idole du Canadien|1955
LAFLEUR|Guy, l'ailier vedette du Canadien|1975
VIGNEAULT|Gilles, auteur de « Mon pays »|1964
CHARLEBOIS|Robert, chanteur de « Lindberg »|1968
OLYMPIQUES|Montréal a accueilli les Jeux ___ en 1976|1976
LEVESQUE|René, fondateur du Parti québécois|1968
TRUDEAU|Premier ministre de la « trudeaumanie »|1968
DION|Céline, découverte toute jeune|1981
CANADIEN|Le club de hockey de Montréal
POUTINE|Frites, fromage en grains et sauce
ERABLE|Arbre dont on tire le sirop
CABANE|___ à sucre, au printemps
BOBINO|Émission jeunesse avec Bobinette|1957
PASSEPARTOUT|Émission jeunesse de Télé-Québec|1977
HUARD|Surnom de la pièce d'un dollar|1987
`,
  },
  us: {
    en: `
ELVIS|The King of Rock and Roll|1956
APOLLO|US space program that reached the Moon|1969
MOON|Apollo 11 landed here|1969
ARMSTRONG|Neil, first to walk on the Moon|1969
HULA|___ hoop, the 1958 craze|1958
TWIST|Chubby Checker’s dance craze|1960
JUKEBOX|Coin-operated record player at the diner
DRIVEIN|Outdoor movie watched from your car
SLINKY|Spring toy that walked down stairs|1945
KENNEDY|President elected in 1960|1960
WOODSTOCK|1969 music festival in New York State|1969
DISNEYLAND|Theme park opened in California|1955
LUCY|“I Love ___”, the 1950s sitcom|1951
CRONKITE|Walter, the CBS anchorman|1962
MUSTANG|Ford’s 1964 pony car|1964
BARBIE|Doll introduced by Mattel|1959
FRISBEE|Flying plastic disc|1957
MOTOWN|Detroit record label of the Supremes|1960
SINATRA|“Ol’ Blue Eyes”|1950
ATARI|Maker of the game Pong|1972
SODA|Fizzy drink from the fountain
`,
  },
  gb: {
    en: `
BEATLES|The Fab Four from Liverpool|1963
CORONATION|Elizabeth II’s was televised in 1953|1953
MINI|Small car launched in 1959|1959
ROUTEMASTER|London’s red double-decker bus|1956
BOWIE|David, alias Ziggy Stardust|1972
WEMBLEY|England won the World Cup there|1966
MOORE|Bobby, England’s 1966 captain|1966
CONCORDE|Supersonic airliner, first flew 1969|1969
TWIGGY|Famous sixties model|1966
MARMITE|Love-it-or-hate-it spread
BLUEPETER|Children’s TV show with famous badges|1958
DALEK|Doctor Who’s pepper-pot enemy|1963
THATCHER|First woman Prime Minister|1979
BEANO|Comic with Dennis the Menace|1951
RATIONING|Food ___ finally ended in 1954|1954
STONES|The Rolling ___|1963
QUEEN|Band of Freddie Mercury|1975
SHILLING|Coin worth twelve pence before 1971
DECIMAL|Britain went ___ in 1971|1971
`,
  },
  fr: {
    fr: `
DEGAULLE|Général, président de 1959 à 1969|1959
CONCORDE|Avion supersonique franco-britannique|1969
DEUCHE|Surnom de la 2 CV Citroën
ASTERIX|Petit Gaulois né dans Pilote|1959
PIAF|Édith, « La Vie en rose »|1950
BREL|Jacques, « Ne me quitte pas »|1959
HALLYDAY|Johnny, l'idole des jeunes|1961
YEYE|Les années « ___ » et Salut les copains|1962
MAI|___ 68, les pavés et les barricades|1968
TINTIN|Reporter à la houppe
MINITEL|Petit terminal des PTT|1982
PLATINI|Michel, numéro 10 des Bleus|1980
GAINSBOURG|Serge, « Le Poinçonneur des Lilas »|1958
SOLEX|Vélo noir à petit moteur
BOURVIL|Acteur de « La Grande Vadrouille »|1966
FRANC|Le nouveau ___ arrive en 1960|1960
TGV|Train à grande vitesse|1981
DALIDA|« Bambino », « Paroles, paroles »|1956
CLOCLO|Surnom de Claude François|1965
`,
    en: `
DEGAULLE|General, president from 1959 to 1969|1959
CONCORDE|Anglo-French supersonic airliner|1969
CITROEN|Maker of the 2CV and the DS
ASTERIX|Little Gaul of the comics|1959
PIAF|Édith, “La Vie en rose”|1950
BREL|Jacques, “Ne me quitte pas”|1959
HALLYDAY|Johnny, France’s Elvis|1961
TINTIN|Boy reporter with a quiff
MINITEL|France’s little online terminal|1982
PLATINI|Michel, number 10 for France|1980
GAINSBOURG|Serge, singer and songwriter|1958
TGV|France’s high-speed train|1981
DALIDA|She sang “Bambino”|1956
FRANC|France’s currency before the euro
BAGUETTE|Long loaf from the boulangerie
`,
  },
  de: {
    de: `
KÄFER|Volkswagen mit der runden Form
ADENAUER|Erster Bundeskanzler|1949
BERN|„Das Wunder von ___“|1954
BECKENBAUER|„Der Kaiser“ des Fußballs|1966
MÜLLER|Gerd, „Der Bomber der Nation“|1970
NENA|„99 Luftballons“|1983
KRAFTWERK|Band von „Autobahn“|1974
TATORT|Sonntagskrimi im Ersten|1970
DERRICK|Oberinspektor im ZDF|1974
BRANDT|Willy, Kniefall in Warschau|1970
HARIBO|Macht Kinder froh
TOAST|„___ Hawaii“, der Partyklassiker|1955
MARK|Die D-___|1948
OLYMPIA|Spiele in München|1972
WIRTSCHAFTSWUNDER|Der Aufschwung der 1950er|1955
MAINZELMÄNNCHEN|Kleine Kerle zwischen der ZDF-Werbung|1963
SCHLAGER|Heintje, Roy Black, Udo Jürgens
`,
    en: `
BEETLE|Volkswagen’s round little car
ADENAUER|First West German chancellor|1949
BERN|The “Miracle of ___” World Cup win|1954
BECKENBAUER|“Der Kaiser” of football|1966
NENA|“99 Luftballons”|1983
KRAFTWERK|Electronic band of “Autobahn”|1974
BRANDT|Willy, chancellor from 1969|1969
HARIBO|Maker of gummy bears
MARK|The Deutsche ___|1948
MUNICH|Host city of the 1972 Olympics|1972
AUTOBAHN|Motorway with no speed limit
`,
  },
  dd: {
    de: `
TRABANT|Der „Trabi“ aus Zwickau|1958
WARTBURG|Auto aus Eisenach|1956
HONECKER|SED-Chef ab 1971|1971
ULBRICHT|Erster Mann der SED bis 1971|1950
PIONIER|Kind mit blauem Halstuch
KONSUM|Laden der Konsumgenossenschaft
SANDMANN|„Unser ___“, Gute-Nacht-Gruß im Fernsehen|1959
PUHDYS|Rockband aus Ost-Berlin|1969
SPREEWALD|Gurken aus dem ___
JÄHN|Sigmund, erster Deutscher im All|1978
MAUER|1961 gebaut, 1989 gefallen|1961
VITACOLA|Die Cola aus dem Osten|1958
PLATTENBAU|Wohnblock aus Fertigteilen|1970
WENDE|Der Umbruch 1989|1989
MOSAIK|Comic mit den Digedags|1955
KARAT|Band von „Über sieben Brücken“|1979
SCHWALBE|Moped von Simson|1964
`,
    en: `
TRABANT|The “Trabi” from Zwickau|1958
WARTBURG|Car from Eisenach|1956
HONECKER|East German leader from 1971|1971
ULBRICHT|East German leader until 1971|1950
SANDMANN|Bedtime TV puppet, “Unser ___chen”|1959
PUHDYS|Rock band from East Berlin|1969
SPREEWALD|Region famous for its gherkins
JAHN|Sigmund, first German in space|1978
WALL|Built in 1961, fell in 1989|1961
PIONEER|Child in a blue neckerchief
KARAT|Band that sang “Über sieben Brücken”|1979
`,
  },
  it: {
    it: `
VESPA|Lo scooter della Piaggio
CINQUECENTO|La piccola Fiat del 1957|1957
FELLINI|Regista de « La dolce vita »|1960
MODUGNO|Domenico, « Volare »|1958
SANREMO|Il festival della canzone
CAROSELLO|La pubblicità prima di andare a letto|1957
MINA|La Tigre di Cremona|1959
CELENTANO|Adriano, il Molleggiato|1960
OLIMPIADI|Roma le ospitò nel 1960|1960
MUNDIAL|La vittoria azzurra del 1982|1982
ROSSI|Paolo, detto Pablito|1982
COPPI|Fausto, il Campionissimo|1949
LIRA|La moneta prima dell'euro
TOPOGIGIO|Il topolino della televisione|1959
NUTELLA|Crema nata ad Alba|1964
BATTISTI|Lucio, « Emozioni »|1970
RISCHIATUTTO|Quiz di Mike Bongiorno|1970
BONGIORNO|Mike, « Allegria! »|1955
`,
    en: `
VESPA|Piaggio’s famous scooter
FELLINI|Director of “La Dolce Vita”|1960
MODUGNO|Domenico, singer of “Volare”|1958
SANREMO|Italy’s song festival
MINA|Singer known as the Tiger of Cremona|1959
ROME|Host city of the 1960 Olympics|1960
ROSSI|Paolo, hero of the 1982 World Cup|1982
COPPI|Fausto, the cycling champion|1949
LIRA|Italy’s currency before the euro
NUTELLA|Hazelnut spread from Alba|1964
FIAT|Turin carmaker of the 500
`,
  },
  br: {
    pt: `
PELE|O Rei do futebol|1958
BRASILIA|Nova capital inaugurada|1960
BOSSANOVA|Ritmo de « Garota de Ipanema »|1962
JOBIM|Tom, o maestro soberano|1958
FUSCA|O Volkswagen mais querido
MARACANA|O maior estádio do Rio|1950
CHACRINHA|O Velho Guerreiro da TV|1960
TROPICALIA|Movimento de Caetano e Gil|1968
CAETANO|___ Veloso, o baiano|1967
XUXA|A Rainha dos Baixinhos|1986
SENNA|Ayrton, tricampeão da Fórmula 1|1988
CRUZEIRO|Moeda brasileira por décadas
NOVELA|Toda noite às oito
GUARANA|Refrigerante de fruta amazônica
GARRINCHA|A Alegria do Povo|1958
ROBERTO|___ Carlos, o Rei da Jovem Guarda|1965
`,
    en: `
PELE|The King of football|1958
BRASILIA|New capital inaugurated in 1960|1960
BOSSANOVA|Rhythm of “The Girl from Ipanema”|1962
JOBIM|Tom, the composer|1958
MARACANA|Rio’s giant stadium|1950
XUXA|Queen of children’s TV|1986
SENNA|Ayrton, three-time F1 champion|1988
SAMBA|Dance of the carnival
GARRINCHA|“The Joy of the People”|1958
CARNIVAL|Rio’s great festival
`,
  },
  mx: {
    es: `
CHESPIRITO|Creador del Chavo del Ocho|1971
CHAVO|El ___ del Ocho|1971
CANTINFLAS|Mario Moreno, el cómico|1950
INFANTE|Pedro, actor y cantante|1950
MUNDIAL|México lo organizó en 1970|1970
AZTECA|Estadio de la Ciudad de México|1966
LOTERIA|Juego de cartas con el Gallo y la Dama
VOCHO|El Volkswagen de los taxis
CHABELO|El amigo de todos los niños|1967
SANTO|El Enmascarado de Plata|1958
OLIMPIADA|México fue sede en 1968|1968
METRO|Se inauguró en la capital en 1969|1969
MARIACHI|Músicos con traje de charro
PESO|La moneda nacional
TINTAN|Germán Valdés, el Pachuco|1950
JUANGABRIEL|El Divo de Juárez|1975
`,
    en: `
CANTINFLAS|Mexico’s great film comedian|1950
CHAVO|“El ___ del Ocho”, TV comedy|1971
INFANTE|Pedro, actor and singer|1950
AZTECA|Mexico City’s great stadium|1966
SANTO|Wrestler in a silver mask|1958
MARIACHI|Musicians in charro suits
PESO|Mexico’s currency
TACO|Folded tortilla with a filling
OLYMPICS|Mexico City hosted them in 1968|1968
`,
  },
  ar: {
    es: `
MARADONA|El Diez de 1986|1986
MUNDIAL|Argentina lo ganó en casa en 1978|1978
MAFALDA|La niña de Quino|1964
QUINO|Dibujante de Mafalda|1964
PERON|Presidente en 1946 y en 1973|1946
EVITA|Eva Duarte de Perón|1946
TANGO|Baile del Río de la Plata
PIAZZOLLA|Astor, el nuevo tango|1960
FANGIO|Cinco veces campeón de Fórmula 1|1951
MATE|Se toma con bombilla
SODA|___ Stereo, banda de rock|1984
BOCA|___ Juniors, de La Bombonera
COLECTIVO|El autobús porteño
OBELISCO|Símbolo de Buenos Aires
ALFAJOR|Dulce con dulce de leche
SANDRO|«El Gitano», ídolo de los 60|1965
`,
    en: `
MARADONA|Argentina’s number 10 of 1986|1986
MAFALDA|Comic-strip girl by Quino|1964
PERON|President first elected in 1946|1946
EVITA|Eva Perón|1946
TANGO|Dance of Buenos Aires
PIAZZOLLA|Astor, master of new tango|1960
FANGIO|Five-time Formula One champion|1951
MATE|Herbal drink sipped through a metal straw
OBELISK|Landmark of Buenos Aires
GAUCHO|Cowboy of the pampas
`,
  },
  co: {
    es: `
MACONDO|Pueblo de «Cien años de soledad»|1967
GABO|Apodo de García Márquez|1967
NOBEL|Gabo lo ganó en 1982|1982
CUMBIA|Ritmo de la costa
VALLENATO|Música del acordeón
VALDEZ|Juan ___, el cafetero|1958
CHIVA|Bus rural de colores
TINTO|Café negro, bien colombiano
COCHISE|Martín Emilio Rodríguez, ciclista|1964
LUCHO|___ Herrera, ganó la Vuelta a España|1987
AREPA|Pan de maíz redondo
PIBE|Carlos Valderrama, el ___|1990
DIOMEDES|___ Díaz, el Cacique de La Junta|1976
CARACOL|Cadena de radio y televisión
HIGUITA|Arquero del «escorpión»|1995
`,
    en: `
MACONDO|Town of “One Hundred Years of Solitude”|1967
GABO|Nickname of García Márquez|1967
NOBEL|Gabo won it in 1982|1982
CUMBIA|Dance rhythm of the coast
VALLENATO|Accordion music of Colombia
VALDEZ|Juan ___, the coffee farmer|1958
AREPA|Round corn bread
COFFEE|Colombia’s famous export
VALDERRAMA|Carlos, “El Pibe”|1990
`,
  },
  in: {
    hi: `
नेहरू|भारत के पहले प्रधानमंत्री|1947
गांधी|बापू
शोले|गब्बर वाली फ़िल्म|1975
अमिताभ|एंग्री यंग मैन|1973
लता|स्वर कोकिला, ___ मंगेशकर|1949
रफ़ी|मोहम्मद ___, अमर गायक|1950
किशोर|___ कुमार, गायक|1960
दूरदर्शन|सरकारी टीवी चैनल|1959
रामायण|रविवार सुबह का धारावाहिक|1987
कपिल|1983 विश्व कप के कप्तान|1983
गावस्कर|सुनील, लिटिल मास्टर|1971
अंबेसडर|सफ़ेद सरकारी कार|1958
चेतक|बजाज का स्कूटर|1972
आर्यभट|भारत का पहला उपग्रह|1975
राकेश|___ शर्मा, अंतरिक्ष में पहले भारतीय|1984
अमूल|अटरली बटरली वाली कंपनी
बिनाका|___ गीतमाला, रेडियो पर|1952
चित्रहार|गानों का टीवी कार्यक्रम|1982
मुग़लेआज़म|अनारकली वाली फ़िल्म|1960
हमलोग|पहला टीवी धारावाहिक|1984
`,
    en: `
NEHRU|India’s first Prime Minister|1947
GANDHI|Father of the Nation
SHOLAY|Film with the villain Gabbar Singh|1975
AMITABH|The “angry young man” of Hindi film|1973
LATA|___ Mangeshkar, the Nightingale|1949
RAFI|Mohammed ___, legendary singer|1950
KISHORE|___ Kumar, singer|1960
DOORDARSHAN|India’s state TV channel|1959
RAMAYAN|Sunday-morning TV epic|1987
KAPIL|Captain of the 1983 World Cup win|1983
GAVASKAR|Sunil, the Little Master|1971
AMBASSADOR|The white government car|1958
ARYABHATA|India’s first satellite|1975
AMUL|“Utterly butterly” dairy brand
CHETAK|Bajaj scooter|1972
`,
  },
  np: {
    ne: `
महेन्द्र|राजा, १९५५ देखि १९७२ सम्म|1955
वीरेन्द्र|राजा, १९७२ देखि २००१ सम्म|1972
तेन्जिङ|सगरमाथा चढ्ने पहिलो मध्ये एक|1953
सगरमाथा|संसारको सबैभन्दा अग्लो हिमाल
नारायणगोपाल|स्वर सम्राट|1960
धरहरा|काठमाडौँको अग्लो स्तम्भ
कुमारी|जीवित देवी
दसैँ|सबैभन्दा ठूलो चाड
तिहार|दियो र भाइटीकाको चाड
त्रिभुवन|प्रजातन्त्र ल्याउने राजा|1951
पशुपति|बागमती किनारको मन्दिर
गोरखापत्र|सबैभन्दा पुरानो पत्रिका
झ्याउरे|लोकगीतको भाका
रोपाइँ|असारमा धान रोप्ने काम
मदन|___ पुरस्कार, साहित्य सम्मान|1956
`,
    en: `
TENZING|Climbed Everest with Hillary|1953
EVEREST|The world’s highest mountain
MAHENDRA|King from 1955 to 1972|1955
BIRENDRA|King from 1972 to 2001|1972
DASHAIN|Nepal’s biggest festival
TIHAR|Festival of lights and brothers
KUMARI|Nepal’s living goddess
PASHUPATI|Temple on the Bagmati River
DHARAHARA|Tall white tower in Kathmandu
TRIBHUVAN|King who returned in 1951|1951
`,
  },
};

// ---------------------------------------------------------------- helpers
const DEVA: Lang[] = ['hi', 'ne'];
export const isDeva = (lang: Lang) => DEVA.includes(lang);

const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

/** Split text into grid units: letters, or whole Devanagari syllables. */
export function units(s: string): string[] {
  if (seg) return [...seg.segment(s)].map(x => x.segment);
  return Array.from(s);
}

/** Normalise typed or stored text the way crossword setters do in each language. */
export function norm(lang: Lang, s: string): string {
  if (isDeva(lang)) return s.replace(/[\s\-‐’'.]/g, '');
  let u = s.toLocaleUpperCase(lang === 'de' ? 'de-DE' : lang);
  // Russian: Ё is written Е in crosswords, but Й is a letter of its own, so
  // no accent stripping at all (it would turn Й into И).
  if (lang === 'ru') return u.replace(/Ё/g, 'Е').replace(/[^\p{L}]/gu, '');
  if (lang === 'de') {
    u = u.replace(/ẞ/g, 'SS');
  } else if (lang === 'es') {
    u = u.replace(/Ñ/g, '\u0000').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0000/g, 'Ñ');
  } else {
    u = u.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  return u.replace(/[^\p{L}]/gu, '');
}

function parse(lang: Lang, deck: Deck | undefined): Entry[] {
  if (!deck) return [];
  const out: Entry[] = [];
  for (const line of deck.split('\n')) {
    const [w, clue, y] = line.split('|');
    if (!w || !clue || clue.length < 4) continue;
    const word = norm(lang, w);
    if (!word) continue;
    out.push({ word, units: units(word), clue, year: y ? Number(y) : undefined });
  }
  return out;
}

/** The letters a keyboard / filler for this language offers. */
export function alphabet(lang: Lang): string[] {
  switch (lang) {
    case 'ru':
      return 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');
    case 'de':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.split('');
    case 'es':
      return 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
    case 'hi':
    case 'ne':
      return []; // built from the words themselves (see syllables())
    default:
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  }
}

/** Distinct grid units used across a set of entries (for Devanagari fillers / keys). */
export function syllables(entries: Entry[]): string[] {
  return [...new Set(entries.flatMap(e => e.units))];
}

export interface WordProfile {
  born?: number;
  country?: string;
}

/**
 * Words for the games, in `lang`, from the culture of `profile.country`,
 * favouring things from when the person was roughly 0–35.
 */
/** Themed packs that have words in this language (Hoot Plus). */
export function packsFor(lang: Lang): ThemePack[] {
  return PACK_IDS.filter(id => parse(lang, PACKS[id].decks[lang]).length >= 12);
}

/** Words for one themed pack in `lang` (empty if the pack has no deck there). */
export function packWords(lang: Lang, pack: ThemePack): Entry[] {
  return parse(lang, PACKS[pack].decks[lang]);
}

export function wordsFor(lang: Lang, profile?: WordProfile, pack?: ThemePack): Entry[] {
  if (pack) {
    const words = packWords(lang, pack);
    if (words.length >= 12) return words;
  }
  const c = profile?.country;
  // The country's deck in this language: the core list (or the diaspora
  // list) plus the extra words, de-duplicated by parse order below.
  const local = parse(lang, c ? [COUNTRY[c]?.[lang] ?? MORE[c]?.[lang] ?? '', EXTRA[c]?.[lang] ?? ''].join('\n') : undefined);
  const everyday = parse(lang, EVERYDAY[lang] ?? EVERYDAY.en);

  let culture = local;
  if (profile?.born && local.length) {
    const lo = profile.born - 3, hi = profile.born + 35;
    const inEra = local.filter(e => e.year === undefined || (e.year >= lo && e.year <= hi));
    if (inEra.length >= 8) culture = inEra;
  }
  // Culture first; everyday words fill in.
  const seen = new Set<string>();
  return [...culture, ...everyday].filter(e => (seen.has(e.word) ? false : (seen.add(e.word), true)));
}

/** Countries × languages that have a dedicated culture deck (used by tests). */
export const DECKS = Object.fromEntries(Object.entries(COUNTRY).map(([c, d]) => [c, [...Object.keys(d), ...Object.keys(MORE[c] ?? {})] as Lang[]]));
