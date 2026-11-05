import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageIntro, PublicLayout } from "@/components/layout/PublicLayout";
import { createContactMessage } from "@/data/api";
import { refreshInquiryData } from "@/lib/sync";
import {
  brand,
  brandPhones,
  directionsUrl,
  mapEmbedUrl,
  telLink,
  whatsappLink,
  pageMeta,
  canonicalLinks,
} from "@/config/brand";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: pageMeta({
      title: `Contact ${brand.name} — ${brand.address.area}, ${brand.address.city}`,
      description: `Call, WhatsApp or visit ${brand.name} on ${brand.address.area}, ${brand.address.city} to ask about a car.`,
      path: "/contact",
    }),
    links: canonicalLinks("/contact"),
  }),
  component: Contact,
});

function Contact() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "A listing",
    message: "",
    website: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      createContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        topic: form.topic,
        message: form.message.trim(),
        website: form.website,
      }),
    onSuccess: () => {
      toast.success("Message sent", {
        description: `Thank you for getting in touch. ${brand.name} will reply to ${form.email.trim()}.`,
      });
      setForm({ name: "", email: "", topic: "A listing", message: "", website: "" });
      void refreshInquiryData(queryClient);
    },
    onError: (error) =>
      toast.error("Could not send your message", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  return (
    <PublicLayout>
      <PageIntro
        eyebrow="Contact us"
        title={
          <>
            Call, message
            <br />
            <span className="bg-gradient-to-r from-accent to-glow bg-clip-text text-transparent">
              or visit us.
            </span>
          </>
        }
        lead={`Ask about a car, a trade-in or financing. You can reach ${brand.name} by phone, WhatsApp or email, or visit us along ${brand.address.area} in ${brand.address.city}.`}
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-6 pb-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          className="glass rounded-3xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <h2 className="font-heading text-lg font-semibold">Send a message</h2>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-xs mb-1.5" htmlFor="c-name">
                Full name
              </label>
              <input
                required
                id="c-name"
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label-xs mb-1.5" htmlFor="c-email">
                Email
              </label>
              <input
                required
                type="email"
                id="c-email"
                className="field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label-xs mb-1.5" htmlFor="c-topic">
              What is this about?
            </label>
            <select
              id="c-topic"
              className="field appearance-none bg-brand"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            >
              <option>A listing</option>
              <option>Financing</option>
              <option>Trade-in appraisal</option>
              <option>Sourcing request</option>
            </select>
          </div>
          <div className="mt-4">
            <label className="label-xs mb-1.5" htmlFor="c-message">
              Message
            </label>
            <textarea
              required
              id="c-message"
              rows={5}
              className="field resize-none"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          {mutation.isError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Something went wrong. Please try again."}
            </p>
          )}
          <button type="submit" disabled={mutation.isPending} className="btn-accent mt-6">
            {mutation.isPending ? "Sending…" : "Send message"}
          </button>
        </form>

        <aside className="glass h-fit rounded-3xl p-6">
          <h2 className="font-heading text-lg font-semibold">Direct lines</h2>
          <ul className="mt-5 space-y-5">
            <li className="flex items-start gap-3">
              <span className="icon-btn size-9 shrink-0">
                <Phone className="size-4 text-accent" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="label-xs">Phone</div>
                <div className="mt-1 flex flex-col gap-1 text-sm">
                  {brandPhones.map((phone) => (
                    <a
                      key={phone.international}
                      href={telLink(phone.international)}
                      className="transition hover:text-accent"
                    >
                      {phone.display}
                    </a>
                  ))}
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="icon-btn size-9 shrink-0">
                <MessageCircle className="size-4 text-accent" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="label-xs">WhatsApp</div>
                <a
                  href={whatsappLink(`Hello ${brand.name}, I would like to ask about a car.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm transition hover:text-accent"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </li>
            {brand.email && (
              <li className="flex items-start gap-3">
                <span className="icon-btn size-9 shrink-0">
                  <Mail className="size-4 text-accent" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="label-xs">Email</div>
                  <a
                    href={`mailto:${brand.email}`}
                    className="mt-1 block break-all text-sm transition hover:text-accent"
                  >
                    {brand.email}
                  </a>
                </div>
              </li>
            )}
            <li className="flex items-start gap-3">
              <span className="icon-btn size-9 shrink-0">
                <MapPin className="size-4 text-accent" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="label-xs">Location</div>
                <div className="mt-1 text-sm">{brand.address.full}</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="icon-btn size-9 shrink-0">
                <Clock className="size-4 text-accent" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="label-xs">Hours</div>
                <div className="mt-1 text-sm">{brand.hours}</div>
              </div>
            </li>
          </ul>
        </aside>
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-12" aria-labelledby="find-us">
        <div className="glass overflow-hidden rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0">
              <h2 id="find-us" className="font-heading text-lg font-semibold">
                Find us
              </h2>
              <p className="mt-1 text-sm text-mist">{brand.address.full}</p>
            </div>
            <a
              href={directionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent"
            >
              <Navigation className="size-4" aria-hidden="true" />
              Get Directions
            </a>
          </div>
          <iframe
            title={`Map showing ${brand.name} on ${brand.address.area}, ${brand.address.city}`}
            src={mapEmbedUrl()}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="h-72 w-full border-0 sm:h-96"
          />
        </div>
      </section>
    </PublicLayout>
  );
}
