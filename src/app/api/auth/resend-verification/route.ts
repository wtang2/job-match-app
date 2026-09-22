import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserByEmail, getUserById } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    let user = getCurrentUser(req);

    if (!user) {
      // Allow passing email in request body if not currently logged in with session
      try {
        const body = await req.json();
        if (body?.email) {
          user = getUserByEmail(body.email);
        }
      } catch {
        // no body
      }
    } else {
      // Re-fetch to get freshest verification status
      const freshUser = getUserById(user.id);
      if (freshUser) user = freshUser;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please log in or provide a valid registered email.' },
        { status: 404 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { error: 'Your email address is already verified.' },
        { status: 400 }
      );
    }

    const emailResult = await sendVerificationEmail(
      { id: user.id, name: user.name, email: user.email },
      req.nextUrl.origin
    );

    return NextResponse.json({
      success: true,
      message: `Verification email sent to ${user.email}`,
      verifyUrl: emailResult.verifyUrl
    });
  } catch (err: any) {
    console.error('Resend verification error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
