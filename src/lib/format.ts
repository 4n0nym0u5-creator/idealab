const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function domainOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}

const LIABILITY_PATTERN =
  /liabilit|never claim|do not|don't |avoid |ndb|notifiable data|credential|terms of service|\btos\b|stalker|without permission|silent failure|disclaimer|not (a )?certif|legal advice|criminal code|privacy act|dual-use|offensive/i;

export function liabilitySentences(notes: string, liabilityNotes: string): string[] {
  const explicit = liabilityNotes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sentences = notes
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && LIABILITY_PATTERN.test(sentence));
  const seen = new Set<string>();
  const combined = [...explicit, ...sentences];
  return combined.filter((sentence) => {
    const key = sentence.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
