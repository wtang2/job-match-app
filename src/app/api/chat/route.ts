import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getResumeByUserId, getAllJobs, getJobById } from '@/lib/db';
import { JobWithMatch, Job } from '@/lib/types';

interface ChatRequestBody {
  message: string;
  messages?: { role: 'user' | 'assistant'; content: string }[];
  currentJobId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { message = '', messages = [], currentJobId } = body;

    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const user = getCurrentUser(req);
    const resume = user ? getResumeByUserId(user.id) : null;
    const allJobs = getAllJobs({ userId: user?.id });
    const currentJob = currentJobId
      ? allJobs.find(j => j.id === currentJobId) || (getJobById(currentJobId) as JobWithMatch | null)
      : null;

    // Optional LLM integration if GEMINI_API_KEY is available in environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const geminiResult = await callGemini({
          apiKey: geminiApiKey,
          userPrompt: trimmedMsg,
          conversationHistory: messages,
          user,
          resume,
          currentJob,
          allJobs: allJobs.slice(0, 15)
        });

        if (geminiResult) {
          // Identify any recommended jobs mentioned
          const recJobs = extractMatchingJobs(trimmedMsg, allJobs, geminiResult);
          return NextResponse.json({
            reply: geminiResult,
            recommendedJobs: recJobs.length > 0 ? recJobs.slice(0, 3) : undefined,
            suggestedFollowUps: generateFollowUps(trimmedMsg, currentJob, user)
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local intelligence engine:', geminiErr);
      }
    }

    // Built-in intelligent Career Coach & Job Assistant engine
    const response = processLocalChatIntelligence({
      message: trimmedMsg,
      user,
      resume,
      currentJob,
      allJobs
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      {
        reply: "I encountered an error processing your request. Please try again, or ask me about job recommendations, resume advice, or cover letters!",
        error: err.message
      },
      { status: 500 }
    );
  }
}

// Call Google Gemini REST API
async function callGemini(params: {
  apiKey: string;
  userPrompt: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  user: any;
  resume: any;
  currentJob: JobWithMatch | null;
  allJobs: JobWithMatch[];
}): Promise<string | null> {
  const { apiKey, userPrompt, conversationHistory, user, resume, currentJob, allJobs } = params;

  const candidateContext = user
    ? `Candidate Name: ${user.name}
Target Title: ${user.desired_title || 'Software Engineer'}
Target Location: ${user.desired_location || 'Any'}
Desired Job Type: ${user.desired_job_type || 'Full-time'}
Experience: ${resume?.parsed_experience?.years || 3} years
Skills: ${(resume?.parsed_skills || []).join(', ') || 'Not uploaded yet'}`
    : `Candidate: Guest user (no profile yet)`;

  const currentJobContext = currentJob
    ? `Currently Selected Job:
Title: ${currentJob.title} at ${currentJob.company} (${currentJob.location}, ${currentJob.job_type})
Salary: $${currentJob.salary_min.toLocaleString()} - $${currentJob.salary_max.toLocaleString()}
Required Skills: ${currentJob.skills.join(', ')}
Match Score: ${currentJob.match ? currentJob.match.score + '%' : 'N/A'}`
    : `No specific job currently focused.`;

  const availableJobsSummary = allJobs
    .slice(0, 10)
    .map(j => `- "${j.title}" at ${j.company} (${j.location}, ${j.is_remote ? 'Remote' : 'On-site'}) | Salary: $${Math.round(j.salary_min / 1000)}k-$${Math.round(j.salary_max / 1000)}k | Skills: ${j.skills.slice(0, 4).join(', ')}`)
    .join('\n');

  const systemInstruction = `You are JobMatch AI Career Copilot, an expert career advisor, resume coach, and job search strategist.
Help the user land their dream job, optimize their resume, prepare for interviews, analyze match scores, and draft persuasive cover notes.
Always be encouraging, actionable, clear, and professional. Format your answer nicely in markdown with bullet points and bolding.

${candidateContext}

${currentJobContext}

Available Jobs in System:
${availableJobsSummary}

Important Rules:
- When recommending jobs, use the exact job titles and company names from the available list.
- When drafting cover letters, personalize them with the candidate's actual skills and the company's role.
- Emphasize that clicking "Apply" in the app directs them to the company's actual job application site.`;

  const contents = [
    ...conversationHistory.slice(-4).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    {
      role: 'user',
      parts: [{ text: userPrompt }]
    }
  ];

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.warn('Gemini API response error:', res.status, errorText);
    return null;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
}

