import Link from "next/link";
import { withPortfolio } from "@/components/gate";
import { PortfolioView } from "@/components/portfolio-view";

export const metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  return withPortfolio((portfolio) => {
    if (!portfolio.settings.portfolio) {
      return (
        <div className="page">
          <h1>Portfolio</h1>
          <p>Run 6 has not been loaded. <Link href="/runs/import">Import the portfolio run</Link>.</p>
        </div>
      );
    }
    return <PortfolioView strategy={portfolio.settings.portfolio} ideas={portfolio.ideas} />;
  });
}
