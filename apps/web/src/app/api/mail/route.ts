import { Resend } from "resend";

import { type NextRequest, NextResponse } from "next/server";

import { Redis } from "@upstash/redis";

import { Ratelimit } from "@upstash/ratelimit";



import WelcomeTemplate from "@/emails";



let resend: Resend | undefined;

function getResend(): Resend | undefined {

  const key = process.env.RESEND_API_KEY;

  if (!key) return undefined;

  resend ??= new Resend(key);

  return resend;

}



let ratelimit: Ratelimit | null | undefined;

function getRatelimit(): Ratelimit | null {

  if (ratelimit !== undefined) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;

  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {

    ratelimit = null;

    return null;

  }

  ratelimit = new Ratelimit({

    redis: new Redis({ url, token }),

    limiter: Ratelimit.slidingWindow(2, "1 m"),

  });

  return ratelimit;

}



export async function POST(request: NextRequest) {

  const limiter = getRatelimit();

  if (!limiter) {

    return NextResponse.json(

      { error: "Rate limiting is not configured" },

      { status: 503 },

    );

  }



  let ip: string;

  const xForwardedForHeader = request.headers.get("x-forwarded-for");



  if (xForwardedForHeader) {

    ip = xForwardedForHeader.split(",")[0].trim();

  } else {

    ip = request.headers.get("x-real-ip")?.trim() ?? "127.0.0.1";

  }



  const result = await limiter.limit(ip);



  if (!result.success) {

    return NextResponse.json({ error: "Too many requests!" }, { status: 429 });

  }



  const mailer = getResend();

  if (!mailer) {

    return NextResponse.json(

      { error: "Email is not configured" },

      { status: 503 },

    );

  }



  const { email, name } = await request.json();



  const { data, error } = await mailer.emails.send({

    from: process.env.RESEND_FROM_EMAIL || "",

    to: [email],

    subject: "Welcome to the Sploy waitlist",

    react: WelcomeTemplate({ userFirstname: name }),

  });



  if (error) {

    return NextResponse.json({ error: error.message }, { status: 500 });

  }



  if (!data) {

    return NextResponse.json(

      { error: "Failed to send email" },

      { status: 500 },

    );

  }



  return NextResponse.json(

    { message: "Email sent successfully" },

    { status: 200 },

  );

}

