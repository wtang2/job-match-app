import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getDb, createUser, saveResume } from '@/lib/db';
import { createAuthToken, setAuthCookie, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json().catch(() => ({ role: 'engineer' }));

    let targetEmail = 'alex@example.com';
    if (role === 'designer') {
      targetEmail = 'emily@example.com';
    }

    let userWithSecrets = getUserByEmail(targetEmail);

    // If emily doesn't exist yet, seed her
    if (!userWithSecrets && targetEmail === 'emily@example.com') {
      const { hash, salt } = hashPassword('password123');
      const emily = createUser({
        email: 'emily@example.com',
        passwordHash: hash,
        salt,
        name: 'Emily Zhang',
        headline: 'Lead Product Designer & Design Systems Specialist',
        location: 'New York, NY',
        desired_title: 'Product Designer',
        desired_location: 'Remote',
        desired_job_type: 'Full-time',
        min_salary: 160000
      });

      // seed resume for Emily
      saveResume({
        user_id: emily.id,
        filename: 'emily_zhang_resume.pdf',
        original_name: 'Emily_Zhang_Design_Resume.pdf',
        file_size: 89000,
        mime_type: 'application/pdf',
        file_path: 'sample_emily_resume.pdf',
        extracted_text: 'Emily Zhang - Lead UI/UX Product Designer with 7+ years creating design systems, user journeys, wireframing in Figma.',
        parsed_skills: ['UI/UX Design', 'Figma', 'Wireframing', 'User Research', 'Prototyping', 'Design Systems', 'Product Management', 'Agile'],
        parsed_experience: {
          years: 7,
          roles: ['Lead UI/UX Product Designer', 'Senior Product Designer'],
          companies: ['Stripe', 'Airbnb']
        },
        parsed_education: {
          degrees: ['Bachelor of Arts in Interaction Design'],
          schools: ['RISD']
        },
        parsed_summary: 'Passionate design leader with 7+ years of experience leading multi-disciplinary product design teams and designing design systems at scale.',
        uploaded_at: new Date().toISOString()
      });

      userWithSecrets = getUserByEmail('emily@example.com');
    }

    if (!userWithSecrets) {
      // Fallback: make sure Alex is there
      getDb();
      userWithSecrets = getUserByEmail('alex@example.com');
    }

    if (!userWithSecrets) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    const { password_hash, salt, ...user } = userWithSecrets;
    const token = createAuthToken(user.id);
    const response = NextResponse.json({ success: true, user, token });
    setAuthCookie(response, token);

    return response;
  } catch (err: any) {
    console.error('Demo login error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
