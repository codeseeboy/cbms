const ACTION_VERBS = [
  "achieved","analyzed","built","collaborated","created","delivered","designed","developed",
  "directed","enhanced","established","executed","implemented","improved","increased",
  "initiated","launched","led","managed","mentored","optimized","organized","performed",
  "planned","produced","reduced","resolved","scaled","secured","spearheaded","streamlined",
  "supervised","trained","transformed","upgraded",
];

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9#+.\-\/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function nGrams(tokens, n) {
  const grams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(" "));
  }
  return grams;
}

function extractKeywords(text) {
  const tokens = tokenize(text);
  const unigrams = new Set(tokens);
  const bigrams = new Set(nGrams(tokens, 2));
  const trigrams = new Set(nGrams(tokens, 3));
  return { unigrams, bigrams, trigrams, tokens };
}

function buildResumeText(resume) {
  const parts = [];
  const p = resume.personalInfo || {};
  if (p.name) parts.push(p.name);
  if (resume.summary) parts.push(resume.summary);
  for (const e of resume.experience || []) {
    parts.push(`${e.title} ${e.company} ${e.description}`);
  }
  for (const e of resume.education || []) {
    parts.push(`${e.degree} ${e.school}`);
  }
  parts.push((resume.skills || []).join(" "));
  for (const p of resume.projects || []) {
    parts.push(`${p.name} ${p.tech} ${p.description}`);
  }
  for (const c of resume.certifications || []) {
    parts.push(`${c.name} ${c.issuer}`);
  }
  for (const v of resume.volunteering || []) {
    parts.push(`${v.role} ${v.organization} ${v.description}`);
  }
  for (const a of resume.awards || []) {
    parts.push(`${a.title} ${a.issuer}`);
  }
  parts.push((resume.achievements || []).join(" "));
  return parts.join(" ");
}

