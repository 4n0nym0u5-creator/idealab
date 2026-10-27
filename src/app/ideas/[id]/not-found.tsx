import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <h1>That idea is not in the database.</h1>
      <Link className="btn btn-primary" href="/ideas">Back to ideas</Link>
    </div>
  );
}
