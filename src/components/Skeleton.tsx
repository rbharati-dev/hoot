// Loading placeholders shaped like what is about to appear, so the page does
// not jump when the content arrives. `card` is a memory/health/news card,
// `tiles` is the grid of news cards, `lines` is plain text.
export default function Skeleton({ kind = 'card', label }: { kind?: 'card' | 'tiles' | 'lines'; label: string }) {
  const lines = (n: number) => Array.from({ length: n }, (_, i) => <span key={i} className="skeleton sk-line" style={{ width: `${[92, 100, 78, 60][i % 4]}%` }} />);
  const card = (key?: number) => (
    <div className="sk-card" key={key}>
      <span className="skeleton sk-photo" />
      <span className="skeleton sk-title" />
      {lines(3)}
    </div>
  );
  return (
    <div className={`sk sk-${kind}`} role="status" aria-label={label} aria-busy="true">
      {kind === 'card' && card()}
      {kind === 'tiles' && [0, 1, 2, 3, 4, 5].map(card)}
      {kind === 'lines' && lines(4)}
    </div>
  );
}
