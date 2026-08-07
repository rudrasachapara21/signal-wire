import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Overview } from "@/pages/Overview";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Overview — Signal Wire" },
      { name: "description", content: "Your brand's advertising overview — readiness score, top channels, and creator matches." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <AppLayout>
      <Overview />
    </AppLayout>
  );
}
