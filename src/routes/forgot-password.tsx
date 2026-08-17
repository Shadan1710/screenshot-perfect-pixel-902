import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — DoP Fleet Intelligence" },
      {
        name: "description",
        content: "Request a single-use password reset link for your DoP Fleet Intelligence account.",
      },
      { property: "og:title", content: "Reset password — DoP Fleet Intelligence" },
      { property: "og:description", content: "Send a reset link to your registered work email." },
    ],
  }),
  component: ForgotPasswordScreen,
});
