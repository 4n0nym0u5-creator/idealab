import Link from "next/link";
import { BundleView } from "@/components/bundle-view";
import { withPortfolio } from "@/components/gate";

export const metadata = { title: "Bundles" };

export default async function BundlesPage() {
  return withPortfolio((portfolio) => {
    const bundle = portfolio.bundles[0];
    if (!bundle) {
      return (
        <div className="page">
          <h1>Bundles</h1>
          <p className="lede">No bundle has been scored yet. A research run can add one alongside its ideas.</p>
        </div>
      );
    }
    return (
      <div className="stack">
        {portfolio.bundles.length > 1 ? (
          <div className="page" style={{ paddingBottom: 0 }}>
            <div className="chips">
              {portfolio.bundles.map((item) => <Link key={item.id} className="chip" href={`#${item.id}`}>{item.title}</Link>)}
            </div>
          </div>
        ) : null}
        <div id={bundle.id}>
          <BundleView bundle={bundle} ideas={portfolio.ideas} />
        </div>
        {portfolio.bundles.slice(1).map((item) => (
          <div key={item.id} id={item.id}>
            <BundleView bundle={item} ideas={portfolio.ideas} />
          </div>
        ))}
      </div>
    );
  });
}
