import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

// Always redirect / to /overview — guests and authenticated users both land there.
function IndexRedirect() {
  return <Navigate to="/overview" replace />;
}