import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getResumeByUserId } from '@/lib/db';
import { scrapeLiveJobs } from '@/lib/scraper';

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    const body = await req.json().catch(() => ({}));

    const resume = user ? getResumeByUserId(user.id) : null;

    const title = body.title || user?.desired_title || 'Software Engineer';
    const location = body.location || user?.desired_location || 'SF Bay Area, CA';
    const skills = resume?.parsed_skills || body.skills || [];
    const brightDataApiKey = body.brightDataApiKey || process.env.BRIGHTDATA_API_KEY;

    const result = await scrapeLiveJobs({
      title,
      location,
      skills,
      brightDataApiKey,
      userId: user?.id
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Scrape API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to scrape live jobs' },
      { status: 500 }
    );
  }
}
