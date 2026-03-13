const crypto = require("crypto");
const uid = () => crypto.randomUUID();

const SECTION_HEADERS = {
  summary:        /^(?:(?:professional\s+)?summary|profile|about\s*me|career\s*objective|objective|overview)\s*:?\s*$/i,
  experience:     /^(?:(?:work|professional|career)\s+)?experience|employment(?:\s+history)?|work\s+history|internships?\s*:?\s*$/i,
  education:      /^(?:education|academic(?:\s+background)?|qualifications?|educational\s+background)\s*:?\s*$/i,
  skills:         /^(?:(?:technical\s+|core\s+|key\s+)?skills|technologies|tech\s+stack|competencies|expertise|areas\s+of\s+expertise|tools?\s*(?:&|and)\s*technologies)\s*:?\s*$/i,
  projects:       /^(?:projects?|personal\s+projects?|key\s+projects?|academic\s+projects?|notable\s+projects?|side\s+projects?)\s*:?\s*$/i,
  certifications: /^(?:certifications?|licenses?(?:\s+(?:&|and)\s+certifications?)?|professional\s+(?:development|training)|courses?(?:\s+(?:&|and)\s+certifications?)?|training)\s*:?\s*$/i,
  languages:      /^(?:languages?|language\s+proficiency|language\s+skills?)\s*:?\s*$/i,
  volunteering:   /^(?:volunteer(?:ing)?(?:\s+(?:&|and)\s+leadership)?|leadership|community\s+(?:service|involvement)|extracurricular(?:\s+activities)?|activities|positions?\s+of\s+responsibility)\s*:?\s*$/i,
  awards:         /^(?:awards?\s*(?:&|and)\s*(?:scholarships?|honors?|recognitions?)|scholarships?|honors?\s*(?:&|and)\s*awards?|awards?|recognitions?)\s*:?\s*$/i,
  publications:   /^(?:publications?|research(?:\s+papers?)?|papers?|published\s+works?)\s*:?\s*$/i,
  achievements:   /^(?:achievements?|accomplishments?|key\s+achievements?)\s*:?\s*$/i,
  hobbies:        /^(?:hobbies|interests|hobbies\s*(?:&|and)\s*interests|personal\s+interests)\s*:?\s*$/i,
  references:     /^(?:references?)\s*:?\s*$/i,
};

function isSectionHeader(line) {
  const cleaned = line.replace(/[:\-–—_]/g, "").trim();
  if (cleaned.length < 2 || cleaned.length > 50) return null;
  for (const [key, pattern] of Object.entries(SECTION_HEADERS)) {
    if (pattern.test(cleaned)) return key;
  }
  return null;
}

function extractContactInfo(text) {
  const emailRe = /[\w.+-]+@[\w.-]+\.\w{2,}/g;
  const phoneRe = /(?:\+\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}|\(\d{3}\)\s*\d{3}[\s-]\d{4}|\+\d{1,3}\s\d{4,5}\s\d{4,5}/g;
  const linkedinRe = /linkedin\.com\/in\/[\w-]+/gi;
  const githubRe = /github\.com\/[\w-]+/gi;
  const websiteRe = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|org|net|io|dev|me|co|in)(?:\/[\w.-]*)?/gi;

  const emails = text.match(emailRe) || [];
  const phones = (text.match(phoneRe) || []).filter((p) => {
    const digits = p.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  });
  const linkedins = text.match(linkedinRe) || [];
  const githubs = text.match(githubRe) || [];

  const allUrls = text.match(websiteRe) || [];
  const websites = allUrls.filter(
    (u) => !u.includes("linkedin.com") && !u.includes("github.com") && !emails.some((e) => u.includes(e.split("@")[1]))
  );

  return {
    email: emails[0] || "",
    phone: phones[0]?.trim() || "",
    linkedin: linkedins[0] || "",
    website: githubs[0] || websites[0] || "",
  };
}

