import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { applyToJob, getResumeByUserId, getJobById } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to apply for jobs.' }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, coverNote } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
    }

    const job = getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const resume = getResumeByUserId(user.id);

    const application = applyToJob(
      user.id,
      jobId,
      resume?.id,
      coverNote
    );

    return NextResponse.json({
      success: true,
      message: `Successfully applied to ${job.title} at ${job.company}!`,
      application
    });
  } catch (err: any) {
    console.error('Apply job error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
