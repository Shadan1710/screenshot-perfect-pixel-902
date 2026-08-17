import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui-kit/Button";
import { Field, Segmented, TextInput } from "@/components/ui-kit/Field";
import type { Role } from "@/mock/types";
import { useAppStore } from "@/state/app-store";

export function LoginScreen() {
  const { signIn } = useAppStore();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("dispatcher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setLoading(true);
    const result = await signIn({ email, password, role });
    setLoading(false);
    if (!result.ok) {
      setFormError(result.error ?? "Incorrect email or password");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell
      title="Log in to the capacity network."
      intro="Live vehicle utilisation, spare-capacity exchange and delay risk for India Post's line-haul fleet."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-accent hover:text-accent-hover">
            Sign up
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
        <Field label="Work email" error={emailError}>
          <TextInput
            type="email"
            value={email}
            autoComplete="email"
            placeholder="dispatcher@indiapost.gov.in"
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() =>
              setEmailError(email && !email.includes("@") ? "Enter a valid email address." : null)
            }
          />
        </Field>
        <Field
          label="Password"
          hint={
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[13px] text-accent hover:text-accent-hover">
                Forgot password?
              </Link>
            </div>
          }
        >
          <TextInput
            type="password"
            value={password}
            autoComplete="current-password"
            placeholder="Minimum 6 characters"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Sign in as">
          <Segmented
            value={role}
            onChange={setRole}
            options={[
              { value: "dispatcher", label: "Dispatcher" },
              { value: "partner", label: "3PL Partner" },
            ]}
          />
        </Field>
        <Button type="submit" variant="solid" loading={loading} className="w-full">
          {loading ? "Signing in" : "Log in"}
        </Button>
      </form>
    </AuthShell>
  );
}
