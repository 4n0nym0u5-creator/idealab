import { RubricStudio } from "@/components/rubric-studio";
import { withPortfolio } from "@/components/gate";

export const metadata = { title: "Rubric" };

export default async function RubricPage() {
  return withPortfolio((portfolio) => (
    <RubricStudio ideas={portfolio.ideas} weights={portfolio.settings.weights} version={portfolio.settings.rubricVersion} changes={portfolio.changes} />
  ));
}
