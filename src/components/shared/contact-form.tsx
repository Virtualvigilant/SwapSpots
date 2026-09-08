"use client";

import { useState } from "react";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";

/**
 * Opens the visitor's mail client with everything filled in.
 *
 * There is no `contact_messages` table and no transactional email provider
 * configured yet, and a form that silently discards what someone typed is worse
 * than no form. This actually delivers, with no backend.
 */
export function ContactForm({
  topics,
  supportEmail,
}: {
  topics: { value: string; label: string }[];
  supportEmail: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(topics[0].value);
  const [message, setMessage] = useState("");

  const label = topics.find((t) => t.value === topic)?.label ?? topic;
  const href =
    `mailto:${supportEmail}` +
    `?subject=${encodeURIComponent(`[${label}] SwapSpot enquiry`)}` +
    `&body=${encodeURIComponent(
      `${message}\n\n—\n${name}\n${email}`.trim(),
    )}`;

  const ready = name.trim() && email.trim() && message.trim();

  return (
    <div className="rounded-2xl border border-line bg-white p-6 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required>
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@kabarak.ac.ke"
            autoComplete="email"
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="What is this about?" required>
          <Select
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            options={topics}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label="Message"
          required
          hint="The more specific, the faster we can help."
        >
          <Textarea
            name="message"
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field>
      </div>

      <a
        href={ready ? href : undefined}
        aria-disabled={!ready}
        className={buttonClasses(
          "primary",
          "lg",
          `mt-6 ${ready ? "" : "pointer-events-none opacity-50"}`,
        )}
      >
        Send message
      </a>
      <p className="mt-3 text-[11.5px] text-ink-400">
        This opens your email app with the message ready to send to{" "}
        {supportEmail}.
      </p>
    </div>
  );
}
