import { IdeasExplorer } from "@/components/ideas-explorer";
import { withPortfolio } from "@/components/gate";

export const metadata = { title: "Ideas" };

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; theme?: string; run?: string; customer?: string; lens?: string }> }) {
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
    />
  ));
}
