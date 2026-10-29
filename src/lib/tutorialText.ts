import type { Lang } from './data';

// Text for the animated tutorial. English is the source.

export const TUTORIAL_STEP_IDS = [
  'welcome', 'menu', 'today', 'memories', 'extras', 'settings',
  'quiz', 'tune', 'crossword', 'wordsearch', 'scramble', 'hangman',
  'solitaire', 'sudoku', 'pattern', 'math', 'chess', 'checkers',
  'finish',
] as const;
export type TutorialStepId = (typeof TUTORIAL_STEP_IDS)[number];

export interface TutorialText {
  ui: {
    heading: string; // dialog label
    next: string;
    back: string;
    skip: string;
    start: string;
    stepOf: string; // "Step {n} of {total}"
    watch: string; // button on the Help page
    watchHint: string;
  };
  steps: Record<TutorialStepId, { title: string; body: string }>;
}

const EN: TutorialText = {
  ui: {
    heading: 'Hoot tutorial',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    start: 'Start using Hoot',
    stepOf: 'Step {n} of {total}',
    watch: 'Watch the tutorial',
    watchHint: 'A short, step-by-step tour of everything in Hoot.',
  },
  steps: {
    welcome: {
      title: 'Welcome to Hoot',
      body: 'Hoot brings back the news, songs and moments from your life, and keeps your mind busy with friendly puzzles. A few minutes a day is all it takes.',
    },
    menu: {
      title: 'Getting around',
      body: 'On a phone, use the bar at the bottom: Today, Memories, Games and More. On a computer, the same choices sit along the top.',
    },
    today: {
      title: "Today's five and your streak",
      body: "Each day Hoot offers five small things to enjoy. Finish them and your streak grows by one day. Come back tomorrow to keep it going.",
    },
    memories: {
      title: 'Memories',
      body: 'You see one memory card at a time. Tap Play a song to hear it, Save to keep it, Next for another, or Read to me to hear it aloud.',
    },
    extras: {
      title: 'News, Reflections and Saved',
      body: "News shows today's stories. Reflections are gentle thoughts to ponder. Saved holds every memory you chose to keep.",
    },
    settings: {
      title: 'Make Hoot comfortable',
      body: 'In Settings you can make the text bigger, switch on high contrast, and change the language whenever you like.',
    },
    quiz: {
      title: 'Memory quiz',
      body: 'Read the question, then tap the year you think is right. You find out straight away.',
    },
    tune: {
      title: 'Name that tune',
      body: 'Press the play button to hear a song, then tap the title you think it is.',
    },
    crossword: {
      title: 'Crossword',
      body: 'Tap a square, then type the letters. When you are ready, tap Check to see how you did.',
    },
    wordsearch: {
      title: 'Word search',
      body: 'Put your finger on the first letter of a hidden word and drag across the letters to the last one.',
    },
    scramble: {
      title: 'Word scramble',
      body: 'The letters are mixed up. Tap them in the right order to spell the word.',
    },
    hangman: {
      title: 'Hangman',
      body: 'Tap a letter to guess. Right letters appear in the word; wrong ones add to the drawing, so choose with care.',
    },
    solitaire: {
      title: 'Solitaire',
      body: "Tap a card and it moves by itself to where it fits: a red card on a black card one higher, or up to the piles at the top. Stuck? Tap the deck for a new card.",
    },
    sudoku: {
      title: 'Sudoku',
      body: 'Tap an empty square, then tap a number to put in it. Each number can appear only once in every row and column.',
    },
    pattern: {
      title: 'Pattern puzzle',
      body: 'Look at the shapes and tap what comes next, or the one that does not belong.',
    },
    math: {
      title: 'Quick math',
      body: 'A short sum appears. Tap the right answer from the choices below it.',
    },
    chess: {
      title: 'Chess',
      body: 'Tap one of your pieces and its possible moves light up. Tap a lit square to move. Changed your mind? Tap Take back.',
    },
    checkers: {
      title: 'Checkers',
      body: 'Tap one of your pieces, then tap where it should jump. Jump over an opponent piece to capture it.',
    },
    finish: {
      title: "You're ready",
      body: 'That is everything. You can watch this tutorial again at any time from the Help page.',
    },
  },
};

