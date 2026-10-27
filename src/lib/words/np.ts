// Extra crossword words for Nepal. "WORD|clue|year" lines, keyed by language.
// Years are Gregorian.
import type { Lang } from '../data';

const NE = `
शुक्रराज|1941 मा शहीद भएका चार मध्येका शास्त्री|1941
गंगालाल|1941 मा शहीद भएका प्रजा परिषद्का श्रेष्ठ|1941
धर्मभक्त|1941 मा शहीद भएका चार मध्येका माथेमा|1941
दशरथ|1941 मा शहीद भएका चार मध्येका बैतडीका चन्द|1941
जुद्ध|1945 मा राजीनामा दिएका राणा प्रधानमन्त्री, ___ शमशेर|1945
गोर्खा|दोस्रो विश्वयुद्धमा लडेका नेपाली सैनिक|1945
विराटनगर|1947 को जुट मिल हडतालको पूर्वी सहर|1947
जुट|1947 मा हडताल भएको विराटनगरको मिलको रेसा|1947
वैधानिक|1948 को नेपाल सरकारको ___ कानुन, पहिलो लिखित संविधान|1948
पद्म|1948 सम्म प्रधानमन्त्री रहेका शमशेर|1948
मोहन|अन्तिम राणा प्रधानमन्त्री, ___ शमशेर|1948
पुष्पलाल|1949 मा कम्युनिस्ट पार्टीका संस्थापक|1949
सन्धि|1950 मा भारतसँग भएको शान्ति र मैत्री ___|1950
अन्नपूर्ण|1950 मा चढिएको पहिलो आठहजारे हिमाल|1950
नेपालीकांग्रेस|1950 मा बनेको पार्टी|1950
राणा|1951 मा शासन सकिएको वंश|1951
रेडियोनेपाल|1951 देखिको देशको आवाज|1951
मातृका|कोइराला, 1951 मा प्रधानमन्त्री|1951
हिलारी|1953 मा सगरमाथामा पुगेका न्युजिल्यान्डका|1953
चोयु|1954 मा पहिलोपटक चढिएको हिमाल|1954
कञ्चनजङ्घा|1955 मा चढिएको तेस्रो अग्लो हिमाल|1955
मकालु|1955 मा फ्रान्सेलीले चढेको हिमाल|1955
ल्होत्से|1956 मा चढिएको सगरमाथाको छिमेकी|1956
मनास्लु|1956 मा जापानीले चढेको हिमाल|1956
रंगशाला|दशरथ ___, काठमाडौँको ठूलो खेल मैदान, 1956 मा बनेको|1956
राजपथ|त्रिभुवन ___, भारतसँग जोड्ने सडक, 1956|1956
राष्ट्रबैंक|नेपालको केन्द्रीय बैंक, 1956 मा स्थापना|1956
टंकप्रसाद|आचार्य, 1956 मा प्रधानमन्त्री|1956
रोयलनेपाल|1958 मा सुरु भएको वायुसेवा|1958
बीपी|1959 मा निर्वाचित पहिलो प्रधानमन्त्री|1959
देवकोटा|महाकवि लक्ष्मीप्रसाद, निधन 1959|1959
पञ्चायत|1960 मा सुरु भएको व्यवस्था|1960
धौलागिरी|1960 मा चढिएको सातौँ अग्लो हिमाल|1960
आमादब्लम|1961 मा चढिएको सुन्दर हिमाल|1961
तुलसीगिरी|1963 मा प्रधानमन्त्री बनेका|1963
मुलुकीऐन|1963 को नयाँ कानुनी संहिता|1963
गोम्बु|नवाङ ___, 1963 मा सगरमाथा चढ्ने शेर्पा|1963
भूमिसुधार|1964 को जग्गा सम्बन्धी कानुन|1964
आमा|1964 मा नेपालमै बनेको पहिलो फिल्म|1964
टोकियो|1964 मा नेपालले पहिलोपटक ओलम्पिक खेलेको सहर|1964
पारिजात|'शिरीषको फूल' की लेखिका|1965
राइजिङ|द ___ नेपाल, अंग्रेजी दैनिक|1965
मैतीघर|निजी बैनरमा बनेको पहिलो नेपाली फिल्म, 1966|1966
भूपी|'घुम्ने मेचमाथि' का कवि शेरचन|1969
झोछे|हिप्पीहरूको काठमाडौँको 'फ्रिक स्ट्रीट'|1970
कीर्तिनिधि|1971 मा फेरि प्रधानमन्त्री बनेका विष्ट|1971
चितवन|गैँडा र बाघको घर, 1973 मा स्थापित राष्ट्रिय पार्क|1973
पृथ्वीराजमार्ग|काठमाडौँ-पोखरा सडक, 1974 मा पूरा|1974
ताबेई|जुन्को ___, 1975 मा सगरमाथा चढ्ने पहिलो महिला|1975
राज्याभिषेक|1975 मा राजा वीरेन्द्रको ___|1975
शान्तिक्षेत्र|राजा वीरेन्द्रले 1975 मा प्रस्ताव गरेको नेपाल ___|1975
अक्सिजन|1978 मा बिना ___ सगरमाथा चढियो|1978
सम्पदा|1979 मा काठमाडौँ उपत्यका विश्व ___ सूचीमा|1979
विद्यार्थी|1979 मा पञ्चायतविरुद्ध आन्दोलन गर्ने|1979
सूर्यबहादुर|1979 मा प्रधानमन्त्री बनेका थापा|1979
जनमत|1980 मा पञ्चायत वा बहुदल रोज्न भएको ___ संग्रह|1980
मेसनर|1980 मा एक्लै सगरमाथा चढ्ने इटालियन|1980
कोइराला|बीपी ___, जसको निधन 1982 मा भयो|1982
फकल्यान्ड|1982 मा गोर्खा सैनिक लडेको द्वीप|1982
लोकेन्द्र|चन्द, 1983 मा प्रधानमन्त्री|1983
साफ|1984 मा काठमाडौँमा भएको पहिलो दक्षिण एसियाली खेलकुद|1984
एनटीभी|1985 मा सुरु भएको सरकारी टेलिभिजन च्यानल|1985
वाईवाई|नेपालमै बन्ने चाउचाउको ब्रान्ड|1985
मरिचमान|सिंह, 1986 मा प्रधानमन्त्री|1986
सार्क|1987 मा सचिवालय काठमाडौँमा खुलेको संगठन|1987
भूकम्प|1988 मा पूर्वी नेपाल र उपत्यका हल्लाउने|1988
नाकाबन्दी|1989 को व्यापारिक रोक|1989
जनआन्दोलन|1990 मा बहुदल ल्याउने|1990
बहुदल|1990 मा फर्किएको व्यवस्था|1990
गणेशमान|सिंह, 1990 आन्दोलनका नेता|1990
संविधान|1990 मा जारी भएको|1990
स्वरसम्राट|नारायणगोपालको उपाधि, निधन 1990|1990
गिरिजा|प्रसाद कोइराला, 1991 मा प्रधानमन्त्री|1991
कान्तिपुर|1993 मा सुरु भएको दैनिक|1993
पासाङल्हामु|सगरमाथा चढ्ने पहिलो नेपाली महिला|1993
मनमोहन|अधिकारी, 1994 मा प्रधानमन्त्री|1994
देउवा|शेरबहादुर, 1995 मा प्रधानमन्त्री|1995
एफएम|1995 मा रेडियो नेपालले सुरु गरेको तरङ्ग|1995
लुम्बिनी|बुद्धको जन्मथलो, 1997 मा विश्व सम्पदा|1997
खेलकुद|1999 मा काठमाडौँमा भएको दक्षिण एसियाली ___|1999
भानुभक्त|नेपाली भाषाका आदिकवि
पृथ्वीनारायण|एकीकरणका महानायक
मुनामदन|देवकोटाको प्रसिद्ध खण्डकाव्य
खुकुरी|गोर्खाको बाङ्गो हतियार
डाँफे|राष्ट्रिय चरा
लालीगुराँस|राष्ट्रिय फूल
गैँडा|एक सिङ भएको ठूलो जनावर
फेवा|पोखराको ताल
पोखरा|ताल र हिमालको सहर
जनकपुर|सीताको जन्मथलो
भक्तपुर|दरबार र दही प्रसिद्ध सहर
स्वयम्भू|बाँदरहरू भएको बौद्ध स्तूप
बौद्ध|ठूलो स्तूप भएको ठाउँ
मुस्ताङ|हिमालपारिको उपल्लो क्षेत्र
लुक्ला|सगरमाथा जाने हवाई ढोका
नारायणी|चितवनको ठूलो नदी
कोशी|पूर्वी नेपालको ठूलो नदी, सप्त___
गोसाइँकुण्ड|हिमाली पवित्र ताल
दालभात|नेपाली घरको दैनिक भोजन
मोमो|पिठोको खोलभित्र मासु वा तरकारी
ढिँडो|कोदो वा फापरको पिठोको खाना
गुन्द्रुक|किण्वन गरेर सुकाइएको हरियो साग
सेलरोटी|तिहारमा बनाइने गोलो रोटी
चिउरा|कुटेको धान, बजी
टीका|दसैँमा निधारमा लगाइने
जमरा|दसैँमा उमारिने पहेँलो
मादल|हातले बजाइने गाउँले बाजा
सारङ्गी|गन्धर्वहरूले बजाउने बाजा
बाँसुरी|मुखले फुकेर बजाइने
ढाकाटोपी|नेपाली पुरुषको रंगीन टोपी
दौरासुरुवाल|नेपाली पुरुषको राष्ट्रिय पहिरन
गुन्यूचोली|महिलाको परम्परागत पहिरन
पोते|विवाहित महिलाले लगाउने हरियो माला
डोको|पिठ्युँमा बोकिने बाँसको भाँडो
नाम्लो|डोको बोक्न निधारमा अड्याइने डोरी
माछापुच्छ्रे|पोखराबाट देखिने माछाको पुच्छर जस्तो हिमाल
इन्द्रजात्रा|काठमाडौँमा कुमारी रथ तानिने चाड
गाईजात्रा|साउनमा गाईको नाममा हाँसोको चाड
तीज|महिलाहरू रातो लुगामा नाच्ने चाड
छठ|तराईमा सूर्यलाई अर्घ दिइने चाड
माघेसङ्क्रान्ति|तिल र घ्यू खाने चाड
मोहर|पुरानो नेपाली सिक्का
हिमाल|सेतो टुप्पो भएको अग्लो पर्वत
सिस्नु|छोएपछि पोल्ने पहाडी बिरुवा, साग पनि बन्ने
निकुञ्ज|सगरमाथा राष्ट्रिय ___, 1976 मा स्थापित|1976
लाङटाङ|रसुवाको हिमाली उपत्यका, 1976 मा संरक्षित घोषित|1976
`;

