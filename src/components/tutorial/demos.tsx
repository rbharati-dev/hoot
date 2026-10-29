import type { CSSProperties, ReactNode } from 'react';
import Logo from '../Logo';
import { Pointer, Stage, at, cellPt, type DemoProps, type Pt } from './kit';

const START: Pt = [92, 98];

/* ---------------- app tour demos ---------------- */

export function WelcomeDemo() {
  return (
    <Stage>
      <div className="abs td-center" style={at(35, 12, 30, 62)}>
        <Logo size={96} />
      </div>
      <span className="abs td-bubble s1" style={at(8, 20)}>🎵</span>
      <span className="abs td-bubble s2" style={at(80, 14)}>📰</span>
      <span className="abs td-bubble s3" style={at(12, 62)}>🧩</span>
      <span className="abs td-bubble s4" style={at(78, 60)}>🔥</span>
    </Stage>
  );
}

export function MenuDemo({ t, phone }: DemoProps) {
  if (phone) {
    const items: [string, string][] = [['☀', t.today], ['🖼', t.memories], ['🧩', t.games], ['⋯', t.more]];
    return (
      <Stage>
        <div className="abs td-page" style={at(0, 0, 100, 70)}>
          <span className="td-line" />
          <span className="td-line short" />
          <span className="td-line" />
        </div>
        <div className="abs td-sheet s3" style={at(58, 24, 40, 44)}>
          <span>{t.settings}</span>
          <span>{t.help}</span>
        </div>
        <div className="abs td-bar" style={at(0, 72, 100, 28)}>
          {items.map(([i, l], k) => (
            <span key={k} className={`td-bi ${k === 1 ? 'a1' : k === 2 ? 'a2' : k === 3 ? 'a3' : ''}`}>
              <b>{i}</b>
              <i>{l}</i>
            </span>
          ))}
        </div>
        <Pointer pts={[START, [37.5, 86], [62.5, 86], [87.5, 86]]} />
      </Stage>
    );
  }
  const tabs = [t.today, t.news, t.memories, t.games, t.saved];
  const x = (i: number) => 3 + (i + 0.5) * (94 / 5);
  return (
    <Stage>
      <div className="abs td-top" style={at(0, 0, 100, 26)}>
        {tabs.map((l, k) => (
          <span key={k} className={`td-tab ${k === 2 ? 'a1' : k === 3 ? 'a4' : ''}`}>{l}</span>
        ))}
      </div>
      <div className="abs td-page" style={at(4, 36, 92, 60)}>
        <span className="td-line" />
        <span className="td-line short" />
        <span className="td-line" />
      </div>
      <Pointer pts={[START, [x(2), 13], [x(3), 13]]} />
    </Stage>
  );
}

export function TodayDemo({ t }: DemoProps) {
  return (
    <Stage>
      <div className="abs td-five" style={at(6, 12, 88, 30)}>
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} className={`td-ball s${n}`}>✓</span>
        ))}
      </div>
      <div className="abs td-streak s5" style={at(30, 52, 40, 40)}>
        <span className="td-flame">🔥</span>
        <b>4</b>
      </div>
      <span className="abs td-small" style={at(6, 46, 20, 8)}>{t.today}</span>
    </Stage>
  );
}

export function MemoriesDemo({ t }: DemoProps) {
  const btn = (x: number, label: string, cls: string): ReactNode => (
    <span className={`abs td-btn ${cls}`} style={at(x, 70, 21, 24)}>{label}</span>
  );
  return (
    <Stage>
      <div className="abs td-mem" style={at(4, 0, 92, 62)}>
        <b className="td-year">1967</b>
        <span className="td-line" />
        <span className="td-line short" />
      </div>
      <span className="abs td-wave s1" style={at(68, 14, 24, 30)}>
        <i /><i /><i /><i /><i />
      </span>
      {btn(4, '▶', 'f1')}
      {btn(27, `♡ ${t.save}`, 'g2')}
      {btn(50, '→', 'f3')}
      {btn(73, '🔊', 'f4')}
      <Pointer pts={[START, [14.5, 82], [37.5, 82], [60.5, 82], [83.5, 82]]} />
    </Stage>
  );
}

export function ExtrasDemo({ t }: DemoProps) {
  const tiles: [string, string][] = [['📰', t.news], ['💭', t.reflections], ['🔖', t.saved]];
  return (
    <Stage>
      {tiles.map(([i, l], k) => (
        <div key={k} className={`abs td-tile s${k + 1}`} style={at(3 + k * 32.5, 16, 29, 62)}>
          <b>{i}</b>
          <span>{l}</span>
        </div>
      ))}
    </Stage>
  );
}

