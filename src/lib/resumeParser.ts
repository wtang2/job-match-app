export interface ExtractedResume {
  rawText: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills: string[];
  experience: {
    years?: number;
    roles?: string[];
    companies?: string[];
  };
  education: {
    degrees?: string[];
    schools?: string[];
  };
  summary?: string;
}

const COMMON_SKILLS = [
  // Languages
  'Python', 'TypeScript', 'JavaScript', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP',
  'Swift', 'Kotlin', 'SQL', 'R', 'Bash', 'Scala',
  // Frontend
  'React', 'Next.js', 'Angular', 'Vue', 'Tailwind CSS', 'HTML5', 'HTML', 'CSS3', 'CSS',
  'Sass', 'SASS', 'Redux', 'D3.js', 'WebSockets', 'Responsive Web Design', 'amCharts',
  // Backend & APIs
  'Node.js', 'Express', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'GraphQL', 'REST APIs',
  'Microservices', 'Distributed Systems', 'GWT',
  // Cloud & DevOps
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Git', 'GitHub',
  'GitHub Actions', 'CI/CD', 'Jenkins', 'Splunk', 'Nginx', 'Ansible',
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'DynamoDB', 'Cassandra', 'Oracle',
  'Relational Database Design',
  // AI & Data Science
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'LLMs',
  'LangChain', 'RAG', 'MCP', 'Prompt Engineering', 'AI-assisted coding', 'Pandas',
  'NumPy', 'Scikit-learn', 'Data Analytics', 'ETL', 'Data Science', 'Data Visualization',
  // Testing & Quality
  'Playwright', 'Jest', 'Cypress', 'Unit Testing', 'Integration Testing', 'Performance Optimization',
  // Design & Architecture
  'Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'Design Systems', 'Frontend Architecture',
  'Component-Based Design', 'System Design', 'Code Reviews',
  // Product & Agile
  'Product Management', 'User Research', 'Agile', 'Scrum', 'Jira', 'SDLC',
  // Security
  'Cybersecurity', 'SIEM', 'Threat Analysis'
];

import { createRequire } from 'node:module';

