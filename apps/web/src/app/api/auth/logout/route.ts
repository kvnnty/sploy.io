import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

async function performLogout(request: Request) {
  const { origin } = new URL(request.url);
  const { sessionId } = await auth();

  if (sessionId) {
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);
  }

  return NextResponse.json(
    { ok: true, redirectTo: `${origin}/auth/login` },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

export async function POST(request: Request) {
  return performLogout(request);
}

export async function GET(request: Request) {
  await performLogout(request);
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/auth/login`);
}