export function SettingsDemo({ t }: DemoProps) {
  return (
    <Stage>
      <div className="abs td-row" style={at(4, 6, 92, 26)}>
        <span>{t.textSize}</span>
        <b className="td-aa">Aa</b>
      </div>
      <div className="abs td-row" style={at(4, 37, 92, 26)}>
        <span>{t.highContrast}</span>
        <span className="td-switch"><i /></span>
      </div>
      <div className="abs td-row" style={at(4, 68, 92, 26)}>
        <span>{t.language}</span>
        <b className="td-chip g3">Aa → Бб</b>
      </div>
      <Pointer pts={[START, [88, 19], [88, 50], [88, 81]]} />
    </Stage>
  );
}

/* ---------------- game demos ---------------- */

export function QuizDemo() {
  const years = ['1959', '1964', '1969'];
  return (
    <Stage>
      <div className="abs td-q" style={at(4, 4, 92, 30)}>🚀 ?</div>
      {years.map((y, k) => (
        <span key={y} className={`abs td-opt ${k === 2 ? 'g1' : ''}`} style={at(4 + k * 32, 44, 28, 34)}>{y}</span>
      ))}
      <span className="abs td-ok s1" style={at(30, 84, 40, 14)}>✓</span>
      <Pointer pts={[START, [84, 61]]} />
    </Stage>
  );
}

export function TuneDemo() {
  return (
    <Stage>
      <span className="abs td-play" style={at(6, 22, 30, 56)}>▶</span>
      <span className="abs td-wave s1 big" style={at(8, 82, 26, 14)}>
        <i /><i /><i /><i /><i />
      </span>
      <span className="abs td-opt" style={at(46, 12, 50, 36)}>Blue Moon</span>
      <span className="abs td-opt g2" style={at(46, 54, 50, 36)}>Yesterday</span>
      <span className="abs td-ok s2" style={at(86, 70, 8, 14)}>✓</span>
      <Pointer pts={[START, [21, 50], [71, 72]]} />
    </Stage>
  );
}

