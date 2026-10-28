"use client";

import { useEffect, useState } from "react";

export type MockupShot = { file: string; title: string; caption: string };

export function MockupGallery({ shots }: { shots: MockupShot[] }) {
  const [open, setOpen] = useState<MockupShot | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="mockup-grid">
        {shots.map((shot) => (
          <figure key={shot.file} className="mockup-card">
            <button type="button" className="mockup-button" onClick={() => setOpen(shot)} aria-label={`Enlarge ${shot.title}`}>
              <img src={`/mockups/life-admin-pass/${shot.file}`} alt={`${shot.title}. Sample data.`} />
            </button>
            <figcaption>
              <strong>{shot.title}</strong>
              <span>{shot.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {open ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={open.title} onClick={() => setOpen(null)}>
          <figure onClick={(event) => event.stopPropagation()}>
            <img src={`/mockups/life-admin-pass/${open.file}`} alt={`${open.title}. Sample data.`} />
            <figcaption>
              <strong>{open.title}.</strong> {open.caption}
            </figcaption>
            <button type="button" className="btn" onClick={() => setOpen(null)}>Close</button>
          </figure>
        </div>
      ) : null}
    </>
  );
}
