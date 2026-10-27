export function SetupScreen({ detail }: { detail?: string }) {
  return (
    <div className="page">
      <p className="kicker">IdeaLab</p>
      <h1>The database is not ready.</h1>
      <p className="lede">
        On Vercel, set <code>DATABASE_URL</code> from Neon and redeploy. Locally, <code>npm run db:setup</code> creates an embedded Postgres and loads both research runs.
      </p>
      {detail ? <p className="callout">{detail}</p> : null}
      <pre className="panel"><code>npm run db:setup{"\n"}npm run dev</code></pre>
    </div>
  );
}
