import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getProfile, updateProfile } from "@/data/api";
import type { CustomerProfile } from "@/data/types";
import { accountNav } from "@/lib/nav";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/account/profile")({
  head: () => ({
    meta: [{ title: `Profile — ${brand.name}` }],
  }),
  component: Profile,
});

const emptyProfile: CustomerProfile = {
  id: "",
  fullName: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  memberSince: new Date().toISOString(),
  preferredContact: "Email",
};

function Profile() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const [form, setForm] = useState<CustomerProfile>(emptyProfile);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateProfile(form),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      toast.success("Profile updated");
    },
  });

  return (
    <DashboardLayout eyebrow="Your account" title="Profile" nav={accountNav}>
      <div className="glass max-w-2xl rounded-2xl p-6">
        {isPending ? (
          <div className="h-64 animate-pulse rounded-xl bg-white/5" />
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-xs mb-1.5" htmlFor="p-name">
                  Full name
                </label>
                <input
                  required
                  id="p-name"
                  className="field"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="label-xs mb-1.5" htmlFor="p-email">
                  Email
                </label>
                <input
                  required
                  type="email"
                  id="p-email"
                  className="field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-xs mb-1.5" htmlFor="p-phone">
                  Phone
                </label>
                <input
                  id="p-phone"
                  className="field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label-xs mb-1.5" htmlFor="p-contact">
                  Preferred contact
                </label>
                <select
                  id="p-contact"
                  className="field appearance-none bg-brand"
                  value={form.preferredContact}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preferredContact: e.target.value as CustomerProfile["preferredContact"],
                    })
                  }
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-xs mb-1.5" htmlFor="p-city">
                  City
                </label>
                <input
                  id="p-city"
                  className="field"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="label-xs mb-1.5" htmlFor="p-country">
                  Country
                </label>
                <input
                  id="p-country"
                  className="field"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" disabled={mutation.isPending} className="btn-accent">
              {mutation.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
