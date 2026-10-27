import { ensureDatabase, exportDocument, requirePortfolio } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await ensureDatabase();
  const document = await exportDocument(await requirePortfolio());
  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ideas.json"',
    },
  });
}
