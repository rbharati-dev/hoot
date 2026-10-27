// Hoot's one icon set: simple line icons drawn at 24×24, inheriting the text
// colour (so dark mode and high contrast just work). Use them everywhere so the
// same idea always has the same picture.
//
//   <Icon name="play" />                      decorative, next to a text label
//   <IconButton icon="undo" label={t.takeBack} onClick={…} />   icon-only button,
//       name shown on hover/focus and read by screen readers
import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  // navigation & places
  today: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><rect x="7" y="13" width="4" height="4" rx="1" fill="currentColor" stroke="none" /></>,
  memories: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 9" /></>,
  games: <path d="M10 3a2 2 0 014 0v2h4a1 1 0 011 1v4h-2a2 2 0 100 4h2v4a1 1 0 01-1 1h-4v-2a2 2 0 10-4 0v2H6a1 1 0 01-1-1v-4h2a2 2 0 100-4H5V6a1 1 0 011-1h4z" />,
  news: <><path d="M4 4h13a1 1 0 011 1v15H6a2 2 0 01-2-2z" /><path d="M18 8h2v10a2 2 0 01-2 2M8 8h6M8 12h6M8 16h4" /></>,
  reflections: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
  saved: <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 115 0c0 1.7-2.5 2-2.5 4M12 17h.01" /></>,
  progress: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  more: <><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  // actions
  play: <path d="M7 4.5v15l12-7.5z" fill="currentColor" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></>,
  next: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  prev: <path d="M15 5l-7 7 7 7" />,
  forward: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 010 11H11" /></>,
  refresh: <><path d="M20 11a8 8 0 10-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6A17 17 0 002 12s3.6 7 10 7a10 10 0 005.4-1.6" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></>,
  bookmark: <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />,
  bookmarkFilled: <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" fill="currentColor" />,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></>,
  link: <><path d="M10 14a5 5 0 007.1 0l3-3a5 5 0 00-7.1-7.1l-1.5 1.5" /><path d="M14 10a5 5 0 00-7.1 0l-3 3a5 5 0 007.1 7.1l1.5-1.5" /></>,
  speaker: <><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" /></>,
  print: <><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  shrink: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  erase: <><path d="M21 5H9l-6 7 6 7h12a1 1 0 001-1V6a1 1 0 00-1-1z" /><path d="M13 9.5l5 5M18 9.5l-5 5" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  lightbulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" /></>,
  flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5.5 1-8.5z" />,
  trophy: <><path d="M8 4h8v5a4 4 0 01-8 0z" /><path d="M8 6H4v1a4 4 0 004 4M16 6h4v1a4 4 0 01-4 4M12 13v4M8 21h8M9 17h6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  warning: <><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.5h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  // settings
  textSize: <path d="M3 19l4.5-12L12 19M4.7 15h5.6M14 19l3.5-9 3.5 9M15.2 16h4.6" />,
  moon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  contrast: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18a9 9 0 000-18z" fill="currentColor" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
  // memory types
  music: <><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  tv: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 3l4 4 4-4" /></>,
  sport: <><circle cx="12" cy="12" r="9" /><path d="M12 7l4 3-1.5 4.5h-5L8 10z" /><path d="M12 3v4M21 10.5l-5 -.5M17.5 19l-3-4.5M6.5 19l3-4.5M3 10.5l5-.5" /></>,
  space: <><path d="M14 4c3 0 6 3 6 6l-6 6-6-6c0-3 3-6 6-6z" transform="rotate(45 12 12)" /><circle cx="12" cy="11" r="1.6" /><path d="M7 17l-3 3M9 19l-2 2M5 15l-2 2" /></>,
  science: <><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 006 21h12a1.7 1.7 0 001.5-2.5L14 9V3" /><path d="M7 15h10" /></>,
  politics: <><path d="M3 21h18M5 21V10M19 21V10M9 21v-8M15 21v-8M2 10l10-6 10 6z" /></>,
  culture: <><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="10" r="1.3" fill="currentColor" /><circle cx="12" cy="7.5" r="1.3" fill="currentColor" /><circle cx="15.5" cy="10" r="1.3" fill="currentColor" /><path d="M12 21a3 3 0 010-6c1 0 1.5-1 1-2" /></>,
  everyday: <><path d="M5 9h11v6a5 5 0 01-5 5H10a5 5 0 01-5-5z" /><path d="M16 11h1.5a2.5 2.5 0 010 5H16M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" /></>,
  cricket: <><path d="M14 3l7 7-9 9-3 1 1-3z" /><circle cx="6" cy="18" r="2" /></>,
  wisdom: <><path d="M12 4C7 4 4 7 4 11c0 2 1 4 3 5v4l4-3h1c5 0 8-3 8-7s-3-6-8-6z" /></>,
  // games
  quiz: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 115 0c0 1.7-2.5 2-2.5 4M12 17h.01" /></>,
  tune: <><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  crossword: <><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /><rect x="9" y="3" width="6" height="6" fill="currentColor" stroke="none" /><rect x="15" y="15" width="6" height="6" fill="currentColor" stroke="none" /></>,
  wordsearch: <><circle cx="10" cy="10" r="6" /><path d="M14.5 14.5L21 21" /><path d="M8 12l2-5 2 5M8.7 10.5h2.6" /></>,
  scramble: <><path d="M3 6h3l11 12h4M3 18h3l4-4.5M14 10l3-4h4" /><path d="M18 3l3 3-3 3M18 15l3 3-3 3" /></>,
  hangman: <path d="M4 21h10M7 21V3h9v3M16 9.5a1.5 1.5 0 100-3" />,
  solitaire: <><rect x="4" y="3" width="11" height="15" rx="1.5" /><path d="M9 21h9.5a1.5 1.5 0 001.5-1.5V7" /><path d="M9.5 7.5l-2 3 2 3 2-3z" fill="currentColor" /></>,
  sudoku: <><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /><path d="M5.3 5.8l1-.8v3" /><path d="M16.8 11.3h2l-2 2.6h2" /></>,
  pattern: <><circle cx="5" cy="17" r="2" /><circle cx="12" cy="12" r="2.5" /><circle cx="19" cy="6" r="3" /><path d="M6.5 15.5l3.5-2.5M14 10.5l3-2.5" /></>,
  quickmath: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2M9 11v2M15 15.5l1 1" /></>,
  chess: <path d="M9 21h6M8 18h8l-1-5H9zM10 13V9l-2-2 2-1V4h4v2l2 1-2 2v4" />,
  checkers: <><ellipse cx="12" cy="9" rx="8" ry="3.5" /><path d="M4 9v4c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V9" /><path d="M4 13v4c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v-4" /></>,
};

/** The icon for a game id (the memory quiz is called trivia in the code). */
export const gameIcon = (g: string) => (g === 'trivia' ? 'quiz' : g);

export type IconName = keyof typeof P;
export const ICON_NAMES = Object.keys(P);

export function Icon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const body = P[name];
  if (!body) return null;
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {body}
    </svg>
  );
}

/** An icon-only button: its name appears on hover/focus and is read aloud. */
export function IconButton({
  icon,
  label,
  onClick,
  disabled,
  className,
  pressed,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  pressed?: boolean;
}) {
  return (
    <button className={`btn icon-btn${className ? ' ' + className : ''}`} onClick={onClick} disabled={disabled} aria-label={label} data-tip={label} aria-pressed={pressed}>
      <Icon name={icon} size={26} />
    </button>
  );
}
