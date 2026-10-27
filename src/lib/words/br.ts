// Extra crossword words for Brazil.
// Same "WORD|clue|year" lines as wordbank.ts. Keyed by language.
import type { Lang } from '../data';
export const WORDS: Partial<Record<Lang, string>> = {
  pt: `
ATLANTIDA|Estúdio carioca das chanchadas|1941
MIRANDA|Carmen, a pequena notável de Hollywood|1943
GRANDEOTELO|Ator de Moleque Tião e das chanchadas|1943
LISPECTOR|Clarice, autora de «Perto do Coração Selvagem»|1943
PORTINARI|Pintor da igrejinha da Pampulha|1944
DRUMMOND|Carlos, poeta de «A Rosa do Povo»|1945
VARGAS|Getúlio, o pai dos pobres|1945
BRIGADEIRO|Doce de leite condensado nascido numa campanha|1945
DUTRA|Presidente eleito em 1945|1945
CONSTITUICAO|Nova lei maior promulgada em 1946|1946
CASSINO|Local de jogo que Dutra mandou fechar em 1946|1946
BAIAO|Ritmo nordestino que Gonzagão popularizou|1946
ASABRANCA|Canção nordestina de Luiz Gonzaga|1947
OSCARITO|Comediante da dupla com Grande Otelo, de «Carnaval no Fogo»|1949
REPORTERESSO|Noticiário do rádio, «testemunha ocular da história»|1941
MARACANAZO|Tragédia da final de 1950|1950
BARBOSA|Goleiro da seleção de 1950|1950
GHIGGIA|Uruguaio que calou o Maracanã|1950
TUPI|Primeira emissora de televisão do país|1950
PETROBRAS|O petróleo é nosso|1953
KUBITSCHEK|JK, o presidente bossa-nova|1956
CANDANGO|Operário que construiu a nova capital|1957
NIEMEYER|Oscar, arquiteto das curvas|1957
SUECIA|País da primeira Copa conquistada|1958
DIDI|Folha Seca, craque de 1958|1958
ZAGALO|Mário, ponta-esquerda campeão|1958
BELLINI|Capitão que ergueu a taça em 1958|1958
ROCHA|Marta, a Miss Brasil de 1954|1954
BUENO|Maria Esther, tenista de Wimbledon|1959
ADHEMAR|Ferreira da Silva, bicampeão olímpico do salto triplo|1952
GILBERTO|João, voz e violão da bossa|1958
VINICIUS|De Moraes, o poetinha|1958
ROMISETTA|Carrinho feito no Brasil, ovo de rodas|1956
KOMBI|Furgão da Volkswagen|1957
MANCHETE|Revista ilustrada da Rua do Russell|1952
AMADO|Jorge, autor de «Gabriela»|1958
ROSA|Guimarães, autor de «Grande Sertão: Veredas»|1956
GOLPE|Em 1964 os militares tomaram o poder|1964
ARRASTAO|Música com que Elis venceu o festival|1965
ELIS|Regina, a Pimentinha|1965
BUARQUE|Chico, autor de «A Banda»|1966
ABANDA|Música que parou a cidade|1966
GIL|O baiano de «Domingo no Parque»|1967
MUTANTES|Banda de Rita Lee e dos irmãos Baptista|1966
JOVEMGUARDA|Programa de iê-iê-iê na TV Record|1965
ERASMO|Carlos, o Tremendão|1965
WANDERLEA|A Ternurinha da Jovem Guarda|1965
GLAUBER|Rocha, de «Deus e o Diabo na Terra do Sol»|1964
CINEMANOVO|Movimento «uma ideia na cabeça»|1962
SANTOS|Time de Pelé, bicampeão da Libertadores|1962
PEPE|Canhão da Vila Belmiro|1962
AMARILDO|Possesso, substituto de Pelé em 1962|1962
BICAMPEAO|Brasil na Copa do Chile|1962
MORUMBI|Estádio do São Paulo inaugurado em 1960|1960
MASP|Museu na Avenida Paulista|1968
OPALA|Chevrolet brasileiro|1968
PASQUIM|Jornal humorístico de Ziraldo e Jaguar|1969
MONICA|Dentuça, da Turma de Maurício de Sousa|1963
CEBOLINHA|Garoto que troca o erre pelo ele|1960
TOMZE|Tropicalista de São Paulo|1968
GLOBO|Emissora inaugurada em 1965|1965
TRAPALHOES|Didi, Dedé, Mussum e Zacarias|1977
MACUNAIMA|Herói sem nenhum caráter|1969
TRICAMPEAO|Brasil no México|1970
JAIRZINHO|Furacão que marcou em todos os jogos de 1970|1970
TOSTAO|Craque do Cruzeiro em 1970|1970
RIVELINO|Patada atômica do Corinthians|1970
GERSON|Canhotinha de Ouro|1970
MAIA|Tim, o síndico do soul|1970
FITTIPALDI|Emerson, primeiro título mundial|1972
FANTASTICO|Show da vida aos domingos|1973
CHEVETTE|Popular da Chevrolet|1973
SEIXAS|Raul, «Gita» e a Sociedade Alternativa|1974
GABRIELA|Novela de Sônia Braga|1975
BRAGA|Sônia, Gabriela e Dona Flor|1975
ALCIONE|A Marrom do samba|1975
DONAFLOR|Filme com dois maridos|1976
ISAURA|A escrava mais famosa da TV|1976
BEIJAFLOR|Escola de samba de Nilópolis|1976
BELCHIOR|Autor de «Como Nossos Pais»|1976
SITIO|___ do Picapau Amarelo na Globo|1977
DANCINDAYS|Novela das discotecas|1978
ANISTIA|Lei de 1979 que trouxe os exilados|1979
GOL|Popular da Volkswagen|1980
RITALEE|Rainha do rock, «Lança Perfume»|1980
ZICO|Galinho de Quintino|1981
PIQUET|Nelson, campeão mundial de F1|1981
VOYAGE|Sedã da Volkswagen|1981
SOCRATES|Doutor, capitão da Democracia Corinthiana|1982
FALCAO|Rei de Roma, craque do Inter|1982
BARAO|___ Vermelho, banda de Cazuza|1982
BLITZ|Banda de «Você Não Soube Me Amar»|1982
PARATI|Perua da Volkswagen|1982
PARALAMAS|Banda de Herbert Vianna|1983
TITAS|Banda de «Comida»|1987
DIRETAS|Campanha por eleições em 1984|1984
SAMBODROMO|Passarela do samba inaugurada em 1984|1984
SEPULTURA|Banda de metal de Belo Horizonte|1984
CHAVES|Menino do barril no SBT|1984
ROCKINRIO|Festival de 1985 na Cidade do Rock|1985
LEGIAO|___ Urbana de Renato Russo|1985
TANCREDO|Eleito em 1985, não tomou posse|1985
SARNEY|Presidente da Nova República|1985
SANTEIRO|Roque ___, novela de 1985|1985
CRUZADO|Plano econômico e moeda de 1986|1986
PAGODINHO|Zeca, sambista que mora em Xerém|1986
VALETUDO|Novela do «Quem matou Odete Roitman?»|1988
CONSTITUINTE|Assembleia que gerou a Carta de 1988|1988
FAUSTAO|Apresentador do Domingão|1989
PANTANAL|Novela da Manchete com a Juma Marruá|1990
COLLOR|Presidente do confisco|1990
ITAMAR|Vice que assumiu a presidência após Collor|1992
CASSETA|___ e Planeta, humor da Globo|1992
RENASCER|Novela com o coronel José Inocêncio|1993
SKANK|Banda mineira de «É Uma Partida de Futebol»|1996
ROMARIO|Baixinho, craque da Copa de 1994|1994
BEBETO|Comemorou o gol «ninando o bebê»|1994
TAFFAREL|Goleiro do tetra|1994
DUNGA|Capitão que levantou a taça em 1994|1994
TETRA|Título mundial conquistado nos EUA|1994
REAL|Moeda lançada em 1994|1994
CARDOSO|Fernando Henrique, presidente de 1995|1995
RAIMUNDOS|Banda de «Mulher de Fases»|1999
MAMONAS|___ Assassinas, sucesso em 1995|1995
KUERTEN|Guga, tricampeão de Roland Garros|1997
FEIJOADA|Prato de sábado com feijão preto
CAIPIRINHA|Cachaça, limão, açúcar e gelo
PAODEQUEIJO|Bolinha mineira de polvilho
COXINHA|Salgado em forma de gota
PASTEL|Salgado frito da feira
CAFEZINHO|Pequena xícara depois do almoço
CHIMARRAO|Erva-mate gaúcha na cuia
TAPIOCA|Beiju de goma de mandioca
FAROFA|Farinha de mandioca torrada
CHURRASCO|Carne na brasa com amigos
CAPOEIRA|Luta dançada ao som do berimbau
FESTAJUNINA|Quadrilha, fogueira e pamonha
CAFUNE|Carinho que se faz nos cabelos
CORCOVADO|Morro do Cristo Redentor
REDE|Lugar de dormir ao ar livre
FUTEBOL|Paixão nacional
CARNAVAL|Quatro dias de samba e fantasia

`,
  en: `
ATLANTIDA|Rio studio of the chanchada comedies|1941
MIRANDA|Carmen, the “Brazilian Bombshell”|1943
GRANDEOTELO|Actor of the chanchadas and “Moleque Tião”|1943
LISPECTOR|Clarice, author of “Near to the Wild Heart”|1943
PORTINARI|Painter of the Pampulha chapel|1944
DRUMMOND|Carlos, poet of “A Rosa do Povo”|1945
VARGAS|Getúlio, “father of the poor”|1945
BRIGADEIRO|Condensed-milk sweet born in a campaign|1945
DUTRA|President elected in 1945|1945
CASINO|Gambling palaces that Dutra closed in 1946|1946
BAIAO|Northeastern rhythm made famous by Gonzaga|1946
ASABRANCA|Luiz Gonzaga’s song of the sertão|1947
OSCARITO|Comedian paired with Grande Otelo in “Carnaval no Fogo”|1949
REPORTERESSO|News bulletin billed as “eyewitness of history”|1941
MARACANAZO|The 1950 final defeat|1950
BARBOSA|Goalkeeper of 1950|1950
GHIGGIA|Uruguayan who silenced the Maracanã|1950
TUPI|Brazil’s first television station|1950
PETROBRAS|“The oil is ours” company|1953
KUBITSCHEK|JK, the bossa nova president|1956
CANDANGO|Worker who built the new capital|1957
NIEMEYER|Oscar, architect of curves|1957
SWEDEN|Host of Brazil’s first World Cup win|1958
DIDI|Maestro of Brazil’s 1958 midfield, “Dry Leaf”|1958
ZAGALO|Mário, winger in 1958|1958
BELLINI|Captain who raised the trophy in 1958|1958
ROCHA|Marta, Miss Brazil of 1954|1954
BUENO|Maria Esther, Wimbledon champion|1959
ADHEMAR|Ferreira da Silva, two-time triple-jump champion|1952
GILBERTO|João, voice and guitar of bossa nova|1958
VINICIUS|De Moraes, the little poet|1958
ROMISETTA|Brazilian-built bubble car|1956
KOMBI|Volkswagen van|1957
MANCHETE|Illustrated magazine of the Rua do Russell|1952
AMADO|Jorge, author of “Gabriela”|1958
ROSA|Guimarães, author of “The Devil to Pay in the Backlands”|1956
COUP|The 1964 military takeover|1964
ELIS|Regina, the “Little Pepper”|1965
BUARQUE|Chico, songwriter of “A Banda”|1966
GIL|Bahian of “Domingo no Parque”|1967
MUTANTES|Band of Rita Lee and the Baptista brothers|1966
ERASMO|Carlos, the Tremendous One|1965
WANDERLEA|Tender darling of the Jovem Guarda|1965
GLAUBER|Rocha, director of Cinema Novo|1964
SANTOS|Pelé’s club, Libertadores champion|1962
PEPE|Cannon shot of Vila Belmiro|1962
AMARILDO|Stand-in for Pelé in 1962|1962
MORUMBI|São Paulo’s stadium, opened in 1960|1960
MASP|Museum on Avenida Paulista|1968
OPALA|Brazilian Chevrolet|1968
PASQUIM|Humour weekly of Ziraldo and Jaguar|1969
MONICA|Toothy girl of Maurício de Sousa’s gang|1963
CEBOLINHA|Boy who swaps his Rs for Ls|1960
TOMZE|Tropicália musician from São Paulo|1968
GLOBO|TV network launched in 1965|1965
TRAPALHOES|Comedy quartet with Didi and Mussum|1977
MACUNAIMA|Hero with no character|1969
JAIRZINHO|Scored in every game of 1970|1970
TOSTAO|Cruzeiro star of 1970|1970
RIVELINO|Atomic left foot of Corinthians|1970
GERSON|The Little Golden Left-Footer|1970
MAIA|Tim, the soul godfather|1970
FITTIPALDI|Emerson, first world title|1972
FANTASTICO|Sunday-night TV magazine show|1973
CHEVETTE|Chevrolet’s popular small car|1973
SEIXAS|Raul, “Gita” and the Alternative Society|1974
GABRIELA|Telenovela starring Sônia Braga|1975
BRAGA|Sônia, star of “Gabriela”|1975
ALCIONE|The Marrom of samba|1975
DONAFLOR|Film about a woman and her two husbands|1976
ISAURA|The most famous slave on TV|1976
BEIJAFLOR|Nilópolis samba school|1976
BELCHIOR|Singer-songwriter of “Como Nossos Pais”|1976
SITIO|Yellow Woodpecker Ranch on Globo|1977
DANCINDAYS|Telenovela of the discos|1978
AMNESTY|Law of 1979 that brought exiles home|1979
GOL|Volkswagen’s popular small car|1980
RITALEE|Queen of rock, “Lança Perfume”|1980
ZICO|Flamengo’s little rooster|1981
PIQUET|Nelson, Formula One champion|1981
VOYAGE|Volkswagen saloon|1981
SOCRATES|The Doctor, captain of Corinthians|1982
FALCAO|King of Rome, Inter midfielder|1982
BARAO|___ Vermelho, Cazuza’s band|1982
BLITZ|Band of “Você Não Soube Me Amar”|1982
PARATI|Volkswagen station wagon|1982
PARALAMAS|Herbert Vianna’s band|1983
TITAS|Band of “Comida”|1987
DIRETAS|Campaign for direct elections|1984
SAMBODROMO|Carnival parade avenue opened in 1984|1984
SEPULTURA|Belo Horizonte metal band|1984
CHAVES|Boy in the barrel on SBT|1984
ROCKINRIO|1985 festival at the Rock City|1985
LEGIAO|___ Urbana of Renato Russo|1985
TANCREDO|Elected in 1985, never took office|1985
SARNEY|President of the New Republic|1985
SANTEIRO|Roque ___, telenovela of 1985|1985
CRUZADO|Economic plan and currency of 1986|1986
PAGODINHO|Zeca, samba singer who lives in Xerém|1986
VALETUDO|Telenovela asking who killed Odete Roitman|1988
FAUSTAO|Sunday TV host|1989
PANTANAL|Manchete’s wetland telenovela|1990
COLLOR|President of the savings freeze|1990
ITAMAR|Vice-president who took over after Collor|1992
CASSETA|___ & Planeta, Globo comedy|1992
RENASCER|Telenovela with Colonel José Inocêncio|1993
SKANK|Minas Gerais band of “O Samba Poconé”|1996
ROMARIO|Baixinho, star of the 1994 Cup|1994
BEBETO|Rocked the baby after scoring|1994
TAFFAREL|Goalkeeper of the fourth title|1994
DUNGA|Captain who lifted the cup in 1994|1994
TETRA|Fourth World Cup, won in the USA|1994
REAL|Currency launched in 1994|1994
CARDOSO|Fernando Henrique, president from 1995|1995
RAIMUNDOS|Band of “Mulher de Fases”|1999
MAMONAS|___ Assassinas, 1995 pop sensation|1995
KUERTEN|Guga, three-time French Open champion|1997
FEIJOADA|Saturday black-bean stew
CAIPIRINHA|Cachaça, lime, sugar and ice
COXINHA|Teardrop-shaped fried snack
PASTEL|Fried pastry from the street fair
CAFEZINHO|Small cup after lunch
CHIMARRAO|Gaucho mate drunk from a gourd
TAPIOCA|Cassava-starch pancake
FAROFA|Toasted cassava flour
CHURRASCO|Barbecue with friends
CAPOEIRA|Martial art danced to the berimbau
CAFUNE|Gentle caress of the hair
CORCOVADO|Mountain of Christ the Redeemer
HAMMOCK|Where you sleep outdoors
FOOTBALL|National passion
AMAZON|The great river and rainforest
`,
};
