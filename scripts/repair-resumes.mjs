import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { parseResumeBuffer } from '../src/lib/resumeParser.ts';

async function repair() {
  const db = new DatabaseSync('data/jobsearch.db');
  const resumes = db.prepare('SELECT * FROM resumes').all();
  console.log('Found', resumes.length, 'resumes in database.');

  for (const r of resumes) {
    if (fs.existsSync(r.file_path)) {
      console.log('Re-parsing file:', r.file_path);
      const buf = fs.readFileSync(r.file_path);
      const parsed = await parseResumeBuffer(buf, r.original_name, r.mime_type);
      console.log(`✓ Resume for user ${r.user_id}:`);
      console.log(`  - Candidate Name: ${parsed.name}`);
      console.log(`  - Skills count: ${parsed.skills.length}`);
      console.log(`  - Experience years: ${parsed.experience?.years}`);
      console.log(`  - Roles: ${parsed.experience?.roles?.slice(0, 3).join(', ')}`);
      console.log(`  - Education degrees:`, parsed.education?.degrees);

      const updateStmt = db.prepare(`
        UPDATE resumes SET
          extracted_text = ?,
          parsed_skills = ?,
          parsed_experience = ?,
          parsed_education = ?,
          parsed_summary = ?
        WHERE id = ?
      `);

      updateStmt.run(
        parsed.rawText.slice(0, 10000),
        JSON.stringify(parsed.skills),
        JSON.stringify(parsed.experience),
        JSON.stringify(parsed.education),
        parsed.summary || null,
        r.id
      );

      // Update user name and headline if user has empty name
      if (parsed.name && parsed.name !== 'Candidate') {
        db.prepare("UPDATE users SET name = ? WHERE id = ? AND (name IS NULL OR name = '')").run(parsed.name, r.user_id);
      }
      if (parsed.experience.roles?.[0]) {
        db.prepare("UPDATE users SET headline = ? WHERE id = ? AND (headline IS NULL OR headline = '')").run(parsed.experience.roles[0], r.user_id);
      }
      if (parsed.location) {
        db.prepare("UPDATE users SET location = ? WHERE id = ? AND (location IS NULL OR location = '')").run(parsed.location, r.user_id);
      }
      console.log('✓ Successfully repaired resume id:', r.id);
    }
  }
  console.log('\nAll resumes updated with extracted skills, education, and experience!');
}

repair().catch(console.error);
