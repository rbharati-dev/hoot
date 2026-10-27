import { Component, type ReactNode } from 'react';

// Shown instead of a blank page if anything in the app crashes.
// Kept independent of the rest of the app (its own words, no shared state)
// so it still works when the part that failed is the app itself.

const WORDS: Record<string, { title: string; body: string; reload: string; reset: string }> = {
  en: { title: 'Something went wrong', body: 'Sorry about that. Your saved memories and settings are safe. Press the button below to try again.', reload: 'Try again', reset: 'Go back to the start of my memories' },
  ru: { title: 'Что-то пошло не так', body: 'Простите. Ваше избранное и настройки сохранены. Нажмите на кнопку ниже, чтобы попробовать ещё раз.', reload: 'Попробовать ещё раз', reset: 'Вернуться к началу воспоминаний' },
  fr: { title: 'Un problème est survenu', body: 'Désolé. Vos favoris et vos réglages sont conservés. Appuyez sur le bouton ci-dessous pour réessayer.', reload: 'Réessayer', reset: 'Revenir au début de mes souvenirs' },
  de: { title: 'Etwas ist schiefgelaufen', body: 'Das tut uns leid. Ihre gemerkten Erinnerungen und Einstellungen sind sicher. Drücken Sie unten, um es noch einmal zu versuchen.', reload: 'Noch einmal versuchen', reset: 'Zurück zum Anfang meiner Erinnerungen' },
  it: { title: 'Qualcosa è andato storto', body: 'Ci scusi. I suoi ricordi salvati e le impostazioni sono al sicuro. Prema il pulsante qui sotto per riprovare.', reload: 'Riprova', reset: 'Torna all’inizio dei miei ricordi' },
  pt: { title: 'Algo deu errado', body: 'Desculpe. Suas lembranças guardadas e seus ajustes estão seguros. Toque no botão abaixo para tentar de novo.', reload: 'Tentar de novo', reset: 'Voltar ao início das minhas lembranças' },
  es: { title: 'Algo salió mal', body: 'Perdón. Tus recuerdos guardados y tus ajustes están a salvo. Toca el botón de abajo para intentarlo de nuevo.', reload: 'Intentar de nuevo', reset: 'Volver al inicio de mis recuerdos' },
};

function words() {
  try {
    const lang = JSON.parse(localStorage.getItem('hoot.settings') ?? '{}').lang;
    return WORDS[lang] ?? WORDS.en;
  } catch {
    return WORDS.en;
  }
}

interface State {
  failed: boolean;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Hoot crashed:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const w = words();
    return (
      <div className="crash" role="alert">
        <h1>{w.title}</h1>
        <p>{w.body}</p>
        <button className="btn primary big" onClick={() => window.location.reload()}>
          {w.reload}
        </button>
        <button
          className="btn"
          onClick={() => {
            // Clears only where you were in the feed and cached Wikipedia
            // pages, the usual culprits. Profile and saved cards stay.
            try {
              Object.keys(localStorage)
                .filter(k => k === 'hoot.at' || k.startsWith('hoot.live.'))
                .forEach(k => localStorage.removeItem(k));
            } catch {
              /* ignore */
            }
            window.location.href = '/';
          }}
        >
          {w.reset}
        </button>
      </div>
    );
  }
}