const RU: TutorialText = {
  ui: {
    heading: 'Обучение Hoot',
    next: 'Далее',
    back: 'Назад',
    skip: 'Пропустить',
    start: 'Начать пользоваться Hoot',
    stepOf: 'Шаг {n} из {total}',
    watch: 'Посмотреть обучение',
    watchHint: 'Короткая пошаговая экскурсия по всему, что есть в Hoot.',
  },
  steps: {
    welcome: {
      title: 'Добро пожаловать в Hoot',
      body: 'Hoot возвращает новости, песни и моменты из вашей жизни и занимает ваш ум приятными головоломками. Достаточно нескольких минут в день.',
    },
    menu: {
      title: 'Как пользоваться',
      body: 'На телефоне используйте панель внизу: Сегодня, Воспоминания, Игры и Ещё. На компьютере те же разделы находятся вверху.',
    },
    today: {
      title: 'Пятёрка дня и ваша серия',
      body: 'Каждый день Hoot предлагает пять небольших радостей. Выполните их, и ваша серия вырастет на один день. Возвращайтесь завтра, чтобы продолжить.',
    },
    memories: {
      title: 'Воспоминания',
      body: 'Вы видите одну карточку воспоминания за раз. Нажмите «Включить песню», чтобы её послушать, «Сохранить», чтобы оставить, «Далее», чтобы увидеть другое, или «Прочитать вслух», чтобы услышать текст.',
    },
    extras: {
      title: 'Новости, Размышления и Избранное',
      body: 'В разделе «Новости» — истории дня. «Размышления» — спокойные мысли для раздумий. «Избранное» хранит все воспоминания, которые вы решили сохранить.',
    },
    settings: {
      title: 'Сделайте Hoot удобным',
      body: 'В настройках можно увеличить текст, включить высокую контрастность и сменить язык, когда захотите.',
    },
    quiz: {
      title: 'Викторина о памяти',
      body: 'Прочитайте вопрос и нажмите на год, который считаете верным. Ответ вы узнаете сразу.',
    },
    tune: {
      title: 'Угадай мелодию',
      body: 'Нажмите кнопку воспроизведения, чтобы услышать песню, и выберите название, которое, по-вашему, подходит.',
    },
    crossword: {
      title: 'Кроссворд',
      body: 'Нажмите на клетку и введите буквы. Когда будете готовы, нажмите «Проверить», чтобы увидеть результат.',
    },
    wordsearch: {
      title: 'Поиск слов',
      body: 'Положите палец на первую букву спрятанного слова и проведите по буквам до последней.',
    },
    scramble: {
      title: 'Анаграмма',
      body: 'Буквы перемешаны. Нажимайте на них в правильном порядке, чтобы составить слово.',
    },
    hangman: {
      title: 'Виселица',
      body: 'Нажимайте на буквы, чтобы угадать слово. Верные буквы появятся в слове, неверные добавятся к рисунку, поэтому выбирайте внимательно.',
    },
    solitaire: {
      title: 'Пасьянс',
      body: "Нажмите на карту — она сама перейдёт туда, где подходит: красная на чёрную на одно значение старше или наверх в стопки. Нет ходов? Нажмите на колоду.",
    },
    sudoku: {
      title: 'Судоку',
      body: 'Нажмите на пустую клетку, затем на цифру, которую хотите в неё поставить. Каждая цифра может встречаться в строке и в столбце только один раз.',
    },
    pattern: {
      title: 'Головоломка с узорами',
      body: 'Посмотрите на фигуры и нажмите на то, что идёт дальше, или на ту, что лишняя.',
    },
    math: {
      title: 'Быстрый счёт',
      body: 'Появляется короткий пример. Нажмите на правильный ответ среди вариантов под ним.',
    },
    chess: {
      title: 'Шахматы',
      body: 'Нажмите на одну из своих фигур, и её возможные ходы подсветятся. Нажмите на подсвеченную клетку, чтобы сделать ход. Передумали? Нажмите «Вернуть ход».',
    },
    checkers: {
      title: 'Шашки',
      body: 'Нажмите на свою шашку, затем на место, куда она должна прыгнуть. Перепрыгните через шашку соперника, чтобы её взять.',
    },
    finish: {
      title: 'Вы готовы',
      body: 'Это всё. Вы можете посмотреть обучение снова в любое время на странице «Помощь».',
    },
  },
};

const FR: TutorialText = {
  ui: {
    heading: 'Tutoriel Hoot',
    next: 'Suivant',
    back: 'Retour',
    skip: 'Passer',
    start: 'Commencer à utiliser Hoot',
    stepOf: 'Étape {n} sur {total}',
    watch: 'Voir le tutoriel',
    watchHint: 'Une courte visite, étape par étape, de tout ce qui se trouve dans Hoot.',
  },
  steps: {
    welcome: {
      title: 'Bienvenue sur Hoot',
      body: 'Hoot fait revivre les actualités, les chansons et les moments de votre vie, et garde votre esprit en éveil avec des jeux amicaux. Quelques minutes par jour suffisent.',
    },
    menu: {
      title: 'Se repérer',
      body: 'Sur un téléphone, utilisez la barre en bas : Aujourd’hui, Souvenirs, Jeux et Plus. Sur un ordinateur, les mêmes choix se trouvent en haut de l’écran.',
    },
    today: {
      title: 'Les cinq du jour et votre série',
      body: 'Chaque jour, Hoot vous propose cinq petites choses à apprécier. Terminez-les et votre série progresse d’un jour. Revenez demain pour la poursuivre.',
    },
    memories: {
      title: 'Souvenirs',
      body: 'Vous voyez une carte de souvenir à la fois. Touchez Écouter une chanson pour l’entendre, Garder pour la conserver, Suivant pour en voir une autre, ou Lire à voix haute pour l’écouter.',
    },
    extras: {
      title: 'Actualités, Réflexions et Favoris',
      body: 'Actualités affiche les histoires du jour. Réflexions sont de douces pensées à méditer. Favoris garde chaque souvenir que vous avez choisi de conserver.',
    },
    settings: {
      title: 'Rendez Hoot confortable',
      body: 'Dans Réglages, vous pouvez agrandir le texte, activer le contraste élevé et changer de langue à tout moment.',
    },
    quiz: {
      title: 'Quiz de mémoire',
      body: 'Lisez la question, puis touchez l’année que vous pensez être la bonne. Vous saurez tout de suite si c’est juste.',
    },
    tune: {
      title: 'Devinez la chanson',
      body: 'Touchez le bouton lecture pour écouter une chanson, puis touchez le titre que vous pensez être le bon.',
    },
    crossword: {
      title: 'Mots croisés',
      body: 'Touchez une case, puis tapez les lettres. Quand vous êtes prêt, touchez Vérifier pour voir le résultat.',
    },
    wordsearch: {
      title: 'Mots mêlés',
      body: 'Posez le doigt sur la première lettre d’un mot caché et glissez sur les lettres jusqu’à la dernière.',
    },
    scramble: {
      title: 'Mot mêlé',
      body: 'Les lettres sont mélangées. Touchez-les dans le bon ordre pour écrire le mot.',
    },
    hangman: {
      title: 'Le pendu',
      body: 'Touchez une lettre pour deviner. Les bonnes lettres apparaissent dans le mot ; les mauvaises ajoutent un trait au dessin, alors choisissez avec soin.',
    },
    solitaire: {
      title: 'Réussite',
      body: "Touchez une carte : elle va toute seule là où elle peut aller — une rouge sur une noire d’une valeur au-dessus, ou en haut sur les piles. Bloqué ? Touchez la pioche.",
    },
    sudoku: {
      title: 'Sudoku',
      body: 'Touchez une case vide, puis un chiffre à y placer. Chaque chiffre ne peut apparaître qu’une seule fois dans chaque ligne et chaque colonne.',
    },
    pattern: {
      title: 'Casse-tête de formes',
      body: 'Regardez les formes et touchez ce qui vient ensuite, ou celle qui n’a pas sa place.',
    },
    math: {
      title: 'Calcul rapide',
      body: 'Une petite opération apparaît. Touchez la bonne réponse parmi les choix proposés en dessous.',
    },
    chess: {
      title: 'Échecs',
      body: 'Touchez une de vos pièces : ses coups possibles s’éclairent. Touchez une case éclairée pour jouer. Vous avez changé d’avis ? Touchez Reprendre.',
    },
    checkers: {
      title: 'Dames',
      body: 'Touchez un de vos pions, puis l’endroit où il doit sauter. Sautez par-dessus un pion adverse pour le capturer.',
    },
    finish: {
      title: 'Vous êtes prêt',
      body: 'C’est tout. Vous pouvez revoir ce tutoriel à tout moment depuis la page Aide.',
    },
  },
};

