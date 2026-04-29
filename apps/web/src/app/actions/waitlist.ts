"use server";

export type WaitlistState =
  | { status: "idle" }
  | { status: "success"; code: string }
  | { status: "error"; message: string };
