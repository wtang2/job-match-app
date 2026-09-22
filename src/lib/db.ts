import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { INITIAL_JOBS } from './seedJobs';
import { User, ResumeData, Job, JobWithMatch, Application, SavedJob, SentEmail } from './types';
import { calculateJobMatch } from './matching';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'jobsearch.db');
  dbInstance = new DatabaseSync(dbPath);

  // Initialize tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      headline TEXT,
      location TEXT,
      desired_title TEXT,
      desired_location TEXT,
      desired_job_type TEXT,
      min_salary INTEGER,
      created_at TEXT NOT NULL,
      email_verified INTEGER DEFAULT 0,
      email_verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      extracted_text TEXT,
      parsed_skills TEXT NOT NULL,
      parsed_experience TEXT,
      parsed_education TEXT,
      parsed_summary TEXT,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      logo_url TEXT,
      location TEXT NOT NULL,
      is_remote INTEGER NOT NULL,
      job_type TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      currency TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      responsibilities TEXT NOT NULL,
      skills TEXT NOT NULL,
      posted_at TEXT NOT NULL,
      department TEXT NOT NULL,
      apply_url TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      resume_id TEXT,
      cover_note TEXT,
      status TEXT NOT NULL,
      applied_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      UNIQUE(user_id, job_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sent_emails (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_content TEXT NOT NULL,
      action_url TEXT,
      sent_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe migration for existing users table
  try {
    const tableInfo = dbInstance.prepare("PRAGMA table_info(users)").all() as any[];
    const hasEmailVerified = tableInfo.some((col: any) => col.name === 'email_verified');
    if (!hasEmailVerified) {
      dbInstance.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0");
      dbInstance.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");
      dbInstance.prepare("UPDATE users SET email_verified = 1 WHERE email = 'alex@example.com'").run();
    }
  } catch (err) {
    console.error('Migration error checking email_verified column:', err);
  }

  // Seed jobs if empty
  const countRow = dbInstance.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number | bigint };
  const count = Number(countRow?.count || 0);

  if (count === 0) {
    console.log('Seeding initial jobs into database...');
    const insertStmt = dbInstance.prepare(`
      INSERT INTO jobs (
        id, title, company, logo_url, location, is_remote, job_type,
        experience_level, salary_min, salary_max, currency, description,
        requirements, responsibilities, skills, posted_at, department, apply_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const job of INITIAL_JOBS) {
      const id = 'job_' + crypto.randomUUID();
      insertStmt.run(
        id,
        job.title,
        job.company,
        job.logo_url || null,
        job.location,
        job.is_remote ? 1 : 0,
        job.job_type,
        job.experience_level,
        job.salary_min,
        job.salary_max,
        job.currency,
        job.description,
        JSON.stringify(job.requirements),
        JSON.stringify(job.responsibilities),
        JSON.stringify(job.skills),
        job.posted_at,
        job.department,
        job.apply_url || null
      );
    }
  }

  // Ensure all existing jobs have apply_url populated
  const missingUrlsCount = dbInstance.prepare("SELECT COUNT(*) as count FROM jobs WHERE apply_url IS NULL OR apply_url = ''").get() as { count: number | bigint };
  if (Number(missingUrlsCount?.count || 0) > 0) {
    const updateUrls: Record<string, string> = {
      'Vercel': 'https://vercel.com/careers',
      'Stripe': 'https://stripe.com/jobs',
      'Linear': 'https://linear.app/careers',
      'Datadog': 'https://careers.datadoghq.com',
      'OpenAI': 'https://openai.com/careers',
      'Figma': 'https://www.figma.com/careers',
      'Airbnb': 'https://careers.airbnb.com',
      'Brex': 'https://www.brex.com/careers',
      'Spotify': 'https://www.lifeatspotify.com/jobs',
      'Discord': 'https://discord.com/careers',
      'Apple': 'https://jobs.apple.com',
      'CrowdStrike': 'https://www.crowdstrike.com/careers',
      'Coinbase': 'https://www.coinbase.com/careers',
      'Shopify': 'https://www.shopify.com/careers',
      'Anthropic': 'https://www.anthropic.com/careers',
      'Amazon Web Services (AWS)': 'https://www.amazon.jobs',
      'HubSpot': 'https://www.hubspot.com/careers',
      'Pinterest': 'https://careers.pinterest.com',
      'Notion': 'https://www.notion.so/careers',
      'MongoDB': 'https://www.mongodb.com/careers',
      'Snowflake': 'https://careers.snowflake.com'
    };

    const updateStmt = dbInstance.prepare("UPDATE jobs SET apply_url = ? WHERE company = ? AND (apply_url IS NULL OR apply_url = '')");
    for (const [company, url] of Object.entries(updateUrls)) {
      updateStmt.run(url, company);
    }
  }

  // Seed demo user if not existing
  const demoCheck = dbInstance.prepare('SELECT id FROM users WHERE email = ?').get('alex@example.com');
  if (!demoCheck) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha512').toString('hex');
    const demoUserId = 'user_demo_alex';

    dbInstance.prepare(`
      INSERT INTO users (
        id, email, password_hash, salt, name, headline, location,
        desired_title, desired_location, desired_job_type, min_salary, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      demoUserId,
      'alex@example.com',
      hash,
      salt,
      'Alex Chen',
      'Senior Full Stack Engineer & System Architect',
      'San Francisco, CA',
      'Full Stack Engineer',
      'San Francisco, CA',
      'Full-time',
      150000,
      new Date().toISOString()
    );

    // Seed sample resume for Alex
    const demoResumeId = 'resume_demo_alex';
    const sampleSkills = ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Tailwind CSS', 'GraphQL', 'REST APIs'];
    dbInstance.prepare(`
      INSERT INTO resumes (
        id, user_id, filename, original_name, file_size, mime_type,
        file_path, extracted_text, parsed_skills, parsed_experience,
        parsed_education, parsed_summary, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      demoResumeId,
      demoUserId,
      'alex_chen_resume.pdf',
      'Alex_Chen_Senior_Engineer_Resume.pdf',
      102400,
      'application/pdf',
      'sample_resume.pdf',
      'Alex Chen - Senior Full Stack Engineer with 6+ years of experience in React, Next.js, Node.js, and Cloud architectures.',
      JSON.stringify(sampleSkills),
      JSON.stringify({ years: 6, roles: ['Senior Full Stack Engineer', 'Full Stack Developer'] }),
      JSON.stringify({ degrees: ['Bachelor of Science in Computer Science'] }),
      'Senior Full Stack Engineer with 6+ years of production experience building high-scale SaaS web applications, developer platforms, and distributed microservices with React, Next.js, TypeScript, and AWS.',
      new Date().toISOString()
    );
  }

  return dbInstance;
}

// User Helpers
export function getUserByEmail(email: string): (User & { password_hash: string; salt: string }) | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
  if (!row) return null;
  return {
    ...row,
    email_verified: Boolean(row.email_verified)
  };
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const row = db.prepare('SELECT id, email, name, headline, location, desired_title, desired_location, desired_job_type, min_salary, created_at, email_verified, email_verified_at FROM users WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    email_verified: Boolean(row.email_verified)
  };
}

export function createUser(user: {
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  headline?: string;
  location?: string;
  desired_title?: string;
  desired_location?: string;
  desired_job_type?: string;
  min_salary?: number;
  email_verified?: boolean;
}): User {
  const db = getDb();
  const id = 'user_' + crypto.randomUUID();
  const now = new Date().toISOString();
  const isVerified = user.email_verified ? 1 : 0;

  db.prepare(`
    INSERT INTO users (
      id, email, password_hash, salt, name, headline, location,
      desired_title, desired_location, desired_job_type, min_salary, created_at,
      email_verified, email_verified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    user.email.toLowerCase().trim(),
    user.passwordHash,
    user.salt,
    user.name.trim(),
    user.headline?.trim() || null,
    user.location?.trim() || null,
    user.desired_title?.trim() || null,
    user.desired_location?.trim() || null,
    user.desired_job_type || 'Full-time',
    user.min_salary || null,
    now,
    isVerified,
    isVerified ? now : null
  );

  return {
    id,
    email: user.email.toLowerCase().trim(),
    name: user.name.trim(),
    headline: user.headline?.trim(),
    location: user.location?.trim(),
    desired_title: user.desired_title?.trim(),
    desired_location: user.desired_location?.trim(),
    desired_job_type: user.desired_job_type,
    min_salary: user.min_salary,
    created_at: now,
    email_verified: Boolean(isVerified),
    email_verified_at: isVerified ? now : null
  };
}

export function createEmailVerificationToken(userId: string, email: string): string {
  const db = getDb();
  const token = 'evt_' + crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  db.prepare(`
    INSERT INTO email_verification_tokens (token, user_id, email, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    token,
    userId,
    email.toLowerCase().trim(),
    now.toISOString(),
    expires.toISOString()
  );

  return token;
}

export function verifyEmailToken(token: string): { success: boolean; user?: User; error?: string } {
  const db = getDb();
  const record = db.prepare('SELECT * FROM email_verification_tokens WHERE token = ?').get(token) as any;

  if (!record) {
    return { success: false, error: 'Invalid verification token. Please request a new verification email.' };
  }

  if (record.used_at) {
    const user = getUserById(record.user_id);
    return { success: true, user: user || undefined };
  }

  const expires = new Date(record.expires_at).getTime();
  if (Date.now() > expires) {
    return { success: false, error: 'Verification link has expired. Please request a new verification email.' };
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE email_verification_tokens SET used_at = ? WHERE token = ?').run(now, token);
  db.prepare('UPDATE users SET email_verified = 1, email_verified_at = ? WHERE id = ?').run(now, record.user_id);

  const updatedUser = getUserById(record.user_id);
  return { success: true, user: updatedUser || undefined };
}

export function saveSentEmail(data: {
  userId: string;
  toEmail: string;
  subject: string;
  htmlContent: string;
  actionUrl?: string;
}): SentEmail {
  const db = getDb();
  const id = 'email_' + crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sent_emails (id, user_id, to_email, subject, html_content, action_url, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.userId,
    data.toEmail,
    data.subject,
    data.htmlContent,
    data.actionUrl || null,
    now
  );

  return {
    id,
    user_id: data.userId,
    to_email: data.toEmail,
    subject: data.subject,
    html_content: data.htmlContent,
    action_url: data.actionUrl,
    sent_at: now
  };
}

export function getSentEmailsByUserId(userId: string): SentEmail[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM sent_emails WHERE user_id = ? ORDER BY sent_at DESC LIMIT 10').all(userId) as any[];
  return rows || [];
}

export function updateUserProfile(id: string, updates: Partial<User>): User | null {
  const db = getDb();
  const existing = getUserById(id);
  if (!existing) return null;

  const name = updates.name !== undefined ? updates.name : existing.name;
  const headline = updates.headline !== undefined ? updates.headline : existing.headline;
  const location = updates.location !== undefined ? updates.location : existing.location;
  const desired_title = updates.desired_title !== undefined ? updates.desired_title : existing.desired_title;
  const desired_location = updates.desired_location !== undefined ? updates.desired_location : existing.desired_location;
  const desired_job_type = updates.desired_job_type !== undefined ? updates.desired_job_type : existing.desired_job_type;
  const min_salary = updates.min_salary !== undefined ? updates.min_salary : existing.min_salary;

  db.prepare(`
    UPDATE users SET
      name = ?,
      headline = ?,
      location = ?,
      desired_title = ?,
      desired_location = ?,
      desired_job_type = ?,
      min_salary = ?
    WHERE id = ?
  `).run(
    name,
    headline || null,
    location || null,
    desired_title || null,
    desired_location || null,
    desired_job_type || null,
    min_salary || null,
    id
  );

  return getUserById(id);
}

// Resume Helpers
export function getResumeByUserId(userId: string): ResumeData | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1').get(userId) as any;
  if (!row) return null;

  return {
    ...row,
    parsed_skills: JSON.parse(row.parsed_skills || '[]'),
    parsed_experience: JSON.parse(row.parsed_experience || '{}'),
    parsed_education: JSON.parse(row.parsed_education || '{}')
  };
}

export function saveResume(resume: Omit<ResumeData, 'id'>): ResumeData {
  const db = getDb();
  const id = 'res_' + crypto.randomUUID();

  // Delete previous resumes for user
  db.prepare('DELETE FROM resumes WHERE user_id = ?').run(resume.user_id);

  db.prepare(`
    INSERT INTO resumes (
      id, user_id, filename, original_name, file_size, mime_type,
      file_path, extracted_text, parsed_skills, parsed_experience,
      parsed_education, parsed_summary, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    resume.user_id,
    resume.filename,
    resume.original_name,
    resume.file_size,
    resume.mime_type,
    resume.file_path,
    resume.extracted_text,
    JSON.stringify(resume.parsed_skills),
    JSON.stringify(resume.parsed_experience),
    JSON.stringify(resume.parsed_education),
    resume.parsed_summary || null,
    resume.uploaded_at
  );

  return {
    ...resume,
    id
  };
}

export function updateResumeSkills(resumeId: string, skills: string[]): boolean {
  const db = getDb();
  const res = db.prepare('UPDATE resumes SET parsed_skills = ? WHERE id = ?').run(
    JSON.stringify(skills),
    resumeId
  );
  return Number(res.changes) > 0;
}

// Job Helpers
export function getAllJobs(options?: {
  title?: string;
  location?: string;
  remoteOnly?: boolean;
  jobType?: string;
  experience?: string;
  minSalary?: number;
  userId?: string;
}): JobWithMatch[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM jobs').all() as any[];

  // Get user profile and resume if userId is provided
  let profile = undefined;
  let resumeSkills: string[] = [];
  let userApplications: Set<string> = new Set();
  let userSaved: Set<string> = new Set();

  if (options?.userId) {
    const user = getUserById(options.userId);
    const resume = getResumeByUserId(options.userId);
    if (user) {
      resumeSkills = resume?.parsed_skills || [];
      profile = {
        desired_title: user.desired_title,
        desired_location: user.desired_location,
        desired_job_type: user.desired_job_type,
        min_salary: user.min_salary,
        skills: resumeSkills,
        experienceYears: resume?.parsed_experience?.years || 3
      };
    }

    const apps = db.prepare('SELECT job_id FROM applications WHERE user_id = ?').all(options.userId) as any[];
    apps.forEach(a => userApplications.add(a.job_id));

    const saved = db.prepare('SELECT job_id FROM saved_jobs WHERE user_id = ?').all(options.userId) as any[];
    saved.forEach(s => userSaved.add(s.job_id));
  }

  const searchTitle = options?.title?.trim() || '';
  const searchLocation = options?.location?.trim() || '';

  const parsedJobs: JobWithMatch[] = rows.map(r => {
    const job: Job = {
      ...r,
      is_remote: Boolean(r.is_remote),
      requirements: JSON.parse(r.requirements || '[]'),
      responsibilities: JSON.parse(r.responsibilities || '[]'),
      skills: JSON.parse(r.skills || '[]')
    };

    const match = calculateJobMatch(job, profile, {
      title: searchTitle,
      location: searchLocation
    });

    return {
      ...job,
      match,
      hasApplied: userApplications.has(job.id),
      isSaved: userSaved.has(job.id)
    };
  });

  // Filter based on options
  return parsedJobs.filter(job => {
    if (searchTitle) {
      const q = searchTitle.toLowerCase();
      const inTitle = job.title.toLowerCase().includes(q);
      const inDesc = job.description.toLowerCase().includes(q);
      const inSkills = job.skills.some(s => s.toLowerCase().includes(q));
      const inCompany = job.company.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inSkills && !inCompany) return false;
    }

    if (searchLocation) {
      const loc = searchLocation.toLowerCase();
      if (loc === 'remote') {
        if (!job.is_remote && !job.location.toLowerCase().includes('remote')) return false;
      } else {
        const inLoc = job.location.toLowerCase().includes(loc);
        if (!inLoc && !job.is_remote) return false;
      }
    }

    if (options?.remoteOnly && !job.is_remote) {
      return false;
    }

    if (options?.jobType && options.jobType !== 'All' && job.job_type !== options.jobType) {
      return false;
    }

    if (options?.experience && options.experience !== 'All' && job.experience_level !== options.experience) {
      return false;
    }

    if (options?.minSalary && job.salary_max < options.minSalary) {
      return false;
    }

    return true;
  });
}

export function getJobById(id: string, userId?: string): JobWithMatch | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
  if (!row) return null;

  const job: Job = {
    ...row,
    is_remote: Boolean(row.is_remote),
    requirements: JSON.parse(row.requirements || '[]'),
    responsibilities: JSON.parse(row.responsibilities || '[]'),
    skills: JSON.parse(row.skills || '[]')
  };

  let match = undefined;
  let hasApplied = false;
  let isSaved = false;

  if (userId) {
    const user = getUserById(userId);
    const resume = getResumeByUserId(userId);
    const profile = user ? {
      desired_title: user.desired_title,
      desired_location: user.desired_location,
      desired_job_type: user.desired_job_type,
      min_salary: user.min_salary,
      skills: resume?.parsed_skills || [],
      experienceYears: resume?.parsed_experience?.years || 3
    } : undefined;

    match = calculateJobMatch(job, profile);

    const appRow = db.prepare('SELECT id FROM applications WHERE user_id = ? AND job_id = ?').get(userId, id);
    hasApplied = Boolean(appRow);

    const savedRow = db.prepare('SELECT id FROM saved_jobs WHERE user_id = ? AND job_id = ?').get(userId, id);
    isSaved = Boolean(savedRow);
  }

  return {
    ...job,
    match,
    hasApplied,
    isSaved
  };
}

// Applications
export function applyToJob(userId: string, jobId: string, resumeId?: string, coverNote?: string): Application {
  const db = getDb();
  const id = 'app_' + crypto.randomUUID();
  const now = new Date().toISOString();

  // Check if already applied
  const existing = db.prepare('SELECT * FROM applications WHERE user_id = ? AND job_id = ?').get(userId, jobId) as any;
  if (existing) {
    return existing;
  }

  db.prepare(`
    INSERT INTO applications (id, user_id, job_id, resume_id, cover_note, status, applied_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    jobId,
    resumeId || null,
    coverNote?.trim() || null,
    'Applied',
    now
  );

  return {
    id,
    user_id: userId,
    job_id: jobId,
    resume_id: resumeId || '',
    cover_note: coverNote,
    status: 'Applied',
    applied_at: now
  };
}

export function getUserApplications(userId: string): Application[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT a.*, j.title, j.company, j.location, j.is_remote, j.salary_min, j.salary_max, j.currency, j.job_type, j.experience_level
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.user_id = ?
    ORDER BY a.applied_at DESC
  `).all(userId) as any[];

  return rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    job_id: r.job_id,
    resume_id: r.resume_id,
    cover_note: r.cover_note,
    status: r.status,
    applied_at: r.applied_at,
    job: {
      id: r.job_id,
      title: r.title,
      company: r.company,
      location: r.location,
      is_remote: Boolean(r.is_remote),
      salary_min: r.salary_min,
      salary_max: r.salary_max,
      currency: r.currency,
      job_type: r.job_type,
      experience_level: r.experience_level || 'Mid',
      description: '',
      requirements: [],
      responsibilities: [],
      skills: [],
      posted_at: '',
      department: ''
    }
  }));
}

