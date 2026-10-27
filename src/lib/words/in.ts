// Extra crossword words for India. "WORD|clue|year" lines, keyed by language.
import type { Lang } from '../data';

const HI = `
आजादी|15 अगस्त 1947 को मिली|1947
बंटवारा|1947 में देश का विभाजन|1947
तिरंगा|राष्ट्रीय ध्वज, केसरिया-सफ़ेद-हरा|1947
पटेल|लौह पुरुष सरदार ___|1947
शहनाई|बिस्मिल्ला ख़ान ने आज़ादी के पहले जश्न में बजाई|1947
नेताजी|सुभाष चंद्र बोस को प्यार से कहते थे|1943
अगस्तक्रांति|9 अगस्त 1942 का आंदोलन|1942
हॉकी|1948 में आज़ाद भारत का पहला ओलंपिक स्वर्ण|1948
सहगल|'जब दिल ही टूट गया' वाले कुंदन लाल ___|1946
महल|मधुबाला की रहस्यमयी 1949 की फ़िल्म|1949
बरसात|राज कपूर-नरगिस की 1949 की फ़िल्म|1949
धर्मयुग|मुंबई की प्रसिद्ध साप्ताहिक पत्रिका|1949
चंदामामा|बच्चों की पत्रिका, हिंदी संस्करण 1949 में शुरू|1949
दिलीपकुमार|ट्रेजडी किंग, 1944 में पहली फ़िल्म|1944
राजकपूर|शोमैन, 'आग' के निर्देशक|1948
देवआनंद|सदाबहार हीरो, 'हम एक हैं' से शुरुआत|1946
संविधान|26 जनवरी 1950 को लागू हुआ|1950
आंबेडकर|संविधान के शिल्पकार डॉ. ___|1950
आवारा|राज कपूर की 1951 की फ़िल्म|1951
अमीनसयानी|रेडियो सीलोन के मशहूर उद्घोषक|1952
दिनकर|'रश्मिरथी' के कवि|1952
मीनाकुमारी|'बैजू बावरा' की नायिका, ट्रेजडी क्वीन|1952
एयरइंडिया|महाराजा वाली, 1953 में राष्ट्रीयकृत|1953
भारतरत्न|सर्वोच्च नागरिक सम्मान, 1954 से|1954
फिल्मफेयर|फ़िल्मी पुरस्कार, 1954 से|1954
भारती|धर्मवीर ___, 'अंधा युग' के रचयिता|1954
सत्यजीतरे|'पथेर पांचाली' के निर्देशक|1955
सीआईडी|देव आनंद की 1956 की जासूसी फ़िल्म|1956
मदरइंडिया|नरगिस की 1957 की ऑस्कर-नामांकित फ़िल्म|1957
प्यासा|गुरु दत्त की 1957 की फ़िल्म|1957
आशा|___ भोसले, 'नया दौर' के गीतों की आवाज़|1957
विविधभारती|आकाशवाणी की फ़रमाइशी सेवा|1957
हीराकुंड|ओडिशा का बड़ा बाँध, 1957 में पूरा|1957
धर्मेंद्र|'ही-मैन', 1960 में पहली फ़िल्म|1960
मिल्खा|'उड़न सिख' ___ सिंह, रोम ओलंपिक में चौथे|1960
जंगली|शम्मी कपूर की 'याहू!' वाली फ़िल्म|1961
पटौदी|नवाब ___, 21 साल की उम्र में भारत के कप्तान|1962
पद्मिनी|1974 में नाम मिला: मुंबई की काली-पीली फ़िएट टैक्सी|1974
शास्त्री|'जय जवान जय किसान' वाले प्रधानमंत्री|1965
ज्ञानपीठ|साहित्य का पुरस्कार, 1965 से|1965
गाइड|देव आनंद और वहीदा रहमान की फ़िल्म|1965
इंदिरा|भारत की पहली महिला प्रधानमंत्री|1966
रविशंकर|पंडित ___ ने 1967 में मोंटेरी उत्सव में सितार बजाया|1967
कृषिदर्शन|किसानों के लिए टीवी कार्यक्रम|1967
रागदरबारी|श्रीलाल शुक्ल का व्यंग्य उपन्यास|1968
हरितक्रांति|गेहूँ की पैदावार बढ़ाने वाली क्रांति|1968
राजेशखन्ना|पहले सुपरस्टार, 'आराधना' के नायक|1969
नीरमा|"वॉशिंग पाउडर ___", 1969 से|1969
इसरो|अंतरिक्ष अनुसंधान संगठन, 1969 में बना|1969
फाल्के|दादासाहेब ___ पुरस्कार, 1969 से|1969
श्वेतक्रांति|ऑपरेशन फ्लड, दूध की क्रांति|1970
आनंद|"बाबूमोशाय" वाली राजेश खन्ना की फ़िल्म|1971
वाडेकर|अजित ___, 1971 में विदेश में जीत वाले कप्तान|1971
चाचाचौधरी|कंप्यूटर से तेज़ दिमाग वाला कॉमिक्स पात्र|1971
गुड्डी|जया की पहली हिंदी फ़िल्म|1971
लूना|कायनेटिक की मोपेड|1972
बॉबी|ऋषि कपूर की किशोर प्रेम कहानी|1973
जंजीर|अमिताभ को सितारा बनाने वाली फ़िल्म|1973
पोखरण|राजस्थान का परमाणु परीक्षण स्थल|1974
जेपी|जयप्रकाश नारायण, संपूर्ण क्रांति के नायक|1974
आपातकाल|1975 में घोषित, 21 महीने चला|1975
दीवार|"मेरे पास माँ है" वाली फ़िल्म|1975
लिरिल|झरने के नीचे नहाती लड़की वाला साबुन|1975
कभीकभी|यश चोपड़ा की 1976 की प्रेम-कविता फ़िल्म|1976
बेदी|बिशन सिंह ___, 1976 में पोर्ट ऑफ़ स्पेन जीत के कप्तान|1976
मोरारजी|1977 में पहले गैर-कांग्रेसी प्रधानमंत्री|1977
थम्सअप|पारले का तीखा कोला|1977
हेमामालिनी|'ड्रीम गर्ल' (1977) की नायिका|1977
डॉन|"ग्यारह मुल्कों की पुलिस" वाली 1978 की फ़िल्म|1978
मदरटेरेसा|कोलकाता की सेवा-साधिका, 1979 में नोबेल शांति पुरस्कार|1979
भास्कर|1979 में छोड़ा गया उपग्रह|1979
पादुकोण|प्रकाश ___, ऑल इंग्लैंड बैडमिंटन चैंपियन|1980
एशियाड|1982 में दिल्ली में हुए खेल|1982
अप्पू|एशियाड का हाथी शुभंकर|1982
रंगीन|1982 में दूरदर्शन पर आया ___ टीवी|1982
विश्वकप|1983 में लॉर्ड्स पर कपिल की जीत|1983
भानुअथैया|'गांधी' के लिए ऑस्कर जीतने वाली पोशाक डिज़ाइनर|1983
मैगी|दो मिनट वाली नूडल्स|1983
राजीव|1984 में बने सबसे युवा प्रधानमंत्री|1984
मेट्रो|कोलकाता में 1984 में चली पहली|1984
उषा|पी.टी. ___, 1984 ओलंपिक में चौथी|1984
भोपाल|1984 की गैस त्रासदी का शहर|1984
बेताल|विक्रम और ___, कहानियों वाला धारावाहिक|1985
नागराज|राज कॉमिक्स का साँप वाला नायक|1986
बुनियाद|विभाजन पर आधारित धारावाहिक|1986
चिट्ठी|'नाम' फ़िल्म का वतन की याद वाला गीत|1986
श्रीदेवी|'हवा-हवाई' वाली अभिनेत्री|1987
मिस्टरइंडिया|मोगैंबो और अदृश्य घड़ी वाली फ़िल्म|1987
महाभारत|बी.आर. चोपड़ा का रविवार का धारावाहिक|1988
विश्वनाथन|शतरंज के पहले भारतीय ग्रैंडमास्टर, ___ आनंद|1988
तेंदुलकर|सचिन ___, 1989 में पदार्पण|1989
अजहर|मोहम्मद ___, कलाई के जादूगर कप्तान|1989
रंगोली|रविवार सुबह फ़िल्मी गानों का कार्यक्रम|1988
सुरभि|दूरदर्शन का सांस्कृतिक सवाल-जवाब कार्यक्रम|1990
उदारीकरण|1991 के आर्थिक सुधार|1991
नरसिंहराव|1991 में बने प्रधानमंत्री|1991
माधुरी|धक-धक गर्ल दीक्षित|1992
अंताक्षरी|गानों के अंतिम अक्षर वाला खेल|1993
मोगली|"चड्डी पहन के फूल खिला है" वाला जंगल का बालक|1993
चंद्रकांता|तिलिस्म और ऐयारी वाला धारावाहिक|1994
गांगुली|सौरव ___ ने 1996 में लॉर्ड्स पर शतक जड़ा|1996
पेस|लिएंडर ___, 1996 ओलंपिक कांस्य|1996
शक्तिमान|गंगाधर वाला टीवी सुपरहीरो|1997
वाजपेयी|अटल बिहारी ___, 1998 में प्रधानमंत्री|1998
कलाम|मिसाइल मैन, पोखरण के वैज्ञानिक डॉ. ___|1998
कुंबले|दिल्ली में एक पारी में दस विकेट|1999
कारगिल|1999 के युद्ध की चोटियाँ|1999
केबीसी|अमिताभ बच्चन के साथ 2000 में शुरू हुआ क्विज़ शो|2000
मल्लेश्वरी|कर्णम ___, ओलंपिक कांस्य पदक|2000
ताजमहल|आगरा में यमुना किनारे संगमरमर का मकबरा
लालकिला|दिल्ली का क़िला, जहाँ 15 अगस्त को झंडा फहरता है
इंडियागेट|दिल्ली में शहीदों का स्मारक
चारमीनार|हैदराबाद की पहचान, कुली कुतुब शाह की बनवाई इमारत
कुतुबमीनार|महरौली का 73 मीटर ऊँचा लाल बलुआ पत्थर का स्तंभ
वाघा|अटारी के पास की सीमा, जहाँ रोज़ शाम परेड होती है
चाय|सुबह की प्याली, दूध और अदरक वाली
समोसा|तिकोना, आलू भरा, तला हुआ
जलेबी|चाशनी में डूबी कुरकुरी मिठाई
लस्सी|पंजाब का गाढ़ा दही का पेय
कुल्फी|ठेले पर मिलने वाली ठंडी मिठाई
रसगुल्ला|बंगाल की स्पंजी सफ़ेद मिठाई
पराठा|घी में सिंका परतदार रोटी
डोसा|दक्षिण का कुरकुरा पतला नाश्ता
मटका|गर्मी में पानी ठंडा रखने वाला मिट्टी का घड़ा
धोती|पुरुषों का बिना सिला कपड़ा
कुर्ता|पायजामे के साथ पहनी जाने वाली कमीज़
दिवाली|दीयों और लक्ष्मी पूजा का त्योहार
होली|रंगों का त्योहार
राखी|भाई की कलाई पर बँधने वाला धागा
दशहरा|रावण दहन का दिन
चरखा|गांधी जी का सूत कातने का पहिया
तांगा|घोड़े से खिंचने वाली सवारी
रिक्शा|तीन पहियों की सवारी
तबला|हाथ से बजने वाला जोड़ी-वाद्य
सितार|तारों वाला वाद्य, रविशंकर का साथी
मेला|गाँव में झूलों और मिठाइयों की भीड़
चूल्हा|मिट्टी का, रोटी सेंकने वाला
अंगीठी|सर्दी में कोयले की आँच वाली
लड्डू|गोल मिठाई, मोतीचूर या बेसन
चटनी|पुदीने या इमली की, खाने के साथ
`;