function extractName(lines, contactInfo) {
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i].trim();
    if (!l || l.length < 2) continue;
    if (l.includes("@") || /^\+?\d/.test(l)) continue;
    if (isSectionHeader(l)) continue;
    if (/^(http|www\.|linkedin|github)/i.test(l)) continue;
    if (contactInfo.email && l.includes(contactInfo.email)) continue;
    if (contactInfo.phone && l.includes(contactInfo.phone)) continue;
    if (/[|•·]/.test(l) && l.includes("@")) continue;
    const cleaned = l.replace(/[|•·,]/g, " ").trim();
    const words = cleaned.split(/\s+/);
    if (words.length >= 1 && words.length <= 5 && cleaned.length < 50) {
      if (/^[A-Z]/.test(cleaned) || cleaned === cleaned.toUpperCase()) {
        return cleaned.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }
  }
  return "";
}

function extractLocation(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const cityRe = /\b(Mumbai|Delhi|Bangalore|Bengaluru|Hyderabad|Chennai|Pune|Kolkata|Ahmedabad|Jaipur|Lucknow|Noida|Gurgaon|Gurugram|Indore|Bhopal|Chandigarh|Kochi|New York|San Francisco|London|Berlin|Toronto|Sydney|Singapore|Dubai|Remote)\b/i;
  for (const line of lines.slice(0, 10)) {
    const m = line.match(cityRe);
    if (m) {
      const parts = line.split(/[|•·]+/).map((p) => p.trim());
      for (const part of parts) {
        if (cityRe.test(part) && !part.includes("@") && !/linkedin|github|http/i.test(part)) {
          return part.length < 40 ? part : m[0];
        }
      }
      return m[0];
    }
  }
  return "";
}

function splitIntoSections(lines) {
  const sections = {};
  let current = null;
  let content = [];

  for (const line of lines) {
    const header = isSectionHeader(line);
    if (header) {
      if (current) sections[current] = content;
      current = header;
      content = [];
    } else if (current) {
      content.push(line);
    }
  }
  if (current) sections[current] = content;
  return sections;
}

const DATE_RE = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[\.,]?\s*\d{2,4}|\d{1,2}\/\d{2,4}|\d{4})\s*[\-–—to]+\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[\.,]?\s*\d{2,4}|\d{1,2}\/\d{2,4}|\d{4}|Present|Current|Now|Till\s+Date|Ongoing)/i;

const TITLE_RE = /\b(?:engineer|developer|designer|manager|analyst|consultant|lead|architect|director|intern|coordinator|specialist|associate|executive|administrator|officer|head of|vp|cto|ceo|cfo|programmer|scientist|researcher|trainee|fresher|student)\b/i;

