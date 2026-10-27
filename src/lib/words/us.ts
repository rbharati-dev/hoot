// Extra crossword words for this country (filled by the word-content pass).
// Same "WORD|clue|year" lines as wordbank.ts. Keyed by language.
import type { Lang } from '../data';
export const WORDS: Partial<Record<Lang, string>> = {
  en: `
PEARLHARBOR|Hawaii naval base attacked on December 7, 1941|1941
DIMAGGIO|Joe, who hit safely in 56 straight games|1941
CITIZENKANE|Orson Welles film about a man’s last word, “Rosebud”|1941
DUMBO|Disney’s flying elephant|1941
USO|Group that entertained the troops, founded 1941|1941
HOPE|Bob, who entertained troops overseas|1941
BOGART|Humphrey, Rick in “Casablanca”|1942
CASABLANCA|Film with “Here’s looking at you, kid”|1942
CROSBY|Bing, who dreamed of a white Christmas|1942
ROSIE|___ the Riveter, symbol of women war workers|1943
DDAY|June 6, 1944, Allied landings in Normandy|1944
GIBILL|1944 law that sent veterans to college|1944
TRUMAN|President who took office in April 1945|1945
BABYBOOM|Surge in births after the war|1946
TUPPERWARE|Airtight plastic containers sold at home parties|1948
BIKINI|Two-piece swimsuit named for a Pacific atoll|1946
HOWDYDOODY|Freckled puppet of children’s TV|1947
LEVITTOWN|Mass-produced Long Island suburb|1947
ROBINSON|Jackie, who broke baseball’s color line|1947
BERLE|Milton, “Mr. Television”|1948
POLAROID|Camera that printed photos in a minute|1948
CANDYLAND|Board game through Lollipop Woods|1949
DESI|Arnaz, Ricky Ricardo on TV|1951
EISENHOWER|General turned president, “I like Ike”|1952
SWANSON|Company that sold the first TV dinner|1953
MONROE|Marilyn, star of “Gentlemen Prefer Blondes”|1953
CORVETTE|Chevrolet two-seat sports car|1953
BRANDO|Marlon, “On the Waterfront” star|1954
BROWN|___ v. Board of Education, school ruling of 1954|1954
DEAN|James, “Rebel Without a Cause”|1955
HALEY|Bill, “Rock Around the Clock”|1955
GLEASON|Jackie, “To the moon, Alice!”|1955
PARKS|Rosa, who kept her seat on a Montgomery bus|1955
SALK|Jonas, polio vaccine|1955
CROCKETT|Davy, coonskin-cap hero of TV|1955
MOUSEKETEER|Club member wearing mouse ears|1955
MCDONALDS|Ray Kroc opened his first franchise in 1955|1955
THUNDERBIRD|Ford two-seater of 1955|1955
SPUTNIK|Soviet satellite that startled Americans|1957
LITTLEROCK|Arkansas city where nine students integrated a school|1957
HOLLY|Buddy, who sang “That’ll Be the Day”|1957
BERRY|Chuck, “Johnny B. Goode”|1958
EDSEL|Ford’s much-hyped car of 1958|1958
SILLYPUTTY|Stretchy toy that lifted comics|1950
SCRABBLE|Word game with lettered tiles, a hit in 1952|1952
FLINTSTONES|Prime-time cartoon set in Bedrock|1960
ETCHASKETCH|Red-framed drawing toy with two knobs|1960
SHEPARD|Alan, first American in space|1961
CAMELOT|Nickname of the Kennedy White House, from a Broadway musical|1963
MARIS|Roger, who hit 61 home runs|1961
GLENN|John, first American to orbit Earth|1962
CARSON|Johnny, host of “The Tonight Show”|1962
KING|Dr. Martin Luther ___ Jr., “I Have a Dream”|1963
DYLAN|Bob, “Blowin’ in the Wind”|1963
BEACHBOYS|Surf-sound group of “Surfin’ USA”|1963
EASYBAKE|Toy oven heated by a light bulb|1963
ALI|Muhammad, who floated like a butterfly|1964
SULLIVAN|Ed, whose Sunday show hosted the Beatles|1964
SUPREMES|Diana Ross’s Motown trio|1964
BEWITCHED|Sitcom with a twitching nose|1964
GILLIGAN|Castaway first mate on a TV island|1964
SELMA|Alabama city of the 1965 voting-rights march|1965
KOUFAX|Sandy, Dodgers lefty with a perfect game|1965
BATMAN|Camp TV hero who said “Pow!”|1966
TWISTER|Game that ties players in knots|1966
MONKEES|Made-for-TV band of “Daydream Believer”|1966
HENDRIX|Jimi, guitar legend at Monterey|1967
ARETHA|Queen of Soul with “Respect”|1967
HAIGHT|San Francisco district of the Summer of Love|1967
LOMBARDI|Vince, Packers coach with a trophy|1967
HOTWHEELS|Mattel’s tiny die-cast cars|1968
HERBIE|The Love Bug, number 53|1968
JOPLIN|Janis, “Piece of My Heart”|1968
NAMATH|Joe, who guaranteed a Jets Super Bowl win|1969
SESAMESTREET|Where Big Bird and Oscar the Grouch live|1969
CARPENTERS|Siblings who sang “Close to You”|1970
FRAZIER|Joe, who beat Ali in 1971|1971
DENVER|John, “Take Me Home, Country Roads”|1971
STARBUCKS|Seattle coffee shop that opened in 1971|1971
ARCHIE|Bunker, loud hero of “All in the Family”|1971
MASH|Sitcom about Korean War army doctors|1972
GODFATHER|Film with “an offer he can’t refuse”|1972
PONG|Simple video tennis game|1972
SKYLAB|First American space station|1973
BILLIEJEAN|Tennis star who beat Bobby Riggs in 1973|1973
STREISAND|Barbra, “The Way We Were”|1973
WATERGATE|Scandal that ended a presidency|1974
AARON|Hank, who passed Babe Ruth’s home run total|1974
FONZIE|Leather-jacketed cool guy of “Happy Days”|1974
JAWS|Spielberg’s shark movie|1975
SNL|“Live from New York, it’s Saturday night!”|1975
MICROSOFT|Software company founded in 1975|1975
PETROCK|Gift craze that came with a care manual|1975
SPRINGSTEEN|The Boss, “Born to Run”|1975
ROCKY|Boxer who ran up the museum steps|1976
EAGLES|Band of “Hotel California”|1976
BICENTENNIAL|The nation’s 200th birthday year|1976
CARTER|Peanut farmer elected President in 1976|1976
APPLE|Computer company started in a garage|1976
ANGELS|Charlie’s ___, TV detectives with feathered hair|1976
STARWARS|Space film that began “A long time ago”|1977
ROOTS|Alex Haley saga watched by millions in 1977|1977
TRAVOLTA|John, disco dancer of 1977|1977
FLEETWOOD|___ Mac, “Rumours”|1977
GREASE|Poodle-skirt musical with Olivia Newton-John|1978
THREEMILE|___ Island, site of the 1979 nuclear accident|1979
STEELERS|Pittsburgh team with four Super Bowls in six years|1979
REAGAN|Actor who became the 40th President|1980
MAGIC|Johnson, Lakers point guard with a famous smile|1980
BIRD|Larry, Celtics star from French Lick|1980
PACMAN|Yellow arcade muncher chased by ghosts|1980
RUBIKS|Colorful twisting cube puzzle|1980
MIRACLE|___ on Ice, 1980 U.S. hockey win|1980
DALLAS|Texas oil family on TV, “Who shot J.R.?”|1980
MTV|Channel that began with “Video Killed the Radio Star”|1981
RAIDERS|___ of the Lost Ark, Indiana Jones’s first film|1981
DYNASTY|Prime-time soap with Joan Collins|1981
CHEERS|Boston bar where everybody knows your name|1982
JACKSON|Michael, whose “Thriller” sold millions|1982
RIDE|Sally, first American woman in space|1983
CABBAGE|___ Patch Kids, dolls with adoption papers|1983
MADONNA|“Like a Virgin” singer|1984
PRINCE|“Purple Rain” star|1984
GHOSTBUSTERS|“Who you gonna call?”|1984
MIAMIVICE|Pastel cop show with Crockett and Tubbs|1984
NINTENDO|Maker of the home console with Mario|1985
LIVEAID|Concert for famine relief, 1985|1985
ROSE|Pete, who broke baseball’s all-time hit record|1985
NEWCOKE|Coca-Cola’s flop of 1985|1985
GOLDENGIRLS|Four Miami seniors sharing a house on TV|1985
CHALLENGER|Space shuttle lost in January 1986|1986
TOPGUN|Maverick’s flying school film|1986
OPRAH|Talk show host who went national in 1986|1986
DIRTYDANCING|Film where “nobody puts Baby in a corner”|1987
GIBSON|Kirk, whose limping homer won a 1988 game|1988
BUSH|41st President, elected 1988|1988
MONTANA|Joe, cool 49ers quarterback|1989
SIMPSONS|Yellow cartoon family that began in 1989|1989
GAMEBOY|Handheld that came with Tetris|1989
BERLINWALL|It came down in November 1989|1989
SEINFELD|“Show about nothing” in New York|1989
DESERTSTORM|Gulf War operation of 1991|1991
NIRVANA|Seattle band of “Smells Like Teen Spirit”|1991
GRUNGE|Flannel-shirted music from Seattle|1991
CLINTON|42nd President from Arkansas|1992
DREAMTEAM|1992 Olympic basketball squad of NBA stars|1992
XFILES|“The truth is out there” TV series|1993
JURASSIC|___ Park, dinosaurs on the loose|1993
FRIENDS|Six pals in New York, “I’ll Be There for You”|1994
NETSCAPE|Early web browser|1994
FORREST|Gump, running with a box of chocolates|1994
WINDOWS|Microsoft system that came with a Start button|1995
TOYSTORY|First full-length computer-animated film|1995
AMAZON|Online bookseller that opened in 1995|1995
EBAY|Online auction site|1995
RIPKEN|Cal, who broke Lou Gehrig’s games streak|1995
TIGER|Woods, who won the Masters at 21|1997
TITANIC|Film with Jack and Rose|1997
BRITNEY|“...Baby One More Time” singer|1998
FURBY|Chattering fuzzy toy|1998
POKEMON|Pocket monsters, Pikachu craze|1998
GOOGLE|Search engine founded in 1998|1998
BULLS|Chicago team that won six titles in the 1990s|1998
DINER|Chrome-trimmed place for pie and coffee
PICKUP|Truck with an open bed
PORCH|Where neighbors sat on summer evenings
BARBECUE|Backyard cooking on the Fourth of July
THANKSGIVING|Turkey day in November
MEATLOAF|Dinner baked in a loaf pan
PEANUTBUTTER|Sandwich spread paired with jelly
LEMONADE|Cold drink sold at a children’s stand
HOTDOG|Ballpark sausage in a bun
SUPERMARKET|Big grocery store with carts
MAILBOX|Curbside box for letters and flags
BASEBALL|America’s pastime
COWBOY|Rider of the Old West
`,
  es: `
PEARLHARBOR|Base naval de Hawái atacada en diciembre de 1941|1941
DIMAGGIO|Joe, que bateó en 56 juegos seguidos|1941
DUMBO|Elefantito volador de Disney|1941
HOPE|Bob, que animaba a las tropas lejos de casa|1941
BOGART|Humphrey, el Rick de la película de 1942|1942
CASABLANCA|Película de 1942 donde suena «As Time Goes By»|1942
CROSBY|Bing, el de «Blanca Navidad»|1942
BRACEROS|Programa de trabajadores mexicanos en EE. UU. desde 1942|1942
ZOOTSUIT|Traje largo de moda entre los pachucos|1943
PACHUCO|Joven mexicoamericano de traje zoot y copete|1943
ROSIE|___ la Remachadora, símbolo de las obreras de guerra|1943
DDAY|6 de junio de 1944, desembarco aliado en Normandía|1944
TRUMAN|Presidente que asumió en abril de 1945|1945
BIKINI|Traje de baño de dos piezas nombrado por un atolón|1946
TUPPERWARE|Recipientes de plástico vendidos en reuniones de amigas|1946
BABYBOOM|Explosión de natalidad tras la guerra|1946
LEVITTOWN|Suburbio de casas en serie en Long Island|1947
ROBINSON|Jackie, que rompió la barrera racial en el béisbol|1947
MENDEZ|Familia cuyo caso acabó con escuelas segregadas en California|1947
HOWDYDOODY|Marioneta pecosa de la tele infantil|1947
BERLE|Milton, el «Míster Televisión»|1948
POLAROID|Cámara que revelaba la foto en un minuto|1948
MARSHALL|Plan ___ de 1948 para reconstruir Europa|1948
ARNAZ|Desi, cubano que fue Ricky Ricardo en la tele|1951
EISENHOWER|El general Ike, elegido presidente en 1952|1952
SCRABBLE|Juego de fichas con letras|1952
MONROE|Marilyn, la rubia de «Los caballeros las prefieren rubias»|1953
CORVETTE|Deportivo de dos plazas de Chevrolet|1953
BRANDO|Marlon, estrella de «On the Waterfront»|1954
MAYS|Willie, el «Say Hey Kid» de los Giants|1954
DEAN|James, el «Rebelde sin causa»|1955
HALEY|Bill, el de «Rock Around the Clock»|1955
GLEASON|Jackie, el de «¡A la luna, Alicia!»|1955
PARKS|Rosa, que no cedió su asiento en el autobús|1955
SALK|Jonas, creador de la vacuna contra la polio|1955
CROCKETT|Davy, héroe con gorro de mapache|1955
MCDONALDS|La primera franquicia de Ray Kroc abrió en 1955|1955
THUNDERBIRD|Auto deportivo de Ford de dos plazas|1955
SPUTNIK|Satélite soviético que sorprendió a EE. UU.|1957
LITTLEROCK|Ciudad de Arkansas donde nueve jóvenes integraron una escuela|1957
ZORRO|Enmascarado de Disney que dibujaba una Z|1957
HOLLY|Buddy, el de «That’ll Be the Day»|1957
VALENS|Ritchie, el joven roquero de «La Bamba»|1958
LABAMBA|Rock de 1958 basado en un son jarocho|1958
EDSEL|Auto de Ford, famoso fracaso|1958
PALMER|Arnold, el Rey del golf|1960
MARIS|Roger, que bateó 61 jonrones|1961
SHEPARD|Alan, primer estadounidense en el espacio|1961
CAMELOT|Apodo de la Casa Blanca de Kennedy, tomado de un musical|1963
WESTSIDE|Historia de pandillas y de María, «___ Story»|1961
CELIACRUZ|Reina de la salsa que dejó Cuba en 1960|1960
GLENN|John, primer estadounidense en orbitar la Tierra|1962
MORENO|Rita, ganadora del Óscar por «West Side Story»|1962
CHAVEZ|César, líder de los campesinos de California|1962
HUERTA|Dolores, cofundadora del sindicato de campesinos|1962
TITOPUENTE|Rey del timbal, autor de «Oye cómo va»|1962
CARSON|Johnny, anfitrión del «Tonight Show»|1962
NICKLAUS|Jack, el Oso Dorado del golf|1962
CHAMBERLAIN|Wilt, que anotó 100 puntos en un juego|1962
KING|Martin Luther ___ Jr., «Tengo un sueño»|1963
BEATLES|Cuarteto de Liverpool que conquistó EE. UU. en 1964|1964
SULLIVAN|Ed, cuyo show de domingo era el más visto|1964
SUPREMES|Trío de Diana Ross con «Baby Love»|1964
FANIA|Disquera neoyorquina que lanzó la salsa|1964
HECHIZADA|Serie de la brujita Samantha|1964
ALI|El boxeador que volaba como mariposa|1964
SELMA|Ciudad de Alabama de la marcha por el voto|1965
KOUFAX|Sandy, lanzador zurdo de los Dodgers|1965
VIETNAM|Guerra que dominó los noticieros|1965
UVAS|Boicot de las ___ de California|1965
DYLAN|Bob, poeta del folk de «Like a Rolling Stone»|1965
MONKEES|Grupo de televisión de «Daydream Believer»|1966
BATMAN|Serie del hombre murciélago, con «¡Pow!»|1966
HENDRIX|Jimi, guitarrista del festival de Monterey|1967
ARETHA|Reina del soul, la de «Respect»|1967
HIPPIE|Joven de flores y paz del verano del amor|1967
COLON|Willie, trombonista de «El malo»|1967
LOMBARDI|Vince, entrenador de los Packers|1967
SUPERBOWL|Gran final del fútbol americano, desde 1967|1967
JOPLIN|Janis, de «Piece of My Heart»|1968
CHICANO|Orgullo mexicoamericano del movimiento de los sesenta|1968
HOTWHEELS|Autitos de metal de Mattel|1968
NAMATH|Joe, que prometió ganar el Super Bowl|1969
SANTANA|Carlos, guitarrista de «Black Magic Woman»|1970
OYECOMOVA|Éxito de Tito Puente retomado por Santana|1970
FRAZIER|Joe, que venció a Ali en 1971|1971
STARBUCKS|Cafetería de Seattle abierta en 1971|1971
ARCHIE|Bunker, gruñón de «Todo en familia»|1971
CLEMENTE|Roberto, el pelotero de los 3.000 hits|1972
PADRINO|«El ___», película de Coppola con Marlon Brando|1972
PONG|Tenis electrónico de pantalla|1972
MASH|Serie de médicos en la guerra de Corea|1972
SKYLAB|Primera estación espacial de EE. UU.|1973
BILLIEJEAN|Tenista que ganó la «batalla de los sexos»|1973
NIXON|Presidente que renunció en 1974|1974
WATERGATE|Escándalo que acabó con una presidencia|1974
AARON|Hank, que superó los jonrones de Babe Ruth|1974
EVERT|Chris, reina del tenis|1974
TIBURON|Película de Spielberg sobre el escualo de la playa|1975
MICROSOFT|Empresa de software fundada en 1975|1975
PETROCK|Piedra de mascota con manual de cuidados|1975
ROCKY|Boxeador que subió corriendo las escaleras del museo|1976
CARTER|Granjero de maní elegido presidente en 1976|1976
APPLE|Compañía fundada en un garaje|1976
ANGELES|Los ___ de Charlie, detectives de la tele|1976
BICENTENARIO|Los 200 años de EE. UU.|1976
STARWARS|Película espacial que empezó en 1977 con «hace mucho tiempo»|1977
RAICES|Miniserie de 1977 basada en Alex Haley|1977
TRAVOLTA|John, bailarín de la fiebre del sábado por la noche|1977
VOYAGER|Sondas lanzadas en 1977 hacia los planetas|1977
LAVOE|Héctor, cantante de «El cantante»|1978
CALLEOCHO|Festival de la Pequeña Habana, en Miami|1978
GREASE|Película con Travolta y Olivia Newton-John|1978
STEELERS|Equipo de Pittsburgh con cuatro Super Bowls|1979
REAGAN|Actor que llegó a presidente en 1980|1980
MARIEL|Puerto cubano del éxodo de 1980|1980
BIRD|Larry, estrella de los Celtics|1980
PACMAN|Bolita amarilla que huye de fantasmas|1980
RUBIK|Cubo de colores que gira|1980
MILAGRO|___ sobre hielo, victoria de EE. UU. en 1980|1980
MTV|Canal de videos musicales|1981
INDIANAJONES|Arqueólogo del látigo, «En busca del arca perdida»|1981
DINASTIA|Telenovela estadounidense de los Carrington|1981
VALENZUELA|Fernando, zurdo que enloqueció a Los Ángeles|1981
THRILLER|Disco de Michael Jackson que rompió récords|1982
RIDE|Sally, primera astronauta de EE. UU.|1983
MADONNA|La de «Like a Virgin»|1984
PRINCE|Cantante de «Purple Rain»|1984
GHOSTBUSTERS|Película: «¿A quién vas a llamar?»|1984
MIAMIVICE|Policías pastel de Crockett y Tubbs|1984
JORDAN|Michael, estrella de los Bulls|1984
JULIO|Cantante español que hizo dueto con Willie Nelson|1984
NINTENDO|Consola de Mario|1985
LIVEAID|Concierto contra el hambre en Etiopía|1985
ESTEFAN|Gloria, de Miami Sound Machine y «Conga»|1985
ROSE|Pete, récord de hits del béisbol|1985
CHALLENGER|Transbordador que se perdió en 1986|1986
TOPGUN|Película de pilotos con Tom Cruise|1986
SABADO|«___ Gigante», el programa de Don Francisco|1986
OPRAH|Presentadora que se hizo nacional en 1986|1986
GIBSON|Kirk, jonrón cojeando|1988
BUSH|George, presidente elegido en 1988|1988
MONTANA|Joe, mariscal de campo de los 49ers|1989
SIMPSON|La familia amarilla de Homero|1989
CRISTINA|Saralegui, reina de las charlas de la tele|1989
MURO|El de Berlín cayó en noviembre de 1989|1989
GAMEBOY|Consola portátil de Nintendo con Tetris|1989
DESIERTO|Tormenta del ___, operación de 1991|1991
NIRVANA|Banda de Seattle de «Smells Like Teen Spirit»|1991
CLINTON|Presidente elegido en 1992|1992
DREAMTEAM|Equipo de ensueño del baloncesto|1992
JURASICO|Parque ___, dinosaurios sueltos|1993
FORRESTGUMP|Corredor con una caja de chocolates|1994
NETSCAPE|Navegador pionero de internet|1994
WINDOWS|Sistema de Microsoft con botón de inicio|1995
TOYSTORY|Primera película totalmente animada por computadora|1995
AMAZON|Librería en línea abierta en 1995|1995
EBAY|Sitio de subastas en línea|1995
RIPKEN|Cal, que superó la racha de Lou Gehrig|1995
TIGER|Woods, campeón del Masters a los 21|1997
TITANIC|Película de Jack y Rose|1997
BRITNEY|Cantante de «...Baby One More Time»|1998
FURBY|Peluche parlanchín de 1998|1998
POKEMON|Pikachu y su fiebre|1998
GOOGLE|Buscador fundado en 1998|1998
BULLS|Equipo de Chicago, seis títulos en los noventa|1998
MARTIN|Ricky, el de «Livin’ la Vida Loca»|1999
LOPEZ|Jennifer, del Bronx a estrella mundial|1999
BEISBOL|El pasatiempo nacional
HOTDOG|Salchicha en pan, comida del estadio
HAMBURGUESA|Carne molida entre dos panes
BARBACOA|Carne a la parrilla en el patio
PAVO|Ave de la cena de Acción de Gracias
TAMALES|Masa envuelta en hojas de maíz en Navidad
TACOS|Tortilla doblada con carne
QUINCEANERA|Gran fiesta de los quince años
CINCODEMAYO|Fiesta mexicana celebrada en EE. UU.
PIÑATA|Figura de papel llena de dulces
BODEGA|Tiendita de la esquina
SUPERMERCADO|Donde se hace la compra semanal
BARRIO|Vecindario donde todos se conocen
CAFECITO|Tacita cubana de la ventanilla
`,
};
