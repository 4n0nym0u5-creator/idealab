import { PipelineBoard } from "@/components/pipeline-board";
import { withPortfolio } from "@/components/gate";

export const metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return withPortfolio((portfolio) => <PipelineBoard ideas={portfolio.ideas} />);
}
