import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { PastReports } from "@/pages/PastReports";

export const Route = createFileRoute("/past-reports")({
  head: () => ({
    meta: [
      { title: "Past reports — Signal Wire" },
      { name: "description", content: "Browse your previous Signal Wire advertising strategy reports." },
    ],
  }),
  component: PastReportsPage,
});

function PastReportsPage() {
  return (
    <AppLayout>
      <PastReports />
    </AppLayout>
  );
}
