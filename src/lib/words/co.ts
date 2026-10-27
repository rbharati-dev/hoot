// Extra crossword words for Colombia. "WORD|clue|year" lines, keyed by language.
import type { Lang } from '../data';

const ES = `
AVIANCA|La aerolínea nacional, nacida de una fusión en 1940|1940
SANTOS|Eduardo ___, presidente y dueño de El Tiempo|1940
PUMAREJO|Alfonso López ___, presidente en su segundo mandato desde 1942|1942
ALPINA|Lácteos de Sopó, fundados por inmigrantes suizos|1945
OSPINA|Mariano ___ Pérez, presidente de 1946|1946
SUTATENZA|Radio campesina de monseñor Salcedo|1947
GAITAN|Jorge Eliécer, caudillo liberal asesinado en 1948|1948
BOGOTAZO|Disturbios en la capital el 9 de abril|1948
DIMAYOR|Liga profesional de fútbol, nacida en 1948|1948
SANTAFE|Campeón de la primera liga profesional|1948
RCN|Radio Cadena Nacional, nacida en 1948|1948
OEA|Su carta se firmó en Bogotá en 1948|1948
MILLONARIOS|El Ballet Azul del fútbol|1949
DISTEFANO|Alfredo, la «Saeta Rubia» de Millonarios|1949
VIOLENCIA|La ___, época dura del conflicto bipartidista|1950
VUELTA|La ___ a Colombia, ciclismo desde 1951|1951
FRENTE|___ Nacional, pacto liberal-conservador que empezó en 1958|1958
ECOPETROL|Empresa petrolera estatal creada en 1951|1951
ROJAS|General Gustavo ___ Pinilla, presidente|1953
TEQUENDAMA|Gran hotel bogotano inaugurado en 1953|1953
TELEVISION|En 1954 llegó a los hogares del país|1954
GLORIA|Valencia de Castaño, «primera dama» de la TV|1954
HOYOS|Ramón, campeón de la Vuelta a Colombia|1955
HOJARASCA|Primera novela de García Márquez|1955
VOTO|Las mujeres lo ejercieron por primera vez en 1957|1957
SILLETEROS|En Medellín desfilan con flores a la espalda|1957
LLERAS|Alberto ___ Camargo, primer presidente del Frente Nacional|1958
ZULUAGA|Luz Marina, Miss Universo|1958
NADAISMO|Movimiento de Gonzalo Arango|1958
ARANGO|Luis Ángel ___, biblioteca del Banco de la República|1958
ELDORADO|Aeropuerto de Bogotá, inaugurado en 1959|1959
CORONEL|«El ___ no tiene quien le escriba», de Gabo|1961
BOTERO|Fernando, pintor de «Mona Lisa a los doce años»|1959
COLL|Marcos, autor del gol olímpico en 1962|1962
YASHIN|Arquero soviético que sufrió el gol de Coll|1962
SPEAKERS|Los ___, banda de rock bogotana|1963
OBREGON|Alejandro, pintor de «Violencia»|1962
VALENCIA|Guillermo León ___, presidente en 1962|1962
INRAVISION|Instituto estatal de radio y televisión|1963
OCHOA|Gabriel ___ Uribe, técnico campeón con Millonarios|1963
RESTREPO|Carlos Lleras ___, presidente en 1966|1966
CANDELARIA|Teatro de Santiago García, fundado en 1966|1966
ALEJO|Durán, primer Rey Vallenato|1968
PAPA|Pablo VI visitó Bogotá en 1968|1968
FRUKO|___ y sus Tesos, salsa paisa|1969
SOFASA|Fábrica de Renault en Envigado|1969
MISAEL|Pastrana Borrero, presidente en 1970|1970
CALI|Sede de los Juegos Panamericanos de 1971|1971
PAMBELE|Kid ___, campeón mundial de boxeo|1972
SABADOS|___ Felices, programa de humor|1972
CHIRCALES|Documental de 1972 sobre ladrilleros|1972
LOPEZ|Alfonso ___ Michelsen, presidente en 1974|1974
CICLOVIA|Domingos sin carros en Bogotá desde 1974|1974
ORTIZ|Willington, el «Viejo Willy» de Millonarios|1975
BINOMIO|___ de Oro, Rafael Orozco e Israel Romero|1976
TURBAY|Julio César, presidente en 1978|1978
COLOR|Llegó a la tele nacional en 1979|1979
AMERICA|___ de Cali, campeón por primera vez en 1979|1979
BETANCUR|Belisario, presidente en 1982|1982
PURASANGRE|Filme caleño de 1982 sobre un vampiro|1982
CARTAGENA|Ciudad amurallada, patrimonio mundial desde 1984|1984
NICHE|Grupo ___, de «Cali pachanguero»|1984
CONDORES|Los ___ no entierran todos los días, filme|1984
ARMERO|Pueblo arrasado por una avalancha en 1985|1985
RUIZ|Nevado del ___, volcán que hizo erupción en 1985|1985
BARCO|Virgilio, presidente en 1986|1986
JOEARROYO|Cantante cartagenero de «La rebelión»|1986
PATARROYO|Manuel Elkin, inmunólogo que presentó una vacuna contra la malaria|1987
FANNY|Mikey, fundadora del Festival de Teatro|1988
PARRA|Fabio, tercero en el Tour de Francia|1988
NACIONAL|Atlético ___, campeón de la Libertadores|1989
GAVIRIA|César, presidente en 1990|1990
SEPTIMA|La ___ papeleta, voto por la constituyente|1990
RINCON|Freddy, goleador del empate con Alemania|1990
CONSTITUCION|Nueva carta política de 1991|1991
GARZON|Jaime, humorista de «Quac, el noticero»|1995
ASPRILLA|Tino, delantero del 5-0 a Argentina|1993
VIVES|Carlos ___, de «La gota fría»|1993
AROMA|Café con ___ de mujer, telenovela|1994
SAMPER|Ernesto, presidente en 1994|1994
ESCOBAR|Andrés, defensa del Mundial de 1994|1994
METRO|Medellín lo estrenó en 1995|1995
SHAKIRA|Barranquillera de «Pies descalzos»|1995
PETRONIO|___ Álvarez, festival de música del Pacífico|1997
PASTRANA|Andrés, presidente en 1998|1998
BETTY|Yo soy ___, la fea, telenovela|1999
SISMO|Terremoto del Eje Cafetero en 1999|1999
MONTOYA|Juan Pablo, campeón de la CART|1999
URRUTIA|María Isabel, oro olímpico en Sídney|2000
TRANSMILENIO|Buses articulados de Bogotá|2000
AJIACO|Sopa bogotana con tres papas
SANCOCHO|Sopa de domingo con plátano y yuca
BUNUELO|Bola frita de Navidad
AGUARDIENTE|Licor de anís
PANELA|Azúcar de caña en bloque
AREQUIPE|Dulce de leche colombiano
EMPANADA|Masa de maíz rellena y frita
PANDEBONO|Pan de queso y yuca
TAMAL|Masa envuelta en hoja de plátano
LECHONA|Cerdo relleno, plato del Tolima
SOMBRERO|El ___ vueltiao, de caña flecha
MOCHILA|Bolso tejido por los wayuu
RUANA|Prenda de lana para el frío andino
BAMBUCO|Ritmo andino de guitarra y tiple
TIPLE|Guitarra pequeña colombiana
YIPAO|Jeep ___ cargado en el Eje Cafetero
MUISCA|Pueblo de la leyenda de El Dorado
TIEMPO|El ___, diario de Bogotá
ESPECTADOR|El ___, diario fundado en Medellín
RENACUAJO|Rin Rin, el ___ de Pombo
MONSERRATE|Cerro con santuario sobre Bogotá
GUATAPE|Embalse y peñón cerca de Medellín
TAYRONA|Parque de playas y selva en Santa Marta
LETICIA|Puerto colombiano sobre el Amazonas
BOGOTA|Capital a 2600 metros de altura
MEDELLIN|Ciudad de la eterna primavera
BARRANQUILLA|Ciudad del Carnaval junto al Magdalena
`;

