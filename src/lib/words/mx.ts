// Extra crossword words for Mexico. "WORD|clue|year" lines, keyed by language.
import type { Lang } from '../data';

const ES = `
AVILACAMACHO|Manuel ___, presidente desde 1940|1940
DETALLE|«Ahí está el ___», filme de Cantinflas|1940
NEGRETE|Jorge, el Charro Cantor de «Ay Jalisco»|1941
LARA|Agustín, autor de «Solamente una vez»|1941
MARIAFELIX|La Doña de «Doña Bárbara»|1943
ARMENDARIZ|Pedro, galán de «María Candelaria»|1944
PANCHOS|Los ___, trío romántico fundado en 1944|1944
BIMBO|Panadería nacida en 1945|1945
ALEMAN|Miguel ___, presidente desde 1946|1946
PLAZAMEXICO|La plaza de toros más grande del mundo|1946
POBRES|«Nosotros los ___», filme de Pedro Infante|1948
MARILES|Humberto, jinete campeón olímpico|1948
BLUEDEMON|Enmascarado que debutó en 1948, rival y amigo del Santo|1948
LABERINTO|«El ___ de la soledad», de Octavio Paz|1950
OLVIDADOS|Los ___, filme de Buñuel sobre niños de la calle|1950
JARRITOS|Refresco de sabores nacido en 1950|1950
TELMEX|Teléfonos de México, fundada en 1947|1947
MIRAMONTES|Luis, coinventor de la píldora anticonceptiva|1951
RUIZCORTINES|Adolfo ___, presidente desde 1952|1952
JURADO|Katy, estrella de «Solo ante el peligro»|1952
VOTO|Las mexicanas lo ganaron en 1953|1953
RULFO|Juan, autor de «El llano en llamas»|1953
KAHLO|Frida, pintora de autorretratos, murió en 1954|1954
MACIAS|Raúl «Ratón», campeón mundial de peso gallo|1955
PARAMO|Pedro ___, novela de Juan Rulfo|1955
CAPILLA|Joaquín, clavadista campeón olímpico|1956
RIVERA|Diego, muralista, murió en 1957|1957
GANSITO|Pastelillo de Marinela con mermelada y chocolate|1957
AURRERA|Supermercado inaugurado en 1958|1958
LOPEZMATEOS|Adolfo ___, presidente desde 1958|1958
FUENTES|Carlos, autor de «La región más transparente»|1958
MACARIO|Filme mexicano nominado al Óscar en 1960|1960
PINAL|Silvia, estrella de «Viridiana»|1961
CHIVAS|Guadalajara, el Campeonísimo|1962
OSUNA|Rafael, campeón del US Open de tenis|1963
KALIMAN|El Hombre Increíble de la radio|1963
DIAZORDAZ|Gustavo ___, presidente desde 1964|1964
ANTROPOLOGIA|Museo Nacional de ___, inaugurado en Chapultepec en 1964|1964
MILMASCARAS|Luchador enmascarado de los mil rostros, debutó en 1963|1963
SUPERMACHOS|Historieta de Rius, de 1965|1965
SOLIS|Javier, el Rey del bolero ranchero, murió en 1966|1966
TLATELOLCO|Plaza donde murieron manifestantes el 2 de octubre de 1968|1968
VELASCO|Raúl, presentador de «Siempre en domingo»|1969
OLIVARES|Rubén «Púas», campeón de peso gallo|1969
NAPOLES|José «Mantequilla», campeón welter|1969
JUANITO|Mascota del Mundial de 1970|1970
CHAPULIN|El ___ Colorado, héroe torpe y simpático|1970
TOPO|«El ___», filme de Jodorowsky|1970
ECHEVERRIA|Luis, presidente desde 1970|1970
INFONAVIT|Instituto de vivienda de los trabajadores|1972
VOLVER|«___, volver», éxito de Vicente Fernández|1972
JIMENEZ|José Alfredo, compositor ranchero, murió en 1973|1973
TELEVISA|Gigante de la televisión, formado en 1973|1973
PORTILLO|José López ___, presidente desde 1976|1976
BAUTISTA|Daniel, oro olímpico en marcha|1976
BASILICA|Nueva ___ de Guadalupe, inaugurada en 1976|1976
CANOA|Filme de 1976 sobre un suceso en Puebla|1976
OXXO|Tienda nacida en Monterrey en 1978|1978
RICOS|Los ___ también lloran, telenovela|1979
SALVADOR|___ Sánchez, campeón pluma desde 1980|1980
VALENZUELA|Fernando, zurdo de los Dodgers|1981
LUISMIGUEL|El Sol de México, cantante|1982
TIMBIRICHE|Grupo juvenil de Sasha y Paulina Rubio|1982
GARCIAROBLES|Alfonso, Nobel de la Paz|1982
DELAMADRID|Miguel ___, presidente desde 1982|1982
CHAVEZ|Julio César, campeón mundial de boxeo|1984
TSURU|Nissan ___, auto y taxi popular|1984
SISMO|El de septiembre de 1985 sacudió la capital|1985
NERI|Rodolfo ___ Vela, primer astronauta mexicano|1985
PIQUE|Mascota del Mundial de 1986|1986
CUNADELOBOS|Telenovela de la malvada Catalina Creel|1986
SALVAJE|Rosa ___, telenovela de Verónica Castro|1987
SALINAS|Carlos, presidente desde 1988|1988
CARRUSEL|Telenovela infantil de 1989|1989
TREVI|Gloria, cantante de «Dr. Psiquiatra»|1989
CHOCOLATE|Como agua para ___, novela de Laura Esquivel|1989
PAZ|Octavio, Nobel de Literatura|1990
SANCHEZ|Hugo, cinco veces Pichichi en España|1990
ROMANCE|Disco de boleros de Luis Miguel|1991
MANA|Banda de «¿Dónde jugarán los niños?»|1992
CAFETACVBA|Banda de «La ingrata»|1994
CRONOS|Primer largo de Guillermo del Toro|1993
ZEDILLO|Ernesto, presidente desde 1994|1994
CAMPOS|Jorge, portero de uniformes de colores|1994
MARIMAR|Telenovela con Thalía|1994
ZAPATISTAS|Ejército que apareció en Chiapas en 1994|1994
TLC|Tratado de Libre Comercio de 1994|1994
MOLINA|Mario, Nobel de Química|1995
MOLOTOV|Banda de «Gimme tha power»|1997
USURPADORA|La ___, telenovela de 1998|1998
BLANCO|Cuauhtémoc, el Temo del Mundial de 1998|1998
PERROS|«Amores ___», filme de Iñárritu|2000
FOX|Vicente ___, ganó la presidencia en 2000|2000
TAMAL|Masa envuelta en hoja de maíz
MOLE|Salsa de chiles y chocolate
POZOLE|Caldo de maíz cacahuazintle con carne
ELOTE|Mazorca con mayonesa y chile
CHILAQUILES|Totopos bañados en salsa, para el desayuno
PULQUE|Bebida espesa del maguey
MEZCAL|Destilado de agave de Oaxaca
TEQUILA|Destilado de agave azul de Jalisco
HORCHATA|Agua fresca de arroz y canela
CHURRO|Masa frita con azúcar
QUESADILLA|Tortilla doblada con queso
GUACAMOLE|Aguacate machacado
PINATA|Se rompe a palos en la posada
REBOZO|Chal largo de las mujeres
TIANGUIS|Mercado ambulante al aire libre
ZOCALO|Plaza principal de la capital
XOCHIMILCO|Canales con barcas de colores
TRAJINERA|Barca florida de Xochimilco
CHARRO|Jinete con traje bordado y sombrero ancho
OFRENDA|Altar del Día de Muertos
CATRINA|Calavera elegante de Posada
CEMPASUCHIL|Flor naranja de los muertos
BALERO|Juguete de madera con bola y palo
MOLCAJETE|Mortero de piedra para la salsa
ATOLE|Bebida caliente de maíz
TLAYUDA|Tortilla grande oaxaqueña
CAJETA|Dulce de leche de cabra
XEW|«La Voz de la América Latina», radio
`;

