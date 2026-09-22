export interface User {
  id: string;
  email: string;
  name: string;
  headline?: string;
  location?: string;
  desired_title?: string;
  desired_location?: string;
  desired_job_type?: string;
  min_salary?: number;
  created_at: string;
  email_verified?: boolean;
  email_verified_at?: string | null;
}

export interface UserProfileUpdate {
  name?: string;
  headline?: string;
  location?: string;
  desired_title?: string;
  desired_location?: string;
  desired_job_type?: string;
  min_salary?: number;
}

export interface ResumeData {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  extracted_text: string;
  parsed_skills: string[];
  parsed_experience: {
    years?: number;
    roles?: string[];
    companies?: string[];
  };
  parsed_education: {
    degrees?: string[];
    schools?: string[];
  };
  parsed_summary?: string;
  uploaded_at: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  logo_url?: string;
  location: string;
  is_remote: boolean;
  job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experience_level: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  salary_min: number;
  salary_max: number;
  currency: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  posted_at: string;
  department: string;
  apply_url?: string;
}

export interface JobMatchBreakdown {
  score: number;
  badge: 'Top Match' | 'Strong Match' | 'Good Match' | 'Fair Match';
  badgeColor: 'emerald' | 'blue' | 'amber' | 'slate';
  titleMatch: boolean;
  locationMatch: boolean;
  matchedSkills: string[];
  missingSkills: string[];
  experienceFit: boolean;
  summaryReason: string;
}

export interface JobWithMatch extends Job {
  match?: JobMatchBreakdown;
  hasApplied?: boolean;
  isSaved?: boolean;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string;
  cover_note?: string;
  status: 'Applied' | 'Reviewing' | 'Interview' | 'Offer' | 'Archived';
  applied_at: string;
  job?: Job;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  saved_at: string;
  job?: Job;
}

export function getJobApplyUrl(job?: { company?: string; title?: string; apply_url?: string | null } | null): string {
  if (!job) return 'https://www.google.com';
  if (job.apply_url && job.apply_url.trim().length > 0) {
    return job.apply_url.trim();
  }

  const companyKey = (job.company || '').trim().toLowerCase();
  const companyUrlMap: Record<string, string> = {
    'vercel': 'https://vercel.com/careers',
    'stripe': 'https://stripe.com/jobs',
    'linear': 'https://linear.app/careers',
    'datadog': 'https://careers.datadoghq.com',
    'openai': 'https://openai.com/careers',
    'figma': 'https://www.figma.com/careers',
    'airbnb': 'https://careers.airbnb.com',
    'brex': 'https://www.brex.com/careers',
    'spotify': 'https://www.lifeatspotify.com/jobs',
    'discord': 'https://discord.com/careers',
    'apple': 'https://jobs.apple.com',
    'crowdstrike': 'https://www.crowdstrike.com/careers',
    'coinbase': 'https://www.coinbase.com/careers',
    'shopify': 'https://www.shopify.com/careers',
    'anthropic': 'https://www.anthropic.com/careers',
    'amazon web services': 'https://www.amazon.jobs',
    'aws': 'https://www.amazon.jobs',
    'hubspot': 'https://www.hubspot.com/careers',
    'pinterest': 'https://careers.pinterest.com',
    'notion': 'https://www.notion.so/careers',
    'mongodb': 'https://www.mongodb.com/careers',
    'snowflake': 'https://careers.snowflake.com',
    'lemon.io': 'https://lemon.io',
    'telus digital': 'https://www.telusinternational.com/careers'
  };

  for (const [key, url] of Object.entries(companyUrlMap)) {
    if (companyKey.includes(key) || key.includes(companyKey)) {
      return url;
    }
  }

  const query = `${job.company || ''} ${job.title || ''} jobs`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendedJobs?: JobWithMatch[];
  suggestedFollowUps?: string[];
}

export interface SentEmail {
  id: string;
  user_id: string;
  to_email: string;
  subject: string;
  html_content: string;
  action_url?: string;
  sent_at: string;
}


