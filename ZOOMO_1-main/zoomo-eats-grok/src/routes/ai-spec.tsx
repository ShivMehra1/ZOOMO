import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ai-spec")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