const DE: TutorialText = {
  ui: {
    heading: 'Hoot-Anleitung',
    next: 'Weiter',
    back: 'Zurück',
    skip: 'Überspringen',
    start: 'Hoot benutzen',
    stepOf: 'Schritt {n} von {total}',
    watch: 'Anleitung ansehen',
    watchHint: 'Eine kurze Schritt-für-Schritt-Führung durch alles in Hoot.',
  },
  steps: {
    welcome: {
      title: 'Willkommen bei Hoot',
      body: 'Hoot holt Nachrichten, Lieder und Momente aus Ihrem Leben zurück und hält Ihren Geist mit freundlichen Rätseln in Schwung. Ein paar Minuten am Tag genügen.',
    },
    menu: {
      title: 'So finden Sie sich zurecht',
      body: 'Auf dem Telefon nutzen Sie die Leiste unten: Heute, Erinnerungen, Spiele und Mehr. Am Computer finden Sie dieselben Auswahlmöglichkeiten oben.',
    },
    today: {
      title: 'Die fünf von heute und Ihre Serie',
      body: 'Jeden Tag bietet Hoot Ihnen fünf kleine Dinge zum Genießen an. Erledigen Sie sie, dann wächst Ihre Serie um einen Tag. Kommen Sie morgen wieder, um sie fortzusetzen.',
    },
    memories: {
      title: 'Erinnerungen',
      body: 'Sie sehen immer eine Erinnerungskarte. Tippen Sie auf Lied abspielen, um es zu hören, auf Merken, um sie zu behalten, auf Weiter für eine andere oder auf Vorlesen, um sie sich vorlesen zu lassen.',
    },
    extras: {
      title: 'Nachrichten, Besinnung und Gemerkt',
      body: 'Unter Nachrichten finden Sie die Geschichten des Tages. Besinnung sind sanfte Gedanken zum Nachdenken. Gemerkt enthält alle Erinnerungen, die Sie aufbewahren wollten.',
    },
    settings: {
      title: 'Hoot angenehm einrichten',
      body: 'In den Einstellungen können Sie die Schrift vergrößern, den hohen Kontrast einschalten und jederzeit die Sprache ändern.',
    },
    quiz: {
      title: 'Erinnerungsquiz',
      body: 'Lesen Sie die Frage und tippen Sie auf die Jahreszahl, die Ihrer Meinung nach richtig ist. Sie erfahren sofort, ob es stimmt.',
    },
    tune: {
      title: 'Erraten Sie das Lied',
      body: 'Tippen Sie auf den Abspielknopf, um ein Lied zu hören, und dann auf den Titel, von dem Sie glauben, dass er passt.',
    },
    crossword: {
      title: 'Kreuzworträtsel',
      body: 'Tippen Sie auf ein Feld und geben Sie die Buchstaben ein. Wenn Sie so weit sind, tippen Sie auf Prüfen, um Ihr Ergebnis zu sehen.',
    },
    wordsearch: {
      title: 'Wortsuche',
      body: 'Legen Sie den Finger auf den ersten Buchstaben eines versteckten Wortes und ziehen Sie über die Buchstaben bis zum letzten.',
    },
    scramble: {
      title: 'Wörter raten',
      body: 'Die Buchstaben sind durcheinander. Tippen Sie sie in der richtigen Reihenfolge an, um das Wort zu bilden.',
    },
    hangman: {
      title: 'Galgenmännchen',
      body: 'Tippen Sie einen Buchstaben an, um zu raten. Richtige Buchstaben erscheinen im Wort; falsche kommen zur Zeichnung hinzu. Wählen Sie also mit Bedacht.',
    },
    solitaire: {
      title: 'Solitär',
      body: "Tippen Sie auf eine Karte – sie geht von selbst dorthin, wo sie passt: rot auf schwarz, einen Wert höher, oder hoch auf die Stapel. Kein Zug? Tippen Sie auf den Stapel.",
    },
    sudoku: {
      title: 'Sudoku',
      body: 'Tippen Sie auf ein leeres Feld und dann auf eine Zahl, die dort hinein soll. Jede Zahl darf in jeder Zeile und jeder Spalte nur einmal vorkommen.',
    },
    pattern: {
      title: 'Muster-Rätsel',
      body: 'Betrachten Sie die Formen und tippen Sie auf das, was als Nächstes kommt, oder auf die, die nicht dazugehört.',
    },
    math: {
      title: 'Kopfrechnen',
      body: 'Eine kurze Aufgabe erscheint. Tippen Sie auf die richtige Antwort unter den Auswahlmöglichkeiten.',
    },
    chess: {
      title: 'Schach',
      body: 'Tippen Sie auf eine Ihrer Figuren, dann leuchten ihre möglichen Züge auf. Tippen Sie auf ein markiertes Feld, um zu ziehen. Haben Sie es sich anders überlegt? Tippen Sie auf Zurücknehmen.',
    },
    checkers: {
      title: 'Dame',
      body: 'Tippen Sie auf einen Ihrer Steine und dann auf die Stelle, wohin er springen soll. Springen Sie über einen gegnerischen Stein, um ihn zu schlagen.',
    },
    finish: {
      title: 'Sie sind bereit',
      body: 'Das war alles. Sie können diese Anleitung jederzeit auf der Hilfe-Seite wieder ansehen.',
    },
  },
};

