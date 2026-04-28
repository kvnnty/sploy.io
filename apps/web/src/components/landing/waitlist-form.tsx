"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  joinWaitlist,
  type WaitlistState,
} from "@/app/actions/waitlist";
import { Button } from "@/components/ui/button";

const initialState: WaitlistState = { status: "idle" };

function WaitlistSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 shrink-0 rounded-full border-0 bg-white/[0.815] px-6 text-[15px] font-semibold tracking-[0.03em] text-[#18191a] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[opacity,background-color] hover:bg-white disabled:opacity-60"
    >
      {pending ? "Joining…" : "Join waitlist"}
    </Button>
  );
}

export function WaitlistForm() {
  const [state, formAction] = useActionState(joinWaitlist, initialState);

  if (state.status === "success") {
    return (
      <p
        className="text-[15px] font-medium tracking-[0.02em] text-[#5fc992]"
        role="status"
      >
        You’re on the list. We’ll be in touch.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="waitlist-email" className="sr-only">
          Email
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          aria-invalid={state.status === "error"}
          aria-describedby={
            state.status === "error" ? "waitlist-error" : undefined
          }
          className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#07080a] px-4 text-[15px] font-medium tracking-[0.02em] text-[#f9f9f9] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-[#6a6b6c] focus-visible:border-[hsl(202,100%,67%)] focus-visible:ring-[3px] focus-visible:ring-[hsla(202,100%,67%,0.15)]"
        />
        {state.status === "error" ? (
          <p
            id="waitlist-error"
            className="text-[13px] font-medium tracking-[0.02em] text-[#ff6363]"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
      </div>
      <WaitlistSubmitButton />
    </form>
  );
}
