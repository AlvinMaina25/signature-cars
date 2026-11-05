import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { brand, noIndexMeta } from "@/config/brand";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      noIndexMeta,
      { title: `Sign in — ${brand.name}` },
      {
        name: "description",
        content: `Sign in to your ${brand.name} account to manage favorites, inquiries and reservations.`,
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", remember: true });

  const mutation = useMutation({
    mutationFn: () => signIn(form.email, form.password),
    onSuccess: () => {
      toast.success("Welcome back", {
        description: `You're signed in to your ${brand.name} account.`,
      });
      navigate({ to: "/account" });
    },
    onError: (error: Error) => {
      toast.error("Sign in failed", { description: error.message });
    },
  });

  return (
    <AuthLayout
      title={`Sign in to ${brand.name}`}
      lead="Access your favorites, inquiries and reservations in one place."
      footer={
        <>
          New to {brand.name}?{" "}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <label className="label-xs mb-1.5" htmlFor="login-email">
            Email
          </label>
          <input
            required
            type="email"
            id="login-email"
            autoComplete="email"
            className="field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label-xs mb-1.5" htmlFor="login-password">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            required
            type="password"
            id="login-password"
            autoComplete="current-password"
            className="field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-mist">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            className="size-4 rounded border-border accent-accent"
          />
          Keep me signed in
        </label>

        <button type="submit" disabled={mutation.isPending} className="btn-accent w-full">
          {mutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