const EN = `
QUITINDIA|Gandhi’s “Do or Die” movement of 1942|1942
NETAJI|Subhas Chandra Bose, leader of the INA|1943
SAIGAL|K. L. ___, singer-actor of “Shahjahan”|1946
DEVANAND|Evergreen hero who debuted in “Hum Ek Hain”|1946
INDEPENDENCE|Achieved on 15 August 1947|1947
PARTITION|Division of the subcontinent in 1947|1947
TRICOLOUR|Saffron, white and green flag|1947
PATEL|Sardar ___, the Iron Man of India|1947
SHEHNAI|Bismillah Khan’s reed instrument, heard at the first Independence Day|1947
CHANDAMAMA|Children’s magazine started in 1947|1947
HOCKEY|Independent India’s first Olympic gold, 1948|1948
RAJKAPOOR|The Showman, director of “Aag”|1948
DILIPKUMAR|Tragedy King who debuted in 1944|1944
MAHAL|Madhubala’s mysterious 1949 film|1949
BARSAAT|Raj Kapoor and Nargis film of 1949|1949
DHARMYUG|Famous Mumbai weekly magazine|1949
CONSTITUTION|Came into force on 26 January 1950|1950
AMBEDKAR|Dr. ___, architect of the Constitution|1950
AWARA|Raj Kapoor’s 1951 film of the tramp|1951
SAYANI|Ameen ___, voice of Binaca Geetmala|1952
DINKAR|Ramdhari ___, poet of Rashmirathi|1952
MEENAKUMARI|Tragedy Queen of “Baiju Bawra”|1952
AIRINDIA|Maharajah’s airline, nationalised in 1953|1953
BHARATRATNA|Highest civilian honour, since 1954|1954
FILMFARE|Film awards, since 1954|1954
SATYAJITRAY|Director of “Pather Panchali”|1955
CID|Dev Anand’s detective film of 1956|1956
MOTHERINDIA|Nargis’s Oscar-nominated 1957 film|1957
PYAASA|Film of “Jaane Woh Kaise Log The”, 1957|1957
ASHA|___ Bhosle, voice of “Naya Daur” songs|1957
GURUDUTT|Director-actor of “Pyaasa”|1957
HIRAKUD|Great dam in Odisha, completed in 1957|1957
DHARMENDRA|The He-Man, debuted in 1960|1960
MILKHA|The Flying Sikh ___ Singh, fourth in Rome|1960
JUNGLEE|Shammi Kapoor’s “Yahoo!” film|1961
PATAUDI|Nawab ___, captain at the age of 21|1962
PADMINI|Black-and-yellow Mumbai taxi, a Fiat, named in 1974|1974
SHASTRI|“Jai Jawan Jai Kisan” Prime Minister|1965
JNANPITH|Literary award, since 1965|1965
GUIDE|Dev Anand and Waheeda Rehman film|1965
INDIRA|India’s first woman Prime Minister|1966
RAVISHANKAR|Pandit ___, sitar maestro at Monterey in 1967|1967
RAGDARBARI|Shrilal Shukla’s satirical novel|1968
RAJESHKHANNA|First superstar, hero of “Aradhana”|1969
NIRMA|Washing powder brand of 1969|1969
ISRO|Space research organisation formed in 1969|1969
PHALKE|Dadasaheb ___ Award, since 1969|1969
ANAND|Rajesh Khanna’s “Babumoshay” film|1971
WADEKAR|Ajit ___, captain of the 1971 overseas wins|1971
GUDDI|Jaya’s first Hindi film|1971
LUNA|Kinetic’s moped|1972
BOBBY|Rishi Kapoor’s teenage romance|1973
ZANJEER|The film that made Amitabh a star|1973
POKHRAN|Rajasthan test site of 1974|1974
JP|Jayaprakash Narayan, hero of “Total Revolution”|1974
EMERGENCY|Declared in 1975, lasted 21 months|1975
DEEWAR|The “Mere paas Maa hai” film|1975
LIRIL|Soap with the girl under the waterfall|1975
KABHIKABHIE|Yash Chopra’s romantic poem of a film, 1976|1976
BEDI|Bishan Singh ___, captain of the 1976 Port of Spain chase|1976
MORARJI|First non-Congress Prime Minister, 1977|1977
THUMSUP|Parle’s strong cola|1977
HEMAMALINI|Star of the 1977 film “Dream Girl”|1977
DON|Amitabh’s 1978 thriller about a double|1978
MOTHERTERESA|Kolkata’s Nobel Peace laureate of 1979|1979
BHASKARA|Satellite launched in 1979|1979
PADUKONE|Prakash ___, All England badminton champion|1980
ASIAD|Games held in Delhi in 1982|1982
APPU|Elephant mascot of the 1982 games|1982
COLOURTV|It reached Indian homes in 1982|1982
WORLDCUP|Kapil’s Devils lifted it at Lord’s in 1983|1983
MAGGI|Two-minute noodles|1983
RAJIV|Youngest Prime Minister, in 1984|1984
METRO|Kolkata ran India’s first, from 1984|1984
USHA|P. T. ___, fourth at the 1984 Olympics|1984
BHOPAL|City of the gas tragedy of 1984|1984
BETAAL|Vikram and ___, tale-telling serial|1985
NAGRAJ|Raj Comics’ snake hero|1986
BUNIYAAD|Serial based on Partition|1986
SRIDEVI|Actress of “Hawa Hawai”|1987
MISTERINDIA|Film of Mogambo and an invisible watch|1987
MAHABHARAT|B. R. Chopra’s Sunday epic|1988
VISWANATHAN|First Indian chess grandmaster, ___ Anand|1988
TENDULKAR|Sachin ___, debuted in 1989|1989
AZHARUDDIN|Wristy captain, Mohammad ___|1989
SURABHI|Doordarshan’s cultural quiz programme|1990
NARASIMHA|P. V. ___ Rao, Prime Minister in 1991|1991
MADHURI|The Dhak Dhak girl Dixit|1992
ANTAKSHARI|Song-chain game show|1993
MOWGLI|Jungle boy of “Chaddi Pehen Ke Phool Khila Hai”|1993
CHANDRAKANTA|Serial of magic and spies|1994
GANGULY|Sourav ___, century on Lord’s debut|1996
PAES|Leander ___, Olympic bronze|1996
SHAKTIMAAN|Gangadhar’s TV superhero|1997
VAJPAYEE|Atal Bihari ___, Prime Minister in 1998|1998
KALAM|The Missile Man, Dr. ___|1998
KUMBLE|Took ten wickets in an innings in Delhi|1999
KARGIL|Peaks of the 1999 conflict|1999
CROREPATI|Kaun Banega ___, Amitabh’s quiz show|2000
MALLESWARI|Karnam ___, Olympic bronze medallist|2000
TAJMAHAL|White marble tomb at Agra
REDFORT|Delhi fort where the flag flies on 15 August
INDIAGATE|Delhi memorial to fallen soldiers
CHARMINAR|Hyderabad landmark built by Quli Qutb Shah in 1591
QUTUBMINAR|Mehrauli’s tall red sandstone tower, 73 metres high
WAGAH|Border where the evening parade is held
CHAI|Morning cup with milk and ginger
SAMOSA|Triangular fried pastry with potato
JALEBI|Crisp orange spiral soaked in syrup
LASSI|Thick yogurt drink of Punjab
KULFI|Frozen sweet sold from a cart
RASGULLA|Spongy white sweet of Bengal
PARATHA|Layered flatbread with ghee
DOSA|Crisp southern breakfast crepe
MATKA|Clay pot that keeps water cool
DHOTI|Unstitched cloth worn by men
KURTA|Long shirt worn with pyjamas
DIWALI|Festival of lamps
HOLI|Festival of colours
RAKHI|Thread tied on a brother’s wrist
DUSSEHRA|Day of burning Ravan’s effigy
LANTERN|Light when the power is out
TONGA|Horse-drawn carriage
RICKSHAW|Three-wheeled ride
TABLA|Pair of hand drums
SITAR|Long-necked string instrument
CHULHA|Clay stove for making rotis
LADDU|Round sweet of gram flour
CHUTNEY|Mint or tamarind relish
RANGOLI|Colourful floor pattern at the door
BINDI|Dot worn on the forehead
`;

export const WORDS: Partial<Record<Lang, string>> = { hi: HI, en: EN };