// Extract matching jobs if mentioned in response
function extractMatchingJobs(query: string, allJobs: JobWithMatch[], answerText: string): JobWithMatch[] {
  const matches: JobWithMatch[] = [];
  const queryLower = query.toLowerCase();
  const answerLower = answerText.toLowerCase();

  for (const job of allJobs) {
    const compLower = job.company.toLowerCase();
    const titleLower = job.title.toLowerCase();
    if (
      (answerLower.includes(compLower) && answerLower.includes(titleLower)) ||
      (queryLower.includes(compLower) && queryLower.includes(titleLower))
    ) {
      if (!matches.some(m => m.id === job.id)) {
        matches.push(job);
      }
    }
  }

  return matches;
}

function generateFollowUps(prompt: string, currentJob: JobWithMatch | null, user: any): string[] {
  const p = prompt.toLowerCase();
  if (p.includes('cover letter')) {
    return [
      `What interview questions might ${currentJob?.company || 'they'} ask?`,
      `How can I tailor my resume for this role?`,
      `Recommend more roles like this`
    ];
  }
  if (p.includes('interview')) {
    return [
      `Give me behavioral questions with STAR examples`,
      `What questions should I ask the hiring manager?`,
      `Salary negotiation tips for this role`
    ];
  }
  return [
    `Recommend top jobs for my background`,
    `Draft cover letter for ${currentJob?.company || 'selected job'}`,
    `How can I improve my match score?`
  ];
}

