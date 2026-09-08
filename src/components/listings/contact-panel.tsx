"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Phone } from "lucide-react";
import { revealContact } from "@/lib/actions/contact";
import { formatPhone, type ContactReveal } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { buttonClasses } from "@/components/ui/button";
import type { Database } from "@/types/database";

/**
 * §5.3 contact reveal.
 *
 * The number is not in the page payload — it does not exist on the client until
 * this button is pressed, at which point `reveal_contact` rate-limits the
 * caller, writes the contact_event that later unlocks reviews, and returns the
 * prefilled wa.me link it built server-side.
 */
export function ContactPanel({
  targetType,
  targetId,
  signedIn = true,
  heading,
  blurb,
}: {
  targetType: Database["public"]["Enums"]["contact_target"];
  targetId: string;
  signedIn?: boolean;
  heading?: string;
  blurb?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [contact, setContact] = useState<ContactReveal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const body = (
    <>
      {contact ? (
        <div className="space-y-3">
          <a
            href={contact.wa_link}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("primary", "lg", "w-full")}
          >
            <WhatsAppIcon className="size-[18px]" />
            Open WhatsApp
          </a>
          <p className="flex items-center justify-center gap-2 text-[13px] font-semibold text-ink">
            <Phone className="size-3.5 text-ink-400" />
            {formatPhone(contact.phone)}
          </p>
          <p className="text-center text-[11.5px] leading-relaxed text-ink-400">
            Your message is pre-filled with the item name. {contact.recipient_name}{" "}
            has been told you asked for their contact.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!signedIn) {
                router.push("/sign-in");
                return;
              }
              setError(null);
              startTransition(async () => {
                const result = await revealContact(targetType, targetId);
                if (!result) return;
                if (result.ok) setContact(result.contact);
                else setError(result.error);
              });
            }}
            className={buttonClasses("primary", "lg", "w-full")}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Revealing…
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Reveal contact
              </>
            )}
          </button>

          {error ? (
            <p role="alert" className="text-center text-[11.5px] font-semibold text-red-600">
              {error}
            </p>
          ) : (
            <p className="text-center text-[11.5px] leading-relaxed text-ink-400">
              Numbers are hidden until you ask. Revealing one is logged, and it is
              what later lets you leave a review.
            </p>
          )}
        </div>
      )}
    </>
  );

  if (!heading) return body;

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-[15px] font-bold text-ink">{heading}</h2>
      {blurb && (
        <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{blurb}</p>
      )}
      <div className="mt-4">{body}</div>
    </div>
  );
}