function parseExperience(lines) {
  if (!lines?.length) return [];
  const results = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const dateMatch = line.match(DATE_RE);

    if (dateMatch) {
      if (current) results.push(current);
      current = { id: uid(), title: "", company: "", period: dateMatch[0].trim(), description: "" };

      const rest = line.replace(dateMatch[0], "").replace(/[|,\-–]+$/, "").replace(/^[|,\-–]+/, "").trim();
      if (rest) {
        const parts = rest.split(/\s*[|]\s*/);
        if (parts.length >= 2) {
          if (TITLE_RE.test(parts[0])) { current.title = parts[0].trim(); current.company = parts.slice(1).join(", ").trim(); }
          else { current.company = parts[0].trim(); current.title = parts.slice(1).join(", ").trim(); }
        } else if (TITLE_RE.test(rest)) {
          current.title = rest;
        } else {
          current.company = rest;
        }
      }

      if (i > 0 && !current.title && !current.company) {
        const prevLine = lines[i - 1].trim();
        if (prevLine && !isSectionHeader(prevLine) && prevLine.length < 80) {
          const parts = prevLine.split(/\s*[|]\s*/);
          if (parts.length >= 2) {
            if (TITLE_RE.test(parts[0])) { current.title = parts[0].trim(); current.company = parts.slice(1).join(", ").trim(); }
            else if (TITLE_RE.test(parts[1])) { current.title = parts[1].trim(); current.company = parts[0].trim(); }
            else { current.title = parts[0].trim(); current.company = parts[1].trim(); }
          } else if (TITLE_RE.test(prevLine)) {
            current.title = prevLine;
          } else {
            current.company = prevLine;
          }
        }
      }
    } else if (current) {
      const trimmed = line.trim();
      if (/^[•\-\*▪►→]/.test(trimmed) || (trimmed.length > 15 && /^[A-Z]/.test(trimmed) && current.title)) {
        const desc = trimmed.replace(/^[•\-\*▪►→]\s*/, "");
        if (desc) current.description += (current.description ? "\n" : "") + desc;
      } else if (!current.title && TITLE_RE.test(trimmed) && trimmed.length < 60) {
        const parts = trimmed.split(/\s*[|]\s*/);
        if (parts.length >= 2) {
          if (TITLE_RE.test(parts[0])) { current.title = parts[0].trim(); if (!current.company) current.company = parts[1].trim(); }
          else { current.company = parts[0].trim(); current.title = parts[1].trim(); }
        } else {
          current.title = trimmed;
        }
      } else if (!current.company && !current.title && trimmed.length < 60) {
        const parts = trimmed.split(/\s*[|]\s*/);
        if (parts.length >= 2) {
          current.title = TITLE_RE.test(parts[0]) ? parts[0].trim() : parts[1].trim();
          current.company = TITLE_RE.test(parts[0]) ? parts[1].trim() : parts[0].trim();
        } else if (TITLE_RE.test(trimmed)) {
          current.title = trimmed;
        } else {
          current.company = trimmed;
        }
      } else if (!current.company && trimmed.length < 50 && !/^[•\-\*▪]/.test(trimmed)) {
        current.company = trimmed;
      } else {
        const desc = trimmed.replace(/^[•\-\*▪►→]\s*/, "");
        if (desc) current.description += (current.description ? "\n" : "") + desc;
      }
    } else {
      const parts = line.split(/\s*[|]\s*/);
      if (parts.length >= 2 || TITLE_RE.test(line)) {
        current = { id: uid(), title: "", company: "", period: "", description: "" };
        if (parts.length >= 2) {
          if (TITLE_RE.test(parts[0])) { current.title = parts[0].trim(); current.company = parts.slice(1).join(", ").trim(); }
          else if (TITLE_RE.test(parts[1])) { current.title = parts[1].trim(); current.company = parts[0].trim(); }
          else { current.title = parts[0].trim(); current.company = parts[1].trim(); }
        } else {
          current.title = line.trim();
        }
      }
    }
  }
  if (current && (current.title || current.company)) results.push(current);

  // Deduplicate: if two consecutive entries have the same title+company, merge them
  const deduped = [];
  for (const entry of results) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.title === entry.title && prev.company === entry.company) {
      if (!prev.period && entry.period) prev.period = entry.period;
      if (entry.description) prev.description += (prev.description ? "\n" : "") + entry.description;
    } else if (entry.title || entry.company) {
      deduped.push(entry);
    }
  }

  // Remove entries that have no period and no description (likely false positives)
  return deduped.filter((e) => e.period || e.description);
}

function parseEducation(lines) {
  if (!lines?.length) return [];
  const results = [];
  let current = null;

  const degreeRe = /\b(?:B\.?(?:Tech|Sc|E|A|Com|Ed|Des|Arch)|M\.?(?:Tech|Sc|E|A|Com|Ed|BA|Des)|Ph\.?D|MBA|BCA|MCA|B\.?Eng|M\.?Eng|Bachelor|Master|Diploma|Associate|Doctor|High\s+School|HSC|SSC|CBSE|ICSE|12th|10th|10\+2|Intermediate|Secondary)\b/i;
  const yearRe = /((?:19|20)\d{2})\s*[\-–—to]+\s*((?:19|20)\d{2}|Present)|((?:19|20)\d{2})/gi;
  const gpaRe = /(?:GPA|CGPA|Grade|Percentage|Score)\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+|%)?)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (degreeRe.test(trimmed)) {
      if (current) results.push(current);
      current = { id: uid(), degree: trimmed.replace(gpaRe, "").replace(/[,|]+$/, "").trim(), school: "", year: "", gpa: "" };

      const gm = trimmed.match(gpaRe);
      if (gm) current.gpa = gm[1];

      const ym = [...trimmed.matchAll(/(?:19|20)\d{2}/g)];
      if (ym.length >= 2) current.year = `${ym[0][0]} - ${ym[ym.length - 1][0]}`;
      else if (ym.length === 1) current.year = ym[0][0];
    } else if (current) {
      const gm = trimmed.match(gpaRe);
      if (gm && !current.gpa) current.gpa = gm[1];

      const ym = [...trimmed.matchAll(/(?:19|20)\d{2}/g)];
      if (ym.length >= 2 && !current.year) current.year = `${ym[0][0]} - ${ym[ym.length - 1][0]}`;
      else if (ym.length === 1 && !current.year) current.year = ym[0][0];

      if (!current.school && trimmed.length < 80 && !/^[•\-\*▪]/.test(trimmed)) {
        const school = trimmed
          .replace(gpaRe, "")
          .replace(/(?:19|20)\d{2}\s*[\-–—to]+\s*(?:(?:19|20)\d{2}|Present)/gi, "")
          .replace(/(?:19|20)\d{2}/g, "")
          .replace(/[|,\-–]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (school.length > 2) current.school = school;
      }
    }
  }
  if (current) results.push(current);
  return results.filter((e) => e.degree || e.school);
}