const CW_BLOCK = new Set(['0,3', '1,1', '2,0', '2,2', '3,3', '3,1']);
export function CrosswordDemo({ t }: DemoProps) {
  const letters = ['C', 'A', 'T'];
  const rows = 4;
  const gx = 4, gw = 50;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 4; c++) {
      const k = `${r},${c}`;
      const block = CW_BLOCK.has(k);
      const cls = r === 0 && c < 3 ? `td-cell ${c === 0 ? 'cw0' : 'g5'}` : block ? 'td-cell block' : 'td-cell';
      cells.push(
        <span key={k} className={cls}>
          {r === 0 && c < 3 ? <b className={`s${c + 2}`}>{letters[c]}</b> : null}
        </span>,
      );
    }
  }
  return (
    <Stage>
      <div className="abs td-grid" style={{ ...at(gx, 0, gw, 100), gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(4,1fr)' }}>{cells}</div>
      <span className="abs td-btn primary f5" style={at(62, 36, 34, 28)}>{t.check.split(' ')[0]}</span>
      <Pointer pts={[START, cellPt(0, 0, 4, 4, gx, gw), cellPt(0, 0, 4, 4, gx, gw), cellPt(0, 0, 4, 4, gx, gw), cellPt(0, 0, 4, 4, gx, gw), [79, 50]]} />
    </Stage>
  );
}

const WS = ['MKPDQ', 'HOWLF', 'TBRAN', 'SECZU', 'VIGJY'];
export function WordSearchDemo() {
  const gx = 25, gw = 50;
  return (
    <Stage>
      <div className="abs td-grid ws" style={{ ...at(gx, 0, gw, 100), gridTemplateColumns: 'repeat(5,1fr)', gridTemplateRows: 'repeat(5,1fr)' }}>
        {WS.flatMap((row, r) => [...row].map((ch, c) => <span key={`${r}${c}`} className="td-cell plain">{ch}</span>))}
      </div>
      <span className="abs td-sweep" style={at(gx + 10, 20, 30, 20)} />
      <Pointer drag pts={[START, cellPt(1, 1, 5, 5, gx, gw), cellPt(1, 3, 5, 5, gx, gw)]} />
    </Stage>
  );
}

export function ScrambleDemo() {
  const tiles = ['A', 'T', 'C'];
  const slot = ['C', 'A', 'T'];
  const xs = [30, 50, 70];
  return (
    <Stage>
      {slot.map((ch, k) => (
        <span key={k} className="abs td-slot g4" style={at(xs[k] - 8, 8, 16, 34)}>
          <b className={`s${k + 1}`}>{ch}</b>
        </span>
      ))}
      {tiles.map((ch, k) => (
        <span key={k} className={`abs td-tile-l u${k === 2 ? 1 : k === 0 ? 2 : 3}`} style={at(xs[k] - 8, 56, 16, 34)}>{ch}</span>
      ))}
      <Pointer pts={[START, [70, 73], [30, 73], [50, 73]]} />
    </Stage>
  );
}

export function HangmanDemo() {
  const keys = ['O', 'Z', 'W', 'L', 'E', 'S'];
  const cls = ['g1', 'b2', 'g3', 'g4', '', ''];
  const kx = (i: number) => 4 + ((i + 0.5) / 6) * 92;
  return (
    <Stage>
      <svg className="abs td-gallows" style={at(4, 0, 28, 62)} viewBox="0 0 60 80" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <path d="M6 76h44M16 76V6h30v10" />
        <circle className="s2" cx="46" cy="26" r="9" />
      </svg>
      {[0, 1, 2].map(i => (
        <span key={i} className="abs td-slot sm" style={at(38 + i * 20, 12, 17, 32)}>
          {i === 0 && <b className="s1">O</b>}
          {i === 1 && <b className="s3">W</b>}
          {i === 2 && <b className="s4">L</b>}
        </span>
      ))}
      {keys.map((k, i) => (
        <span key={k} className={`abs td-key ${cls[i]}`} style={at(4 + i * (92 / 6) + 0.6, 66, 92 / 6 - 1.2, 30)}>{k}</span>
      ))}
      <Pointer pts={[START, [kx(0), 81], [kx(1), 81], [kx(2), 81], [kx(3), 81]]} />
    </Stage>
  );
}

export function SolitaireDemo() {
  const col = [4, 27, 50, 73];
  return (
    <Stage>
      {col.map(x => <span key={x} className="abs td-slotline" style={at(x, 6, 19, 44)} />)}
      <span className="abs td-card back" style={at(col[0], 8, 19, 44)} />
      <span className="abs td-card" style={at(col[1], 8, 19, 44)}><b>7</b>♠</span>
      <span className="abs td-card" style={at(col[2], 8, 19, 44)}><b>K</b>♣</span>
      <span className="abs td-card red mv" style={at(col[1], 30, 19, 44)}><b>6</b>♥</span>
      {/* One tap on the 6: it slides onto the black 7 by itself. */}
      <Pointer pts={[START, [col[0] + 9.5, 52]]} />
    </Stage>
  );
}

const SUDOKU = [
  [1, 2, 3, 4],
  [3, 4, 0, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];
export function SudokuDemo() {
  const gx = 4, gw = 50;
  return (
    <Stage>
      <div className="abs td-grid sd" style={{ ...at(gx, 0, gw, 100), gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(4,1fr)' }}>
        {SUDOKU.flatMap((row, r) =>
          row.map((n, c) =>
            n ? (
              <span key={`${r}${c}`} className="td-cell given">{n}</span>
            ) : (
              <span key={`${r}${c}`} className="td-cell sdc"><b className="s2">1</b></span>
            ),
          ),
        )}
      </div>
      <div className="abs td-pad" style={at(62, 8, 34, 84)}>
        {[1, 2, 3, 4].map(n => (
          <span key={n} className={n === 1 ? 'f2' : ''}>{n}</span>
        ))}
      </div>
      <Pointer pts={[START, cellPt(1, 2, 4, 4, gx, gw), [70.5, 29]]} />
    </Stage>
  );
}

export function PatternDemo() {
  const shape = (k: string) => <b className={`td-shape ${k}`}>{k === 'tri' ? '▲' : k === 'dot' ? '●' : '■'}</b>;
  const seq = ['tri', 'dot', 'tri', 'dot'];
  return (
    <Stage>
      {seq.map((k, i) => (
        <span key={i} className="abs td-seq" style={at(2 + i * 19, 6, 17, 34)}>{shape(k)}</span>
      ))}
      <span className="abs td-seq q" style={at(78, 6, 20, 34)}>
        <b className="td-qm">?</b>
        <b className="s1 td-ans">{shape('tri')}</b>
      </span>
      {['sq', 'tri', 'dot'].map((k, i) => (
        <span key={k} className={`abs td-opt ${k === 'tri' ? 'g1' : ''}`} style={at(8 + i * 30.5, 52, 27, 40)}>{shape(k)}</span>
      ))}
      <Pointer pts={[START, [51, 72]]} />
    </Stage>
  );
}

export function MathDemo() {
  return (
    <Stage>
      <div className="abs td-sum" style={at(4, 4, 92, 34)}>7 + 5 = ?</div>
      {[11, 12, 13].map((n, i) => (
        <span key={n} className={`abs td-opt ${n === 12 ? 'g1' : ''}`} style={at(4 + i * 32, 50, 28, 40)}>{n}</span>
      ))}
      <span className="abs td-ok s1" style={at(84, 8, 12, 24)}>✓</span>
      <Pointer pts={[START, [50, 70]]} />
    </Stage>
  );
}

export function ChessDemo({ t }: DemoProps) {
  const gx = 4, gw = 50;
  const sq = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) sq.push(<span key={`${r}${c}`} className={(r + c) % 2 ? 'td-sq dk' : 'td-sq'} />);
  const dots: [number, number][] = [[1, 0], [1, 2], [2, 3], [4, 3]];
  return (
    <Stage>
      <div className="abs td-grid bd" style={{ ...at(gx, 0, gw, 100), gridTemplateColumns: 'repeat(5,1fr)', gridTemplateRows: 'repeat(5,1fr)' }}>
        {sq}
        {/* a few other pieces for context */}
        <span className="td-pc" style={{ gridArea: '5 / 3' }}>♙</span>
        <span className="td-pc blk" style={{ gridArea: '1 / 4' }}>♟</span>
        {dots.map(([r, c]) => (
          <span key={`${r}${c}`} className="td-dot" style={{ gridArea: `${r + 1} / ${c + 1}` }} />
        ))}
      </div>
      {/* the knight, moving between squares (percent of the whole board box) */}
      <span className="abs td-knight" style={{ left: `${gx + gw * 0.2}%`, top: '60%', width: `${gw * 0.2}%`, height: '20%' }}>♘</span>
      <span className="abs td-btn f3" style={at(62, 36, 34, 28)}>{t.takeBack}</span>
      <Pointer pts={[START, cellPt(3, 1, 5, 5, gx, gw), cellPt(1, 2, 5, 5, gx, gw), [79, 50], cellPt(3, 1, 5, 5, gx, gw)]} />
    </Stage>
  );
}

export function CheckersDemo() {
  const gx = 25, gw = 50;
  const sq = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) sq.push(<span key={`${r}${c}`} className={(r + c) % 2 ? 'td-sq dk' : 'td-sq'} />);
  const piece = (r: number, c: number, cls: string, style?: CSSProperties) => (
    <span className={`abs td-ck ${cls}`} style={{ left: `${gx + c * gw * 0.2}%`, top: `${r * 20}%`, width: `${gw * 0.2}%`, height: '20%', ...style }}>
      <i />
    </span>
  );
  return (
    <Stage>
      <div className="abs td-grid bd" style={{ ...at(gx, 0, gw, 100), gridTemplateColumns: 'repeat(5,1fr)', gridTemplateRows: 'repeat(5,1fr)' }}>{sq}</div>
      <span className="abs td-target" style={{ left: `${gx + 4 * gw * 0.2}%`, top: '20%', width: `${gw * 0.2}%`, height: '20%' }} />
      {piece(0, 1, 'blk')}
      {piece(2, 3, 'blk cap')}
      {piece(4, 1, 'red')}
      {piece(1, 4, 'red mvck')}
      <Pointer pts={[START, cellPt(3, 2, 5, 5, gx, gw), cellPt(1, 4, 5, 5, gx, gw)]} />
    </Stage>
  );
}

export function FinishDemo() {
  return (
    <Stage>
      <div className="abs td-center" style={at(35, 6, 30, 66)}>
        <Logo size={96} />
      </div>
      <span className="abs td-ok big s1" style={at(56, 48, 14, 28)}>✓</span>
      <span className="abs td-bubble s2" style={at(10, 30)}>🎉</span>
      <span className="abs td-bubble s3" style={at(82, 26)}>🌟</span>
    </Stage>
  );
}
