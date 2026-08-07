import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { StrategyReport } from "@/pages/StrategyReport";

export const Route = createFileRoute("/strategy-report")({
  head: () => ({
    meta: [
      { title: "Strategy report — Signal Wire" },
      { name: "description", content: "Your personalised advertising strategy — recommended channels, creator shortlist, and a 30-day action plan." },
    ],
  }),
  component: StrategyReportPage,
});

function StrategyReportPage() {
  return (
    <AppLayout>
      <StrategyReport />
    </AppLayout>
  );
}