const IT: TutorialText = {
  ui: {
    heading: 'Tutorial di Hoot',
    next: 'Avanti',
    back: 'Indietro',
    skip: 'Salta',
    start: 'Inizia a usare Hoot',
    stepOf: 'Passo {n} di {total}',
    watch: 'Guarda il tutorial',
    watchHint: 'Un breve giro guidato, passo dopo passo, di tutto ciò che c’è in Hoot.',
  },
  steps: {
    welcome: {
      title: 'Benvenuto in Hoot',
      body: 'Hoot riporta le notizie, le canzoni e i momenti della sua vita e tiene la mente allenata con giochi piacevoli. Bastano pochi minuti al giorno.',
    },
    menu: {
      title: 'Come muoversi',
      body: 'Sul telefono usi la barra in basso: Oggi, Ricordi, Giochi e Altro. Sul computer, le stesse scelte si trovano in alto.',
    },
    today: {
      title: 'I cinque di oggi e la sua serie',
      body: 'Ogni giorno Hoot le propone cinque piccole cose da godersi. Completandole, la sua serie cresce di un giorno. Torni domani per mantenerla.',
    },
    memories: {
      title: 'Ricordi',
      body: 'Vede una scheda ricordo alla volta. Tocchi Ascolta una canzone per sentirla, Salva per conservarla, Avanti per un’altra, o Leggi ad alta voce per farsela leggere.',
    },
    extras: {
      title: 'Notizie, Riflessioni e Preferiti',
      body: 'Notizie mostra le storie di oggi. Le Riflessioni sono pensieri delicati su cui meditare. Preferiti raccoglie tutti i ricordi che ha scelto di conservare.',
    },
    settings: {
      title: 'Rendi Hoot confortevole',
      body: 'Nelle Impostazioni può ingrandire il testo, attivare l’alto contrasto e cambiare lingua quando vuole.',
    },
    quiz: {
      title: 'Quiz della memoria',
      body: 'Legga la domanda, poi tocchi l’anno che ritiene corretto. Saprà subito com’è andata.',
    },
    tune: {
      title: 'Indovina la canzone',
      body: 'Prema il pulsante di riproduzione per ascoltare una canzone, poi tocchi il titolo che pensa sia quello giusto.',
    },
    crossword: {
      title: 'Cruciverba',
      body: 'Tocchi una casella, poi scriva le lettere. Quando è pronto, tocchi Controlla per vedere com’è andata.',
    },
    wordsearch: {
      title: 'Cerca parole',
      body: 'Appoggi il dito sulla prima lettera di una parola nascosta e trascini fino all’ultima lettera.',
    },
    scramble: {
      title: 'Parole mescolate',
      body: 'Le lettere sono mescolate. Tocchi le lettere nell’ordine giusto per comporre la parola.',
    },
    hangman: {
      title: 'Impiccato',
      body: 'Tocchi una lettera per indovinare. Le lettere giuste compaiono nella parola; quelle sbagliate aggiungono un pezzo al disegno, quindi scelga con cura.',
    },
    solitaire: {
      title: 'Solitario',
      body: "Tocchi una carta: va da sola dove può andare — una rossa su una nera di un valore più alto, o in alto sulle pile. Bloccato? Tocchi il mazzo.",
    },
    sudoku: {
      title: 'Sudoku',
      body: 'Tocchi una casella vuota, poi un numero da inserire. Ogni numero può comparire una sola volta in ogni riga e in ogni colonna.',
    },
    pattern: {
      title: 'Rompicapo di forme',
      body: 'Guardi le figure e tocchi quella che viene dopo, oppure quella che non c’entra.',
    },
    math: {
      title: 'Calcolo veloce',
      body: 'Compare un piccolo calcolo. Tocchi la risposta giusta tra le scelte sotto.',
    },
    chess: {
      title: 'Scacchi',
      body: 'Tocchi uno dei suoi pezzi e si illuminano le mosse possibili. Tocchi una casella illuminata per muovere. Ci ripensa? Tocchi Annulla mossa.',
    },
    checkers: {
      title: 'Dama',
      body: 'Tocchi una delle sue pedine, poi il punto dove deve saltare. Salti sopra una pedina avversaria per catturarla.',
    },
    finish: {
      title: 'È pronto',
      body: 'Questo è tutto. Può rivedere questo tutorial in qualsiasi momento dalla pagina Aiuto.',
    },
  },
};

