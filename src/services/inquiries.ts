import { supabase } from "@/integrations/supabase/client";
import type { Inquiry } from "@/data/types";

import { toInquiry, type InquiryRow } from "./mappers";

const SELECT =
  "id, car_id, topic, name, email, phone, message, status, created_at, cars ( year, make, model )";

export interface InquiryInput {
  vehicleId: string;
  vehicleName?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** Honeypot: hidden field, real visitors leave it empty. */
  website?: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  topic: string;
  message: string;
  phone?: string;
  /** Honeypot: hidden field, real visitors leave it empty. */
  website?: string;
}

// Visitors who are not signed in may insert an inquiry but are not allowed to
// read rows back, so these inserts deliberately do not ask for the row in return.
export async function createInquiry(input: InquiryInput): Promise<void> {
  if (input.website) return; // bot filled the hidden field: pretend success, save nothing
  const { data: session } = await supabase.auth.getUser();

  const { error } = await supabase.from("inquiries").insert({
    car_id: input.vehicleId,
    user_id: session.user?.id ?? null,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    message: input.message,
  });

  if (error) throw new Error(`Could not send your inquiry: ${error.message}`);
}

/** A general message from the Contact page: lands in the same Inquiries list, with no car. */
export async function createContactMessage(input: ContactMessageInput): Promise<void> {
  if (input.website) return; // bot filled the hidden field: pretend success, save nothing
  const { data: session } = await supabase.auth.getUser();

  const { error } = await supabase.from("inquiries").insert({
    car_id: null,
    topic: input.topic,
    user_id: session.user?.id ?? null,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    message: input.message,
  });

  if (error) throw new Error(`Could not send your message: ${error.message}`);
}

export async function listInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load inquiries: ${error.message}`);
  return ((data ?? []) as unknown as InquiryRow[]).map(toInquiry);
}

export async function listMyInquiries(): Promise<Inquiry[]> {
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return [];
  const { data, error } = await supabase
    .from("inquiries")
    .select(SELECT)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your inquiries: ${error.message}`);
  return ((data ?? []) as unknown as InquiryRow[]).map(toInquiry);
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: Inquiry["status"],
): Promise<void> {
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", inquiryId);
  if (error) throw new Error(`Could not update the inquiry: ${error.message}`);
}
