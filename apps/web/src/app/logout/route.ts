import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const { sessionId } = await auth();

  if (sessionId) {
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}
