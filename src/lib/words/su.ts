// Extra crossword words for this country (filled by the word-content pass).
// Same "WORD|clue|year" lines as wordbank.ts. Keyed by language.
import type { Lang } from '../data';
export const WORDS: Partial<Record<Lang, string>> = {
  ru: `
ПАРАД|Он прошёл на Красной площади 24 июня 1945 года|1945
БЛОКАДА|Ленинград выстоял в ней 872 дня|1941
СТАЛИНГРАД|Город-герой, где переломилась война|1943
ТЕРКИН|«Василий ___» — поэма Твардовского о солдате|1942
КАТЮША|Реактивный миномёт, первый залп дан в 1941 году|1941
ЛЕВИТАН|Диктор, чей голос объявил о Победе|1945
РУСЛАНОВА|Певица, исполнявшая «Валенки» в 1945 году у рейхстага|1945
ШУЛЬЖЕНКО|Певица, чей «Синий платочек» знала вся страна|1940
УЛАНОВА|Балерина, Джульетта в балете Прокофьева|1940
ДИНАМО|Московская команда, гастролировавшая в Британии в 1945 году|1945
ПОБЕДА|Автомобиль ГАЗ-М20, пошёл в серию в 1946 году|1946
ЮБИЛЕЙ|800-летний ___ Москвы отмечали в 1947 году|1947
КАРТОЧКИ|Продуктовые ___ отменили в декабре 1947 года|1947
ЖУКОВ|Маршал Победы, принимавший парад|1945
ТАНК|Знаменитая «тридцатьчетвёрка» Т-34 — это он|1940
ХАЧАТУРЯН|Композитор «Танца с саблями» из балета «Гаянэ»|1942
ШОСТАКОВИЧ|Композитор Седьмой, «Ленинградской» симфонии|1942
ПРОКОФЬЕВ|Композитор, чья «Золушка» дана в Большом театре|1945
КАЛАШНИКОВ|Конструктор автомата, принятого на вооружение|1949
ПОКРЫШКИН|Лётчик, трижды Герой Советского Союза|1944
ХРУЩЕВКА|Типовой пятиэтажный дом из панелей|1957
ОТТЕПЕЛЬ|Повесть Эренбурга, давшая имя целой эпохе|1954
ЦЕЛИНА|Её распахивали в Казахстане по призыву партии|1954
КУКУРУЗА|«Царица полей» при Хрущёве|1955
ЖУРАВЛИ|«Летят ___» — фильм с Золотой пальмовой ветвью|1958
САМОЙЛОВА|Актриса, сыгравшая Веронику в фильме о журавлях|1957
ИЛЬИНСКИЙ|Актёр, сыгравший Огурцова в «Карнавальной ночи»|1956
ГУРЧЕНКО|Актриса, певшая «Пять минут» в «Карнавальной ночи»|1956
ВОЛГА|ГАЗ-21 с оленем на капоте|1956
ТУПОЛЕВ|Конструктор, чей Ту-104 возил пассажиров|1956
ФЕСТИВАЛЬ|Съезд молодёжи мира в Москве, 1957 год|1957
ЛУЖНИКИ|Большой московский стадион, открытый в 1956 году|1956
КОРОЛЁВ|Главный конструктор ракет, чьё имя долго скрывали|1957
ЗЕНИТ|Знаменитый зеркальный фотоаппарат из Красногорска|1952
МГУ|Высотка на Ленинских горах|1953
ЯШИН|Вратарь, олимпийский чемпион Мельбурна|1956
ПАСТЕРНАК|Поэт, названный Нобелевским лауреатом в 1958 году|1958
ОКУДЖАВА|Бард, автор «Бумажного солдатика»|1959
БЕЛКА|Собака, вернувшаяся из космоса вместе со Стрелкой|1960
СТРЕЛКА|Подруга Белки по космическому полёту|1960
ЗАПОРОЖЕЦ|«Ушастый» малыш Запорожского завода|1960
ТИТОВ|Герман, второй советский космонавт|1961
КВН|Телеигра «Клуб весёлых и находчивых»|1961
ОГОНЁК|Голубой ___ — новогодняя передача|1962
ТАГАНКА|Московский театр Любимова, где играл Высоцкий|1964
МЕЛОДИЯ|Всесоюзная фирма грамзаписи|1964
ВОСХОД|Корабль, откуда Леонов вышел в открытый космос|1965
ЛЕОНОВ|Первый человек в открытом космосе|1965
ШУРИК|Студент-тихоня из «Операции Ы»|1965
ШОЛОХОВ|Автор «Тихого Дона», лауреат Нобелевской премии|1965
КАВКАЗСКАЯ|«___ пленница» — комедия Гайдая|1967
ПЛИСЕЦКАЯ|Балерина, исполнявшая «Кармен-сюиту»|1967
ВРЕМЯ|Вечерняя информационная программа Центрального телевидения|1968
НИКУЛИН|Клоун и актёр, герой «Бриллиантовой руки»|1968
КАРЛСОН|Весёлый человек в самом расцвете сил, живёт на крыше|1968
ВИННИПУХ|Медвежонок с опилками в голове из мультфильма Хитрука|1969
ВИЦИН|Артист, игравший Труса в комедиях Гайдая|1961
БИТЛЗ|Ливерпульская четвёрка, чьи записи ловили по радио|1964
СУХОВ|Красноармеец из «Белого солнца пустыни»|1970
ПЕСНЯРЫ|Белорусский ансамбль Мулявина, основан в 1969 году|1969
РОДНИНА|Фигуристка, трижды чемпионка Олимпиады подряд|1980
КОРБУТ|Гимнастка-«пташка» из Минска на Играх в Мюнхене|1972
ХАРЛАМОВ|Нападающий ЦСКА, звезда суперсерии с канадцами|1972
ШТИРЛИЦ|Полковник Исаев, герой «Мгновений весны»|1973
ТИХОНОВ|Актёр, сыгравший полковника Исаева в тылу врага|1973
КОБЗОН|Певец, исполнявший песни «Семнадцати мгновений»|1973
ЕРАЛАШ|Детский юмористический киножурнал|1974
АРЛЕКИНО|Песня Пугачёвой, победившая на «Золотом Орфее»|1975
ЛЕЩЕНКО|Певец, чей «День Победы» поют каждый год|1975
СОЮЗ|Совместный полёт «___ — Аполлон»|1975
САХАРОВ|Академик и правдолюбец, лауреат Нобелевской премии мира|1975
ТЕТЯ|«Здравствуйте, я ваша ___» — телекомедия с Калягиным|1975
КАМАЗ|Грузовик из Набережных Челнов|1976
НИВА|Внедорожник ВАЗ-2121 с полным приводом|1977
МИМИНО|Фильм Данелии о лётчике Валико|1977
СЛУЖЕБНЫЙ|«___ роман» — комедия Рязанова с Мягковым|1977
МОСКВА|Город, который «слезам не верит», фильм Меньшова|1979
ГАРАЖ|Комедия Рязанова о собрании кооператива|1979
ХОЛМС|Сыщик с Бейкер-стрит в исполнении Ливанова|1979
ОЛИМПИЙСКИЙ|Спорткомплекс на проспекте Мира, открытый к Играм-80|1980
ЧАРОДЕИ|Новогодний фильм по мотивам Стругацких|1982
ТЕЛЕМОСТ|Беседа советских и американских зрителей через экран|1982
ЭЛЕКТРОНИКА|Карманная игра, где волк ловит яйца|1984
ПЕРЕСТРОЙКА|Эпоха перемен, объявленная в 1985 году|1985
ГОРБАЧЁВ|Генсек, избранный в марте 1985 года|1985
ГЛАСНОСТЬ|Открытость, ставшая лозунгом эпохи|1986
ЧЕРНОБЫЛЬ|Атомная станция, на которой в апреле 1986 года случилась авария|1986
ВЗГЛЯД|Программа молодых журналистов, ведущий Листьев|1987
ГОРДЕЕВА|Фигуристка, олимпийская чемпионка в паре с Гриньковым|1988
КИНО|Группа Цоя, альбом «Группа крови»|1988
ЦОЙ|Лидер «Кино», автор «Звезды по имени Солнце»|1989
ЛЮБЭ|Группа Расторгуева, основана в 1989 году|1989
МАКДОНАЛДС|Первый в Москве на Пушкинской площади|1990
ПОЛЕЧУДЕС|Телеигра с барабаном и буквами на табло|1990
ТАЛОНЫ|Их выдавали на сахар и масло|1990
ЕЛЬЦИН|Первый президент России|1991
ПУТЧ|Август 1991 года, ГКЧП|1991
СНГ|Содружество Независимых Государств, коротко|1991
ДЕНДИ|Приставка с Марио, пришедшая в 1992 году|1992
НТВ|Первый частный телеканал России|1993
ЛИСТЬЕВ|Журналист «Взгляда», убитый в марте 1995 года|1995
ТИТАНИК|Фильм Кэмерона, ажиотаж в кинотеатрах|1998
ПРИМАДОННА|Песня Пугачёвой про звезду эстрады|1997
ДЕФОЛТ|Августовский кризис в России|1998
ЗЕМФИРА|Певица, чей первый альбом вышел в 1999 году|1999
ВЫСОТКА|Здание сталинской эпохи с острым шпилем|1953
ПЕЛЬМЕНИ|Сибирское блюдо, которое лепят всей семьёй
БОРЩ|Красный суп со сметаной
САМОВАР|Угольный чайник, сердце стола
УШАНКА|Шапка с завязывающимися «ушами»
ВАЛЕНКИ|Тёплая обувь из войлока
ДАЧА|Загородный домик с грядками
БАНЯ|Парная с берёзовым веником
КОММУНАЛКА|Квартира с общей кухней на много семей
МАТРЁШКА|Куколка, внутри которой много куколок
БАЛАЛАЙКА|Трёхструнный инструмент с треугольным корпусом
ВИНЕГРЕТ|Салат со свёклой, картошкой и квашеной капустой
ОЛИВЬЕ|Новогодний салат с горошком и колбасой
СГУЩЁНКА|Сладкое молоко в жестяной банке
`,
  en: `
PARADE|Held in Red Square on 24 June 1945|1945
BLOCKADE|Leningrad endured this for 872 days|1941
STALINGRAD|Hero city where the war turned|1943
KATYUSHA|Rocket launcher and a song about a girl by a river|1941
LEVITAN|Radio announcer who read out the news of victory|1945
SHULZHENKO|Singer whose “Blue Kerchief” everyone knew|1940
ULANOVA|Ballerina, Juliet in Prokofiev’s ballet|1940
DYNAMO|Moscow football club that toured Britain in 1945|1945
POBEDA|Car that means “victory”, built from 1946|1946
ZHUKOV|Marshal of Victory who took the parade|1945
KALASHNIKOV|Designer whose rifle was adopted in 1949|1949
POKRYSHKIN|Fighter ace, three times Hero of the Soviet Union|1944
SHOSTAKOVICH|Composer of the Leningrad Symphony|1942
KHACHATURIAN|Composer of the “Sabre Dance”|1942
PROKOFIEV|Composer of the ballet Cinderella|1945
KRUSHCHEVKA|Standard five-storey panel apartment block|1957
THAW|Name for the easing of the mid-1950s|1954
CORN|“Queen of the fields” in Khrushchev’s campaign|1955
VIRGINLANDS|Kazakh steppe ploughed up by volunteers|1954
SAMOILOVA|Actress who played Veronika in a Cannes-winning film|1958
ILYINSKY|Actor who played Ogurtsov in “Carnival Night”|1956
GURCHENKO|Actress who sang “Five Minutes” in “Carnival Night”|1956
TUPOLEV|Designer of the Tu-104 passenger jet|1956
LUZHNIKI|Big Moscow stadium opened in 1956|1956
FESTIVAL|World Youth ___ held in Moscow in 1957|1957
KOROLEV|Chief Designer of rockets, name long kept secret|1957
ZENIT|Famous SLR camera made near Moscow|1952
YASHIN|Goalkeeper known as the Black Spider|1956
PASTERNAK|Poet named Nobel laureate in 1958|1958
BELKA|Dog who returned from orbit with Strelka|1960
STRELKA|Belka’s companion on the 1960 flight|1960
TITOV|German, the second Soviet cosmonaut|1961
KVN|TV contest of “the cheerful and quick-witted”|1961
TAGANKA|Moscow theatre where Vysotsky acted|1964
VOSKHOD|Spacecraft from which Leonov stepped out|1965
LEONOV|First person to walk in space|1965
SHOLOKHOV|Author of “And Quiet Flows the Don”, Nobel winner|1965
PLISETSKAYA|Prima ballerina who danced “Carmen Suite”|1967
VREMYA|Evening news programme on Soviet television|1968
NIKULIN|Beloved clown and film star of “The Diamond Arm”|1968
KARLSSON|Cheerful fellow living on the roof, cartoon hero|1968
NUPOGODI|Soviet cartoon of a wolf forever chasing a hare, from 1969|1969
BEATLES|Liverpool four whose songs were caught on the radio|1964
BAM|Baikal-Amur Mainline railway, great Siberian project|1974
SOYUZ|Spacecraft of the 1975 handshake with Apollo|1975
ARLEKINO|Pugacheva song that won in Bulgaria|1975
SAKHAROV|Physicist and campaigner, Nobel Peace laureate|1975
KAMAZ|Truck from Naberezhnye Chelny|1976
NIVA|Four-wheel-drive Lada of 1977|1977
MIMINO|Danelia comedy about a Georgian pilot|1977
GARAGE|Ryazanov comedy about a cooperative meeting|1979
HOLMES|Detective played by Livanov on Soviet TV|1979
ERALASH|Children’s humorous short-film magazine|1974
KOBZON|Singer of the songs of “Seventeen Moments”|1973
STIRLITZ|Colonel Isaev’s famous alias in “Seventeen Moments”|1973
RODNINA|Pair skater, three Olympic golds in a row|1980
KORBUT|Gymnast, “the sparrow from Minsk” at Munich|1972
KHARLAMOV|CSKA forward, star of the 1972 Summit Series|1972
HOCKEY|Game of the 1972 Soviet–Canadian Summit Series|1972
OLYMPIC|The Moscow ___ Stadium on Prospekt Mira, 1980|1980
SORCERERS|Soviet New Year film “Charodei”|1982
SPACEBRIDGE|Televised link between Soviet and US audiences|1982
ELEKTRONIKA|Handheld game with a wolf catching eggs|1984
PERESTROIKA|Reform era declared in 1985|1985
GORBACHEV|General Secretary elected in March 1985|1985
GLASNOST|Openness, the slogan of the late 1980s|1986
CHERNOBYL|Nuclear power plant accident of April 1986|1986
VZGLYAD|Young journalists’ show of 1987|1987
GORDEEVA|Skater, Olympic pair champion with Grinkov|1988
KINO|Viktor Tsoi’s rock band|1988
TSOI|Rock singer of “A Star Called the Sun”|1989
LYUBE|Rock band formed in 1989 by Rastorguev|1989
MCDONALDS|First one opened in Moscow’s Pushkin Square|1990
COUPONS|Rationing slips for sugar and butter|1990
YELTSIN|First President of Russia|1991
COUP|August 1991 attempt to remove Gorbachev|1991
DENDY|Console with Mario that arrived in 1992|1992
LISTYEV|Journalist of “Vzglyad”, murdered in March 1995|1995
TITANIC|Cameron film that filled cinemas|1998
DEFAULT|The financial crisis of August 1998|1998
ZEMFIRA|Singer whose first album came out in 1999|1999
BERLIN|Soviet soldiers raised a red flag over its Reichstag|1945
YALTA|Crimean resort where the Allies met in 1945|1945
KOSYGIN|Soviet premier from 1964|1964
DETENTE|Easing of Cold War tension in the early 1970s|1972
KASPAROV|Young chess genius who became world champion|1985
MIR|Space station launched in 1986|1986
SPITAK|Armenian town hit by a terrible earthquake|1988
BURAN|Soviet space shuttle that flew once, unmanned|1988
VOUCHER|Privatisation slip handed to every citizen|1992
LUZHKOV|Moscow mayor from 1992|1992
DEEPBLUE|Computer that beat Kasparov at chess|1997
CIS|Commonwealth formed after the Union ended|1991
PETERSBURG|Leningrad got this old name back in 1991|1991
SAMIZDAT|Secretly typed books passed from hand to hand
RUBLE|Currency divided into a hundred kopecks
GUM|Grand department store on Red Square
METRO|Moscow’s underground palace of marble
TROIKA|Sleigh drawn by three horses
KREMLIN|Red-starred fortress in the heart of Moscow
BOLSHOI|Moscow theatre of ballet and opera
SAMBO|Soviet martial art
GORKY|Moscow park where people strolled on Sundays
BORSCHT|Red beet soup with sour cream
SAMOVAR|Urn that kept the tea hot
USHANKA|Fur hat with ear flaps
VALENKI|Warm felt boots
DACHA|Country cottage with a vegetable patch
BANYA|Steam bath with birch twigs
MATRYOSHKA|Nesting doll
BALALAIKA|Three-stringed triangular instrument
PELMENI|Siberian dumplings made by the whole family
OLIVIER|Russian New Year potato salad
KOMMUNALKA|Flat where many families share one kitchen
BALLAD|“___ of a Soldier”, Chukhrai’s 1959 film|1959
`,
};