// Saved Jobs
export function toggleSaveJob(userId: string, jobId: string): { isSaved: boolean } {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM saved_jobs WHERE user_id = ? AND job_id = ?').get(userId, jobId);

  if (existing) {
    db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?').run(userId, jobId);
    return { isSaved: false };
  } else {
    const id = 'save_' + crypto.randomUUID();
    db.prepare('INSERT INTO saved_jobs (id, user_id, job_id, saved_at) VALUES (?, ?, ?, ?)').run(
      id,
      userId,
      jobId,
      new Date().toISOString()
    );
    return { isSaved: true };
  }
}

export function getUserSavedJobs(userId: string): SavedJob[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT s.*, j.title, j.company, j.location, j.is_remote, j.salary_min, j.salary_max, j.currency, j.job_type, j.experience_level, j.skills
    FROM saved_jobs s
    JOIN jobs j ON s.job_id = j.id
    WHERE s.user_id = ?
    ORDER BY s.saved_at DESC
  `).all(userId) as any[];

  return rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    job_id: r.job_id,
    saved_at: r.saved_at,
    job: {
      id: r.job_id,
      title: r.title,
      company: r.company,
      location: r.location,
      is_remote: Boolean(r.is_remote),
      salary_min: r.salary_min,
      salary_max: r.salary_max,
      currency: r.currency,
      job_type: r.job_type,
      experience_level: r.experience_level || 'Mid',
      skills: JSON.parse(r.skills || '[]'),
      description: '',
      requirements: [],
      responsibilities: [],
      posted_at: '',
      department: ''
    }
  }));
}
