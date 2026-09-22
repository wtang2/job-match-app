import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSentEmailsByUserId } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emails = getSentEmailsByUserId(user.id);
    return NextResponse.json({ emails });
  } catch (err: any) {
    console.error('Fetch sent emails error:', err);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
