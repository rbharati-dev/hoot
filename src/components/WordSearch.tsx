import { useEffect, useMemo, useRef, useState } from 'react';
import { freshFirst, readRecent, rememberUsed } from '../lib/recentWords';
import { buildWordSearch } from '../lib/wordsearch';
import { store } from '../lib/data';
import { ding } from '../lib/sound';
import { fmtTime, useStopwatch } from '../lib/useTimer';
import type { Strings } from '../lib/i18n';
import { useGate,  } from './PlusProvider';
import type { ThemePack } from '../lib/packs';
import type { Lang } from '../lib/data';
import { alphabet, wordsFor, type WordProfile } from '../lib/wordbank';
import { Icon, IconButton } from './Icon';

const key = (r: number, c: number) => `${r},${c}`;
const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

// The straight line of cells from an anchor to a cursor, if they form a valid
// word-search direction (horizontal, vertical or diagonal); otherwise just the
// anchor. Returns the cells plus the two endpoints.
function lineCells(a: [number, number], b: [number, number]) {
  const [r0, c0] = a;
  const [r1, c1] = b;
  const dr = r1 - r0;
  const dc = c1 - c0;
  const straight = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
  if (!straight) return { cells: [[r0, c0]] as [number, number][], end: a };
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = sign(dr);
  const sc = sign(dc);
  const cells: [number, number][] = [];
  for (let k = 0; k <= steps; k++) cells.push([r0 + sr * k, c0 + sc * k]);
  return { cells, end: b };
}

export default function WordSearch({ t, lang, profile, onSolved }: { t: Strings; lang: Lang; profile: WordProfile; onSolved: () => void }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const gate = useGate();
  const [pack, setPack] = useState<ThemePack | undefined>();
  // Prefer words not seen recently; re-read for every new puzzle (seed).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entries = useMemo(() => freshFirst(wordsFor(lang, profile, pack), readRecent(lang)), [lang, profile, pack, seed]);
  const { grid, placed } = useMemo(() => buildWordSearch(seed, 8, entries, alphabet(lang)), [seed, entries, lang]);
  useEffect(() => rememberUsed(lang, placed.map(p => p.word)), [placed, lang]);
  const [found, setFound] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<[number, number] | null>(null);
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [justFound, setJustFound] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(() => store.records()['wordsearch'] ?? null);
  const [record, setRecord] = useState(false);
  const { elapsed, reset } = useStopwatch(running);
  const gridRef = useRef<HTMLDivElement>(null);

  const foundCells = new Set<string>();
  for (const p of placed) if (found.includes(p.word)) for (let k = 0; k < p.units.length; k++) foundCells.add(key(p.r + p.dr * k, p.c + p.dc * k));

  // Cells highlighted during the current drag.
  const dragSel = anchor && cursor ? new Set(lineCells(anchor, cursor).cells.map(([r, c]) => key(r, c))) : new Set<string>();

  const tryMatch = (a: [number, number], b: [number, number]) => {
    const [r0, c0] = a;
    const [r1, c1] = b;
    const hit = placed.find(p => {
      const er = p.r + p.dr * (p.units.length - 1),
        ec = p.c + p.dc * (p.units.length - 1);
      return (p.r === r0 && p.c === c0 && er === r1 && ec === c1) || (p.r === r1 && p.c === c1 && er === r0 && ec === c0);
    });
    if (hit && !found.includes(hit.word)) {
      const f = [...found, hit.word];
      setFound(f);
      setJustFound(hit.word);
      ding();
      setTimeout(() => setJustFound(null), 650);
      if (f.length === placed.length) {
        setRunning(false);
        if (best === null || elapsed < best) {
          setBest(elapsed);
          setRecord(true);
          store.setRecords({ ...store.records(), wordsearch: elapsed });
        }
        onSolved();
      }
    }
  };

  // Map a pointer event to a grid cell via data-attributes on the target.
  const cellFromPoint = (x: number, y: number): [number, number] | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const rc = el?.closest('[data-rc]') as HTMLElement | null;
    if (!rc) return null;
    const [r, c] = rc.dataset.rc!.split(',').map(Number);
    return [r, c];
  };

  const beginDrag = (r: number, c: number) => {
    if (!running) setRunning(true);
    setAnchor([r, c]);
    setCursor([r, c]);
  };
  const moveDrag = (x: number, y: number) => {
    if (!anchor) return;
    const cell = cellFromPoint(x, y);
    if (cell) setCursor(cell);
  };
  const endDrag = () => {
    if (anchor && cursor) {
      const { end } = lineCells(anchor, cursor);
      tryMatch(anchor, end);
    }
    setAnchor(null);
    setCursor(null);
  };

  const done = found.length === placed.length;

  const newGame = (p: ThemePack | undefined = pack) => {
    if (!gate()) return;
    setPack(p);
    setSeed(Math.floor(Math.random() * 1e9));
    setFound([]);
    setAnchor(null);
    setCursor(null);
    setRunning(false);
    setRecord(false);
    reset();
  };

  return (
    <div className="wordsearch">
      <h1 className="with-icon">
        <Icon name="wordsearch" size={32} />
        {t.wordsearch}
      </h1>
      <p className="muted">
        {t.wsHelp}
      </p>
      <div className="game-stats">
        <span className="timer" aria-label={fmtTime(elapsed)}><Icon name="clock" size={22} /> {fmtTime(elapsed)}</span>
        {best !== null && <span className="muted small">{t.bestTime(fmtTime(best))}</span>}
      </div>
      <div className="ws-layout">
        <div
          className="ws-grid"
          ref={gridRef}
          role="grid"
          aria-label={t.wordsearch}
          style={{ touchAction: 'none' }}
          onPointerDown={e => {
            const cell = cellFromPoint(e.clientX, e.clientY);
            if (cell) {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              beginDrag(cell[0], cell[1]);
            }
          }}
          onPointerMove={e => anchor && moveDrag(e.clientX, e.clientY)}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {grid.map((row, r) =>
            row.map((ch, c) => {
              const k = key(r, c);
              const cls = ['ws-cell', foundCells.has(k) && 'found', dragSel.has(k) && 'sel', justFound && foundCells.has(k) && 'pop'].filter(Boolean).join(' ');
              return (
                <div key={k} data-rc={`${r},${c}`} className={cls} aria-label={`${ch}, ${r + 1}, ${c + 1}`}>
                  {ch}
                </div>
              );
            }),
          )}
        </div>
        <div className="ws-words">
          <p className="label">{t.wordsFound(found.length, placed.length)}</p>
          <ul>
            {placed.map(p => (
              <li key={p.word} className={found.includes(p.word) ? 'done' : ''}>
                {p.word}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {done && (
        <p className="notice good">
          {t.solved} {t.yourTime(fmtTime(elapsed))} {record && `· ${t.newRecord}`}
        </p>
      )}
      <IconButton icon="refresh" label={t.newPuzzle} onClick={() => newGame()} />
    </div>
  );
}
