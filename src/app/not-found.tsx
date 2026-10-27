import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <h1>That page is not in the lab.</h1>
      <Link className="btn btn-primary" href="/">Back to the dashboard</Link>
    </div>
  );
}
