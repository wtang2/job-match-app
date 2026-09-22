import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updated = updateUserProfile(user.id, {
      name: body.name,
      headline: body.headline,
      location: body.location,
      desired_title: body.desired_title,
      desired_location: body.desired_location,
      desired_job_type: body.desired_job_type,
      min_salary: body.min_salary ? Number(body.min_salary) : undefined
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