function parseSkills(lines) {
  if (!lines?.length) return [];
  const text = lines.join(" ");
  return [...new Set(
    text.split(/[,;|•·▪►\n]+/)
      .map((s) => s.replace(/^[\s\-\*:]+/, "").trim())
      .filter((s) => s.length >= 2 && s.length <= 35 && !/^\d+$/.test(s) && !/^(and|or|the|with)$/i.test(s))
  )].slice(0, 30);
}

function parseProjects(lines) {
  if (!lines?.length) return [];
  const results = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isBullet = /^[•\-\*▪►→]/.test(trimmed);
    const isUrl = /(?:github|gitlab|bitbucket|herokuapp|vercel|netlify)\.\w+/i.test(trimmed);

    if (!isBullet && !isUrl && trimmed.length < 80 && /^[A-Z]/.test(trimmed)) {
      if (current) results.push(current);
      const dashSplit = trimmed.split(/\s+[\-–—]\s+/);
      current = {
        id: uid(),
        name: dashSplit[0]?.trim() || trimmed,
        tech: dashSplit.slice(1).join(", ").trim(),
        description: "",
        link: "",
      };
    } else if (current) {
      if (isUrl) {
        const urlMatch = trimmed.match(/(?:https?:\/\/)?[\w.-]+\.[\w]+(?:\/[\w.\-/]*)?/i);
        if (urlMatch) current.link = urlMatch[0];
      } else {
        const desc = trimmed.replace(/^[•\-\*▪►→]\s*/, "");
        if (desc.length > 3) current.description += (current.description ? " " : "") + desc;
      }
    }
  }
  if (current) results.push(current);
  return results.filter((p) => p.name);
}

function parseCertifications(lines) {
  if (!lines?.length) return [];
  const results = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.replace(/^[•\-\*▪►→]\s*/, "").trim();
    if (!trimmed || trimmed.length < 3) continue;
    const yearMatch = trimmed.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?(?:20\d{2}|19\d{2})/i);
    const hasYear = !!yearMatch;
    const looksLikeIssuer = hasYear || /^[A-Z][a-z]/.test(trimmed) && trimmed.length < 40 && !trimmed.includes("and") && current && current.name;

    if (current && looksLikeIssuer && !current.issuer) {
      const rest = trimmed.replace(yearMatch?.[0] || "", "").replace(/^[\s|,\-–]+/, "").replace(/[\s|,\-–]+$/, "").trim();
      current.issuer = rest || current.issuer;
      current.year = trimmed.match(/(20\d{2}|19\d{2})/)?.[1] || current.year;
    } else {
      if (current) results.push(current);
      const ym = trimmed.match(/(20\d{2}|19\d{2})/);
      const rest = trimmed.replace(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?(?:20\d{2}|19\d{2})/i, "").trim();
      const parts = rest.split(/\s*[\-–|]\s*/);
      current = {
        id: uid(),
        name: parts[0]?.replace(/[,\s]+$/, "").trim() || rest,
        issuer: parts[1]?.trim() || "",
        year: ym?.[1] || "",
      };
    }
  }
  if (current) results.push(current);
  return results.filter((c) => c.name && c.name.length > 2);
}

