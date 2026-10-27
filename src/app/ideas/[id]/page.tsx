import { notFound } from "next/navigation";
import { IdeaDetail } from "@/components/idea-detail";
import { withPortfolio } from "@/components/gate";

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withPortfolio((portfolio) => {
    const idea = portfolio.ideas.find((item) => item.id === id);
    if (!idea) notFound();
    const live = portfolio.ideas.filter((item) => item.rank != null).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    const index = live.findIndex((item) => item.id === id);
    return (
      <IdeaDetail
        idea={idea}
        weights={portfolio.settings.weights}
        criteriaOrder={portfolio.settings.criteriaOrder}
        neighbors={{
          prev: index > 0 ? { id: live[index - 1].id, title: live[index - 1].title } : undefined,
          next: index >= 0 && index < live.length - 1 ? { id: live[index + 1].id, title: live[index + 1].title } : undefined,
        }}
      />
    );
  });
}
