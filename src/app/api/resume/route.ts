import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getResumeByUserId, updateResumeSkills } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = getResumeByUserId(user.id);
    if (!resume) {
      return NextResponse.json({ resume: null });
    }

    return NextResponse.json({ resume });
  } catch (err: any) {
    console.error('Get resume error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = getResumeByUserId(user.id);
    if (!resume) {
      return NextResponse.json({ error: 'No resume found. Please upload one first.' }, { status: 404 });
    }

    const body = await req.json();
    const { skills } = body;

    if (!Array.isArray(skills)) {
      return NextResponse.json({ error: 'Skills must be an array of strings' }, { status: 400 });
    }

    const cleanSkills = skills.map((s: any) => String(s).trim()).filter(Boolean);
    updateResumeSkills(resume.id, cleanSkills);

    const updated = getResumeByUserId(user.id);
    return NextResponse.json({ success: true, resume: updated });
  } catch (err: any) {
    console.error('Update resume skills error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