const requireNode = createRequire(import.meta.url);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function parseResumeBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractedResume> {
  let text = '';
  const ext = filename.toLowerCase().split('.').pop() || '';

  try {
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      try {
        let pdfModule: any = null;
        try {
          pdfModule = requireNode('pdf-parse');
        } catch {
          pdfModule = await import('pdf-parse');
        }

        if (pdfModule && typeof pdfModule.PDFParse === 'function') {
          const parser = new pdfModule.PDFParse({ data: buffer });
          await parser.load();
          const result = await parser.getText();
          text = result.text || '';
        } else if (typeof pdfModule === 'function') {
          const pdfData = await pdfModule(buffer);
          text = pdfData.text || '';
        } else if (pdfModule && typeof pdfModule.default === 'function') {
          const pdfData = await pdfModule.default(buffer);
          text = pdfData.text || '';
        }
      } catch (pdfErr) {
        console.error('PDF parsing error, attempting string fallback:', pdfErr);
      }
    } else if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
      try {
        let mammoth: any = null;
        try {
          mammoth = requireNode('mammoth');
        } catch {
          mammoth = await import('mammoth');
        }
        const extract = mammoth?.extractRawText || mammoth?.default?.extractRawText;
        if (extract) {
          const result = await extract({ buffer });
          text = result.value || '';
        }
      } catch (docErr) {
        console.error('mammoth docx extraction error:', docErr);
      }
    }

    // If text still empty (e.g. text/plain, markdown, or fallback)
    if (!text) {
      text = buffer.toString('utf-8');
    }
  } catch (err) {
    console.error('Error reading resume buffer:', err);
    text = buffer.toString('utf-8');
  }

  // Clean up text: normalize carriage returns, tabs, and page markers
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/\0/g, '');

  // Extract Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = cleanedText.match(emailRegex);
  const email = emailMatch ? emailMatch[1] : undefined;

  // Extract Phone
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = cleanedText.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  // Extract Location (e.g. SF Bay Area, CA or San Francisco, CA)
  let candidateLocation = undefined;
  const locRegex = /(?:[A-Za-z\s]+),\s*(?:[A-Z]{2}|California|New York|Texas|Washington|Illinois|Massachusetts)\b/;
  const locLines = cleanedText.split('\n').slice(0, 5);
  for (const l of locLines) {
    const m = l.match(locRegex);
    if (m && !m[0].includes('@') && !m[0].includes('http')) {
      candidateLocation = m[0].trim();
      break;
    }
  }

  // Extract Candidate Name (first non-empty lines)
  const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let name = undefined;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (
      line.length >= 3 &&
      line.length <= 40 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !line.includes('.com') &&
      !line.includes('Resume') &&
      !line.includes('Curriculum') &&
      !/\d/.test(line) &&
      !/^(SUMMARY|SKILLS|EXPERIENCE|EDUCATION)/i.test(line)
    ) {
      name = line;
      break;
    }
  }

  // -------------------------------------------------------------
  // Extract Skills
  // -------------------------------------------------------------
  const foundSkillsMap = new Map<string, string>(); // lowercase key -> formatted display

  // 1. Parse from dedicated SKILLS section if present
  const skillsSectionMatch = cleanedText.match(
    /(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)[\s\S]*?(?=(?:PROJECTS|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT HISTORY|EDUCATION|$))/i
  );
  if (skillsSectionMatch) {
    const rawBlock = skillsSectionMatch[0].replace(/^(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)[\s:]*/i, '');
    const skillLines = rawBlock.split('\n').map(l => l.trim()).filter(Boolean);

    for (const sLine of skillLines) {
      // If line has category header e.g. "Frontend: Angular, React, HTML5..."
      const content = sLine.includes(':') ? sLine.substring(sLine.indexOf(':') + 1) : sLine;
      const rawTokens = content.split(/[,•|;/]+/).map(s => s.trim()).filter(Boolean);

      for (let token of rawTokens) {
        // Strip trailing parens or notes like (ES2024) or (Pandas, NumPy
        token = token.replace(/\s*\(.*$/g, '').replace(/^[-(]+|[)-]+$/g, '').trim();
        // Skip common stop words or single characters
        if (
          token.length >= 2 &&
          token.length <= 35 &&
          !/^(and|or|the|with|for|tools|knowledge|experience|proficient)$/i.test(token)
        ) {
          foundSkillsMap.set(token.toLowerCase(), token);
        }
      }
    }
  }

  // 2. Comprehensive Dictionary Match across full text
  for (const skill of COMMON_SKILLS) {
    const escaped = escapeRegex(skill);
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#])${escaped}(?:$|[^a-zA-Z0-9#])`, 'i');
    if (regex.test(cleanedText)) {
      foundSkillsMap.set(skill.toLowerCase(), skill);
    }
  }

  // Remove minor noise tokens
  foundSkillsMap.delete('ci');
  foundSkillsMap.delete('cd');
  foundSkillsMap.delete('optimization');

  const skills = Array.from(foundSkillsMap.values());

  // -------------------------------------------------------------
  // Extract Years of Experience and Roles
  // -------------------------------------------------------------
  let years: number | undefined = undefined;

  // Check explicit statement (e.g. "9+ years of experience")
  const yearsRegex = /(\d+)\+?\s*(?:years|yrs)\s*(?:of\s*)?(?:experience|exp)/i;
  const yearsMatch = cleanedText.match(yearsRegex);
  if (yearsMatch) {
    years = parseInt(yearsMatch[1], 10);
  }

  // Find all year occurrences in date ranges
  const dateRangeRegex = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(20\d\d|19\d\d)\s*[-–—to]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(20\d\d|present|current)/gi;
  const dateMatches = Array.from(cleanedText.matchAll(dateRangeRegex));

  if (dateMatches.length > 0) {
    const startYears: number[] = [];
    const endYears: number[] = [];

    for (const match of dateMatches) {
      if (match[1]) startYears.push(parseInt(match[1], 10));
      if (match[2]) {
        if (/pres|curr/i.test(match[2])) {
          endYears.push(new Date().getFullYear());
        } else {
          endYears.push(parseInt(match[2], 10));
        }
      }
    }

    if (startYears.length > 0) {
      const minStart = Math.min(...startYears);
      const maxEnd = endYears.length > 0 ? Math.max(...endYears) : new Date().getFullYear();
      const calculatedYears = Math.max(1, maxEnd - minStart);
      if (!years || calculatedYears > years) {
        years = calculatedYears;
      }
    }
  }

  // Extract detected roles
  const rolesRegex = /(?:Principal|Senior|Lead|Staff|Associate|Junior|Chief|Head|Contractor)?\s*(?:Software Engineer|Full Stack Web Application Engineer|Full Stack Engineer|Full Stack Developer|Frontend Engineer|Backend Engineer|App Developer|Web Developer|Data Visualization Web Developer|Data Scientist|Data Engineer|Solutions Architect|Engineering Manager|Product Manager|Product Designer|UI\/UX Designer|QA Engineer)/gi;
  const matchedRoles = Array.from(cleanedText.matchAll(rolesRegex))
    .map(m => m[0].replace(/[\r\n\t]+/g, ' ').trim())
    .filter(r => r.length > 5 && !/^(Software Engineer|Developer)$/i.test(r) || r.split(' ').length >= 2);

  // Deduplicate roles preserving case
  const rolesFound = Array.from(new Set(matchedRoles));

  // Extract detected companies
  const companyRegex = /(?:Dell Technologies|Support\.com|HyperNova|Automatic Data Processing|ADP|Sqor Sports|Google|Apple|Meta|Amazon|Microsoft|Netflix|Stripe|Airbnb|Vercel|Figma|Linear|Datadog|OpenAI|Spotify|Coinbase|Shopify|Anthropic|HubSpot|Pinterest|Notion|MongoDB)/gi;
  const matchedCompanies = Array.from(cleanedText.matchAll(companyRegex)).map(m => m[0].trim());
  const companiesFound = Array.from(new Set(matchedCompanies));

  // -------------------------------------------------------------
  // Extract Education
  // -------------------------------------------------------------
  const educationDegrees: string[] = [];

  // 1. Look for explicit EDUCATION section
  const eduSectionMatch = cleanedText.match(
    /EDUCATION[\s\S]*?(?=(?:CERTIFICATIONS|PROJECTS|SKILLS|WORK EXPERIENCE|EXPERIENCE|PUBLICATIONS|LANGUAGES|$|\n\s*\n\s*\n))/i
  );

  if (eduSectionMatch) {
    const eduBlock = eduSectionMatch[0].replace(/^EDUCATION[\s:]*/i, '');
    const eduLines = eduBlock
      .split('\n')
      .map(l => l.replace(/[\t\r]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(l => l.length > 5 && !/^--\s*\d+\s*of\s*\d+\s*--$/i.test(l) && !/^EDUCATION$/i.test(l));

    for (const el of eduLines) {
      if (
        /M\.?S\.?|B\.?S\.?|B\.?A\.?|M\.?A\.?|Ph\.?D\.?|Bachelor|Master|Doctor|Certificate|Degree|University|College|School|Extension/i.test(el)
      ) {
        educationDegrees.push(el);
      }
    }
  }

  // 2. Fallback if section wasn't formatted standardly
  if (educationDegrees.length === 0) {
    const fallbackEduRegex = /(?:(?:Bachelor|Master|Doctor|Certificate|B\.?S\.?|M\.?S\.?|Ph\.?D\.?|B\.?A\.?|M\.?A\.?)[^,\n]+(?:,\s*[^,\n]+|\s+in\s+[^,\n]+)?(?:\s+(?:at|from)?\s+[A-Z][a-zA-Z\s]+(?:University|College|Institute|School))?)/gi;
    const fallbackMatches = Array.from(cleanedText.matchAll(fallbackEduRegex)).map(m => m[0].trim());
    fallbackMatches.forEach(fm => {
      if (fm.length > 8 && !educationDegrees.includes(fm)) {
        educationDegrees.push(fm);
      }
    });
  }

  // -------------------------------------------------------------
  // Extract Professional Summary
  // -------------------------------------------------------------
  let summary = '';
  const summaryMatch = cleanedText.match(
    /(?:PROFESSIONAL SUMMARY|SUMMARY|ABOUT ME|OBJECTIVE)[\s:]*([\s\S]{80,1200}?)(?=(?:\n[A-Z\s]{4,}|\n\n\n|SKILLS|WORK EXPERIENCE|EXPERIENCE|PROJECTS|EDUCATION|$))/i
  );

  if (summaryMatch && summaryMatch[1]) {
    summary = summaryMatch[1].replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  } else if (lines.length > 3) {
    // Take first descriptive paragraph after header
    const candidates = lines.slice(1, 8).filter(l => l.length > 60);
    if (candidates.length > 0) {
      summary = candidates[0];
    }
  }

  return {
    rawText: cleanedText,
    name: name || 'Candidate',
    email,
    phone,
    location: candidateLocation,
    skills,
    experience: {
      years: years || (rolesFound.length > 0 ? 4 : 2),
      roles: rolesFound,
      companies: companiesFound
    },
    education: {
      degrees: educationDegrees
    },
    summary: summary || undefined
  };
}
