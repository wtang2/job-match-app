import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { getCurrentUser } from '@/lib/auth';
import { parseResumeBuffer } from '@/lib/resumeParser';
import { saveResume, updateUserProfile } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to upload a resume.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileExt = path.extname(file.name) || '.pdf';
    const safeBaseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storedFilename = `${user.id}_${Date.now()}_${safeBaseName}${fileExt}`;
    const storedFilePath = path.join(uploadsDir, storedFilename);

    fs.writeFileSync(storedFilePath, buffer);

    // Parse the resume
    const extracted = await parseResumeBuffer(buffer, file.name, file.type);

    // Save resume to DB
    const saved = saveResume({
      user_id: user.id,
      filename: storedFilename,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      file_path: storedFilePath,
      extracted_text: extracted.rawText.slice(0, 10000), // store first 10k chars
      parsed_skills: extracted.skills,
      parsed_experience: extracted.experience,
      parsed_education: extracted.education,
      parsed_summary: extracted.summary,
      uploaded_at: new Date().toISOString()
    });

    // If user has empty name, headline or desired title, suggest from resume
    const updates: any = {};
    if (!user.name && extracted.name && extracted.name !== 'Candidate') {
      updates.name = extracted.name;
    }
    if (!user.headline && extracted.experience?.roles?.[0]) {
      updates.headline = extracted.experience.roles[0];
    }
    if (!user.desired_title && extracted.experience?.roles?.[0]) {
      updates.desired_title = extracted.experience.roles[0];
    }
    if (!user.location && extracted.location) {
      updates.location = extracted.location;
    }
    if (Object.keys(updates).length > 0) {
      updateUserProfile(user.id, updates);
    }

    return NextResponse.json({
      success: true,
      resume: saved,
      message: 'Resume uploaded and parsed successfully!'
    });
  } catch (err: any) {
    console.error('Resume upload error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process resume' }, { status: 500 });
  }
}
