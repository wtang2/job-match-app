import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getCurrentUser } from '@/lib/auth';
import { getResumeByUserId } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = getResumeByUserId(user.id);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Check if real file exists on disk
    if (fs.existsSync(resume.file_path)) {
      const fileBuffer = fs.readFileSync(resume.file_path);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': resume.mime_type || 'application/pdf',
          'Content-Disposition': `attachment; filename="${resume.original_name}"`
        }
      });
    }

    // Fallback: generate text representation
    const textContent = `${resume.original_name}\n\n${resume.extracted_text || 'Resume content'}\n\nExtracted Skills:\n${resume.parsed_skills.join(', ')}`;
    return new NextResponse(textContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${resume.original_name.replace(/\.[^/.]+$/, '')}.txt"`
      }
    });
  } catch (err: any) {
    console.error('Download resume error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
