import { IdeasExplorer } from "@/components/ideas-explorer";
import { withPortfolio } from "@/components/gate";

export const metadata = { title: "Ideas" };

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; theme?: string; run?: string; customer?: string; lens?: string; category?: string; tier?: string; evidence?: string; fitTier?: string; family?: string; privacy?: string; model?: string }> }) {
  const params = await searchParams;
  return withPortfolio((portfolio) => (
    <IdeasExplorer
      ideas={portfolio.ideas}
      criteriaOrder={portfolio.settings.criteriaOrder}
      initialQuery={params.q ?? ""}
      initialStatus={params.status ?? ""}
      initialTheme={params.theme ?? ""}
      initialRun={params.run ?? ""}
      initialCustomer={params.customer ?? ""}
      initialLens={params.lens ?? ""}
      initialCategory={params.category ?? ""}
      initialTier={params.tier ?? ""}
      initialEvidence={params.evidence ?? ""}
      initialFitTier={params.fitTier ?? ""}
      initialFamily={params.family ?? ""}
      initialPrivacy={params.privacy ?? ""}
      initialModel={params.model ?? ""}
    />
  ));
}
