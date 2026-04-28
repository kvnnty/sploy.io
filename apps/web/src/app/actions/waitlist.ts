"use server";

export type WaitlistState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { status: "error", message: "Enter your email." };
  }
  if (!emailPattern.test(email)) {
    return {
      status: "error",
      message: "That doesn’t look like a valid email.",
    };
  }

  const webhook = process.env.WAITLIST_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        return {
          status: "error",
          message: "Something went wrong. Try again in a moment.",
        };
      }
    } catch {
      return {
        status: "error",
        message: "Something went wrong. Try again in a moment.",
      };
    }
  }

  return { status: "success" };
}
