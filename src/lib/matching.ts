import { Job, JobMatchBreakdown } from './types';

interface CandidateProfile {
  desired_title?: string;
  desired_location?: string;
  desired_job_type?: string;
  min_salary?: number;
  skills?: string[];
  experienceYears?: number;
}

export function calculateJobMatch(
  job: Job,
  profile?: CandidateProfile,
  searchQuery?: { title?: string; location?: string }
): JobMatchBreakdown {
  const targetTitle = (searchQuery?.title || profile?.desired_title || '').trim().toLowerCase();
  const targetLoc = (searchQuery?.location || profile?.desired_location || '').trim().toLowerCase();
  const userSkills = (profile?.skills || []).map(s => s.toLowerCase());
  const jobSkills = (job.skills || []).map(s => s.toLowerCase());

  let titleScore = 0;
  let titleMatch = false;

  if (!targetTitle) {
    titleScore = 30; // Neutral baseline when user hasn't specified
    titleMatch = true;
  } else {
    const jobTitleLower = job.title.toLowerCase();
    if (jobTitleLower.includes(targetTitle) || targetTitle.includes(jobTitleLower)) {
      titleScore = 35;
      titleMatch = true;
    } else {
      // Check word token overlap
      const targetWords = targetTitle.split(/\s+/).filter(w => w.length > 2);
      let matches = 0;
      for (const word of targetWords) {
        if (jobTitleLower.includes(word)) matches++;
      }
      if (matches > 0) {
        titleScore = Math.min(30, Math.round((matches / targetWords.length) * 35));
        titleMatch = true;
      } else {
        titleScore = 5;
        titleMatch = false;
      }
    }
  }

  // Location scoring
  let locationScore = 0;
  let locationMatch = false;
  const jobLocLower = job.location.toLowerCase();

  if (!targetLoc) {
    locationScore = 20;
    locationMatch = true;
  } else if (targetLoc.includes('remote')) {
    if (job.is_remote || jobLocLower.includes('remote')) {
      locationScore = 25;
      locationMatch = true;
    } else {
      locationScore = 5;
      locationMatch = false;
    }
  } else {
    if (jobLocLower.includes(targetLoc) || targetLoc.includes(jobLocLower)) {
      locationScore = 25;
      locationMatch = true;
    } else if (job.is_remote) {
      locationScore = 22; // Remote is usually accepted if user is in any location
      locationMatch = true;
    } else {
      // Check city or state code (e.g. NY, CA, TX)
      const parts = targetLoc.split(/[,\s]+/).filter(p => p.length >= 2);
      const matchedPart = parts.some(p => jobLocLower.includes(p));
      if (matchedPart) {
        locationScore = 18;
        locationMatch = true;
      } else {
        locationScore = 5;
        locationMatch = false;
      }
    }
  }

  // Skills scoring
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of job.skills) {
    const sLower = skill.toLowerCase();
    const isMatched = userSkills.some(
      us => us === sLower || us.includes(sLower) || sLower.includes(us)
    );
    if (isMatched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  let skillScore = 0;
  if (userSkills.length === 0) {
    // If user hasn't uploaded a resume or added skills yet, allocate moderate baseline
    skillScore = 20;
  } else if (job.skills.length > 0) {
    const ratio = matchedSkills.length / job.skills.length;
    skillScore = Math.round(ratio * 35);
  } else {
    skillScore = 25;
  }

  // Experience level compatibility
  let expScore = 0;
  let experienceFit = false;
  const expYears = profile?.experienceYears ?? 3;

  if (job.experience_level === 'Entry' && expYears <= 3) {
    expScore = 5;
    experienceFit = true;
  } else if (job.experience_level === 'Mid' && expYears >= 2 && expYears <= 6) {
    expScore = 5;
    experienceFit = true;
  } else if (job.experience_level === 'Senior' && expYears >= 4) {
    expScore = 5;
    experienceFit = true;
  } else if (job.experience_level === 'Lead' && expYears >= 6) {
    expScore = 5;
    experienceFit = true;
  } else {
    expScore = 3;
    experienceFit = false;
  }

  // Calculate total score (clamp between 10 and 99)
  const rawTotal = titleScore + locationScore + skillScore + expScore;
  const score = Math.min(99, Math.max(15, rawTotal));

  let badge: 'Top Match' | 'Strong Match' | 'Good Match' | 'Fair Match' = 'Fair Match';
  let badgeColor: 'emerald' | 'blue' | 'amber' | 'slate' = 'slate';

  if (score >= 85) {
    badge = 'Top Match';
    badgeColor = 'emerald';
  } else if (score >= 70) {
    badge = 'Strong Match';
    badgeColor = 'blue';
  } else if (score >= 50) {
    badge = 'Good Match';
    badgeColor = 'amber';
  } else {
    badge = 'Fair Match';
    badgeColor = 'slate';
  }

  // Generate summary reason
  let summaryReason = '';
  if (userSkills.length > 0 && matchedSkills.length > 0) {
    summaryReason = `Matches ${matchedSkills.length} of ${job.skills.length} required skills (${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? '...' : ''}).`;
    if (locationMatch) {
      summaryReason += ` Aligns with your location preference (${job.is_remote ? 'Remote' : job.location}).`;
    }
  } else if (locationMatch && titleMatch) {
    summaryReason = `Role title and location strongly align with your search criteria. Upload a resume to see direct skill overlap.`;
  } else {
    summaryReason = `Relevant role matching your criteria. Compare your skills with the required stack below.`;
  }

  return {
    score,
    badge,
    badgeColor,
    titleMatch,
    locationMatch,
    matchedSkills,
    missingSkills,
    experienceFit,
    summaryReason
  };
}
