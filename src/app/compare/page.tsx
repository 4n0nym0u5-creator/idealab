import { CompareView } from "@/components/compare-view";
import { withPortfolio } from "@/components/gate";

export const metadata = { title: "Compare" };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const params = await searchParams;
  const initialIds = (params.ids ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  return withPortfolio((portfolio) => <CompareView ideas={portfolio.ideas} initialIds={initialIds} criteriaOrder={portfolio.settings.criteriaOrder} />);
}
