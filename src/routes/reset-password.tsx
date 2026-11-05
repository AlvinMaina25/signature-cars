import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { brand, noIndexMeta } from "@/config/brand";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      noIndexMeta,
      { title: `Reset password — ${brand.name}` },
      {
        name: "description",
        content: `Choose a new password for your ${brand.name} account.`,
      },
    ],
  }),
  component: ResetPassword,
});

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => delay(form),
    onSuccess: () => {
      toast.success("Password updated", {
        description: "Sign in with your new password.",
      });
      navigate({ to: "/login" });
    },
  });

  return (
    <AuthLayout
      title="Choose a new password"
      lead="Use at least 8 characters, mixing letters and numbers."
      footer={
        <>
          <Link to="/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
          }
          if (form.password !== form.confirmPassword) {
            setError("Passwords don't match.");
            return;
          }
          mutation.mutate();
        }}
      >
        <div>
          <label className="label-xs mb-1.5" htmlFor="reset-password">
            New password
          </label>
          <input
            required
            type="password"
            id="reset-password"
            autoComplete="new-password"
            className="field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div>
          <label className="label-xs mb-1.5" htmlFor="reset-confirm">
            Confirm new password
          </label>
          <input
            required
            type="password"
            id="reset-confirm"
            autoComplete="new-password"
            className="field"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={mutation.isPending} className="btn-accent w-full">
          {mutation.isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}