function parseLanguages(lines) {
  if (!lines?.length) return [];
  const results = [];
  const profLevels = /\b(native|fluent|proficient|intermediate|basic|beginner|advanced|professional|working|elementary|bilingual|conversational|a1|a2|b1|b2|c1|c2)\b/i;

  for (const line of lines) {
    const trimmed = line.replace(/^[•\-\*▪►→]\s*/, "").trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s*[\-–|:,]+\s*/);
    const lang = parts[0]?.trim();
    const profMatch = trimmed.match(profLevels);
    if (lang && lang.length > 1 && lang.length < 30) {
      results.push({ id: uid(), language: lang, proficiency: profMatch?.[1] || parts[1]?.trim() || "" });
    }
  }
  return results;
}

function parseAchievements(lines) {
  if (!lines?.length) return [];
  return lines
    .map((l) => l.replace(/^[•\-\*▪►→\d.)\]]+\s*/, "").trim())
    .filter((l) => l.length > 5 && l.length < 200);
}

function parseHobbies(lines) {
  if (!lines?.length) return [];
  const text = lines.join(" ");
  return text
    .split(/[,;|•·▪\n]+/)
    .map((s) => s.replace(/^[\s\-\*]+/, "").trim())
    .filter((s) => s.length >= 2 && s.length <= 40);
}

function parseVolunteering(lines) {
  if (!lines?.length) return [];
  const ROLE_RE = /leader|president|head|coordinator|member|volunteer|captain|secretary|treasurer|director|chair|mentor|organizer|ambassador/i;
  const results = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const dateMatch = trimmed.match(DATE_RE);
    const isBullet = /^[•\-\*▪►→]/.test(trimmed);

    if (dateMatch) {
      const rest = trimmed.replace(dateMatch[0], "").replace(/[|,\-–]+$/, "").replace(/^[|,\-–]+/, "").trim();
      if (current && !current.period) {
        current.period = dateMatch[0].trim();
        if (rest) {
          const parts = rest.split(/\s*[|,]\s*/);
          if (parts.length >= 2) { current.organization = current.organization || parts[0]; current.role = current.role || parts[1]; }
          else if (!current.organization) current.organization = rest;
        }
      } else {
        if (current) results.push(current);
        current = { id: uid(), role: "", organization: "", period: dateMatch[0].trim(), description: "" };
        if (rest) {
          const parts = rest.split(/\s*[|,]\s*/);
          if (parts.length >= 2) { current.organization = parts[0]; current.role = parts[1]; }
          else current.organization = rest;
        }
      }
    } else if (current && isBullet) {
      const desc = trimmed.replace(/^[•\-\*▪►→]\s*/, "");
      if (desc) current.description += (current.description ? "\n" : "") + desc;
    } else if (!isBullet && trimmed.length < 80 && /^[A-Z]/.test(trimmed)) {
      const isRole = ROLE_RE.test(trimmed);
      if (current && !current.organization && !isRole) {
        current.organization = trimmed;
      } else if (current && !current.role && isRole) {
        current.role = trimmed;
      } else if (current && !current.role && !isRole && current.organization) {
        current.role = trimmed;
      } else {
        if (current) results.push(current);
        current = { id: uid(), role: isRole ? trimmed : "", organization: isRole ? "" : trimmed, period: "", description: "" };
      }
    } else if (current) {
      const desc = trimmed.replace(/^[•\-\*▪►→]\s*/, "");
      if (desc) current.description += (current.description ? "\n" : "") + desc;
    }
  }
  if (current) results.push(current);

  for (const v of results) {
    if (v.organization && !v.role && ROLE_RE.test(v.organization)) {
      v.role = v.organization; v.organization = "";
    }
  }
  return results.filter((v) => v.role || v.organization);
}

