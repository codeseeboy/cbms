const ACTION_VERBS = [
  "achieved","administered","analyzed","built","collaborated","completed","conducted","coordinated","created",
  "delivered","designed","developed","directed","drove","enhanced","established","executed","generated",
  "implemented","improved","increased","initiated","introduced","launched","led","maintained","managed",
  "mentored","negotiated","operated","optimized","organized","oversaw","performed","pioneered","planned",
  "produced","reduced","resolved","revamped","saved","scaled","secured","spearheaded","streamlined",
  "supervised","trained","transformed","upgraded",
];

const POWER_KEYWORDS = [
  "agile","api","automation","budget","client","cloud","collaboration","communication","cross-functional",
  "customer","data","database","deadline","deploy","efficiency","framework","full-stack","growth","impact",
  "integration","kpi","leadership","metric","microservice","milestone","optimization","performance",
  "problem-solving","process","production","project","quality","rest","revenue","roi","scalable",
  "scrum","security","strategy","system","team","testing","user",
];

const QUANTIFIERS_RE = /\d+[\+%]?|\$[\d,]+|[0-9]+(?:x|X)\b/;

exports.calculateATSScore = function (data) {
  const tips = [];
  const breakdown = {};
  let total = 0;

  // 1. Contact Information (15 pts)
  let contactScore = 0;
  const p = data.personalInfo || {};
  if (p.name && p.name.trim().length > 1) contactScore += 3; else tips.push({ section: "Contact", severity: "high", tip: "Add your full name" });
  if (p.email) contactScore += 3; else tips.push({ section: "Contact", severity: "high", tip: "Add your email address" });
  if (p.phone) contactScore += 3; else tips.push({ section: "Contact", severity: "medium", tip: "Add your phone number" });
  if (p.location) contactScore += 2; else tips.push({ section: "Contact", severity: "low", tip: "Add your location (city, country)" });
  if (p.linkedin) contactScore += 2; else tips.push({ section: "Contact", severity: "low", tip: "Add your LinkedIn profile URL" });
  if (p.website) contactScore += 2; else tips.push({ section: "Contact", severity: "low", tip: "Add a portfolio or GitHub link" });
  contactScore = Math.min(contactScore, 15);
  breakdown.contact = { score: contactScore, max: 15, label: "Contact Info" };
  total += contactScore;

  // 2. Professional Summary (12 pts)
  let summaryScore = 0;
  const summary = (data.summary || "").trim();
  if (summary.length > 0) summaryScore += 2;
  if (summary.length >= 50) summaryScore += 3;
  if (summary.length >= 100) summaryScore += 2;
  if (summary.length > 300) { summaryScore -= 1; tips.push({ section: "Summary", severity: "low", tip: "Keep summary under 300 characters for better readability" }); }
  if (!summary) tips.push({ section: "Summary", severity: "high", tip: "Add a professional summary (2-3 sentences)" });

  const summaryLower = summary.toLowerCase();
  const hasActionInSummary = ACTION_VERBS.some((v) => summaryLower.includes(v));
  if (hasActionInSummary) summaryScore += 2;
  const hasKeywordsInSummary = POWER_KEYWORDS.filter((k) => summaryLower.includes(k)).length;
  if (hasKeywordsInSummary >= 2) summaryScore += 2; else if (hasKeywordsInSummary >= 1) summaryScore += 1;
  if (QUANTIFIERS_RE.test(summary)) summaryScore += 1;
  if (summary && !hasActionInSummary) tips.push({ section: "Summary", severity: "medium", tip: "Use action verbs like 'developed', 'led', 'optimized' in your summary" });

  summaryScore = Math.min(summaryScore, 12);
  breakdown.summary = { score: summaryScore, max: 12, label: "Summary" };
  total += summaryScore;

  // 3. Work Experience (25 pts)
  let expScore = 0;
  const exp = data.experience || [];
  if (exp.length >= 1) expScore += 5;
  if (exp.length >= 2) expScore += 3;
  if (exp.length >= 3) expScore += 2;
  if (!exp.length) tips.push({ section: "Experience", severity: "high", tip: "Add at least 2 work experience entries" });
  else if (exp.length < 2) tips.push({ section: "Experience", severity: "medium", tip: "Add more work experience entries (aim for 2-3)" });

  let totalActionVerbs = 0;
  let totalQuantified = 0;
  let descriptionsWithLength = 0;
  for (const e of exp) {
    if (!e.title) tips.push({ section: "Experience", severity: "medium", tip: `Add a job title for "${e.company || "an experience entry"}"` });
    if (!e.company) tips.push({ section: "Experience", severity: "medium", tip: `Add company name for "${e.title || "an experience entry"}"` });
    if (!e.period) tips.push({ section: "Experience", severity: "medium", tip: `Add date range for "${e.title || e.company || "an experience entry"}"` });

    const desc = (e.description || "").toLowerCase();
    if (desc.length >= 30) { descriptionsWithLength++; expScore += 1; }
    if (desc.length >= 80) expScore += 1;

    const verbCount = ACTION_VERBS.filter((v) => desc.includes(v)).length;
    totalActionVerbs += verbCount;
    if (QUANTIFIERS_RE.test(e.description || "")) { totalQuantified++; expScore += 1; }
  }

  if (totalActionVerbs >= 3) expScore += 3; else if (totalActionVerbs >= 1) expScore += 1;
  if (totalQuantified === 0 && exp.length > 0) tips.push({ section: "Experience", severity: "high", tip: "Add measurable achievements with numbers (e.g., 'Increased revenue by 20%')" });
  if (totalActionVerbs < 2 && exp.length > 0) tips.push({ section: "Experience", severity: "medium", tip: "Start bullet points with action verbs (built, led, designed, optimized)" });

  expScore = Math.min(expScore, 25);
  breakdown.experience = { score: expScore, max: 25, label: "Work Experience" };
  total += expScore;

  // 4. Education (10 pts)
  let eduScore = 0;
  const edu = data.education || [];
  if (edu.length >= 1) eduScore += 5;
  if (edu.length >= 1 && edu[0].degree) eduScore += 2;
  if (edu.length >= 1 && edu[0].school) eduScore += 2;
  if (edu.some((e) => e.gpa)) eduScore += 1;
  if (!edu.length) tips.push({ section: "Education", severity: "high", tip: "Add your educational background" });
  else {
    if (!edu[0].degree) tips.push({ section: "Education", severity: "medium", tip: "Specify your degree (e.g., B.Tech in Computer Science)" });
    if (!edu[0].year) tips.push({ section: "Education", severity: "low", tip: "Add graduation year to education" });
  }
  eduScore = Math.min(eduScore, 10);
  breakdown.education = { score: eduScore, max: 10, label: "Education" };
  total += eduScore;

  // 5. Skills (15 pts)
  let skillScore = 0;
  const skills = data.skills || [];
  if (skills.length >= 1) skillScore += 3;
  if (skills.length >= 3) skillScore += 3;
  if (skills.length >= 5) skillScore += 3;
  if (skills.length >= 8) skillScore += 3;
  if (skills.length >= 12) skillScore += 3;
  if (!skills.length) tips.push({ section: "Skills", severity: "high", tip: "Add at least 5-8 relevant technical skills" });
  else if (skills.length < 5) tips.push({ section: "Skills", severity: "medium", tip: `You have ${skills.length} skills. Add more to reach at least 8` });
  skillScore = Math.min(skillScore, 15);
  breakdown.skills = { score: skillScore, max: 15, label: "Skills" };
  total += skillScore;

  // 6. Projects (8 pts)
  let projScore = 0;
  const projects = data.projects || [];
  if (projects.length >= 1) projScore += 3;
  if (projects.length >= 2) projScore += 2;
  if (projects.some((p) => p.tech)) projScore += 1;
  if (projects.some((p) => p.link)) projScore += 1;
  if (projects.some((p) => (p.description || "").length > 20)) projScore += 1;
  if (!projects.length) tips.push({ section: "Projects", severity: "medium", tip: "Add 1-2 projects to showcase your practical skills" });
  projScore = Math.min(projScore, 8);
  breakdown.projects = { score: projScore, max: 8, label: "Projects" };
  total += projScore;

  // 7. Certifications (5 pts)
  let certScore = 0;
  const certs = data.certifications || [];
  if (certs.length >= 1) certScore += 3;
  if (certs.length >= 2) certScore += 2;
  if (!certs.length) tips.push({ section: "Certifications", severity: "low", tip: "Add relevant certifications (AWS, Google, etc.) to stand out" });
  certScore = Math.min(certScore, 5);
  breakdown.certifications = { score: certScore, max: 5, label: "Certifications" };
  total += certScore;

  // 8. Languages (3 pts)
  let langScore = 0;
  const langs = data.languages || [];
  if (langs.length >= 1) langScore += 2;
  if (langs.length >= 2) langScore += 1;
  if (!langs.length) tips.push({ section: "Languages", severity: "low", tip: "Add languages you speak with proficiency levels" });
  langScore = Math.min(langScore, 3);
  breakdown.languages = { score: langScore, max: 3, label: "Languages" };
  total += langScore;

  // 9. Volunteering & Leadership (4 pts)
  let volScore = 0;
  const vol = data.volunteering || [];
  if (vol.length >= 1) volScore += 2;
  if (vol.length >= 2) volScore += 2;
  if (!vol.length) tips.push({ section: "Volunteering", severity: "low", tip: "Add volunteering or leadership roles to show initiative" });
  volScore = Math.min(volScore, 4);
  breakdown.volunteering = { score: volScore, max: 4, label: "Volunteering" };
  total += volScore;

  // 10. Awards & Scholarships (3 pts)
  let awardScore = 0;
  const awards = data.awards || [];
  if (awards.length >= 1) awardScore += 2;
  if (awards.length >= 2) awardScore += 1;
  if (!awards.length) tips.push({ section: "Awards", severity: "low", tip: "Add awards, scholarships, or recognitions you've received" });
  awardScore = Math.min(awardScore, 3);
  breakdown.awards = { score: awardScore, max: 3, label: "Awards" };
  total += awardScore;

  // 11. Achievements (3 pts)
  let achScore = 0;
  const achs = data.achievements || [];
  if (achs.length >= 1) achScore += 2;
  if (achs.length >= 2) achScore += 1;
  achScore = Math.min(achScore, 3);
  breakdown.achievements = { score: achScore, max: 3, label: "Achievements" };
  total += achScore;

  // 12. Formatting & Completeness (4 pts)
  let fmtScore = 0;
  const filledSections = [summary, exp.length, edu.length, skills.length, projects.length, certs.length, vol.length, awards.length].filter(Boolean).length;
  if (filledSections >= 3) fmtScore += 1;
  if (filledSections >= 5) fmtScore += 1;
  if (filledSections >= 6) fmtScore += 1;
  if (filledSections >= 7) fmtScore += 1;
  fmtScore = Math.min(fmtScore, 4);
  breakdown.formatting = { score: fmtScore, max: 4, label: "Completeness" };
  total += fmtScore;

  total = Math.min(total, 100);

  let grade;
  if (total >= 90) grade = "Excellent";
  else if (total >= 75) grade = "Good";
  else if (total >= 55) grade = "Average";
  else if (total >= 35) grade = "Needs Work";
  else grade = "Poor";

  const sortedTips = tips.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return {
    score: total,
    grade,
    breakdown,
    tips: sortedTips.slice(0, 12),
  };
};
