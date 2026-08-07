import { createFileRoute } from "@tanstack/react-router";
import { Signup } from "@/pages/auth/Signup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Signal Wire" },
      { name: "description", content: "Create your free Signal Wire account and start building your advertising strategy." },
    ],
  }),
  component: Signup,
});