const PT: TutorialText = {
  ui: {
    heading: 'Tutorial do Hoot',
    next: 'Próximo',
    back: 'Voltar',
    skip: 'Pular',
    start: 'Começar a usar o Hoot',
    stepOf: 'Passo {n} de {total}',
    watch: 'Assistir ao tutorial',
    watchHint: 'Um passeio curto, passo a passo, por tudo o que há no Hoot.',
  },
  steps: {
    welcome: {
      title: 'Bem-vindo ao Hoot',
      body: 'O Hoot traz de volta as notícias, as músicas e os momentos da sua vida, e mantém sua mente ativa com quebra-cabeças amigáveis. Alguns minutos por dia são suficientes.',
    },
    menu: {
      title: 'Como navegar',
      body: 'No celular, use a barra de baixo: Hoje, Lembranças, Jogos e Mais. No computador, as mesmas opções ficam no topo.',
    },
    today: {
      title: 'Os cinco de hoje e sua sequência',
      body: 'Todo dia o Hoot oferece cinco pequenas coisas para você curtir. Complete-as e sua sequência cresce um dia. Volte amanhã para mantê-la.',
    },
    memories: {
      title: 'Lembranças',
      body: 'Você vê um cartão de lembrança por vez. Toque em Tocar uma música para ouvi-la, em Salvar para guardar, em Próximo para ver outra, ou em Ler para mim para ouvir em voz alta.',
    },
    extras: {
      title: 'Notícias, Reflexões e Guardadas',
      body: 'Notícias mostra as histórias de hoje. Reflexões são pensamentos suaves para ponderar. Guardadas reúne todas as lembranças que você escolheu manter.',
    },
    settings: {
      title: 'Deixe o Hoot confortável',
      body: 'Em Ajustes você pode aumentar o texto, ativar o alto contraste e mudar o idioma sempre que quiser.',
    },
    quiz: {
      title: 'Quiz de memória',
      body: 'Leia a pergunta e toque no ano que você acha certo. Você descobre na hora.',
    },
    tune: {
      title: 'Adivinhe a música',
      body: 'Toque no botão de play para ouvir uma música e, depois, toque no título que você acha que é.',
    },
    crossword: {
      title: 'Palavras cruzadas',
      body: 'Toque em um quadrado e digite as letras. Quando estiver pronto, toque em Conferir para ver como foi.',
    },
    wordsearch: {
      title: 'Caça-palavras',
      body: 'Coloque o dedo na primeira letra de uma palavra escondida e arraste até a última letra.',
    },
    scramble: {
      title: 'Palavra embaralhada',
      body: 'As letras estão misturadas. Toque nelas na ordem certa para formar a palavra.',
    },
    hangman: {
      title: 'Forca',
      body: 'Toque em uma letra para adivinhar. As letras certas aparecem na palavra; as erradas acrescentam uma parte ao desenho, então escolha com cuidado.',
    },
    solitaire: {
      title: 'Paciência',
      body: "Toque numa carta e ela vai sozinha para onde cabe: vermelha sobre preta um número acima, ou para as pilhas no alto. Sem jogada? Toque no monte.",
    },
    sudoku: {
      title: 'Sudoku',
      body: 'Toque em um quadrado vazio e depois em um número para colocá-lo ali. Cada número só pode aparecer uma vez em cada linha e em cada coluna.',
    },
    pattern: {
      title: 'Quebra-cabeça de padrões',
      body: 'Observe as formas e toque no que vem a seguir, ou naquela que não combina.',
    },
    math: {
      title: 'Conta rápida',
      body: 'Aparece uma conta curta. Toque na resposta certa entre as opções abaixo dela.',
    },
    chess: {
      title: 'Xadrez',
      body: 'Toque em uma das suas peças e os movimentos possíveis se acendem. Toque em um quadrado aceso para mover. Mudou de ideia? Toque em Voltar jogada.',
    },
    checkers: {
      title: 'Damas',
      body: 'Toque em uma das suas peças e depois no lugar para onde ela deve pular. Pule sobre uma peça do adversário para capturá-la.',
    },
    finish: {
      title: 'Você está pronto',
      body: 'Isso é tudo. Você pode assistir a este tutorial de novo a qualquer momento na página Ajuda.',
    },
  },
};

