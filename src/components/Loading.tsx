// A little cup of coffee with rising steam — Hoot's loading indicator. It sets
// a warm, unhurried, part-of-the-morning-routine tone while content arrives.
export default function Loading({ label }: { label?: string }) {
  return (
    <div className="coffee-loader" role="status" aria-live="polite">
      <div className="cup" aria-hidden="true">
        <span className="steam s1" />
        <span className="steam s2" />
        <span className="steam s3" />
        <span className="handle" />
      </div>
      {label && <p className="muted">{label}</p>}
    </div>
  );
}
