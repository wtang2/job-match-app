import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserApplications } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = getUserApplications(user.id);
    return NextResponse.json({ applications });
  } catch (err: any) {
    console.error('Get applications error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