const EN = `
AVILACAMACHO|Manuel ___, president from 1940|1940
DETALLE|“Ahí está el ___”, a Cantinflas film|1940
NEGRETE|Jorge, the singing charro of “Ay Jalisco”|1941
LARA|Agustín, who wrote “Solamente una vez”|1941
MARIAFELIX|The “Doña” of Mexican cinema|1943
ARMENDARIZ|Pedro, star of “María Candelaria”|1944
PANCHOS|Los ___, romantic trio formed in 1944|1944
BIMBO|Bakery brand founded in 1945|1945
ALEMAN|Miguel ___, president from 1946|1946
PLAZAMEXICO|World’s largest bullring|1946
POBRES|“Nosotros los ___”, a Pedro Infante film|1948
MARILES|Humberto, Olympic equestrian champion|1948
BLUEDEMON|Masked wrestler who debuted in 1948, rival and friend of El Santo|1948
LABERINTO|“The ___ of Solitude”, by Octavio Paz|1950
OLVIDADOS|“The Young and the Damned”, by Buñuel|1950
JARRITOS|Fruit-flavoured soda born in 1950|1950
TELMEX|Telephone company founded in 1947|1947
MIRAMONTES|Luis, co-inventor of the contraceptive pill|1951
RUIZCORTINES|Adolfo ___, president from 1952|1952
JURADO|Katy, star of “High Noon”|1952
SUFFRAGE|Mexican women won it in 1953|1953
RULFO|Juan, author of “The Burning Plain”|1953
KAHLO|Frida, painter of self-portraits, died in 1954|1954
MACIAS|Raúl “Ratón”, bantamweight world champion|1955
PARAMO|Pedro ___, novel by Juan Rulfo|1955
CAPILLA|Joaquín, Olympic diving champion|1956
RIVERA|Diego, the muralist, died in 1957|1957
GANSITO|Marinela snack cake with jam and a chocolate coating|1957
AURRERA|Supermarket chain opened in 1958|1958
LOPEZMATEOS|Adolfo ___, president from 1958|1958
FUENTES|Carlos, author of “Where the Air Is Clear”|1958
MACARIO|Mexican film nominated for an Oscar in 1960|1960
PINAL|Silvia, star of “Viridiana”|1961
CHIVAS|Guadalajara’s great team of the 1960s|1962
OSUNA|Rafael, US Open tennis champion|1963
KALIMAN|The “Incredible Man” of radio|1963
DIAZORDAZ|Gustavo ___, president from 1964|1964
ANTROPOLOGIA|National Museum of ___, opened at Chapultepec in 1964|1964
MILMASCARAS|Wrestler of a thousand masks, debuted in 1963|1963
SUPERMACHOS|Rius’s comic strip of 1965|1965
SOLIS|Javier, king of the ranchero bolero, died in 1966|1966
TLATELOLCO|Square where protesters died on October 2, 1968|1968
VELASCO|Raúl, host of “Siempre en domingo”|1969
OLIVARES|Rubén “Púas”, bantamweight champion|1969
NAPOLES|José “Mantequilla”, welterweight champion|1969
JUANITO|Mascot of the 1970 World Cup|1970
CHAPULIN|El ___ Colorado, a clumsy, lovable hero|1970
TOPO|“El ___”, film by Jodorowsky|1970
ECHEVERRIA|Luis, president from 1970|1970
INFONAVIT|Workers’ housing institute|1972
VOLVER|“___, volver”, Vicente Fernández hit|1972
JIMENEZ|José Alfredo, ranchero composer, died in 1973|1973
TELEVISA|Television giant formed in 1973|1973
PORTILLO|José López ___, president from 1976|1976
BAUTISTA|Daniel, Olympic gold in race walking|1976
BASILICA|New ___ of Guadalupe, opened in 1976|1976
CANOA|1976 film about an event in Puebla|1976
OXXO|Convenience store born in Monterrey in 1978|1978
RICOS|Los ___ también lloran, telenovela|1979
SALVADOR|___ Sánchez, featherweight champion from 1980|1980
VALENZUELA|Fernando, the Dodgers’ left-hander|1981
LUISMIGUEL|The Sun of Mexico, singer|1982
TIMBIRICHE|Teen pop group of Sasha and Paulina Rubio|1982
GARCIAROBLES|Alfonso, Nobel Peace laureate|1982
DELAMADRID|Miguel ___, president from 1982|1982
CHAVEZ|Julio César, world boxing champion|1984
TSURU|Nissan ___, popular car and taxi|1984
EARTHQUAKE|It shook the capital in September 1985|1985
NERI|Rodolfo ___ Vela, first Mexican astronaut|1985
PIQUE|Mascot of the 1986 World Cup|1986
CUNADELOBOS|Telenovela of the wicked Catalina Creel|1986
SALVAJE|Rosa ___, Verónica Castro telenovela|1987
SALINAS|Carlos, president from 1988|1988
CARRUSEL|Children’s telenovela of 1989|1989
TREVI|Gloria, singer of “Dr. Psiquiatra”|1989
CHOCOLATE|Like Water for ___, Laura Esquivel novel|1989
PAZ|Octavio, Nobel laureate in literature|1990
SANCHEZ|Hugo, five-time Pichichi in Spain|1990
ROMANCE|Luis Miguel’s album of boleros|1991
MANA|Band of “¿Dónde jugarán los niños?”|1992
CAFETACVBA|Band of “La ingrata”|1994
CRONOS|Guillermo del Toro’s first feature|1993
ZEDILLO|Ernesto, president from 1994|1994
CAMPOS|Jorge, goalkeeper in loud kits|1994
MARIMAR|Telenovela starring Thalía|1994
ZAPATISTAS|Army that appeared in Chiapas in 1994|1994
NAFTA|Free trade pact of 1994|1994
MOLINA|Mario, Nobel laureate in chemistry|1995
MOLOTOV|Band of “Gimme tha Power”|1997
USURPADORA|La ___, telenovela of 1998|1998
BLANCO|Cuauhtémoc, star of the 1998 World Cup|1998
PERROS|“Amores ___”, film by Iñárritu|2000
FOX|Vicente ___, won the presidency in 2000|2000
TAMAL|Dough wrapped in a corn husk
MOLE|Sauce of chiles and chocolate
POZOLE|Hominy stew with meat
ELOTE|Corn on the cob with mayo and chile
CHILAQUILES|Tortilla chips in sauce, for breakfast
PULQUE|Thick drink from the maguey
MEZCAL|Smoky agave spirit of Oaxaca
TEQUILA|Blue agave spirit of Jalisco
HORCHATA|Rice and cinnamon cold drink
CHURRO|Fried dough rolled in sugar
QUESADILLA|Folded tortilla with cheese
GUACAMOLE|Mashed avocado dip
PINATA|Hit with a stick at the posada
REBOZO|Long shawl worn by women
TIANGUIS|Open-air street market
ZOCALO|Main square of the capital
XOCHIMILCO|Canals with colourful boats
TRAJINERA|Flower-decked boat of Xochimilco
CHARRO|Horseman in embroidered suit and big hat
OFRENDA|Altar for the Day of the Dead
CATRINA|Elegant skeleton by Posada
MARIGOLD|Orange flower of the dead
MOLCAJETE|Stone mortar for salsa
ATOLE|Hot corn drink
TLAYUDA|Large Oaxacan tortilla
CAJETA|Goat’s-milk caramel
TORTILLA|Flat corn bread, daily staple
SALSA|Spicy table sauce
`;

export const WORDS: Partial<Record<Lang, string>> = { es: ES, en: EN };