exports.matchResumeToJob = function (resume, jobDescription) {
  const tips = [];
  const breakdown = {};
  let total = 0;

  const resumeText = buildResumeText(resume);
  const resumeKW = extractKeywords(resumeText);
  const jobKW = extractKeywords(jobDescription);

  const resumeSkills = new Set((resume.skills || []).map((s) => s.toLowerCase().trim()));

  // 1. Skills Match (30 pts)
  const skillTokens = tokenize(jobDescription);
  const techTerms = new Set();
  const TECH_RE = /^(?:react|angular|vue|node\.?js|python|java|javascript|typescript|c\+\+|c#|ruby|go|rust|swift|kotlin|php|sql|nosql|mongodb|postgres|mysql|redis|docker|kubernetes|aws|azure|gcp|git|linux|html|css|sass|graphql|rest|api|ci\/cd|jenkins|terraform|ansible|figma|jira|agile|scrum|devops|machine\s?learning|deep\s?learning|ai|ml|nlp|tensorflow|pytorch|pandas|numpy|flask|django|spring|express|next\.?js|tailwind|bootstrap|webpack|vite|docker|microservices?|serverless)$/i;

  for (const t of skillTokens) {
    if (TECH_RE.test(t)) techTerms.add(t);
  }
  for (const bg of nGrams(skillTokens, 2)) {
    if (TECH_RE.test(bg.replace(/\s/g, ""))) techTerms.add(bg);
  }

  let skillMatched = 0;
  const matchedSkills = [];
  const missingSkills = [];

  for (const tech of techTerms) {
    const normalized = tech.toLowerCase();
    if (resumeSkills.has(normalized) || resumeKW.unigrams.has(normalized) || resumeKW.bigrams.has(normalized)) {
      skillMatched++;
      matchedSkills.push(tech);
    } else {
      missingSkills.push(tech);
    }
  }

  let skillScore = 0;
  if (techTerms.size > 0) {
    skillScore = Math.round((skillMatched / techTerms.size) * 30);
  } else {
    const commonSkills = [...resumeSkills].filter((s) => jobKW.unigrams.has(s)).length;
    skillScore = Math.min(commonSkills * 5, 30);
  }
  skillScore = Math.min(skillScore, 30);
  breakdown.skills = { score: skillScore, max: 30, label: "Skills Match", matched: matchedSkills, missing: missingSkills };
  total += skillScore;

  if (missingSkills.length > 0) {
    tips.push({ severity: "high", section: "Skills", tip: `Missing key skills: ${missingSkills.slice(0, 5).join(", ")}` });
  }
  if (skillMatched === 0 && techTerms.size > 0) {
    tips.push({ severity: "high", section: "Skills", tip: "Your resume doesn't match any technical skills from the job description" });
  }

  // 2. Experience Relevance (25 pts)
  let expScore = 0;
  const expText = (resume.experience || []).map((e) => `${e.title} ${e.company} ${e.description}`).join(" ").toLowerCase();
  const jobTokens = [...jobKW.unigrams];
  const STOP_WORDS_EXP = new Set(["the","and","for","are","but","not","you","all","can","had","was","one","our","has","its","let","may","who","use","how","will","with","this","that","from","they","been","have","said","each","which","their","time","very","when","come","could","made","like","look","many","some","then","them","these","than","been","would","make","just","over","such","take","year","into","most","also","about","know","back","only","work","other","give","well","much","should","than","through"]);
  const meaningfulExpTokens = jobTokens.filter((t) => !STOP_WORDS_EXP.has(t) && t.length > 2);
  const expOverlap = meaningfulExpTokens.filter((t) => expText.includes(t)).length;
  const expRatio = meaningfulExpTokens.length > 0 ? expOverlap / Math.min(meaningfulExpTokens.length, 35) : 0;
  expScore = Math.round(expRatio * 25);

  const expEntries = resume.experience || [];
  if (expEntries.length >= 2) expScore = Math.min(expScore + 3, 25);
  if (expEntries.some((e) => (e.description || "").length > 50)) expScore = Math.min(expScore + 2, 25);

  const hasQuantified = expEntries.some((e) => /\d+[\+%]|\$[\d,]+/.test(e.description || ""));
  if (hasQuantified) expScore = Math.min(expScore + 2, 25);
  else tips.push({ severity: "medium", section: "Experience", tip: "Add quantifiable metrics to your experience (e.g., 'Increased revenue by 20%')" });

  expScore = Math.min(expScore, 25);
  breakdown.experience = { score: expScore, max: 25, label: "Experience Relevance" };
  total += expScore;

  if (expEntries.length === 0) tips.push({ severity: "high", section: "Experience", tip: "Add work experience to improve your match score" });

  // 3. Keyword Overlap (20 pts)
  let kwScore = 0;
  const STOP_WORDS = new Set(["the","and","for","are","but","not","you","all","can","had","her","was","one","our","out","has","its","let","may","who","use","how","will","with","this","that","from","they","been","have","said","each","which","their","time","very","when","come","could","made","like","long","look","many","some","then","them","these","than","first","been","would","make","just","over","such","take","year","into","most","also","about","know","back","only","work","other","give","well","much","before","because","same","through","should","after","still","under","last","never","any","between","both","own","does","must","while","being","during","without","within"]);
  const meaningfulJobTokens = jobTokens.filter((t) => !STOP_WORDS.has(t) && t.length > 3);
  const resumeTokenSet = resumeKW.unigrams;
  const kwOverlap = meaningfulJobTokens.filter((t) => resumeTokenSet.has(t)).length;
  const kwRatio = meaningfulJobTokens.length > 0 ? kwOverlap / Math.min(meaningfulJobTokens.length, 40) : 0;
  kwScore = Math.round(kwRatio * 20);
  kwScore = Math.min(kwScore, 20);
  breakdown.keywords = { score: kwScore, max: 20, label: "Keyword Match" };
  total += kwScore;

  if (kwRatio < 0.3) tips.push({ severity: "medium", section: "Keywords", tip: "Tailor your resume summary and experience to include more keywords from the job description" });

  // 4. Education & Certifications (10 pts)
  let eduScore = 0;
  const eduText = (resume.education || []).map((e) => `${e.degree} ${e.school}`).join(" ").toLowerCase();
  const certText = (resume.certifications || []).map((c) => `${c.name} ${c.issuer}`).join(" ").toLowerCase();
  const combinedEdu = eduText + " " + certText;

  if ((resume.education || []).length > 0) eduScore += 4;
  if ((resume.certifications || []).length > 0) eduScore += 3;
  const eduOverlap = meaningfulJobTokens.filter((t) => combinedEdu.includes(t)).length;
  if (eduOverlap >= 2) eduScore += 3;
  else if (eduOverlap >= 1) eduScore += 1;

  eduScore = Math.min(eduScore, 10);
  breakdown.education = { score: eduScore, max: 10, label: "Education & Certs" };
  total += eduScore;

  // 5. Title Match (10 pts)
  let titleScore = 0;
  const jobTitleWords = tokenize(jobDescription.split(/\n/)[0] || "").filter((t) => !STOP_WORDS.has(t));
  const resumeTitles = (resume.experience || []).map((e) => tokenize(e.title)).flat();
  const titleOverlap = jobTitleWords.filter((t) => resumeTitles.includes(t)).length;
  if (titleOverlap >= 2) titleScore = 10;
  else if (titleOverlap >= 1) titleScore = 6;
  else {
    const anyTitleInResume = jobTitleWords.some((t) => resumeKW.unigrams.has(t));
    if (anyTitleInResume) titleScore = 3;
  }
  titleScore = Math.min(titleScore, 10);
  breakdown.title = { score: titleScore, max: 10, label: "Title Relevance" };
  total += titleScore;

  if (titleScore < 5) tips.push({ severity: "low", section: "Title", tip: "Consider adjusting your experience titles to better align with the job title" });

  // 6. Overall Profile (5 pts)
  let profileScore = 0;
  if (resume.summary && resume.summary.length > 30) profileScore += 2;
  if ((resume.projects || []).length > 0) profileScore += 1;
  if ((resume.volunteering || []).length > 0) profileScore += 1;
  if ((resume.awards || []).length > 0) profileScore += 1;
  profileScore = Math.min(profileScore, 5);
  breakdown.profile = { score: profileScore, max: 5, label: "Profile Strength" };
  total += profileScore;

  total = Math.min(total, 100);

  let grade;
  if (total >= 85) grade = "Excellent Match";
  else if (total >= 70) grade = "Strong Match";
  else if (total >= 55) grade = "Good Match";
  else if (total >= 40) grade = "Partial Match";
  else grade = "Low Match";

  const sortedTips = tips.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return {
    score: total,
    grade,
    breakdown,
    tips: sortedTips.slice(0, 10),
    matchedSkills,
    missingSkills: missingSkills.slice(0, 10),
  };
};

exports.generateSuggestedJobs = function (resume) {
  const skills = (resume.skills || []).map((s) => s.toLowerCase());
  const titles = (resume.experience || []).map((e) => (e.title || "").toLowerCase());
  const summary = (resume.summary || "").toLowerCase();

  const JOB_TEMPLATES = [
    { title: "Frontend Developer", company: "TechCorp", skills: ["react", "javascript", "typescript", "html", "css", "tailwind", "next.js", "vue", "angular"], type: "Full-time", salary: "$80K - $120K" },
    { title: "Backend Developer", company: "DataSystems", skills: ["node.js", "python", "java", "sql", "mongodb", "express", "django", "spring", "api", "rest"], type: "Full-time", salary: "$85K - $130K" },
    { title: "Full Stack Developer", company: "InnovateTech", skills: ["react", "node.js", "typescript", "mongodb", "express", "next.js", "python", "sql"], type: "Full-time", salary: "$90K - $140K" },
    { title: "DevOps Engineer", company: "CloudFirst", skills: ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux", "jenkins", "ansible"], type: "Full-time", salary: "$95K - $145K" },
    { title: "Data Scientist", company: "AnalyticsPro", skills: ["python", "machine learning", "tensorflow", "pandas", "numpy", "sql", "deep learning", "nlp"], type: "Full-time", salary: "$100K - $150K" },
    { title: "Mobile Developer", company: "AppWorks", skills: ["react native", "swift", "kotlin", "flutter", "javascript", "typescript", "ios", "android"], type: "Full-time", salary: "$85K - $125K" },
    { title: "UI/UX Designer", company: "DesignHub", skills: ["figma", "sketch", "adobe", "css", "html", "prototype", "wireframe", "user research"], type: "Full-time", salary: "$70K - $110K" },
    { title: "Cloud Architect", company: "SkyScale", skills: ["aws", "azure", "gcp", "terraform", "kubernetes", "microservices", "serverless", "docker"], type: "Full-time", salary: "$120K - $180K" },
    { title: "Software Engineer", company: "BuildRight", skills: ["java", "python", "c++", "algorithms", "data structures", "system design", "git"], type: "Full-time", salary: "$90K - $150K" },
    { title: "ML Engineer", company: "AILabs", skills: ["python", "pytorch", "tensorflow", "machine learning", "deep learning", "mlops", "docker"], type: "Full-time", salary: "$110K - $170K" },
    { title: "QA Engineer", company: "QualityFirst", skills: ["selenium", "testing", "automation", "python", "javascript", "cypress", "jest"], type: "Full-time", salary: "$70K - $100K" },
    { title: "Product Manager", company: "ProductVision", skills: ["agile", "scrum", "jira", "analytics", "strategy", "roadmap", "communication"], type: "Full-time", salary: "$100K - $160K" },
  ];

  const scored = JOB_TEMPLATES.map((job) => {
    let matchScore = 0;
    const matched = [];
    for (const s of job.skills) {
      if (skills.some((rs) => rs.includes(s) || s.includes(rs))) { matchScore += 12; matched.push(s); }
      else if (summary.includes(s)) { matchScore += 5; matched.push(s); }
    }
    for (const t of titles) {
      const titleWords = t.split(/\s+/);
      const jobTitleWords = job.title.toLowerCase().split(/\s+/);
      if (jobTitleWords.some((w) => titleWords.includes(w))) matchScore += 15;
    }
    return { ...job, matchScore: Math.min(matchScore, 100), matchedSkills: matched };
  });

  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .filter((j) => j.matchScore > 15)
    .slice(0, 6)
    .map((j, i) => ({
      id: `suggested-${i}`,
      title: j.title,
      company: j.company,
      match: j.matchScore,
      type: j.type,
      salary: j.salary,
      matchedSkills: j.matchedSkills,
    }));
};
