import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { saveResume, updateUserProfile } from '@/lib/db';

const SAMPLE_TEMPLATES: Record<string, any> = {
  software_engineer: {
    filename: 'sample_fullstack_engineer_resume.pdf',
    original_name: 'Alex_Chen_Senior_Engineer_Resume.pdf',
    file_size: 104857,
    mime_type: 'application/pdf',
    extracted_text: `Alex Chen
Senior Full Stack Engineer
alex.chen.dev@example.com | (415) 555-0192 | San Francisco, CA

SUMMARY
Senior Full Stack Engineer with 6+ years of experience designing and scaling high-performance web applications, developer tooling, and distributed backend services. Proficient in TypeScript, React, Next.js, Node.js, and cloud architectures on AWS.

EXPERIENCE
Staff Software Engineer | Acme Cloud Platform (2022 - Present)
- Architected edge computing microservices reducing latency by 45% for 2M daily active users.
- Built reusable React & TypeScript component libraries adopted across 8 engineering teams.
- Led migration of PostgreSQL database cluster to AWS Aurora with zero downtime.

Senior Full Stack Developer | NextFlow Inc (2019 - 2022)
- Spearheaded frontend architecture using Next.js and Tailwind CSS.
- Designed high-throughput REST and GraphQL APIs using Node.js and Redis.

EDUCATION
B.S. in Computer Science | University of California, Berkeley (2015 - 2019)`,
    parsed_skills: [
      'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'PostgreSQL',
      'Docker', 'AWS', 'Tailwind CSS', 'GraphQL', 'REST APIs', 'System Design',
      'Redis', 'Git', 'CI/CD'
    ],
    parsed_experience: {
      years: 6,
      roles: ['Senior Full Stack Engineer', 'Staff Software Engineer', 'Full Stack Developer'],
      companies: ['Acme Cloud Platform', 'NextFlow Inc']
    },
    parsed_education: {
      degrees: ['Bachelor of Science in Computer Science'],
      schools: ['University of California, Berkeley']
    },
    parsed_summary: 'Senior Full Stack Engineer with 6+ years of experience designing and scaling high-performance web applications, developer tooling, and distributed backend services.',
    headline: 'Senior Full Stack Engineer',
    desired_title: 'Senior Full Stack Engineer',
    desired_location: 'San Francisco, CA'
  },
  product_manager: {
    filename: 'sample_product_manager_resume.pdf',
    original_name: 'Jordan_Taylor_Lead_PM_Resume.pdf',
    file_size: 98304,
    mime_type: 'application/pdf',
    extracted_text: `Jordan Taylor
Lead Product Manager
jordan.taylor@example.com | (212) 555-0148 | New York, NY

SUMMARY
Lead Product Manager with 5+ years driving end-to-end product discovery, roadmap prioritization, and feature launches for enterprise SaaS and developer products.

EXPERIENCE
Lead Product Manager | Pulse Analytics (2021 - Present)
- Defined product roadmap and vision for self-serve analytics suite, generating $8M ARR.
- Led discovery interviews with 60+ enterprise customers to validate pain points.
- Managed 3 agile scrum pods consisting of 14 engineers and 2 product designers.

EDUCATION
B.A. in Economics & Information Systems | New York University`,
    parsed_skills: [
      'Product Management', 'Agile', 'Scrum', 'User Research', 'Figma',
      'Data Analytics', 'Roadmapping', 'Jira', 'UI/UX Design', 'Communication'
    ],
    parsed_experience: {
      years: 5,
      roles: ['Lead Product Manager', 'Product Manager'],
      companies: ['Pulse Analytics']
    },
    parsed_education: {
      degrees: ['Bachelor of Arts in Economics & Information Systems'],
      schools: ['New York University']
    },
    parsed_summary: 'Lead Product Manager with 5+ years driving end-to-end product discovery, roadmap prioritization, and feature launches for enterprise SaaS.',
    headline: 'Lead Product Manager',
    desired_title: 'Product Manager',
    desired_location: 'Remote'
  },
  ai_ml_engineer: {
    filename: 'sample_ai_engineer_resume.pdf',
    original_name: 'Sarah_Vance_AI_Engineer_Resume.pdf',
    file_size: 112640,
    mime_type: 'application/pdf',
    extracted_text: `Sarah Vance
AI / Machine Learning Engineer
sarah.vance@example.com | (512) 555-0182 | Austin, TX

SUMMARY
Machine Learning Engineer specializing in Large Language Models (LLMs), deep learning inference pipelines, and generative AI application systems with Python and PyTorch.

EXPERIENCE
Machine Learning Engineer | NeuralScale AI (2022 - Present)
- Built distributed LLM inference pipeline serving 15,000 requests/min with sub-150ms time-to-first-token.
- Fine-tuned transformer models using LoRA and RLHF on multi-GPU clusters.
- Deployed ML models with Docker and Kubernetes on AWS and GCP.

EDUCATION
M.S. in Computer Science (Machine Learning) | UT Austin`,
    parsed_skills: [
      'Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'LLMs',
      'NLP', 'Docker', 'Kubernetes', 'AWS', 'PostgreSQL', 'System Design'
    ],
    parsed_experience: {
      years: 4,
      roles: ['Machine Learning Engineer', 'AI Research Engineer'],
      companies: ['NeuralScale AI']
    },
    parsed_education: {
      degrees: ['Master of Science in Computer Science (Machine Learning)'],
      schools: ['UT Austin']
    },
    parsed_summary: 'Machine Learning Engineer specializing in Large Language Models (LLMs), deep learning inference pipelines, and generative AI systems with Python and PyTorch.',
    headline: 'Machine Learning & AI Engineer',
    desired_title: 'Machine Learning Engineer',
    desired_location: 'Austin, TX'
  }
};

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    }

    const { template = 'software_engineer' } = await req.json().catch(() => ({ template: 'software_engineer' }));
    const sample = SAMPLE_TEMPLATES[template] || SAMPLE_TEMPLATES.software_engineer;

    const saved = saveResume({
      user_id: user.id,
      filename: sample.filename,
      original_name: sample.original_name,
      file_size: sample.file_size,
      mime_type: sample.mime_type,
      file_path: 'sample_resume.pdf',
      extracted_text: sample.extracted_text,
      parsed_skills: sample.parsed_skills,
      parsed_experience: sample.parsed_experience,
      parsed_education: sample.parsed_education,
      parsed_summary: sample.parsed_summary,
      uploaded_at: new Date().toISOString()
    });

    // Update user profile criteria to match sample
    updateUserProfile(user.id, {
      headline: sample.headline,
      desired_title: sample.desired_title,
      desired_location: sample.desired_location
    });

    return NextResponse.json({
      success: true,
      resume: saved,
      message: `Sample resume (${sample.original_name}) loaded successfully!`
    });
  } catch (err: any) {
    console.error('Load sample resume error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
