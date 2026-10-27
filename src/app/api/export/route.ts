import { exportDocument, requirePortfolio } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  const document = exportDocument(requirePortfolio());
  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ideas.json"',
    },
  });
}
