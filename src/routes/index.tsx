import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Log in — DoP Fleet Intelligence & Capacity Exchange" },
      {
        name: "description",
        content:
          "Log in to India Post's fleet capacity platform: live utilisation, 3PL spare-capacity exchange and predictive delay risk.",
      },
      { property: "og:title", content: "Log in — DoP Fleet Intelligence" },
      {
        property: "og:description",
        content: "Live vehicle utilisation, capacity exchange and delay risk for India Post line-haul fleet.",
      },
    ],
  }),
  component: LoginScreen,
});
