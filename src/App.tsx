import type { GameId } from './lib/activity';
import { useEffect, useMemo, useRef, useState } from 'react';
import { store, profileFromUrl, type Profile, type Settings, type Lang, COUNTRIES } from './lib/data';
import { setSoundEnabled } from './lib/sound';
import { STRINGS } from './lib/i18n';
import Onboarding from './components/Onboarding';
import Intro from './components/Intro';
import Today from './components/Today';
import Feed from './components/Feed';
import Reflections from './components/Reflections';
import Health from './components/Health';
import News from './components/News';
import Saved from './components/Saved';
import SettingsPage from './components/SettingsPage';
import Games from './components/Games';
import Logo from './components/Logo';
import PlusProvider from './components/PlusProvider';
import AccountProvider, { useAccount } from './components/AccountProvider';
import AccountSheet, { type AccountResult, type AccountView } from './components/AccountSheet';
import SupportSheet from './components/SupportSheet';
import About from './components/About';
import { ABOUT } from './lib/about';
import { markAsked, readAsk, readUsage, recordMinute, recordVisit, shouldAsk } from './lib/supportNudge';
import { Icon } from './components/Icon';
import Progress from './components/Progress';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';
import Help from './components/Help';
import Tutorial, { TOUR_STEPS, gameSteps, hasSeenTutorial } from './components/Tutorial';
import type { TutorialStepId } from './lib/tutorialText';

export type Tab = 'today' | 'news' | 'memories' | 'health' | 'reflections' | 'games' | 'saved' | 'settings' | 'help' | 'progress' | 'about';

function CrashTest(): null {
  // Used by the automated tests to check the recovery screen.
  throw new Error('crash test');
}
const crashTest = new URLSearchParams(window.location.search).has('crashtest');

export default function App() {
  return crashTest ? (
    <CrashTest />
  ) : (
    <AccountProvider>
      <Hoot />
    </AccountProvider>
  );
}

type Sheet = { kind: 'account'; view: AccountView; after?: (r?: AccountResult) => void } | { kind: 'support'; nudgeDays?: number } | null;

