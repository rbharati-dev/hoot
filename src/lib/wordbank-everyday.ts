// More everyday words for the word games (crossword, word search, hangman,
// word scramble), written natively in each language: the home, the kitchen,
// the garden, music, travel and childhood. These are shared by every reader of
// a language whatever country they were born in, so a Russian speaker born in
// Canada (say) still gets a rich deck. Format: WORD|clue, one per line.
import type { Lang } from './data';

export const EVERYDAY_MORE: Record<Lang, string> = {
  en: `
KETTLE|It whistles when the water boils
TEAPOT|It pours a proper brew
APRON|Worn to keep flour off your clothes
PANTRY|Small room for jars and tins
LARDER|Cool cupboard for food before fridges
THIMBLE|It protects a sewing finger
NEEDLE|It has an eye but cannot see
KNITTING|Two needles and a ball of wool
QUILT|Bed cover stitched from patches
PILLOW|Where you rest your head
BLANKET|Warm cover on a cold night
LANTERN|Lamp you can carry
CANDLE|Wax and a wick
MATCHBOX|It rattles with little sticks
FIREPLACE|Hearth of the home
CHIMNEY|Where the smoke goes out
DOORBELL|Ring it and wait
LETTERBOX|Slot in the door for the post
ENVELOPE|A letter goes inside it
POSTMAN|He brings the mail
PARCEL|Package tied with string
DIARY|A private book of days
ALBUM|Book of family photographs
PIANO|Eighty-eight keys
VIOLIN|Four strings and a bow
GUITAR|Six strings to strum
ACCORDION|Squeezebox
HARMONICA|Mouth organ
TRUMPET|Brass with three valves
WALTZ|Dance in three-four time
BALLROOM|Hall made for dancing
JUKEBOX|A coin picks the song
CINEMA|Where you watched the big screen
MATINEE|Afternoon film showing
POPCORN|Snack at the pictures
CAROUSEL|Merry-go-round
CIRCUS|Big top, clowns and acrobats
PICNIC|Meal on a blanket outdoors
HAMPER|Basket for a day out
THERMOS|Flask that keeps tea hot
SEASIDE|Sand, sea and deckchairs
LIGHTHOUSE|Its beam warns ships
HARBOUR|Shelter for boats
STEAMER|Ship driven by steam
RAILWAY|Tracks, stations and timetables
PLATFORM|Where you wait for the train
SUITCASE|Packed for a journey
COMPASS|Its needle points north
ATLAS|Book of maps
GLOBE|The world on a stand
ORCHARD|Where apples grow
MEADOW|Field of grass and wildflowers
HAYSTACK|Hard place to find a needle
SCARECROW|Straw guard in a field
TRACTOR|Farm workhorse on wheels
WINDMILL|Its sails turn in the breeze
HARVEST|Gathering in the crops
PUMPKIN|Orange autumn squash
RHUBARB|Pink stalks for a crumble
MARMALADE|Orange preserve for toast
PORRIDGE|Hot oats for breakfast
PANCAKE|Tossed in a pan
CUSTARD|Yellow sauce for pudding
GINGERBREAD|Spiced biscuit, often a little man
LEMONADE|Fizzy or cloudy, always sweet
TOFFEE|Chewy sweet
LIQUORICE|Black sweet in laces
ROBIN|Red-breasted garden bird
SPARROW|Small brown town bird
SWALLOW|It returns with the summer
OWL|Night bird that hoots
HEDGEHOG|Prickly visitor to the garden
SQUIRREL|It buries nuts for winter
BUTTERFLY|It was once a caterpillar
DAFFODIL|Yellow trumpet of spring
TULIP|Dutch spring flower
ROSE|Thorny flower of love
LAVENDER|Purple and sweetly scented
SNOWMAN|Carrot nose and coal eyes
SLEDGE|Ride it down a snowy hill
MITTENS|Gloves without fingers
RAINBOW|Seven colours after rain
`,
  fr: `
BOUILLOIRE|Elle siffle quand l'eau bout
THEIERE|On y fait infuser le thé
TABLIER|Il protège les vêtements en cuisine
CAFETIERE|Elle prépare le café du matin
MOULIN|Il broie le café ou le blé
AIGUILLE|Elle a un chas pour le fil
TRICOT|Deux aiguilles et une pelote
EDREDON|Couverture épaisse garnie de plumes
OREILLER|On y pose la tête
LANTERNE|Lampe que l'on porte
BOUGIE|Cire et mèche
ALLUMETTE|Petit bâton qui s'enflamme
CHEMINEE|On y fait du feu
SONNETTE|On la tire pour s'annoncer
ENVELOPPE|On y glisse une lettre
FACTEUR|Il apporte le courrier
COLIS|Paquet ficelé
TIMBRE|On le collait sur la lettre
ALBUM|Livre de photos de famille
PIANO|Quatre-vingt-huit touches
VIOLON|Quatre cordes et un archet
GUITARE|Six cordes
ACCORDEON|Le piano à bretelles
HARMONICA|Petit instrument de poche
TROMPETTE|Cuivre à trois pistons
VALSE|Danse à trois temps
MUSETTE|Bal populaire à l'accordéon
CINEMA|La salle du grand écran
MANEGE|Chevaux de bois qui tournent
CIRQUE|Chapiteau, clowns et acrobates
GUIGNOL|Marionnette lyonnaise
PETANQUE|Jeu de boules du Midi
BELOTE|Jeu de cartes des cafés
MARELLE|On y saute à cloche-pied
BILLES|Petites boules de la cour de récré
CERCEAU|Rond que l'on fait rouler
TOUPIE|Elle tourne sur sa pointe
PIQUENIQUE|Repas sur l'herbe
PANIER|On y range les provisions
PLAGE|Sable, mer et parasols
PHARE|Sa lumière guide les bateaux
BATEAU|Il flotte sur l'eau
GARE|On y prend le train
QUAI|On y attend le train
VALISE|Bagage du voyageur
BOUSSOLE|Son aiguille montre le nord
VERGER|Là où poussent les pommiers
PRAIRIE|Champ d'herbe et de fleurs
MOISSON|Récolte du blé
VENDANGES|Récolte du raisin
TRACTEUR|Machine du fermier
POTAGER|Jardin des légumes
BROUETTE|Une roue et deux bras
ARROSOIR|Il donne à boire aux fleurs
CITROUILLE|Grosse courge orange
CONFITURE|Fruits et sucre en pot
BAGUETTE|Pain long et croustillant
CROISSANT|Viennoiserie du matin
BRIOCHE|Pain doux et moelleux
CREPE|On la fait sauter à la Chandeleur
TARTINE|Tranche de pain beurrée
BONBON|Sucrerie des enfants
REGLISSE|Friandise noire
LIMONADE|Boisson pétillante et sucrée
SIROP|On l'allonge d'eau fraîche
MOINEAU|Petit oiseau des villes
HIRONDELLE|Elle annonce le printemps
ROSSIGNOL|Il chante la nuit
HIBOU|Oiseau de nuit aux aigrettes
HERISSON|Il se roule en boule
ECUREUIL|Il cache ses noisettes
PAPILLON|Ancienne chenille
COQUELICOT|Fleur rouge des champs
MUGUET|On l'offre le premier mai
TULIPE|Fleur du printemps
LAVANDE|Parfum bleu de Provence
TOURNESOL|Il suit le soleil
LUGE|On glisse dessus sur la neige
MOUFLES|Gants sans doigts
PARAPLUIE|Il s'ouvre sous l'averse
ARCENCIEL|Sept couleurs après la pluie
`,
  es: `
TETERA|En ella se prepara el té
CAFETERA|Prepara el café de la mañana
DELANTAL|Protege la ropa en la cocina
DESPENSA|Cuarto de las provisiones
DEDAL|Protege el dedo al coser
AGUJA|Tiene ojo pero no ve
COSTURA|Labor de hilo y aguja
COLCHA|Cubre la cama
ALMOHADA|Donde reposa la cabeza
MANTA|Abriga en la noche fría
FAROL|Luz que se lleva en la mano
VELA|Cera y mecha
CERILLA|Palito que enciende el fuego
CHIMENEA|Por ella sale el humo
BRASERO|Calentaba los pies bajo la mesa
BOTIJO|Mantiene el agua fresca
ABANICO|Da aire en verano
TIMBRE|Suena al llegar la visita
SOBRE|Dentro va la carta
CARTERO|Trae el correo
PAQUETE|Envío atado con cuerda
SELLO|Se pegaba en la carta
ALBUM|Libro de fotos de familia
PIANO|Ochenta y ocho teclas
VIOLIN|Cuatro cuerdas y un arco
GUITARRA|Seis cuerdas
ACORDEON|Instrumento de fuelle
ARMONICA|Se toca soplando
TROMPETA|Metal con tres pistones
BOLERO|Canción romántica y lenta
TANGO|Baile de Buenos Aires
PASODOBLE|Baile de las verbenas
VERBENA|Fiesta popular nocturna
CINE|La sala de la gran pantalla
TIOVIVO|Caballitos que dan vueltas
CIRCO|Carpa, payasos y acróbatas
RAYUELA|Se salta a la pata coja
CANICAS|Bolitas del recreo
TROMPO|Gira sobre su punta
COMETA|Vuela con viento y cuerda
PARCHIS|Juego de fichas y dados
DOMINO|Fichas con puntos
MERIENDA|Comida ligera de la tarde
CESTA|En ella se lleva la comida
PLAYA|Arena, mar y sombrillas
FARO|Su luz guía a los barcos
PUERTO|Refugio de los barcos
ESTACION|Donde se toma el tren
ANDEN|Donde se espera el tren
MALETA|Equipaje del viajero
BRUJULA|Su aguja señala el norte
HUERTO|Donde crecen las hortalizas
PRADO|Campo de hierba
COSECHA|Recogida de los frutos
VENDIMIA|Recogida de la uva
TRACTOR|Máquina del labrador
MOLINO|Sus aspas giran con el viento
REGADERA|Da de beber a las flores
CALABAZA|Hortaliza grande y naranja
MERMELADA|Fruta y azúcar en tarro
CHURROS|Se mojan en chocolate
TURRON|Dulce de Navidad
HORCHATA|Bebida fresca de chufa
GASEOSA|Refresco con burbujas
CARAMELO|Dulce de los niños
REGALIZ|Golosina negra
GORRION|Pajarillo de la ciudad
GOLONDRINA|Vuelve con la primavera
BUHO|Ave nocturna
ERIZO|Se hace una bola con púas
ARDILLA|Guarda nueces para el invierno
MARIPOSA|Antes fue oruga
AMAPOLA|Flor roja del campo
CLAVEL|Flor de las fiestas
GIRASOL|Sigue al sol
JAZMIN|Flor blanca y perfumada
TRINEO|Se desliza por la nieve
BUFANDA|Abriga el cuello
PARAGUAS|Se abre bajo la lluvia
ARCOIRIS|Siete colores tras la lluvia
`,
  de: `
KESSEL|Er pfeift, wenn das Wasser kocht
TEEKANNE|Darin zieht der Tee
SCHÜRZE|Sie schützt die Kleidung beim Kochen
SPEISEKAMMER|Kleiner Raum für Vorräte
FINGERHUT|Schützt den Finger beim Nähen
NADEL|Sie hat ein Öhr
STRICKEN|Zwei Nadeln und ein Wollknäuel
FEDERBETT|Dicke Decke voller Daunen
KISSEN|Darauf ruht der Kopf
LATERNE|Licht zum Tragen
KERZE|Wachs und Docht
STREICHHOLZ|Kleines Holz, das Feuer macht
KAMIN|Feuerstelle im Wohnzimmer
OFEN|Er wärmt die Stube
KLINGEL|Man drückt sie an der Tür
BRIEFKASTEN|Dort landet die Post
UMSCHLAG|Hülle für den Brief
BRIEFTRÄGER|Er bringt die Post
PAKET|Mit Schnur verschnürt
BRIEFMARKE|Man klebte sie auf den Brief
ALBUM|Buch mit Familienfotos
KLAVIER|Achtundachtzig Tasten
GEIGE|Vier Saiten und ein Bogen
GITARRE|Sechs Saiten
AKKORDEON|Auch Schifferklavier genannt
TROMPETE|Blech mit drei Ventilen
WALZER|Tanz im Dreivierteltakt
POLKA|Flotter böhmischer Tanz
SCHLAGER|Lied zum Mitsingen
KINO|Saal mit der großen Leinwand
KARUSSELL|Es dreht sich auf dem Jahrmarkt
ZIRKUS|Zelt, Clowns und Artisten
JAHRMARKT|Buden, Lose und Zuckerwatte
MURMELN|Kleine Kugeln vom Schulhof
KREISEL|Er dreht sich auf der Spitze
DRACHEN|Er steigt im Herbstwind
SKAT|Kartenspiel zu dritt
PICKNICK|Mahlzeit auf der Wiese
KORB|Darin trägt man den Proviant
STRAND|Sand, Meer und Strandkörbe
LEUCHTTURM|Sein Licht warnt die Schiffe
HAFEN|Schutz für Schiffe
DAMPFER|Schiff mit Schornstein
BAHNHOF|Hier fährt der Zug ab
BAHNSTEIG|Dort wartet man auf den Zug
KOFFER|Gepäck für die Reise
KOMPASS|Seine Nadel zeigt nach Norden
OBSTGARTEN|Dort wachsen Äpfel und Birnen
WIESE|Gras und Wildblumen
ERNTE|Einbringen der Früchte
TRAKTOR|Zugmaschine des Bauern
WINDMÜHLE|Ihre Flügel drehen sich im Wind
SCHUBKARRE|Ein Rad und zwei Griffe
GIESSKANNE|Sie gibt den Blumen Wasser
KÜRBIS|Großes oranges Gemüse
MARMELADE|Frucht und Zucker im Glas
BREZEL|Geschlungenes Laugengebäck
PFANNKUCHEN|Dünn aus der Pfanne
STREUSEL|Krümel auf dem Kuchen
LEBKUCHEN|Würziges Gebäck zur Weihnachtszeit
STOLLEN|Weihnachtsgebäck mit Rosinen
LIMONADE|Süßes Getränk mit Kohlensäure
BONBON|Süßigkeit zum Lutschen
LAKRITZ|Schwarze Süßigkeit
SPATZ|Kleiner brauner Stadtvogel
SCHWALBE|Sie bringt den Sommer
AMSEL|Schwarzer Sänger im Garten
EULE|Nachtvogel
IGEL|Stachliger Gartenbesucher
EICHHÖRNCHEN|Es vergräbt Nüsse
SCHMETTERLING|Er war einmal eine Raupe
TULPE|Frühlingsblume aus Holland
VEILCHEN|Kleine violette Blume
LAVENDEL|Duftet blau und süß
SONNENBLUME|Sie dreht sich zur Sonne
SCHNEEMANN|Karottennase und Kohleaugen
SCHLITTEN|Damit geht es den Hang hinab
HANDSCHUHE|Sie wärmen die Finger
REGENSCHIRM|Er öffnet sich im Regen
REGENBOGEN|Sieben Farben nach dem Regen
`,
  it: `
TEIERA|Ci si prepara il tè
CAFFETTIERA|La moka del mattino
GREMBIULE|Protegge i vestiti in cucina
DISPENSA|Stanzino delle provviste
DITALE|Protegge il dito quando si cuce
AGO|Ha una cruna per il filo
MAGLIA|Si fa con i ferri e la lana
TRAPUNTA|Coperta imbottita
CUSCINO|Ci si appoggia la testa
COPERTA|Scalda nelle notti fredde
LANTERNA|Lume che si porta in mano
CANDELA|Cera e stoppino
FIAMMIFERO|Bastoncino che accende il fuoco
CAMINO|Vi si accende il fuoco
STUFA|Riscalda la stanza
CAMPANELLO|Si suona alla porta
BUSTA|Dentro c'è la lettera
POSTINO|Porta la posta
PACCO|Legato con lo spago
FRANCOBOLLO|Si incollava sulla lettera
ALBUM|Libro delle foto di famiglia
PIANOFORTE|Ottantotto tasti
VIOLINO|Quattro corde e un archetto
CHITARRA|Sei corde
FISARMONICA|Strumento a mantice
MANDOLINO|Piccolo strumento napoletano
TROMBA|Ottone con tre pistoni
VALZER|Ballo in tre tempi
TARANTELLA|Danza vivace del Sud
CINEMA|La sala del grande schermo
GIOSTRA|Gira con i cavallucci
CIRCO|Tendone, pagliacci e acrobati
BIGLIE|Palline di vetro dei bambini
TROTTOLA|Gira sulla punta
AQUILONE|Vola con il vento
BRISCOLA|Gioco di carte all'osteria
TOMBOLA|Si gioca a Natale con i numeri
BOCCE|Gioco di palle sul campo
MERENDA|Spuntino del pomeriggio
CESTINO|Vi si porta il pranzo al sacco
SPIAGGIA|Sabbia, mare e ombrelloni
FARO|La sua luce guida le navi
PORTO|Riparo per le barche
STAZIONE|Dove si prende il treno
BINARIO|Dove si aspetta il treno
VALIGIA|Bagaglio del viaggiatore
BUSSOLA|Il suo ago indica il nord
FRUTTETO|Dove crescono gli alberi da frutta
PRATO|Campo d'erba
VENDEMMIA|Raccolta dell'uva
RACCOLTO|Frutto del lavoro nei campi
TRATTORE|Macchina del contadino
MULINO|Macina il grano
ORTO|Giardino delle verdure
ANNAFFIATOIO|Dà da bere ai fiori
ZUCCA|Grande ortaggio arancione
MARMELLATA|Frutta e zucchero in vasetto
FOCACCIA|Pane basso con olio e sale
GRISSINI|Bastoncini croccanti di Torino
PANETTONE|Dolce di Natale milanese
TORRONE|Dolce con miele e mandorle
GELATO|Si mangia nel cono
GAZZOSA|Bibita con le bollicine
CARAMELLA|Dolcetto dei bambini
LIQUIRIZIA|Dolce nero
PASSERO|Uccellino di città
RONDINE|Torna a primavera
GUFO|Uccello della notte
RICCIO|Si chiude a palla con gli aculei
SCOIATTOLO|Nasconde le noci
FARFALLA|Prima era un bruco
PAPAVERO|Fiore rosso dei campi
MIMOSA|Fiore giallo dell'otto marzo
GIRASOLE|Segue il sole
LAVANDA|Profumo viola
SLITTA|Scivola sulla neve
SCIARPA|Scalda il collo
OMBRELLO|Si apre sotto la pioggia
ARCOBALENO|Sette colori dopo la pioggia
`,
  pt: `
CHALEIRA|Apita quando a água ferve
BULE|Nele se serve o chá
AVENTAL|Protege a roupa na cozinha
DESPENSA|Onde se guardam os mantimentos
DEDAL|Protege o dedo na costura
AGULHA|Tem um buraco para a linha
COSTURA|Trabalho de linha e agulha
COLCHA|Cobre a cama
ALMOFADA|Onde se apoia a cabeça
COBERTOR|Aquece nas noites frias
LAMPIAO|Luz que se carrega na mão
VELA|Cera e pavio
FOSFORO|Palito que acende o fogo
LAREIRA|Onde se acende o fogo em casa
FOGAO|Onde se cozinha
CAMPAINHA|Toca-se ao chegar
ENVELOPE|Dentro vai a carta
CARTEIRO|Traz a correspondência
PACOTE|Embrulho amarrado com barbante
SELO|Colava-se na carta
ALBUM|Livro de fotos de família
PIANO|Oitenta e oito teclas
VIOLINO|Quatro cordas e um arco
VIOLAO|Seis cordas
SANFONA|Instrumento de fole
GAITA|Toca-se soprando
PANDEIRO|Dá o ritmo ao samba
CAVAQUINHO|Pequeno, de quatro cordas
VALSA|Dança em três tempos
SERESTA|Cantoria sob a janela
CINEMA|A sala da tela grande
CARROSSEL|Gira com cavalinhos
CIRCO|Lona, palhaços e acrobatas
AMARELINHA|Pula-se num pé só
PIAO|Gira na ponta
PIPA|Voa com vento e linha
DOMINO|Peças com pontinhos
BARALHO|Conjunto de cartas
MERENDA|Lanche da tarde
CESTA|Leva-se nela a comida
PRAIA|Areia, mar e guarda-sol
FAROL|Sua luz guia os navios
PORTO|Abrigo dos barcos
ESTACAO|Onde se pega o trem
MALA|Bagagem do viajante
BUSSOLA|A agulha aponta o norte
POMAR|Onde crescem as frutas
PRADO|Campo de capim
COLHEITA|Recolha dos frutos
VINDIMA|Colheita da uva
TRATOR|Máquina do lavrador
MOINHO|Mói o grão com o vento
HORTA|Canteiro de verduras
REGADOR|Dá de beber às flores
ABOBORA|Legume grande e alaranjado
GELEIA|Fruta e açúcar no pote
GOIABADA|Doce que casa com queijo
PAMONHA|Feita de milho verde
TAPIOCA|Massa branca da mandioca
BRIGADEIRO|Docinho de festa
RAPADURA|Doce duro de cana
GUARANA|Refrigerante brasileiro
PIPOCA|Estoura na panela
PARDAL|Passarinho da cidade
ANDORINHA|Uma só não faz verão
SABIA|Canta nas palmeiras
CORUJA|Ave da noite
OURICO|Faz-se bola de espinhos
ESQUILO|Guarda nozes
BORBOLETA|Antes era lagarta
GIRASSOL|Segue o sol
JASMIM|Flor branca e perfumada
ORQUIDEA|Flor delicada dos trópicos
CRAVO|Flor de abril em Portugal
CACHECOL|Aquece o pescoço
SOMBRINHA|Abre-se sob a chuva
JANGADA|Barco simples dos pescadores
REDE|Balança na varanda
ARCOIRIS|Sete cores depois da chuva
`,
  ru: `
ЧАЙНИК|Свистит, когда вода закипит
САМОВАР|Пузатый хозяин чаепития
ФАРТУК|Бережёт одежду на кухне
КЛАДОВКА|Комнатка для запасов
НАПЁРСТОК|Защищает палец при шитье
ИГОЛКА|С ушком, но не слышит
ВЯЗАНИЕ|Две спицы и клубок шерсти
ОДЕЯЛО|Согревает холодной ночью
ПОДУШКА|На неё кладут голову
ПЕРИНА|Пуховая постель
ФОНАРЬ|Свет, который носят с собой
СВЕЧА|Воск и фитиль
СПИЧКИ|Гремят в коробке
ПЕЧКА|Греет избу
КАМИН|В нём горит огонь
ЗВОНОК|На него нажимают у двери
КОНВЕРТ|В него кладут письмо
ПОЧТАЛЬОН|Приносит письма
ПОСЫЛКА|Ящик, перевязанный бечёвкой
АЛЬБОМ|Книга семейных фотографий
ПИАНИНО|Чёрно-белые клавиши
СКРИПКА|Четыре струны и смычок
ГИТАРА|Шесть или семь струн
ГАРМОНЬ|Душа деревенской гулянки
БАЯН|Кнопочный аккордеон
БАЛАЛАЙКА|Три струны и треугольник
ТРУБА|Медная, с тремя клапанами
ВАЛЬС|Танец на три счёта
РОМАНС|Песня под гитару
КИНОТЕАТР|Зал с большим экраном
КАРУСЕЛЬ|Кружится в парке
ЦИРК|Арена, клоуны и акробаты
ЛОТО|Бочонки с номерами
ДОМИНО|Костяшки с точками
ШАШКИ|Белые и чёрные на доске
ЮЛА|Вертится на острие
САНКИ|На них катаются с горки
КОНЬКИ|На них скользят по льду
ВАРЕЖКИ|Рукавички без пальцев
ВАЛЕНКИ|Тёплая обувь из шерсти
ДАЧА|Домик за городом
ГРЯДКА|Полоска земли для овощей
ЛЕЙКА|Поит цветы
ТЕПЛИЦА|Домик для огурцов и помидоров
САРАЙ|Постройка для дров и инструмента
КОЛОДЕЦ|Вода из глубины
ПЛЯЖ|Песок, море и зонтики
МАЯК|Его свет ведёт корабли
ПРИСТАНЬ|Место, где причаливают
ПАРОХОД|Судно с трубой
ВОКЗАЛ|Отсюда уходят поезда
ПЕРРОН|Тут ждут поезд
ЧЕМОДАН|Багаж путешественника
КОМПАС|Стрелка показывает на север
САД|Яблони и вишни
ЛУГ|Трава и полевые цветы
УРОЖАЙ|Его собирают осенью
ТРАКТОР|Железный конь пахаря
МЕЛЬНИЦА|Мелет зерно
ТЫКВА|Большой оранжевый овощ
ВАРЕНЬЕ|Ягоды с сахаром на зиму
БЛИНЫ|Их пекут на Масленицу
ПИРОЖОК|С капустой или с повидлом
СУШКИ|Маленькие бублики к чаю
ПРЯНИК|Тульский, например
КВАС|Хлебный напиток
КОМПОТ|Сладкий отвар из фруктов
ЛЕДЕНЕЦ|Петушок на палочке
ВОРОБЕЙ|Серый городской птах
ЛАСТОЧКА|Прилетает с весной
СНЕГИРЬ|Красная грудка на снегу
СОВА|Ночная птица
ЁЖИК|Колючий гость в саду
БЕЛКА|Прячет орехи на зиму
БАБОЧКА|Раньше была гусеницей
РОМАШКА|На ней гадают: любит — не любит
ЛАНДЫШ|Майский цветок
ПОДСОЛНУХ|Поворачивается за солнцем
СИРЕНЬ|Душистые майские гроздья
СНЕГОВИК|Морковный нос
РАДУГА|Семь цветов после дождя
`,
  hi: `
केतली|इसमें चाय का पानी उबलता है
चूल्हा|इस पर खाना पकता है
तवा|इस पर रोटी सिकती है
बेलन|इससे रोटी बेली जाती है
चकला|बेलन का साथी
कड़ाही|इसमें पूरियाँ तली जाती हैं
मटका|इसमें पानी ठंडा रहता है
सुराही|लंबी गर्दन वाला पानी का बर्तन
थाली|इसमें खाना परोसा जाता है
कटोरी|दाल-सब्ज़ी का छोटा बर्तन
अचार|आम या नींबू का चटपटा स्वाद
पापड़|कुरकुरा और पतला
मुरब्बा|चाशनी में डूबा फल
सुई|इसमें धागा पिरोया जाता है
धागा|सुई का साथी
चरखा|इस पर सूत काता जाता है
रज़ाई|सर्दियों की गरम ओढ़नी
तकिया|सिर के नीचे रखा जाता है
चारपाई|रस्सी से बुनी खाट
दरी|फ़र्श पर बिछाई जाती है
लालटेन|हाथ में ले जाने वाली रोशनी
दीया|मिट्टी का छोटा दीपक
मोमबत्ती|मोम और बाती
माचिस|इसकी तीली से आग जलती है
पंखा|गर्मी में हवा देता है
चिट्ठी|डाकिया इसे लाता है
डाकिया|घर-घर ख़त पहुँचाता है
लिफ़ाफ़ा|इसमें ख़त रखा जाता है
तार|जल्दी की ख़बर का संदेश
हारमोनियम|भजन और ग़ज़ल का साथी
तबला|दो हिस्सों वाला ताल वाद्य
सितार|तारों वाला शास्त्रीय वाद्य
बाँसुरी|कृष्ण का प्रिय वाद्य
ढोलक|शादी के गीतों का साथी
शहनाई|शादी में बजती है
सिनेमा|बड़े पर्दे का घर
मेला|झूले, खिलौने और मिठाइयाँ
झूला|सावन में पेड़ पर डलता है
सर्कस|जोकर और कलाबाज़
कठपुतली|धागों से नाचती गुड़िया
पतंग|डोर से आसमान में उड़ती है
लट्टू|रस्सी से घुमाया जाता है
कंचे|काँच की छोटी गोलियाँ
गिल्ली|डंडे से उछाली जाती है
लूडो|पासे और गोटियों का खेल
शतरंज|राजा, वज़ीर और प्यादे
ताश|बावन पत्तों का खेल
रेलगाड़ी|पटरी पर चलती है
स्टेशन|यहाँ गाड़ी रुकती है
तांगा|घोड़े से चलने वाली सवारी
रिक्शा|तीन पहियों की सवारी
साइकिल|दो पहिये और घंटी
बैलगाड़ी|बैलों से खिंचती गाड़ी
नाव|नदी पार कराती है
खेत|यहाँ फ़सल उगती है
फ़सल|किसान की मेहनत का फल
कुआँ|इससे पानी खींचा जाता है
रहट|बैल घुमाकर पानी निकालने का यंत्र
बगीचा|फूलों और पेड़ों की जगह
आम|फलों का राजा
अमरूद|इलाहाबाद का मशहूर फल
जामुन|बैंगनी रंग का खट्टा-मीठा फल
इमली|खट्टी फली
गन्ना|इससे गुड़ बनता है
गुड़|गन्ने की मिठास
जलेबी|चाशनी में डूबी घुमावदार मिठाई
लड्डू|गोल मिठाई
खीर|दूध और चावल की मिठाई
लस्सी|दही का ठंडा पेय
शरबत|गर्मी का मीठा ठंडा पेय
गौरैया|आँगन की छोटी चिड़िया
कोयल|मीठी कूक वाली
मोर|बारिश में नाचता है
तोता|हरा और बोलने वाला पक्षी
गिलहरी|पेड़ पर दौड़ती है
तितली|रंगीन पंखों वाली
गुलाब|काँटों वाला फूल
कमल|कीचड़ में खिलता है
चमेली|सफ़ेद ख़ुशबूदार फूल
गेंदा|पीला-नारंगी फूल
छाता|बारिश से बचाता है
इंद्रधनुष|बारिश के बाद सात रंग
`,
  ne: `
केतली|यसमा चियाको पानी उम्लिन्छ
चुलो|यसमा खाना पाक्छ
अँगेनो|घरको आगो बाल्ने ठाउँ
कराही|यसमा सेल पकाइन्छ
ताप्के|डन्डी भएको पकाउने भाँडो
गाग्री|पानी बोक्ने भाँडो
अम्खोरा|पानी पिउने भाँडो
थाल|यसमा भात पस्किन्छ
कचौरा|दाल खाने भाँडो
डाडु|तरकारी पस्किने
अचार|चटपटे स्वाद
गुन्द्रुक|सागबाट बन्ने अमिलो खाना
ढिँडो|पिठोको परम्परागत खाना
सियो|यसमा धागो उनिन्छ
धागो|सियोको साथी
चर्खा|यसमा धागो कातिन्छ
तान|कपडा बुन्ने साधन
सिरक|जाडोको न्यानो ओढ्ने
सिरानी|टाउकोमुनि राखिन्छ
गुन्द्री|परालको ओछ्यान
राडी|भेडाको ऊनको ओढ्ने
लाल्टिन|हातमा बोक्ने बत्ती
दियो|माटोको सानो बत्ती
मैनबत्ती|मैन र बाती
सलाई|यसले आगो बल्छ
चिठी|हुलाकीले ल्याउँछ
हुलाकी|घरघर चिठी पुर्‍याउँछ
खाम|यसभित्र चिठी राखिन्छ
मादल|नेपाली तालको बाजा
सारङ्गी|गन्धर्वको बाजा
बाँसुरी|फुकेर बजाइन्छ
मुरली|गोठालाको बाँसुरी
पन्चेबाजा|बिहेमा बज्ने बाजाहरू
दमाहा|ठूलो तालबाजा
हार्मोनियम|भजनको साथी
सिनेमा|ठूलो पर्दाको घर
मेला|पिङ, खेलौना र मिठाई
पिङ|दसैँमा खेलिन्छ
चङ्गा|दसैँमा आकाशमा उड्छ
लट्टाई|चङ्गाको धागो बेर्ने
भुरुङ|डोरीले घुमाइने खेलौना
गुच्चा|काँचका साना गोली
डन्डीबियो|लट्ठी र बियोको खेल
बाघचाल|बाघ र बाख्राको खेल
लुडो|पासा र गोटीको खेल
तास|बाउन्न पत्तीको खेल
रेडियो|समाचार र गीत सुनिने
डोको|पिठ्युँमा बोकिने बाँसको भाँडो
नाम्लो|डोको बोक्ने डोरी
चौतारी|बरपीपलमुनिको बिसौनी
पँधेरो|गाउँको पानी भर्ने ठाउँ
धारा|पानी झर्ने ठाउँ
गोरेटो|गाउँको सानो बाटो
भञ्ज्याङ|डाँडाको बाटो काट्ने ठाउँ
झोलुङ्गे|खोला तर्ने पुल
खेत|यहाँ धान रोपिन्छ
बारी|मकै र कोदो फल्ने
रोपाइँ|असारको धान रोप्ने काम
हलो|गोरुले तान्ने जोत्ने साधन
कोदालो|खन्ने औजार
हँसिया|घाँस काट्ने
बगैँचा|फूल र फलको ठाउँ
सुन्तला|हिउँदको रसिलो फल
अम्बा|बारीको मीठो फल
काफल|जेठमा पाक्ने रातो फल
ऐँसेलु|बाटोछेउको पहेँलो फल
उखु|यसबाट सख्खर बन्छ
सख्खर|उखुको मिठास
सेल|तिहारको गोलो रोटी
अनरसा|चामलको मीठो रोटी
खीर|दूध र चामलको मिठाई
मोही|दहीबाट बन्ने पेय
भँगेरा|आँगनको सानो चरो
कोइली|मीठो स्वरमा गाउँछ
डाँफे|राष्ट्रिय पन्छी
ढुकुर|घुर्घुर गर्ने चरो
पुतली|रङ्गीन पखेटा भएको
गुराँस|राष्ट्रिय फूल
सयपत्री|तिहारको पहेँलो फूल
मखमली|नओइलाउने फूल
छाता|पानीबाट जोगाउँछ
इन्द्रेणी|पानीपछिका सात रङ
`,
};
