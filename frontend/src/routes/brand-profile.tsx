import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { BrandProfile } from "@/pages/BrandProfile";

export const Route = createFileRoute("/brand-profile")({
  head: () => ({
    meta: [
      { title: "Brand profile — Signal Wire" },
      { name: "description", content: "Tell Signal Wire about your brand to generate a personalised advertising strategy." },
    ],
  }),
  component: BrandProfilePage,
});

function BrandProfilePage() {
  return (
    <AppLayout>
      <BrandProfile />
    </AppLayout>
  );
}