function Hoot() {
  const { available, ready, account, dataVersion } = useAccount();
  const fromUrl = useMemo(() => profileFromUrl(), []);
  const [settings, setSettingsState] = useState<Settings>(() => {
    const s = store.settings();
    if (fromUrl.lang) return { ...s, lang: fromUrl.lang };
    if (fromUrl.profile && !store.profile()) {
      const c = COUNTRIES.find(x => x.code === fromUrl.profile!.country);
      if (c) return { ...s, lang: c.lang };
    }
    return s;
  });
  const [profile, setProfileState] = useState<Profile | null>(() => {
    // A shared link sets up this device (before the feed reads its position).
    if (fromUrl.profile) {
      if (JSON.stringify(store.profile()) !== JSON.stringify(fromUrl.profile)) store.setPosition(0);
      store.setProfile(fromUrl.profile);
    }
    return fromUrl.profile ?? store.profile();
  });
  // A shared link (feed or single memory) opens straight into the feed, as
  // promised; a normal visit opens on Today, the daily ritual home.
  const [tab, setTabState] = useState<Tab>(fromUrl.profile || fromUrl.card ? 'memories' : 'today');
  // Tapping a tab always opens its front page (e.g. Games goes back to the list).
  const [visit, setVisit] = useState(0);
  // Which part of the About page to open (About, Privacy or Contact).
  const [aboutSection, setAboutSection] = useState<'about' | 'privacy' | 'contact'>('about');
  const openAbout = (s: 'about' | 'privacy' | 'contact') => {
    setAboutSection(s);
    setTab('about');
  };
  // A game picked on the welcome screen, opened straight away on the Games tab.
  const [startGame, setStartGame] = useState<GameId | null>(null);
  const setTab = (next: Tab) => {
    if (next !== 'games') setStartGame(null);
    setTabState(next);
    setVisit(v => v + 1);
  };
  const [focusCard, setFocusCard] = useState<string | null>(fromUrl.card);
  const [showIntro, setShowIntro] = useState(() => !store.seenIntro());
  // Read once: seenIntro=true counts as having seen the tutorial too.
  const [seenTutorialAtStart] = useState(() => hasSeenTutorial());
  // null = closed; a number = open at that step. New users see it right after the intro.
  const [tutorial, setTutorial] = useState<readonly TutorialStepId[] | null>(null);
  const t = STRINGS[settings.lang];
  const [sheet, setSheet] = useState<Sheet>(null);
  const [flash, setFlash] = useState<'signed-out' | 'deleted' | null>(null);

  // Count days and minutes of use, for the occasional "Support Hoot" ask.
  useEffect(() => {
    recordVisit();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        recordMinute();
        recordVisit(); // a session that runs past midnight counts the new day
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);
  // On the welcome screen only, after a calm moment, and never over something else.
  const quiet = tab === 'today' && !sheet && !tutorial && !showIntro && !!profile;
  useEffect(() => {
    if (!quiet || !shouldAsk(readUsage(), readAsk(), new Date())) return;
    const id = window.setTimeout(() => {
      markAsked();
      setSheet({ kind: 'support', nudgeDays: readUsage().days.length });
    }, 15_000);
    return () => window.clearTimeout(id);
  }, [quiet]);

  // Progress that arrived from (or was removed for) an account takes effect
  // straight away: settings, profile and the intro flag are read again.
  const seenVersion = useRef(dataVersion);
  useEffect(() => {
    if (seenVersion.current === dataVersion) return;
    seenVersion.current = dataVersion;
    setSettingsState(store.settings());
    setProfileState(store.profile()); // gone after sign-out: back to the welcome screen
    if (store.seenIntro()) setShowIntro(false);
  }, [dataVersion]);

  const openAccount = (view: AccountView, after?: (r?: AccountResult) => void) => setSheet({ kind: 'account', view, after });
  const closeSheet = (r?: AccountResult) => {
    const after = sheet?.kind === 'account' ? sheet.after : undefined;
    setSheet(null);
    if (r === 'signed-out' || r === 'deleted') setFlash(r);
    after?.(r);
  };
  const overlays = (
    <>
      {flash && (
        <div className="acct-flash" role="status">
          <Icon name="check" size={26} />
          <span>{flash === 'deleted' ? t.acctDeleted : t.acctSignedOut}</span>
          <button className="acct-flash-close" aria-label={t.close} onClick={() => setFlash(null)}>
            <Icon name="close" size={24} />
          </button>
        </div>
      )}
      {sheet?.kind === 'account' && <AccountSheet t={t} lang={settings.lang} initial={sheet.view} onClose={closeSheet} />}
      {sheet?.kind === 'support' && <SupportSheet t={t} nudgeDays={sheet.nudgeDays} onClose={() => setSheet(null)} />}
    </>
  );

  // Tidy the address bar once a shared link has been read.
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', '/');
  }, []);

  useEffect(() => {
    store.setSettings(settings);
    const root = document.documentElement;
    root.dataset.theme = settings.dark ? 'dark' : 'light';
    root.dataset.size = String(settings.textSize);
    root.dataset.contrast = settings.contrast ? 'high' : 'normal';
    root.lang = settings.lang;
    setSoundEnabled(settings.sound !== false);
  }, [settings]);

  const setSettings = (s: Settings) => setSettingsState(s);
  const setProfile = (p: Profile | null) => {
    store.setProfile(p);
    store.setPosition(0);
    setProfileState(p);
  };
  const setLang = (lang: Lang) => setSettings({ ...settings, lang });

  if (!profile) {
    return (
      <>
        <Onboarding t={t} lang={settings.lang} setLang={setLang} onDone={p => { setProfile(p); setTab('today'); }} openAccount={openAccount} />
        {overlays}
      </>
    );
  }

  if (showIntro) {
    const done = () => {
      store.setSeenIntro(true);
      setShowIntro(false);
      if (!seenTutorialAtStart) setTutorial(TOUR_STEPS);
    };
    return <Intro t={t} onDone={done} />;
  }

  const tabs: [Tab, string][] = [
    ['today', t.today],
    ['news', t.news],
    ['memories', t.memories],
    ['health', t.health],
    ['reflections', t.reflections],
    ['games', t.games],
    ['saved', t.saved],
    ['settings', t.settings],
    ['help', t.help],
  ];

  return (
    <>
    <PlusProvider key={dataVersion}>
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setTab('today')} aria-label="Hoot">
          <Logo /> <span>Hoot</span>
        </button>
        <div className="top-right">
          <TopNav tabs={tabs} tab={tab} setTab={setTab} />
          {available && ready && (
            <button
              className={account ? 'tab icon-tab acct-top signed' : 'tab icon-tab acct-top'}
              aria-label={t.acctButton}
              data-tip={t.acctButton}
              onClick={() => openAccount(account ? 'account' : 'signin')}
            >
              <Icon name="person" size={28} />
            </button>
          )}
        </div>
      </header>
      <main className={tab === 'news' || tab === 'games' ? 'page wide' : 'page'}>
        {tab === 'today' && (
          <Today
            key={visit}
            t={t}
            lang={settings.lang}
            profile={profile}
            browseAll={() => setTab('memories')}
            openGames={() => setTab('games')}
            openGame={g => {
              setStartGame(g);
              setTab('games');
            }}
            openHealth={() => setTab('health')}
            openNews={() => setTab('news')}
            openReflections={() => setTab('reflections')}
          />
        )}
        {tab === 'memories' && (
          <Feed t={t} lang={settings.lang} profile={profile} focusCard={focusCard} clearFocus={() => setFocusCard(null)} openSettings={() => setTab('settings')} />
        )}
        {tab === 'news' && <News key={visit} t={t} lang={settings.lang} profile={profile} />}
        {tab === 'health' && <Health key={visit} t={t} lang={settings.lang} />}
        {tab === 'reflections' && <Reflections key={visit} t={t} lang={settings.lang} profile={profile} />}
        {tab === 'games' && <Games key={`${visit}-${startGame ?? ''}`} t={t} lang={settings.lang} profile={profile} startGame={startGame ?? undefined} openProgress={() => setTab('progress')} howToPlay={g => setTutorial(gameSteps(g))} />}
        {tab === 'progress' && <Progress key={visit} t={t} lang={settings.lang} />}
        {tab === 'saved' && <Saved t={t} lang={settings.lang} profile={profile} />}
        {tab === 'settings' && (
          <SettingsPage t={t} settings={settings} setSettings={setSettings} profile={profile} setProfile={setProfile} openAccount={openAccount} />
        )}
        {tab === 'about' && <About key={`${visit}-${aboutSection}`} lang={settings.lang} section={aboutSection} />}
        {tab === 'help' && <Help key={visit} t={t} lang={settings.lang} onTutorial={() => setTutorial(TOUR_STEPS)} />}
      </main>
      <footer className="foot">
        <span>{available ? t.privacyAccount : t.privacy}</span>
        <nav className="foot-links" aria-label={ABOUT[settings.lang].title}>
          <button onClick={() => openAbout('about')}>{ABOUT[settings.lang].title}</button>
          <button onClick={() => openAbout('privacy')}>{ABOUT[settings.lang].privacy}</button>
          <button onClick={() => openAbout('contact')}>{ABOUT[settings.lang].contact}</button>
        </nav>
        <button className="foot-support" onClick={() => setSheet({ kind: 'support' })}>
          <Icon name="heart" size={20} />
          {t.supportLink}
        </button>
      </footer>
      <BottomNav t={t} tab={tab} setTab={setTab} onAccount={available && ready ? () => openAccount(account ? 'account' : 'signin') : undefined} />
    </div>
    {tutorial !== null && <Tutorial lang={settings.lang} steps={tutorial} onClose={() => setTutorial(null)} />}
    </PlusProvider>
    {overlays}
    </>
  );
}
