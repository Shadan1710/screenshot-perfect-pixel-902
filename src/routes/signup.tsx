import { createFileRoute } from "@tanstack/react-router";
import { SignupScreen } from "@/components/auth/SignupScreen";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — DoP Fleet Intelligence" },
      {
        name: "description",
        content:
          "Create a dispatcher or 3PL partner account on the DoP Fleet Intelligence & Capacity Exchange platform.",
      },
      { property: "og:title", content: "Create account — DoP Fleet Intelligence" },
      {
        property: "og:description",
        content: "Dispatchers publish live spare capacity; 3PL partners book against it.",
      },
    ],
  }),
  component: SignupScreen,
});