const ES: TutorialText = {
  ui: {
    heading: 'Tutorial de Hoot',
    next: 'Siguiente',
    back: 'Atrás',
    skip: 'Omitir',
    start: 'Empezar a usar Hoot',
    stepOf: 'Paso {n} de {total}',
    watch: 'Ver el tutorial',
    watchHint: 'Un recorrido breve, paso a paso, por todo lo que hay en Hoot.',
  },
  steps: {
    welcome: {
      title: 'Bienvenido a Hoot',
      body: 'Hoot le trae de vuelta las noticias, las canciones y los momentos de su vida, y mantiene su mente activa con rompecabezas amables. Unos minutos al día son suficientes.',
    },
    menu: {
      title: 'Cómo moverse',
      body: 'En el teléfono, use la barra de abajo: Hoy, Recuerdos, Juegos y Más. En la computadora, las mismas opciones están arriba.',
    },
    today: {
      title: 'Los cinco de hoy y su racha',
      body: 'Cada día Hoot le ofrece cinco pequeñas cosas para disfrutar. Complételas y su racha crece un día. Vuelva mañana para seguir.',
    },
    memories: {
      title: 'Recuerdos',
      body: 'Ve una tarjeta de recuerdo a la vez. Toque Reproducir una canción para escucharla, Guardar para conservarla, Siguiente para ver otra, o Leer en voz alta para que se la lean.',
    },
    extras: {
      title: 'Noticias, Reflexiones y Guardados',
      body: 'Noticias muestra las historias de hoy. Reflexiones son pensamientos suaves para meditar. Guardados contiene todos los recuerdos que decidió conservar.',
    },
    settings: {
      title: 'Haga Hoot cómodo',
      body: 'En Ajustes puede agrandar el texto, activar el alto contraste y cambiar el idioma cuando quiera.',
    },
    quiz: {
      title: 'Quiz de recuerdos',
      body: 'Lea la pregunta y toque el año que cree que es el correcto. Lo sabrá enseguida.',
    },
    tune: {
      title: 'Adivina la canción',
      body: 'Toque el botón de reproducir para escuchar una canción y luego toque el título que cree que es.',
    },
    crossword: {
      title: 'Crucigrama',
      body: 'Toque una casilla y escriba las letras. Cuando esté listo, toque Revisar para ver cómo le fue.',
    },
    wordsearch: {
      title: 'Sopa de letras',
      body: 'Ponga el dedo en la primera letra de una palabra escondida y deslícelo hasta la última letra.',
    },
    scramble: {
      title: 'Palabra revuelta',
      body: 'Las letras están mezcladas. Tóquelas en el orden correcto para formar la palabra.',
    },
    hangman: {
      title: 'Ahorcado',
      body: 'Toque una letra para adivinar. Las letras correctas aparecen en la palabra; las incorrectas añaden una parte al dibujo, así que elija con cuidado.',
    },
    solitaire: {
      title: 'Solitario',
      body: "Toca una carta y se mueve sola a donde encaja: roja sobre negra un número más alta, o arriba a los montones. ¿Sin jugadas? Toca el mazo.",
    },
    sudoku: {
      title: 'Sudoku',
      body: 'Toque una casilla vacía y luego un número para colocarlo. Cada número solo puede aparecer una vez en cada fila y en cada columna.',
    },
    pattern: {
      title: 'Rompecabezas de patrones',
      body: 'Mire las figuras y toque lo que viene después, o la que no pertenece.',
    },
    math: {
      title: 'Cálculo rápido',
      body: 'Aparece una cuenta corta. Toque la respuesta correcta entre las opciones de abajo.',
    },
    chess: {
      title: 'Ajedrez',
      body: 'Toque una de sus piezas y se iluminarán sus movimientos posibles. Toque una casilla iluminada para mover. ¿Cambió de opinión? Toque Deshacer.',
    },
    checkers: {
      title: 'Damas',
      body: 'Toque una de sus fichas y luego el lugar donde debe saltar. Salte sobre una ficha del rival para capturarla.',
    },
    finish: {
      title: 'Ya está listo',
      body: 'Eso es todo. Puede volver a ver este tutorial en cualquier momento desde la página de Ayuda.',
    },
  },
};

