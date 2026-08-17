import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui-kit/Button";
import { Field, Segmented, TextInput } from "@/components/ui-kit/Field";
import type { Role } from "@/mock/types";
import { useAppStore } from "@/state/app-store";
import { cn } from "@/lib/utils";

function strength(password: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[^a-zA-Z0-9]/.test(password) && /\d/.test(password)) score += 1;
  return Math.min(3, score) as 0 | 1 | 2 | 3;
}

export function SignupScreen() {
  const { signUp } = useAppStore();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("dispatcher");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const score = strength(password);
  const segmentColor = ["bg-danger", "bg-danger", "bg-warning", "bg-success"][score];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setFormError(null);
    setLoading(true);
    const result = await signUp({ email, password, role, fullName, organization });
    setLoading(false);
    if (!result.ok) {
      setFormError(result.error ?? "Could not create the account");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell
      title="Create your operations account."
      intro="Dispatchers publish live spare capacity. 3PL partners book against it. One ledger, one source of truth."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/" className="text-accent hover:text-accent-hover">
            Log in
          </Link>
        </>
      }
    >
      {formError ? (
        <p className="mb-6 rounded-[8px] border border-danger/40 px-4 py-3 text-[14px] text-danger">
          {formError}
        </p>
      ) : null}
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <Field label="Account type">
          <Segmented
            value={role}
            onChange={setRole}
            options={[
              { value: "dispatcher", label: "Dispatcher" },
              { value: "partner", label: "3PL Partner" },
            ]}
          />
        </Field>
        <Field label="Full name">
          <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="A. Rangarajan" />
        </Field>
        <Field label={role === "dispatcher" ? "Organisation / depot" : "Company name"}>
          <TextInput
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={role === "dispatcher" ? "Delhi NDLS Hub" : "Bluedart Express"}
          />
        </Field>
        <Field label="Work email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="mt-1 flex gap-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn("h-1 flex-1 rounded-pill bg-border", i < score && segmentColor)}
              />
            ))}
          </div>
        </Field>
        <Field label="Confirm password" error={confirmError}>
          <TextInput
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setConfirmError(confirm && confirm !== password ? "Passwords do not match." : null)}
          />
        </Field>
        <Button type="submit" variant="solid" loading={loading} className="w-full">
          {loading ? "Creating account" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
