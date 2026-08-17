import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui-kit/Button";
import { Field, TextInput } from "@/components/ui-kit/Field";
import { useAppStore } from "@/state/app-store";

export function ForgotPasswordScreen() {
  const { requestReset } = useAppStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const result = await requestReset(email);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Enter a valid email address");
      return;
    }
    setError(null);
    setSent(true);
  }

  return (
    <AuthShell
      title="Reset your password."
      intro="We'll email a single-use reset link to your registered work address."
      footer={
        <Link to="/" className="text-accent hover:text-accent-hover">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-5 text-success" strokeWidth={1.75} />
          <p className="text-[15px] text-foreground">
            Reset link sent to <span className="num">{email}</span>. It expires in 30 minutes.
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
          <Field label="Work email" error={error}>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" variant="solid" loading={loading} className="w-full">
            {loading ? "Sending" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
