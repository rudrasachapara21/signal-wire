import { createFileRoute } from "@tanstack/react-router";
import { Login } from "@/pages/auth/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Signal Wire" },
      { name: "description", content: "Sign in to Signal Wire to generate and save your advertising strategy." },
    ],
  }),
  component: Login,
});
