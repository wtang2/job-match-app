import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest, getCurrentUser } from '@/lib/auth';
import { getAllJobs } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user = getCurrentUser(req);

    // If query param is provided, use it. Otherwise, if user has saved criteria, default to it!
    const queryTitle = searchParams.get('title') ?? searchParams.get('q');
    const queryLocation = searchParams.get('location');
    const remoteOnly = searchParams.get('remote') === 'true';
    const jobType = searchParams.get('jobType') || undefined;
    const experience = searchParams.get('experience') || undefined;
    const minSalaryParam = searchParams.get('minSalary');
    const sort = searchParams.get('sort') || 'match'; // match | recent | salary

    const titleFilter = queryTitle !== null ? queryTitle : (user?.desired_title || '');
    const locationFilter = queryLocation !== null ? queryLocation : (user?.desired_location || '');
    const minSalary = minSalaryParam ? parseInt(minSalaryParam, 10) : undefined;

    const jobs = getAllJobs({
      title: titleFilter,
      location: locationFilter,
      remoteOnly,
      jobType,
      experience,
      minSalary,
      userId: user?.id
    });

    // Sorting
    jobs.sort((a, b) => {
      if (sort === 'match') {
        const scoreA = a.match?.score ?? 0;
        const scoreB = b.match?.score ?? 0;
        return scoreB - scoreA;
      } else if (sort === 'salary') {
        return (b.salary_max || 0) - (a.salary_max || 0);
      } else if (sort === 'recent') {
        return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
      }
      return 0;
    });

    return NextResponse.json({
      jobs,
      total: jobs.length,
      criteria: {
        title: titleFilter,
        location: locationFilter,
        remoteOnly,
        jobType: jobType || 'All',
        experience: experience || 'All',
        minSalary: minSalary || 0,
        sort
      },
      userProfile: user ? {
        id: user.id,
        name: user.name,
        desired_title: user.desired_title,
        desired_location: user.desired_location
      } : null
    });
  } catch (err: any) {
    console.error('Job search error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
