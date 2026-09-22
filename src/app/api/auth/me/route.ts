import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getResumeByUserId, getUserApplications, getUserSavedJobs } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const resume = getResumeByUserId(user.id);
    const applications = getUserApplications(user.id);
    const savedJobs = getUserSavedJobs(user.id);

    return NextResponse.json({
      authenticated: true,
      user,
      hasResume: Boolean(resume),
      resumeSummary: resume ? {
        id: resume.id,
        filename: resume.original_name,
        skillsCount: resume.parsed_skills.length,
        skills: resume.parsed_skills,
        uploadedAt: resume.uploaded_at
      } : null,
      stats: {
        applicationsCount: applications.length,
        savedCount: savedJobs.length
      }
    });
  } catch (err: any) {
    console.error('Me endpoint error:', err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
