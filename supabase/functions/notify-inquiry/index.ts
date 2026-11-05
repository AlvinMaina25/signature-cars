// Emails the business whenever a new row is inserted into public.inquiries
// (Contact page messages and car-page inquiries). Triggered by the database
// webhook in supabase/inquiry-email-webhook.sql.
//
// Secrets (set in Supabase, never in the frontend):
//   RESEND_API_KEY   API key from resend.com
//   WEBHOOK_SECRET   same value as in the webhook SQL (x-webhook-secret header)
//   NOTIFY_TO        business inbox(es), comma separated, e.g. <TODO client email>
//   NOTIFY_FROM      e.g. "Signature Cars Limited <noreply@yourdomain.co.ke>"
//                    (until a domain is verified: "Signature Cars Limited <onboarding@resend.dev>")
//
// The inquiry row is already saved before this runs, so an email failure
// never loses a customer's message.

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = (Deno.env.get("NOTIFY_TO") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const from = Deno.env.get("NOTIFY_FROM");
  if (!apiKey || !to.length || !from) {
    console.error("notify-inquiry: missing RESEND_API_KEY, NOTIFY_TO or NOTIFY_FROM");
    return new Response("Not configured", { status: 500 });
  }

  let payload: { type?: string; record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (payload.type !== "INSERT" || !payload.record) {
    return new Response("Ignored", { status: 200 });
  }

  const r = payload.record;
  const topic = r.topic ? String(r.topic) : r.car_id ? "Car inquiry" : "General message";
  const subject = `New website inquiry: ${topic} — ${String(r.name ?? "").slice(0, 60)}`;

  const rows: [string, unknown][] = [
    ["Name", r.name],
    ["Email", r.email],
    ["Phone", r.phone || "—"],
    ["About", topic],
    ["Message", r.message],
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="margin:0 0 12px">New inquiry from your website</h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666;vertical-align:top;width:90px">${k}</td>` +
              `<td style="padding:6px 10px;border-bottom:1px solid #eee;white-space:pre-wrap">${esc(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="color:#666;font-size:13px">Reply to this email to answer the customer directly.
      Every inquiry is also saved in the admin Inquiries page.</p>
    </div>`;

  const text = rows.map(([k, v]) => `${k}: ${v ?? ""}`).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      reply_to: r.email ? String(r.email) : undefined,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error("notify-inquiry: Resend error", res.status, await res.text());
    return new Response("Email failed", { status: 502 });
  }
  return new Response("OK", { status: 200 });
});
