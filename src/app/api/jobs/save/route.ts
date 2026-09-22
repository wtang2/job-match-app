import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { toggleSaveJob } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to save jobs.' }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
    }

    const result = toggleSaveJob(user.id, jobId);
    return NextResponse.json({
      success: true,
      isSaved: result.isSaved,
      message: result.isSaved ? 'Job saved to your bookmarks!' : 'Job removed from saved.'
    });
  } catch (err: any) {
    console.error('Toggle save error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