// Built-in intelligent engine when offline or no API key is provided
function processLocalChatIntelligence(params: {
  message: string;
  user: any;
  resume: any;
  currentJob: JobWithMatch | null;
  allJobs: JobWithMatch[];
}): {
  reply: string;
  recommendedJobs?: JobWithMatch[];
  suggestedFollowUps?: string[];
} {
  const { message, user, resume, currentJob, allJobs } = params;
  const q = message.toLowerCase();
  const userSkills: string[] = (resume?.parsed_skills || []).map((s: string) => s.toLowerCase());
  const userName = user?.name || 'there';

  // 1. RECOMMENDATION / SEARCH INTENT
  if (
    q.includes('recommend') ||
    q.includes('match') ||
    q.includes('find job') ||
    q.includes('jobs for me') ||
    q.includes('suggest') ||
    q.includes('what roles') ||
    q.includes('remote job') ||
    q.includes('highest paying') ||
    q.includes('python') ||
    q.includes('react') ||
    q.includes('full stack') ||
    q.includes('frontend') ||
    q.includes('backend')
  ) {
    let ranked = [...allJobs];

    if (q.includes('remote')) {
      ranked = ranked.filter(j => j.is_remote);
    }
    if (q.includes('high') || q.includes('salary') || q.includes('pay')) {
      ranked.sort((a, b) => b.salary_max - a.salary_max);
    } else if (userSkills.length > 0) {
      ranked.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
    } else {
      ranked.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
    }

    // Filter by tech keyword if present
    const techKeywords = ['react', 'python', 'node', 'typescript', 'aws', 'docker', 'go', 'design', 'figma', 'mobile', 'ios'];
    const matchedTech = techKeywords.filter(k => q.includes(k));
    if (matchedTech.length > 0) {
      const filtered = ranked.filter(j =>
        matchedTech.some(t =>
          j.title.toLowerCase().includes(t) ||
          j.skills.some(s => s.toLowerCase().includes(t)) ||
          j.description.toLowerCase().includes(t)
        )
      );
      if (filtered.length > 0) ranked = filtered;
    }

    const topJobs = ranked.slice(0, 3);

    let reply = `Here are the top roles that best align with your background:\n\n`;

    topJobs.forEach((job, idx) => {
      const scoreText = job.match ? ` **${job.match.score}% match**` : '';
      const salaryText = `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`;
      reply += `${idx + 1}. **${job.title}** at **${job.company}** (${salaryText})${scoreText}\n`;
      reply += `   - **Location**: ${job.location} ${job.is_remote ? '• Remote Friendly' : ''}\n`;
      reply += `   - **Key Stack**: ${job.skills.slice(0, 5).join(', ')}\n`;
      if (job.match?.matchedSkills && job.match.matchedSkills.length > 0) {
        reply += `   - **Matched Skills**: ${job.match.matchedSkills.slice(0, 4).join(', ')}\n`;
      }
      reply += `\n`;
    });

    reply += `💡 *Tip: Click **Apply** on any job card to navigate directly to the actual company application site and automatically save the application to your dashboard tracker!*`;

    return {
      reply,
      recommendedJobs: topJobs,
      suggestedFollowUps: [
        `Draft cover letter for ${topJobs[0]?.company || 'top role'}`,
        `How to improve my score for ${topJobs[0]?.title || 'this role'}?`,
        `Interview questions for ${topJobs[0]?.title || 'engineering'}`
      ]
    };
  }

  // 2. COVER LETTER INTENT
  if (
    q.includes('cover letter') ||
    q.includes('draft') ||
    q.includes('cover note') ||
    q.includes('pitch') ||
    q.includes('outreach')
  ) {
    const targetJob = currentJob || allJobs[0];
    const skillsList = resume?.parsed_skills?.slice(0, 4).join(', ') || 'React, TypeScript, Node.js, and Modern Web Architecture';
    const yearsExp = resume?.parsed_experience?.years || 5;

    const reply = `Here is a tailored, high-conversion cover letter drafted for **${targetJob.title}** at **${targetJob.company}**:

---

**Dear Hiring Team at ${targetJob.company},**

I am writing to express my enthusiastic interest in the **${targetJob.title}** position. Having closely followed ${targetJob.company}'s work in ${targetJob.department}, I am inspired by your team's standard for product engineering and high-throughput reliability.

With over **${yearsExp} years of hands-on experience** developing scalable applications using **${skillsList}**, I am confident in my ability to immediately contribute to your product roadmap. In my recent roles, I have:

- Built and maintained production-grade web systems prioritizing low-latency user experiences and high availability.
- Collaborated closely with cross-functional design and product leads to translate intricate requirements into performant solutions.
- Championed clean code standards, comprehensive automated testing, and agile release velocity.

${targetJob.company}'s mission resonates deeply with my personal engineering principles, and I am particularly excited about tackling challenges around ${targetJob.skills.slice(0, 3).join(' and ')}.

Thank you for your consideration. I look forward to the opportunity to discuss how my background and enthusiasm align with your goals for this role.

Warm regards,  
**${user?.name || 'Alex Chen'}**  
${user?.email || 'alex@example.com'}

---
💡 *You can copy this letter directly, or click **Apply with Note** in the Job Detail panel to attach it before navigating to the official application portal.*`;

    return {
      reply,
      recommendedJobs: [targetJob],
      suggestedFollowUps: [
        `What interview questions might ${targetJob.company} ask?`,
        `What skills am I missing for ${targetJob.company}?`,
        `Recommend more roles like this`
      ]
    };
  }

  // 3. SKILL GAP & MATCH SCORE IMPROVEMENT
  if (
    q.includes('improve') ||
    q.includes('score') ||
    q.includes('skill gap') ||
    q.includes('missing') ||
    q.includes('critique') ||
    q.includes('boost') ||
    q.includes('resume feedback')
  ) {
    const targetJob = currentJob || allJobs[0];
    const missing = targetJob.match?.missingSkills || ['Docker', 'GraphQL', 'System Design'];
    const matched = targetJob.match?.matchedSkills || ['React', 'TypeScript', 'Node.js'];

    let reply = `### 📊 Skill Fit Analysis for **${targetJob.title}** at **${targetJob.company}**\n\n`;
    reply += `Current Match Score: **${targetJob.match?.score || 78}% (${targetJob.match?.badge || 'Strong Match'})**\n\n`;

    reply += `#### ✅ Strong Matched Competencies:\n`;
    matched.forEach(skill => {
      reply += `- **${skill}**: Recognized directly from your candidate profile and resume.\n`;
    });

    reply += `\n#### 🎯 Highest-Impact Growth Skills:\n`;
    missing.slice(0, 4).forEach(skill => {
      reply += `- **${skill}**: Adding practical experience or a project highlighting ${skill} will boost your match score by +8-15%.\n`;
    });

    reply += `\n#### 🚀 Actionable Recommendations:\n`;
    reply += `1. **Add keywords to resume**: Ensure tools like *${missing.slice(0, 2).join(', ')}* appear in your project bullet points if you have used them.\n`;
    reply += `2. **Quantify achievements**: Format your bullet points with measurable impact (e.g., *"Improved page load times by 42% utilizing Next.js SSR"*).\n`;
    reply += `3. **Target Title Alignment**: Set your desired title to *"${targetJob.title}"* in your profile settings to maximize keyword relevancy.\n`;

    return {
      reply,
      recommendedJobs: [targetJob],
      suggestedFollowUps: [
        `Draft cover letter addressing missing skills`,
        `Technical interview prep for ${targetJob.company}`,
        `Find jobs where I have a 90%+ match`
      ]
    };
  }

  // 4. INTERVIEW PREPARATION INTENT
  if (
    q.includes('interview') ||
    q.includes('prep') ||
    q.includes('questions') ||
    q.includes('behavioral') ||
    q.includes('technical question')
  ) {
    const targetJob = currentJob || allJobs[0];
    const tech1 = targetJob.skills[0] || 'React';
    const tech2 = targetJob.skills[1] || 'Node.js';

    const reply = `### 🎯 Interview Preparation Guide for **${targetJob.title}** at **${targetJob.company}**

Here are the most critical questions and focus areas based on the job requirements:

#### 1. Core Technical Questions
- **${tech1} Architecture**: *"How would you architect a state management and data caching strategy for a high-traffic collaborative application?"*
  - *What to highlight*: Optimistic UI updates, caching layers (React Query/SWR), and performance profiling.
- **${tech2} & Microservices**: *"Explain how you handle failure resilience, idempotency, and rate limiting in production APIs."*
  - *What to highlight*: Distributed locking (Redis), database indexing, and retry mechanisms with exponential backoff.
- **System Design**: *"Walk through the design of an analytics ingestion pipeline handling 50,000 requests per second."*
  - *What to highlight*: Message queues (Kafka/SQS), horizontal scaling, and eventual consistency.

#### 2. Behavioral Questions (STAR Framework)
- *"Describe a situation where you had to debug a critical production incident under high pressure."*
  - **Situation & Task**: Briefly set the context and your responsibility.
  - **Action**: Explain your systematic troubleshooting methodology without assigning blame.
  - **Result**: Quantify downtime reduction and post-mortem preventative measures implemented.
- *"Tell me about a time you disagreed with a product specification or technical decision."*
  - Highlight constructive communication, user-centric tradeoffs, and commitment to the team's shared outcome.

💡 *Would you like me to simulate an answer to any of these questions or draft follow-up questions to ask the interviewer?*`;

    return {
      reply,
      recommendedJobs: [targetJob],
      suggestedFollowUps: [
        `What questions should I ask the interviewer at ${targetJob.company}?`,
        `Draft a 60-second elevator pitch for myself`,
        `Salary negotiation tips for this role`
      ]
    };
  }

  // 5. SALARY & COMPENSATION INTENT
  if (
    q.includes('salary') ||
    q.includes('compensation') ||
    q.includes('pay') ||
    q.includes('negotiate') ||
    q.includes('offer')
  ) {
    const targetJob = currentJob || allJobs[0];
    const minK = Math.round(targetJob.salary_min / 1000);
    const maxK = Math.round(targetJob.salary_max / 1000);
    const midK = Math.round((minK + maxK) / 2);

    const reply = `### 💰 Salary & Compensation Insights for **${targetJob.title}**

- **Posted Range**: **$${minK}k - $${maxK}k / year** (${targetJob.currency})
- **Market Midpoint**: **~$${midK}k**
- **Location Baseline**: ${targetJob.location} ${targetJob.is_remote ? '(Remote flexibility)' : ''}

#### 💡 Negotiation Strategy & Tips:
1. **Anchor near the upper tier**: If your resume match is Strong or Top Match (75%+), target **$${Math.round(minK + (maxK - minK) * 0.75)}k - $${maxK}k**.
2. **Evaluate total rewards**: Look beyond base pay—evaluate equity grants (options/RSUs), health benefits, 401(k) matching, and annual bonus structures.
3. **Use competitive leverage**: If you are interviewing across multiple companies (e.g. ${allJobs.slice(0, 2).map(j => j.company).join(' and ')}), mention that you have active interview loops to accelerate timeline and offer strength.`;

    return {
      reply,
      recommendedJobs: [targetJob],
      suggestedFollowUps: [
        `Draft a polite salary negotiation email`,
        `Recommend other high-paying roles ($180k+)`,
        `Draft cover letter for ${targetJob.company}`
      ]
    };
  }

  // 6. DEFAULT / GREETING & GENERAL CAREER COACHING
  const reply = `Hello ${userName}! 👋 I'm your **JobMatch AI Career Copilot**.

I'm here to help you navigate your job search, optimize your profile, and land your next role. Here is what we can do together:

- 🎯 **Job Recommendations**: Ask me *"Recommend top roles for me"* to surface positions that match your specific skillset and preferred salary.
- 📝 **Custom Cover Letters**: Select any job and ask me *"Draft a cover letter for Stripe"* or *"Write an elevator pitch"*.
- 🔍 **Skill Gap Analysis**: Ask *"How can I improve my match score?"* to see what skills would boost your candidacy.
- 🎤 **Interview Coaching**: Ask *"Give me interview questions for Senior Full Stack Engineer"*.
- 🚀 **Direct Application**: When you find a job you love, click **Apply on Company Site** to go straight to the official portal while tracking your application here!

What would you like to explore today?`;

  const top3 = allJobs.slice(0, 3);

  return {
    reply,
    recommendedJobs: top3,
    suggestedFollowUps: [
      '🎯 Recommend top jobs for my profile',
      '📝 Draft cover letter for selected job',
      '💡 How can I improve my match score?',
      '🎤 Give me technical interview questions'
    ]
  };
}