const EN = `
AVIANCA|National airline formed by a merger in 1940|1940
SANTOS|Eduardo ___, president and El Tiempo owner|1940
PUMAREJO|Alfonso López ___, president in his second term from 1942|1942
ALPINA|Dairy brand founded by Swiss settlers at Sopó|1945
OSPINA|Mariano ___ Pérez, president from 1946|1946
SUTATENZA|Rural radio school of Monsignor Salcedo|1947
GAITAN|Jorge Eliécer, liberal leader assassinated in 1948|1948
BOGOTAZO|Riots in the capital on April 9th|1948
DIMAYOR|Professional football league founded in 1948|1948
SANTAFE|Champions of the first pro league|1948
RCN|Radio network born in 1948|1948
OAS|Its charter was signed in Bogotá in 1948|1948
MILLONARIOS|The “Blue Ballet” of Colombian football|1949
DISTEFANO|Alfredo, the “Blond Arrow” of Millonarios|1949
VIOLENCIA|La ___, the hard years of party conflict|1950
VUELTA|Cycling tour of Colombia, since 1951|1951
FRONT|National ___, liberal-conservative pact that began in 1958|1958
ECOPETROL|State oil company created in 1951|1951
ROJAS|General Gustavo ___ Pinilla, president|1953
TEQUENDAMA|Grand Bogotá hotel opened in 1953|1953
BROADCAST|Colombia’s first television ___ aired in 1954|1954
GLORIA|Valencia de Castaño, TV’s first lady|1954
HOYOS|Ramón, champion of the Vuelta a Colombia|1955
HOJARASCA|García Márquez’s first novel, “Leaf Storm”|1955
SUFFRAGE|Women first voted in the 1957 plebiscite|1957
SILLETEROS|Flower-bearers parading in Medellín|1957
LLERAS|Alberto ___ Camargo, first National Front president|1958
ZULUAGA|Luz Marina, crowned Miss Universe|1958
NADAISMO|Movement founded by Gonzalo Arango|1958
ARANGO|Luis Ángel ___, library of the national bank|1958
ELDORADO|Bogotá’s airport, opened in 1959|1959
COLONEL|“No One Writes to the ___”, by Gabo|1961
BOTERO|Fernando, painter of “Mona Lisa, Age Twelve”|1959
COLL|Marcos, scored direct from a corner against the USSR|1962
YASHIN|Soviet goalkeeper beaten by Coll|1962
SPEAKERS|The ___, Bogotá rock band|1963
OBREGON|Alejandro, painter of “Violencia”|1962
VALENCIA|Guillermo León ___, president in 1962|1962
INRAVISION|State radio and television institute|1963
OCHOA|Gabriel ___ Uribe, Millonarios title coach|1963
RESTREPO|Carlos Lleras ___, president in 1966|1966
CANDELARIA|Bogotá theatre company founded in 1966|1966
ALEJO|Durán, first Vallenato King|1968
POPE|Paul VI visited Bogotá in 1968|1968
FRUKO|___ y sus Tesos, Medellín salsa band|1969
SOFASA|Renault’s plant in Envigado|1969
MISAEL|Pastrana Borrero, president in 1970|1970
CALI|Host of the 1971 Pan American Games|1971
PAMBELE|Kid ___, world boxing champion|1972
SABADOS|___ Felices, long-running comedy show|1972
CHIRCALES|1972 documentary about brickmakers|1972
LOPEZ|Alfonso ___ Michelsen, president in 1974|1974
CICLOVIA|Sundays without cars in Bogotá since 1974|1974
ORTIZ|Willington, the “Old Willy” of Millonarios|1975
BINOMIO|___ de Oro, Orozco and Romero|1976
TURBAY|Julio César, president in 1978|1978
COLOR|It reached Colombian TV in 1979|1979
AMERICA|___ de Cali, first champions in 1979|1979
BETANCUR|Belisario, president in 1982|1982
PURASANGRE|1982 Cali film about a vampire businessman|1982
CARTAGENA|Walled city, World Heritage since 1984|1984
NICHE|Grupo ___, band of “Cali Pachanguero”|1984
CONDORS|Giant Andean birds that title a 1984 Colombian film|1984
ARMERO|Town lost to a mudflow in 1985|1985
RUIZ|Nevado del ___, volcano that erupted in 1985|1985
BARCO|Virgilio, president in 1986|1986
JOEARROYO|Cartagena-born singer of “La Rebelión”|1986
PATARROYO|Manuel Elkin, immunologist who unveiled a malaria vaccine|1987
FANNY|Mikey, founder of the Bogotá theatre festival|1988
PARRA|Fabio, third in the Tour de France|1988
NACIONAL|Atlético ___, Libertadores champions|1989
GAVIRIA|César, president in 1990|1990
SEPTIMA|The ___ ballot, vote for a new constitution|1990
RINCON|Freddy, scorer against Germany in 1990|1990
CONSTITUTION|New charter signed in 1991|1991
GARZON|Jaime, humorist of “Quac! El Noticero”|1995
ASPRILLA|Tino, striker of the 5-0 against Argentina|1993
VIVES|Carlos ___, singer of “La Gota Fría”|1993
AROMA|Coffee with ___ of a Woman, 1994 telenovela|1994
SAMPER|Ernesto, president in 1994|1994
ESCOBAR|Andrés, defender at the 1994 World Cup|1994
METRO|Medellín opened its elevated rail system in 1995|1995
SHAKIRA|Barranquilla singer of “Pies Descalzos”|1995
PETRONIO|___ Álvarez, Pacific music festival in Cali|1997
PASTRANA|Andrés, president in 1998|1998
BETTY|“Yo soy ___, la fea”, hit telenovela|1999
EARTHQUAKE|Struck the coffee region in 1999|1999
MONTOYA|Juan Pablo, CART champion|1999
URRUTIA|María Isabel, Olympic gold in Sydney|2000
TRANSMILENIO|Bogotá’s articulated bus system|2000
AJIACO|Bogotá soup with three kinds of potato
SANCOCHO|Sunday stew with plantain and yucca
BUNUELO|Fried cheese ball of Christmas
AGUARDIENTE|Anise-flavoured spirit
PANELA|Block of raw cane sugar
AREQUIPE|Colombian milk caramel
EMPANADA|Fried corn pastry with filling
PANDEBONO|Cheese and yucca bread
TAMAL|Masa wrapped in a plantain leaf
LECHONA|Stuffed roast pig of Tolima
SOMBRERO|The vueltiao ___, made of cane arrow fibre
MOCHILA|Woven bag made by the Wayuu
RUANA|Woollen wrap for the Andean cold
BAMBUCO|Andean rhythm of guitar and tiple
TIPLE|Small Colombian guitar
YIPAO|Willys jeep of the coffee region
MUISCA|People behind the El Dorado legend
TIEMPO|El ___, Bogotá newspaper
ESPECTADOR|El ___, newspaper founded in Medellín
MONSERRATE|Hill with a shrine above Bogotá
GUATAPE|Reservoir and rock near Medellín
TAYRONA|Park of beaches and jungle near Santa Marta
LETICIA|Colombian port on the Amazon
BOGOTA|Capital city, high in the Andes
MEDELLIN|City of eternal spring
BARRANQUILLA|Carnival city on the Magdalena
EMERALD|Green gem of Muzo
ORCHID|National flower, the Cattleya
`;

export const WORDS: Partial<Record<Lang, string>> = { es: ES, en: EN };
