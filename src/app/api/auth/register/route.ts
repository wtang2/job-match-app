import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/db';
import { hashPassword, createAuthToken, setAuthCookie } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, headline, location, desired_title, desired_location, desired_job_type, min_salary } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const { hash, salt } = hashPassword(password);
    const user = createUser({
      email,
      passwordHash: hash,
      salt,
      name,
      headline,
      location,
      desired_title,
      desired_location,
      desired_job_type,
      min_salary: min_salary ? Number(min_salary) : undefined
    });

    // Send verification email asynchronously
    try {
      await sendVerificationEmail(user, req.nextUrl.origin);
    } catch (emailErr) {
      console.error('Failed to send verification email upon registration:', emailErr);
    }

    const token = createAuthToken(user.id);
    const response = NextResponse.json({ success: true, user, token });
    setAuthCookie(response, token);

    return response;
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