const HI: TutorialText = {
  ui: {
    heading: 'Hoot ट्यूटोरियल',
    next: 'आगे',
    back: 'पीछे',
    skip: 'छोड़ें',
    start: 'Hoot इस्तेमाल करना शुरू करें',
    stepOf: 'चरण {n} / {total}',
    watch: 'ट्यूटोरियल देखें',
    watchHint: 'Hoot की हर चीज़ का छोटा, चरण-दर-चरण परिचय।',
  },
  steps: {
    welcome: {
      title: 'Hoot में आपका स्वागत है',
      body: 'Hoot आपके जीवन की ख़बरें, गाने और यादगार पल फिर से लाता है, और दोस्ताना पहेलियों से आपके दिमाग़ को सक्रिय रखता है। रोज़ बस कुछ मिनट काफ़ी हैं।',
    },
    menu: {
      title: 'आसानी से चलें',
      body: 'फ़ोन पर नीचे की पट्टी से चुनें: आज, यादें, खेल, और और। कंप्यूटर पर ये विकल्प ऊपर होते हैं।',
    },
    today: {
      title: 'आज के पाँच और आपकी लगातार दिनों की गिनती',
      body: 'हर दिन Hoot आपके लिए आनंद लेने की पाँच छोटी चीज़ें लाता है। इन्हें पूरा करने पर आपकी लगातार दिनों की गिनती एक दिन बढ़ जाती है। उसे जारी रखने के लिए कल फिर आइए।',
    },
    memories: {
      title: 'यादें',
      body: 'एक बार में एक याद का कार्ड दिखता है। उसे सुनने के लिए गाना चलाएँ दबाएँ, रखने के लिए सहेजें, दूसरी के लिए आगे दबाएँ, या उसे ज़ोर से सुनने के लिए मुझे पढ़कर सुनाएँ दबाएँ।',
    },
    extras: {
      title: 'समाचार, चिंतन और सहेजी गई',
      body: 'समाचार में आज की ख़बरें दिखती हैं। चिंतन शांत मन से सोचने वाले विचार हैं। सहेजी गई में वे सब यादें रहती हैं जिन्हें आपने रखना चुना।',
    },
    settings: {
      title: 'Hoot को आरामदायक बनाएँ',
      body: 'सेटिंग्स में आप अक्षर बड़े कर सकते हैं, तेज़ कंट्रास्ट चालू कर सकते हैं, और जब चाहें भाषा बदल सकते हैं।',
    },
    quiz: {
      title: 'याद प्रश्नोत्तरी',
      body: 'प्रश्न पढ़ें, फिर जो साल सही लगे उस पर दबाएँ। आपको तुरंत पता चल जाएगा।',
    },
    tune: {
      title: 'गाना पहचानें',
      body: 'गाना सुनने के लिए चलाएँ बटन दबाएँ, फिर जो शीर्षक सही लगे उस पर दबाएँ।',
    },
    crossword: {
      title: 'वर्ग पहेली',
      body: 'कोई खाना दबाएँ, फिर अक्षर लिखें। जब तैयार हों, तो अपने उत्तर जाँचने के लिए मेरे उत्तर जाँचें दबाएँ।',
    },
    wordsearch: {
      title: 'शब्द खोज',
      body: 'छिपे हुए शब्द के पहले अक्षर पर उँगली रखें और आख़िरी अक्षर तक अक्षरों पर खींचें।',
    },
    scramble: {
      title: 'शब्द जोड़ो',
      body: 'अक्षर मिले-जुले हैं। शब्द बनाने के लिए उन्हें सही क्रम में दबाएँ।',
    },
    hangman: {
      title: 'शब्द अनुमान',
      body: 'अनुमान लगाने के लिए कोई अक्षर दबाएँ। सही अक्षर शब्द में दिखेंगे; गलत अक्षर चित्र में एक हिस्सा जोड़ देंगे, इसलिए सोच-समझकर चुनें।',
    },
    solitaire: {
      title: 'सॉलिटेयर',
      body: "किसी पत्ते पर टैप करें — वह अपने आप सही जगह चला जाएगा: लाल पत्ता एक बड़े काले पत्ते पर, या ऊपर की ढेरियों में। कोई चाल नहीं? गड्डी पर टैप करें।",
    },
    sudoku: {
      title: 'सुडोकू',
      body: 'कोई खाली खाना दबाएँ, फिर उसमें डालने के लिए कोई संख्या दबाएँ। हर संख्या हर पंक्ति और हर कॉलम में सिर्फ़ एक बार आ सकती है।',
    },
    pattern: {
      title: 'पैटर्न पहेली',
      body: 'आकृतियों को देखें और जो आगे आएगा या जो अलग है, उस पर दबाएँ।',
    },
    math: {
      title: 'तेज़ गणित',
      body: 'एक छोटा सवाल दिखेगा। उसके नीचे दिए विकल्पों में से सही उत्तर दबाएँ।',
    },
    chess: {
      title: 'शतरंज',
      body: 'अपना कोई मोहरा दबाएँ, तो उसकी संभावित चालें चमक उठेंगी। चमकते खाने पर दबाकर चाल चलें। मन बदल गया? वापस लें दबाएँ।',
    },
    checkers: {
      title: 'चेकर्स',
      body: 'अपनी कोई गोटी दबाएँ, फिर वह जहाँ कूदेगी वहाँ दबाएँ। विरोधी की गोटी पर से कूदकर उसे हटाएँ।',
    },
    finish: {
      title: 'आप तैयार हैं',
      body: 'बस इतना ही है। आप मदद पेज से कभी भी यह ट्यूटोरियल दोबारा देख सकते हैं।',
    },
  },
};