function parseAwards(lines) {
  if (!lines?.length) return [];
  const results = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.replace(/^[•\-\*▪►→\d.)\]]+\s*/, "").trim();
    if (!trimmed || trimmed.length < 3) continue;
    const yearMatch = trimmed.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?(?:20\d{2}|19\d{2})/i);
    const hasYear = !!yearMatch;
    const looksLikeIssuer = (hasYear || (trimmed.length < 40 && /^[A-Z]/.test(trimmed))) && current && current.title && !current.issuer;

    if (current && looksLikeIssuer) {
      const rest = trimmed.replace(yearMatch?.[0] || "", "").replace(/^[\s|,\-–]+/, "").replace(/[\s|,\-–]+$/, "").trim();
      current.issuer = rest || current.issuer;
      current.year = trimmed.match(/(20\d{2}|19\d{2})/)?.[1] || current.year;
    } else {
      if (current) results.push(current);
      const ym = trimmed.match(/(20\d{2}|19\d{2})/);
      const rest = trimmed.replace(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?(?:20\d{2}|19\d{2})/i, "").trim();
      const parts = rest.split(/\s*[\-–|]\s*/);
      current = {
        id: uid(),
        title: parts[0]?.replace(/[,\s]+$/, "").trim() || rest,
        issuer: parts[1]?.trim() || "",
        year: ym?.[1] || "",
      };
    }
  }
  if (current) results.push(current);
  return results.filter((a) => a.title && a.title.length > 2);
}

function parsePublications(lines) {
  if (!lines?.length) return [];
  const results = [];
  for (const line of lines) {
    const trimmed = line.replace(/^[•\-\*▪►→\d.)\]]+\s*/, "").trim();
    if (!trimmed || trimmed.length < 5) continue;
    const yearMatch = trimmed.match(/(20\d{2}|19\d{2})/);
    const urlMatch = trimmed.match(/(?:https?:\/\/)?[\w.-]+\.[\w]+(?:\/[\w.\-/]*)?/i);
    const rest = trimmed.replace(/(20\d{2}|19\d{2})/, "").replace(urlMatch?.[0] || "", "").trim();
    const parts = rest.split(/\s*[\-–|,]\s*/);
    results.push({
      id: uid(),
      title: parts[0]?.trim() || rest,
      publisher: parts[1]?.trim() || "",
      year: yearMatch?.[1] || "",
      link: urlMatch?.[0] || "",
    });
  }
  return results.filter((p) => p.title && p.title.length > 3);
}

exports.parseResumeText = function (text) {
  const rawLines = text.split("\n").map((l) => l.trim());
  const lines = rawLines.filter(Boolean);

  const contactInfo = extractContactInfo(text);
  const name = extractName(lines, contactInfo);
  const location = extractLocation(text);

  const sections = splitIntoSections(lines);

  let summary = "";
  if (sections.summary) {
    summary = sections.summary.join(" ").trim();
    if (summary.length > 500) summary = summary.substring(0, 500);
  }

  if (!summary) {
    const topLines = [];
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const l = lines[i];
      if (isSectionHeader(l)) break;
      if (l.includes("@") || /^\+?\d/.test(l) || l.length < 15) continue;
      if (l === name) continue;
      if (/linkedin|github|www\./i.test(l)) continue;
      if (TITLE_RE.test(l) && l.length < 50) continue;
      if (l.length > 40 && /[a-z]/.test(l)) topLines.push(l);
    }
    if (topLines.length) summary = topLines.join(" ");
  }

  let title = "";
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const l = lines[i];
    if (l === name || l.includes("@") || /^\+?\d/.test(l)) continue;
    if (isSectionHeader(l)) break;
    if (/linkedin|github|www\./i.test(l)) continue;
    if (TITLE_RE.test(l) && l.length < 50) { title = l; break; }
  }

  return {
    personalInfo: { name, email: contactInfo.email, phone: contactInfo.phone, location, linkedin: contactInfo.linkedin, website: contactInfo.website },
    title,
    summary,
    experience: parseExperience(sections.experience),
    education: parseEducation(sections.education),
    skills: parseSkills(sections.skills),
    projects: parseProjects(sections.projects),
    certifications: parseCertifications(sections.certifications),
    languages: parseLanguages(sections.languages),
    volunteering: parseVolunteering(sections.volunteering),
    awards: parseAwards(sections.awards),
    publications: parsePublications(sections.publications),
    achievements: parseAchievements(sections.achievements),
    hobbies: parseHobbies(sections.hobbies),
  };
};