const EN = `
SHUKRARAJ|Shastri, one of the four martyrs of 1941|1941
GANGALAL|Shrestha, executed in 1941 with three others|1941
DHARMABHAKTA|Mathema, one of the four martyrs of 1941|1941
DASHARATH|Chand, the Baitadi-born one of the four martyrs of 1941|1941
JUDDHA|Rana prime minister who resigned in 1945|1945
GURKHAS|Nepali soldiers who fought in the Second World War|1945
BIRATNAGAR|Eastern city of the 1947 jute mill strike|1947
JUTE|Fibre of the Biratnagar mills|1947
ACT|Government of Nepal ___, first written constitution, 1948|1948
PADMA|Shamsher, prime minister until 1948|1948
MOHAN|Shamsher, the last Rana prime minister, from 1948|1948
PUSHPALAL|Founder of the Communist Party in 1949|1949
TREATY|Peace and friendship pact with India, 1950|1950
ANNAPURNA|First 8,000-metre peak climbed, in 1950|1950
CONGRESS|Nepali ___, party formed in 1950|1950
RANA|Dynasty whose rule ended in 1951|1951
RADIONEPAL|The nation’s voice since 1951|1951
MATRIKA|Koirala, prime minister from 1951|1951
HILLARY|Sir Edmund, on Everest in 1953|1953
CHOOYU|Peak first climbed in 1954|1954
KANGCHENJUNGA|Third highest peak, first climbed in 1955|1955
MAKALU|Peak first climbed by the French in 1955|1955
LHOTSE|Everest’s neighbour, first climbed in 1956|1956
MANASLU|Peak first climbed by Japanese in 1956|1956
RANGASALA|Kathmandu’s national stadium, built in 1956|1956
RAJPATH|Tribhuvan ___, road from India, 1956|1956
BANK|Nepal Rastra ___, central bank founded in 1956|1956
TANKA|Prasad Acharya, prime minister in 1956|1956
AIRLINES|Royal Nepal ___, formed in 1958|1958
BP|Koirala, elected prime minister in 1959|1959
DEVKOTA|Laxmi Prasad, the Mahakavi, died 1959|1959
PANCHAYAT|System introduced in 1960|1960
DHAULAGIRI|Seventh highest peak, first climbed in 1960|1960
AMADABLAM|Graceful peak first climbed in 1961|1961
GIRI|Tulsi ___, prime minister in 1963|1963
MULUKI|___ Ain, new civil code of 1963|1963
GOMBU|Nawang ___, Sherpa on Everest in 1963|1963
LANDREFORM|Law of 1964 on farmland|1964
AAMA|First film made in Nepal, 1964|1964
TOKYO|City of Nepal’s Olympic debut in 1964|1964
PARIJAT|Writer of “Shirishko Phool”|1965
RISING|The ___ Nepal, English daily|1965
MAITIGHAR|First Nepali film made under a private banner, 1966|1966
BHUPI|Sherchan, poet of “Ghumne Mechmathi”|1969
JHOCHHE|Freak Street, hippies’ hangout|1970
BISTA|Kirti Nidhi ___, prime minister in 1971|1971
CHITWAN|Home of rhinos and tigers, protected since 1973|1973
HIGHWAY|Prithvi ___, Kathmandu to Pokhara, finished 1974|1974
TABEI|Junko, first woman on Everest, 1975|1975
CORONATION|King Birendra’s ceremony of 1975|1975
ZONE|Peace ___, Nepal’s idea of 1975|1975
OXYGEN|Everest was first climbed without it in 1978|1978
HERITAGE|World ___ listing of the Kathmandu Valley, 1979|1979
STUDENTS|They protested against the Panchayat in 1979|1979
THAPA|Surya Bahadur ___, prime minister in 1979|1979
REFERENDUM|Vote of 1980: panchayat or multiparty|1980
MESSNER|Reinhold, solo on Everest in 1980|1980
KOIRALA|BP ___, who died in 1982|1982
FALKLANDS|Islands where Gurkhas fought in 1982|1982
CHAND|Lokendra Bahadur ___, prime minister in 1983|1983
GAMES|First South Asian ___, Kathmandu 1984|1984
NTV|Nepal’s state television channel, on air since 1985|1985
WAIWAI|Nepal’s famous instant noodles|1985
MARICH|Man Singh, prime minister in 1986|1986
SAARC|Its secretariat opened in Kathmandu in 1987|1987
EARTHQUAKE|Shook eastern Nepal in 1988|1988
BLOCKADE|Trade closure of 1989|1989
JANAANDOLAN|People’s movement of 1990|1990
MULTIPARTY|System restored in 1990|1990
GANESHMAN|Singh, leader of the 1990 movement|1990
CONSTITUTION|Adopted in 1990|1990
NARAYANGOPAL|Singer known as Swar Samrat, died in 1990|1990
GIRIJA|Prasad Koirala, prime minister in 1991|1991
KANTIPUR|Daily newspaper launched in 1993|1993
PASANG|Lhamu Sherpa, first Nepali woman on Everest|1993
MANMOHAN|Adhikari, first communist prime minister, 1994|1994
DEUBA|Sher Bahadur, prime minister in 1995|1995
FM|Radio Nepal launched its first ___ band in 1995|1995
SAGARMATHA|Radio ___, community station of 1997|1997
LUMBINI|Buddha’s birthplace, listed in 1997|1997
ATHLETES|They filled Kathmandu for the 1999 South Asian Games|1999
BHANUBHAKTA|First poet of the Nepali language
PRITHVI|Narayan Shah, who unified Nepal
MUNAMADAN|Devkota’s famous poem of a young merchant
KHUKURI|Curved knife of the Gurkhas
DANPHE|National bird
LALIGURANS|National flower
RHINO|One-horned giant of Chitwan
PHEWA|Lake of Pokhara
POKHARA|City of lakes under the Annapurnas
JANAKPUR|Birthplace of Sita
BHAKTAPUR|Town of palaces and curd
SWAYAMBHU|Buddhist stupa with monkeys
BOUDHA|Great stupa of Kathmandu
MUSTANG|Arid former kingdom beyond the Himalaya
LUKLA|Air gateway to Everest
NARAYANI|Great river of Chitwan
KOSHI|River of the east
GOSAINKUND|Sacred high-altitude lake
DALBHAT|Daily meal of lentils and rice
MOMO|Steamed dumpling
DHIDO|Millet or buckwheat porridge
GUNDRUK|Dried fermented greens
SELROTI|Ring-shaped festival bread
CHIURA|Beaten rice
TIKA|Red mark received at Dashain
JAMARA|Barley shoots grown for Dashain
MADAL|Village hand drum
SARANGI|Fiddle of the Gandharva singers
BANSURI|Bamboo flute
DHAKATOPI|Colourful cap of Nepali men
DAURA|Traditional men’s tunic
GUNYUCHOLI|Traditional women’s dress
POTE|Green glass-bead necklace of married women
DOKO|Basket carried on the back
NAMLO|Strap that carries the doko
MACHHAPUCHHRE|Fishtail mountain above Pokhara
INDRAJATRA|Kathmandu festival of the living goddess’s chariot
GAIJATRA|Festival of cows and laughter
TEEJ|Women’s festival in red
CHHATH|Festival of the sun in the Terai
MAGHE|___ Sankranti, festival of sesame and ghee
MOHAR|Old Nepali coin
HIMAL|White-capped giant
KODO|Millet grown in the hills
SHERPA|Mountain guide of Khumbu
PARK|Sagarmatha National ___, established in 1976|1976
LANGTANG|Himalayan valley north of Kathmandu, protected since 1976|1976
`;

export const WORDS: Partial<Record<Lang, string>> = { ne: NE, en: EN };
