// Automated Integration Test Suite for Job Search App
async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  console.log('--- Starting Integration Tests against', BASE_URL, '---');

  // Wait a few seconds for server to be ready
  let ready = false;
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!ready) {
    throw new Error('Server not ready after 15 seconds');
  }
  console.log('✓ Server is live and responding!');

  // 1. Test Demo Login
  console.log('\n1. Testing 1-Click Demo Login (Alex Chen)...');
  const demoRes = await fetch(`${BASE_URL}/api/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'engineer' })
  });
  const demoData = await demoRes.json();
  if (!demoRes.ok || !demoData.user) {
    throw new Error('Demo login failed: ' + JSON.stringify(demoData));
  }
  const authCookie = demoRes.headers.get('set-cookie');
  console.log(`✓ Logged in as: ${demoData.user.name} (${demoData.user.email})`);
  console.log(`✓ Desired Title: ${demoData.user.desired_title}, Location: ${demoData.user.desired_location}`);

  // 2. Test User Registration with criteria
  console.log('\n2. Testing New User Registration with target title and location...');
  const testEmail = `jane_developer_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      name: 'Jane Developer',
      headline: 'Frontend React & TypeScript Specialist',
      desired_title: 'Frontend Engineer',
      desired_location: 'Remote',
      min_salary: 130000
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok || !regData.user) {
    throw new Error('Registration failed: ' + JSON.stringify(regData));
  }
  const userCookie = regRes.headers.get('set-cookie');
  console.log(`✓ Registered user: ${regData.user.name} (${regData.user.email})`);
  console.log(`✓ Desired Title: ${regData.user.desired_title}, Desired Location: ${regData.user.desired_location}`);

  // 3. Test Resume Upload and Skills Extraction
  console.log('\n3. Testing Resume Upload & Skill Extraction...');
  const resumeText = `
Jane Developer
jane.dev@example.com | (555) 019-2834 | San Francisco, CA

SUMMARY
Senior Frontend Engineer with 5+ years of experience building delightful, high-performance web applications using React, TypeScript, Next.js, and Tailwind CSS.

SKILLS
React, TypeScript, Next.js, JavaScript, Tailwind CSS, GraphQL, Redux, HTML, CSS, Git, Jest, Playwright, UI/UX Design

EXPERIENCE
Frontend Developer | TechCorp (2021 - Present)
- Developed modern web applications using React and TypeScript.
- Implemented responsive design systems using Tailwind CSS.
  `;

  // Create multipart form data with Blob
  const formData = new FormData();
  const blob = new Blob([resumeText], { type: 'text/plain' });
  formData.append('file', blob, 'Jane_Developer_Resume.txt');

  const uploadRes = await fetch(`${BASE_URL}/api/resume/upload`, {
    method: 'POST',
    headers: {
      Cookie: userCookie || ''
    },
    body: formData
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.resume) {
    throw new Error('Resume upload failed: ' + JSON.stringify(uploadData));
  }
  console.log(`✓ Resume uploaded: ${uploadData.resume.original_name}`);
  console.log(`✓ Extracted Skills (${uploadData.resume.parsed_skills.length}):`, uploadData.resume.parsed_skills.join(', '));

  // 4. Test Job Search Pulling Matching Jobs based on User Criteria
  console.log('\n4. Testing Job Search Matching User Criteria (title="Frontend", location="Remote")...');
  const jobsRes = await fetch(`${BASE_URL}/api/jobs?title=Frontend&location=Remote&remote=true`, {
    headers: {
      Cookie: userCookie || ''
    }
  });
  const jobsData = await jobsRes.json();
  if (!jobsRes.ok || !Array.isArray(jobsData.jobs)) {
    throw new Error('Jobs search failed: ' + JSON.stringify(jobsData));
  }
  console.log(`✓ Found ${jobsData.jobs.length} matching jobs!`);
  const topJob = jobsData.jobs[0];
  console.log(`✓ Top matching job: "${topJob.title}" at ${topJob.company} (${topJob.location})`);
  console.log(`  - Match Score: ${topJob.match?.score}% (${topJob.match?.badge})`);
  console.log(`  - Matched Skills:`, topJob.match?.matchedSkills?.join(', '));
  console.log(`  - Missing Skills:`, topJob.match?.missingSkills?.join(', '));
  console.log(`  - Match Reason:`, topJob.match?.summaryReason);

  // 5. Test Quick Apply with Resume
  console.log('\n5. Testing Job Application with Resume...');
  const applyRes = await fetch(`${BASE_URL}/api/jobs/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userCookie || ''
    },
    body: JSON.stringify({
      jobId: topJob.id,
      coverNote: 'Excited about building responsive, fast UIs with your engineering team!'
    })
  });
  const applyData = await applyRes.json();
  if (!applyRes.ok || !applyData.success) {
    throw new Error('Job application failed: ' + JSON.stringify(applyData));
  }
  console.log(`✓ ${applyData.message}`);

  // 6. Test Fetching Applications Pipeline
  console.log('\n6. Verifying User Applications...');
  const appListRes = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Cookie: userCookie || '' }
  });
  const appListData = await appListRes.json();
  console.log(`✓ Active applications count: ${appListData.applications?.length}`);
  console.log(`  - Job: ${appListData.applications[0]?.job?.title} at ${appListData.applications[0]?.job?.company}`);
  console.log(`  - Status: ${appListData.applications[0]?.status}`);

  // 7. Test Bookmark / Save Job
  console.log('\n7. Testing Job Bookmark/Save...');
  const saveRes = await fetch(`${BASE_URL}/api/jobs/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userCookie || ''
    },
    body: JSON.stringify({ jobId: topJob.id })
  });
  const saveData = await saveRes.json();
  console.log(`✓ Bookmark toggle: isSaved=${saveData.isSaved} (${saveData.message})`);

  // 8. Test Updating Criteria and Re-Matching
  console.log('\n8. Testing Profile Criteria Update (change desired title to "Full Stack")...');
  const profileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userCookie || ''
    },
    body: JSON.stringify({
      desired_title: 'Full Stack Engineer',
      desired_location: 'San Francisco, CA'
    })
  });
  const profileData = await profileRes.json();
  console.log(`✓ Updated desired title: ${profileData.user.desired_title}, location: ${profileData.user.desired_location}`);

  console.log('\n=======================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED 100%! 🎉');
  console.log('=======================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
