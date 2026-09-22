import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserSavedJobs } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedJobs = getUserSavedJobs(user.id);
    return NextResponse.json({ savedJobs });
  } catch (err: any) {
    console.error('Get saved jobs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
