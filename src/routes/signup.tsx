import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { brand, noIndexMeta } from "@/config/brand";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      noIndexMeta,
      { title: `Create an account — ${brand.name}` },
      {
        name: "description",
        content: `Create an ${brand.name} account to save favorites and track inquiries and reservations.`,
      },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => signUp(form.email, form.password, form.fullName),
    onSuccess: ({ needsEmail }) => {
      if (needsEmail) {
        toast.success("Check your email", {
          description: "Confirm your address to finish creating your account.",
        });
        navigate({ to: "/login" });
        return;
      }
      toast.success("Account created", {
        description: `Welcome to ${brand.name} — your account is ready.`,
      });
      navigate({ to: "/account" });
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <AuthLayout
      title="Create your account"
      lead="Save favorites, track inquiries and manage reservations from one dashboard."
      footer={
        <>
          Already have an account?{" "}
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
          setError(null);
          if (form.password !== form.confirmPassword) {
            setError("Passwords don't match.");
            return;
          }
          if (!form.agree) {
            setError("Please accept the terms to continue.");
            return;
          }
          mutation.mutate();
        }}
      >
        <div>
          <label className="label-xs mb-1.5" htmlFor="signup-name">
            Full name
          </label>
          <input
            required
            id="signup-name"
            autoComplete="name"
            className="field"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-xs mb-1.5" htmlFor="signup-email">
              Email
            </label>
            <input
              required
              type="email"
              id="signup-email"
              autoComplete="email"
              className="field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label-xs mb-1.5" htmlFor="signup-phone">
              Phone
            </label>
            <input
              id="signup-phone"
              autoComplete="tel"
              className="field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-xs mb-1.5" htmlFor="signup-password">
              Password
            </label>
            <input
              required
              type="password"
              id="signup-password"
              autoComplete="new-password"
              className="field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="label-xs mb-1.5" htmlFor="signup-confirm">
              Confirm password
            </label>
            <input
              required
              type="password"
              id="signup-confirm"
              autoComplete="new-password"
              className="field"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-mist">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e) => setForm({ ...form, agree: e.target.checked })}
            className="mt-0.5 size-4 rounded border-border accent-accent"
          />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={mutation.isPending} className="btn-accent w-full">
          {mutation.isPending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
