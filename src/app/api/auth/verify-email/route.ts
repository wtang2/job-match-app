import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/db';
import { createAuthToken, setAuthCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const origin = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/?verified=false&error=Invalid+or+missing+verification+token`);
  }

  const result = verifyEmailToken(token);

  if (!result.success || !result.user) {
    const errorMsg = encodeURIComponent(result.error || 'Email verification failed');
    return NextResponse.redirect(`${origin}/?verified=false&error=${errorMsg}`);
  }

  // Create response redirecting to home with verified=true parameter
  const response = NextResponse.redirect(`${origin}/?verified=true`);

  // Ensure user session is updated/logged in
  try {
    const authToken = createAuthToken(result.user.id);
    setAuthCookie(response, authToken);
  } catch (err) {
    console.error('Error setting auth cookie on verification:', err);
  }

  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = verifyEmailToken(token);
    if (!result.success || !result.user) {
      return NextResponse.json({ error: result.error || 'Verification failed' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, user: result.user });
    const authToken = createAuthToken(result.user.id);
    setAuthCookie(response, authToken);

    return response;
  } catch (err: any) {
    console.error('Verify email POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
