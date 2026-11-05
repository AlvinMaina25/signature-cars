import { supabase } from "@/integrations/supabase/client";
import type { CustomerProfile } from "@/data/types";

import { toProfile, type ProfileRow } from "./mappers";

const SELECT = "id, full_name, email, phone, role, avatar_url, created_at";

const EMPTY: CustomerProfile = {
  id: "",
  fullName: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  memberSince: new Date().toISOString(),
  preferredContact: "Email",
};

export async function getProfile(): Promise<CustomerProfile> {
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return EMPTY;

  const { data, error } = await supabase
    .from("profiles")
    .select(SELECT)
    .eq("id", session.user.id)
    .maybeSingle();
  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  if (!data) return { ...EMPTY, id: session.user.id, email: session.user.email ?? "" };
  return toProfile(data as unknown as ProfileRow);
}

export async function updateProfile(patch: Partial<CustomerProfile>): Promise<CustomerProfile> {
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) throw new Error("Please sign in to update your profile.");

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: session.user.id,
      full_name: patch.fullName ?? null,
      email: patch.email ?? session.user.email ?? null,
      phone: patch.phone ?? null,
    })
    .eq("id", session.user.id);
  if (error) throw new Error(`Could not save your profile: ${error.message}`);
  return getProfile();
}

export async function isAdmin(): Promise<boolean> {
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return false;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: session.user.id,
    _role: "admin",
  });
  if (error) return false;
  return Boolean(data);
}
