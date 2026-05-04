"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useSearchParams } from "next/navigation";

interface FormProps {
  onSuccessChange?: (success: boolean) => void;
}

export function WaitlistForm({ onSuccessChange }: FormProps) {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.email || !isValidEmail(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      setStep(2);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        firstname: formData.name || formData.email.split("@")[0],
        email: formData.email,
        name: formData.name || formData.email.split("@")[0],
        referredBy: refCode || undefined,
      };

      const mailRes = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!mailRes.ok) {
        const err =
          mailRes.status === 429 ? "Rate limited" : "Email failed";
        throw new Error(err);
      }

      const notionRes = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!notionRes.ok) {
        const errData = await notionRes.json();
        if (notionRes.status === 409) {
          toast.error(errData.error || "You're already on the waitlist!");
          return;
        }
        const err =
          notionRes.status === 429 ? "Rate limited" : "Notion failed";
        throw new Error(err);
      }

      const { code } = await notionRes.json();
      const link = `${window.location.origin}/?ref=${code}`;
      setShareLink(link);

      toast.success("You're on the waitlist!");
      setSuccess(true);
      onSuccessChange?.(true);

      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#55b3ff", "#5fc992", "#ff6363", "#f9f9f9"],
        });
      }, 150);

      setFormData({ email: "", name: "" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        const msg =
          error.message === "Rate limited"
            ? "Too many attempts. Try again later."
            : "Something went wrong. Try again.";
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({ email: "", name: "" });
    setSuccess(false);
    setShareLink("");
    onSuccessChange?.(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied!");
  };

  return (
    <div className="w-full relative">
      {success ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-lg font-medium">
            Share your link to skip the line!
          </p>
          <div className="flex items-center gap-2 max-w-sm mx-auto">
            <input
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg text-black text-sm bg-gray-50"
            />
            <button
              type="button"
              onClick={copyLink}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Copy
            </button>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="text-sm underline"
          >
            Join with another email
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="relative">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex relative"
              >
                <label htmlFor="waitlist-email" className="sr-only">
                  Email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="grow rounded-[12px] border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute top-2 right-2 bottom-2 flex items-center justify-center rounded-[12px] bg-primary px-5 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <label htmlFor="waitlist-name" className="sr-only">
                  Name
                </label>
                <input
                  id="waitlist-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name (optional)"
                  disabled={loading}
                  className="w-full rounded-[12px] border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-[12px] bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <title>Loading</title>
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Joining...
                    </>
                  ) : (
                    "Join Waitlist"
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  );
}
