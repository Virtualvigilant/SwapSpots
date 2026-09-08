"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createCategory, setCategoryActive } from "@/lib/actions/admin";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus } from "@/components/ui/form-status";
import { buttonClasses } from "@/components/ui/button";

export function CategoryVisibility({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => setCategoryActive(id, !isActive).then(() => {}))
      }
      className={buttonClasses("ghost", "sm")}
    >
      {pending ? "…" : isActive ? "Hide" : "Show"}
    </button>
  );
}

export function NewCategoryForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createCategory, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses("primary", "sm")}
      >
        <Plus className="size-3.5" />
        New category
      </button>
    );
  }

  return (
    <form
      action={action}
      className="w-full space-y-4 rounded-2xl border border-line bg-white p-5"
    >
      <FormStatus state={state} />
      <Field label="Name" required hint="The slug is derived from this.">
        <Input name="name" required placeholder="Transport" />
      </Field>
      <Field label="Blurb" hint="Shown on the category landing page.">
        <Textarea name="blurb" rows={2} />
      </Field>
      <div className="flex gap-2">
        <SubmitButton size="sm" variant="dark">
          Create
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={buttonClasses("ghost", "sm")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
