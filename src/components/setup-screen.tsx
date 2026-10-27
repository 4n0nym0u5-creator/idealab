export function SetupScreen() {
  return (
    <div className="page">
      <p className="kicker">IdeaLab</p>
      <h1>The database is not seeded yet.</h1>
      <p className="lede">From the project root, create the SQLite file and load Run 1 and Run 2.</p>
      <pre className="panel"><code>npm run db:setup{"\n"}npm run dev</code></pre>
    </div>
  );
}