const NE: TutorialText = {
  ui: {
    heading: 'Hoot ट्युटोरियल',
    next: 'अर्को',
    back: 'पछाडि',
    skip: 'छोड्नुहोस्',
    start: 'Hoot प्रयोग गर्न सुरु गर्नुहोस्',
    stepOf: 'चरण {n} / {total}',
    watch: 'ट्युटोरियल हेर्नुहोस्',
    watchHint: 'Hoot मा भएका सबै कुराको छोटो, चरणबद्ध भ्रमण।',
  },
  steps: {
    welcome: {
      title: 'Hoot मा स्वागत छ',
      body: 'Hoot ले तपाईंको जीवनका समाचार, गीत र क्षणहरू फर्काउँछ, र मैत्रीपूर्ण पजलहरूले तपाईंको दिमागलाई सक्रिय राख्छ। दिनमा केही मिनेट मात्र काफी हुन्छ।',
    },
    menu: {
      title: 'कसरी चलाउने',
      body: 'फोनमा तलको पट्टी प्रयोग गर्नुहोस्: आज, सम्झनाहरू, खेलहरू र थप। कम्प्युटरमा उही विकल्पहरू माथि हुन्छन्।',
    },
    today: {
      title: 'आजका पाँच र तपाईंको निरन्तरता',
      body: 'हरेक दिन Hoot ले रमाउनका लागि पाँचवटा सानो कुरा दिन्छ। ती पूरा गर्दा तपाईंको निरन्तरता एक दिन बढ्छ। यसलाई जारी राख्न भोलि फेरि आउनुहोस्।',
    },
    memories: {
      title: 'सम्झनाहरू',
      body: 'एक पटकमा एउटा सम्झना कार्ड देखिन्छ। गीत सुन्न “गीत बजाउनुहोस्” थिच्नुहोस्, राख्न “सुरक्षित गर्नुहोस्”, अर्को हेर्न “अर्को”, वा पढेर सुनाउन “मलाई पढेर सुनाउनुहोस्” थिच्नुहोस्।',
    },
    extras: {
      title: 'समाचार, चिन्तन र सुरक्षित',
      body: 'समाचारमा आजका खबर देखिन्छन्। चिन्तन भनेका शान्त मनले सोच्ने विचार हुन्। सुरक्षितमा तपाईंले राख्न रोज्नुभएका सबै सम्झनाहरू बस्छन्।',
    },
    settings: {
      title: 'Hoot लाई आरामदायी बनाउनुहोस्',
      body: 'सेटिङमा तपाईं अक्षर ठूलो बनाउन, उच्च कन्ट्रास्ट खोल्न, र जुनसुकै बेला भाषा बदल्न सक्नुहुन्छ।',
    },
    quiz: {
      title: 'सम्झना प्रश्नोत्तरी',
      body: 'प्रश्न पढ्नुहोस्, त्यसपछि तपाईंलाई सही लाग्ने वर्षमा थिच्नुहोस्। तुरुन्तै थाहा हुन्छ।',
    },
    tune: {
      title: 'गीत चिन्नुहोस्',
      body: 'गीत सुन्न बजाउने बटन थिच्नुहोस्, त्यसपछि सही लाग्ने शीर्षकमा थिच्नुहोस्।',
    },
    crossword: {
      title: 'शब्द पहेली',
      body: 'एउटा खानामा थिच्नुहोस्, त्यसपछि अक्षर टाइप गर्नुहोस्। तयार भएपछि नतिजा हेर्न जाँच्नुहोस् थिच्नुहोस्।',
    },
    wordsearch: {
      title: 'शब्द खोज',
      body: 'लुकेको शब्दको पहिलो अक्षरमा औंला राखेर अन्तिम अक्षरसम्म अक्षरहरूमा तान्नुहोस्।',
    },
    scramble: {
      title: 'शब्द मिलाऊ',
      body: 'अक्षरहरू मिलेका छन्। शब्द बनाउन तिनलाई सही क्रममा थिच्नुहोस्।',
    },
    hangman: {
      title: 'शब्द अनुमान',
      body: 'अनुमान गर्न कुनै अक्षरमा थिच्नुहोस्। सही अक्षर शब्दमा देखिन्छन्; गलत अक्षरले चित्रमा एक भाग थप्छ, त्यसैले सावधानीपूर्वक छान्नुहोस्।',
    },
    solitaire: {
      title: 'सोलिटेयर',
      body: "कुनै पत्तीमा ट्याप गर्नुहोस् — त्यो आफैं मिल्ने ठाउँमा जान्छ: रातो पत्ती एक ठूलो कालो पत्तीमाथि, वा माथिका थुप्रोमा। चाल छैन? गड्डीमा ट्याप गर्नुहोस्।",
    },
    sudoku: {
      title: 'सुडोकु',
      body: 'कुनै खाली खानामा थिच्नुहोस्, त्यसपछि त्यहाँ राख्न एउटा संख्यामा थिच्नुहोस्। हरेक संख्या प्रत्येक पङ्क्ति र स्तम्भमा एक पटक मात्र आउन सक्छ।',
    },
    pattern: {
      title: 'ढाँचा पहेली',
      body: 'आकृतिहरू हेर्नुहोस् र अर्को आउने वा नमिल्ने एउटामा थिच्नुहोस्।',
    },
    math: {
      title: 'छिटो गणित',
      body: 'एउटा सानो हिसाब देखिन्छ। तलका विकल्पबाट सही उत्तरमा थिच्नुहोस्।',
    },
    chess: {
      title: 'चेस',
      body: 'आफ्नो कुनै मोहरामा थिच्नुहोस्, त्यसका सम्भावित चाल चम्कन्छन्। चम्किएको खानामा थिचेर चाल चल्नुहोस्। विचार फेरियो? वापस लिनुहोस् थिच्नुहोस्।',
    },
    checkers: {
      title: 'चेकर्स',
      body: 'आफ्नो गोटीमा थिच्नुहोस्, त्यसपछि त्यो उफ्रनुपर्ने ठाउँमा थिच्नुहोस्। विपक्षीको गोटीमाथि उफ्रेर त्यसलाई हटाउनुहोस्।',
    },
    finish: {
      title: 'तपाईं तयार हुनुहुन्छ',
      body: 'बस यति नै हो। तपाईं मद्दत पृष्ठबाट यो ट्युटोरियल जुनसुकै बेला फेरि हेर्न सक्नुहुन्छ।',
    },
  },
};

export const TUTORIAL_TEXT: Record<Lang, TutorialText> = {
  en: EN,
  ru: RU,
  fr: FR,
  de: DE,
  it: IT,
  pt: PT,
  es: ES,
  hi: HI,
  ne: NE,
};
