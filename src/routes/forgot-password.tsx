import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { brand, noIndexMeta } from "@/config/brand";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      noIndexMeta,
      { title: `Forgot password — ${brand.name}` },
      {
        name: "description",
        content: `Reset the password for your ${brand.name} account.`,
      },
    ],
  }),
  component: ForgotPassword,
});

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: (submittedEmail: string) => delay(submittedEmail),
  });

  if (mutation.isSuccess) {
    return (
      <AuthLayout
        title="Check your inbox"
        lead="If an account matches that email, a reset link is on its way."
      >
        <div className="rise flex flex-col items-center gap-4 py-4 text-center">
          <span className="icon-btn size-14">
            <MailCheck className="size-6 text-accent" />
          </span>
          <p className="text-sm leading-relaxed text-mist">
            We sent instructions to <span className="text-foreground">{mutation.variables}</span>.
            The link expires in 30 minutes.
          </p>
          <Link to="/login" className="btn-glass w-full">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      lead="Enter the email on your account and we'll send you a reset link."
      footer={
        <>
          Remembered it after all?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(email);
        }}
      >
        <div>
          <label className="label-xs mb-1.5" htmlFor="forgot-email">
            Email
          </label>
          <input
            required
            type="email"
            id="forgot-email"
            autoComplete="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-accent w-full">
          {mutation.isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
