function esc(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderExperience(exp) {
  if (!exp?.length) return "";
  return exp
    .map(
      (e) => `<div class="item">
      <div class="row"><span class="bold">${esc(e.title)}</span><span class="muted">${esc(e.period)}</span></div>
      <div class="sub">${esc(e.company)}</div>
      ${e.description ? `<div class="desc">${esc(e.description)}</div>` : ""}
    </div>`
    )
    .join("");
}

function renderEducation(edu) {
  if (!edu?.length) return "";
  return edu
    .map(
      (e) => `<div class="item">
      <div class="row"><span class="bold">${esc(e.degree)}</span><span class="muted">${esc(e.year)}</span></div>
      <div class="sub">${esc(e.school)}${e.gpa ? ` &mdash; GPA: ${esc(e.gpa)}` : ""}</div>
    </div>`
    )
    .join("");
}

function renderProjects(proj) {
  if (!proj?.length) return "";
  return proj
    .map(
      (p) => `<div class="item">
      <div class="row"><span class="bold">${esc(p.name)}</span>${p.tech ? `<span class="muted">${esc(p.tech)}</span>` : ""}</div>
      ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ""}
      ${p.link ? `<div class="link">${esc(p.link)}</div>` : ""}
    </div>`
    )
    .join("");
}

function renderCertifications(certs) {
  if (!certs?.length) return "";
  return certs
    .map(
      (c) => `<div class="item-inline">
      <span class="bold">${esc(c.name)}</span> &mdash; <span class="sub-inline">${esc(c.issuer)}</span>
      ${c.year ? `<span class="muted"> (${esc(c.year)})</span>` : ""}
    </div>`
    )
    .join("");
}

function renderVolunteering(vol) {
  if (!vol?.length) return "";
  return vol.map((v) => `<div class="item">
    <div class="row"><span class="bold">${esc(v.role)}</span><span class="muted">${esc(v.period)}</span></div>
    <div class="sub">${esc(v.organization)}</div>
    ${v.description ? `<div class="desc">${esc(v.description)}</div>` : ""}
  </div>`).join("");
}

function renderAwards(awards) {
  if (!awards?.length) return "";
  return awards.map((a) => `<div class="item-inline">
    <span class="bold">${esc(a.title)}</span>${a.issuer ? ` &mdash; <span class="sub-inline">${esc(a.issuer)}</span>` : ""}
    ${a.year ? `<span class="muted"> (${esc(a.year)})</span>` : ""}
  </div>`).join("");
}

function renderPublications(pubs) {
  if (!pubs?.length) return "";
  return pubs.map((p) => `<div class="item-inline">
    <span class="bold">${esc(p.title)}</span>${p.publisher ? ` &mdash; <span class="sub-inline">${esc(p.publisher)}</span>` : ""}
    ${p.year ? `<span class="muted"> (${esc(p.year)})</span>` : ""}
    ${p.link ? `<div class="link">${esc(p.link)}</div>` : ""}
  </div>`).join("");
}

function renderLanguages(langs) {
  if (!langs?.length) return "";
  return langs.map((l) => `<span class="lang-item"><strong>${esc(l.language)}</strong>: ${esc(l.proficiency)}</span>`).join(" &bull; ");
}

function renderSkillTags(skills) {
  if (!skills?.length) return "";
  return skills.map((s) => `<span class="skill-tag">${esc(s)}</span>`).join("");
}

function renderList(items) {
  if (!items?.length) return "";
  return items.map((i) => `<span class="list-item">${esc(i)}</span>`).join(" &bull; ");
}

function contactLine(p, separator) {
  const parts = [];
  if (p.email) parts.push(p.email);
  if (p.phone) parts.push(p.phone);
  if (p.location) parts.push(p.location);
  if (p.linkedin) parts.push(p.linkedin);
  if (p.website) parts.push(p.website);
  return parts.map((x) => esc(x)).join(separator || " | ");
}

function hasSection(d, key) {
  if (key === "skills" || key === "achievements" || key === "hobbies") return d[key]?.length > 0;
  if (key === "volunteering" || key === "awards" || key === "publications") return d[key]?.length > 0;
  if (key === "summary") return !!d.summary;
  return d[key]?.length > 0;
}

// ===================== MODERN TEMPLATE =====================
exports.modernTemplate = function (d) {
  const p = d.personalInfo || {};
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Calibri,Arial,sans-serif;color:#1e293b;background:#fff;font-size:11pt;line-height:1.5}
.page{width:210mm;min-height:297mm;margin:0 auto}
.header{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:32px 40px 24px}
.header h1{font-size:26pt;font-weight:700;letter-spacing:-.5px;margin-bottom:2px}
.header .jobtitle{font-size:11pt;opacity:.9;margin-bottom:10px}
.header .contact{font-size:8.5pt;opacity:.8;display:flex;flex-wrap:wrap;gap:14px}
.body{display:grid;grid-template-columns:1fr 240px;gap:0}
.main{padding:24px 24px 24px 40px}
.sidebar{padding:24px 40px 24px 0}
.sec{margin-bottom:20px}
.sec-title{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#2563eb;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
.item{margin-bottom:12px}
.row{display:flex;justify-content:space-between;align-items:baseline}
.bold{font-weight:600;font-size:10pt}
.sub{font-size:9pt;color:#64748b;margin-top:1px}
.sub-inline{color:#64748b}
.muted{font-size:8pt;color:#94a3b8}
.desc{font-size:9pt;color:#475569;margin-top:4px;line-height:1.6}
.link{font-size:8pt;color:#2563eb;margin-top:2px}
.item-inline{font-size:9.5pt;margin-bottom:6px}
.skill-tag{display:inline-block;background:#eff6ff;color:#2563eb;font-size:8.5pt;padding:3px 10px;border-radius:12px;margin:2px 3px 2px 0}
.lang-item{font-size:9pt}
.list-item{font-size:9pt;color:#475569}
.sidebar .sec-title{color:#1e293b;border-bottom-color:#cbd5e1}
</style></head><body><div class="page">
<div class="header">
  <h1>${esc(p.name)}</h1>
  ${d.title ? `<div class="jobtitle">${esc(d.title)}</div>` : ""}
  <div class="contact">${contactLine(p, " &nbsp;&bull;&nbsp; ")}</div>
</div>
<div class="body">
<div class="main">
  ${d.summary ? `<div class="sec"><div class="sec-title">Professional Summary</div><div class="desc">${esc(d.summary)}</div></div>` : ""}
  ${hasSection(d, "experience") ? `<div class="sec"><div class="sec-title">Work Experience</div>${renderExperience(d.experience)}</div>` : ""}
  ${hasSection(d, "projects") ? `<div class="sec"><div class="sec-title">Projects</div>${renderProjects(d.projects)}</div>` : ""}
  ${hasSection(d, "volunteering") ? `<div class="sec"><div class="sec-title">Volunteering & Leadership</div>${renderVolunteering(d.volunteering)}</div>` : ""}
  ${hasSection(d, "education") ? `<div class="sec"><div class="sec-title">Education</div>${renderEducation(d.education)}</div>` : ""}
</div>
<div class="sidebar">
  ${hasSection(d, "skills") ? `<div class="sec"><div class="sec-title">Skills</div><div>${renderSkillTags(d.skills)}</div></div>` : ""}
  ${hasSection(d, "certifications") ? `<div class="sec"><div class="sec-title">Certifications</div>${renderCertifications(d.certifications)}</div>` : ""}
  ${hasSection(d, "awards") ? `<div class="sec"><div class="sec-title">Awards</div>${renderAwards(d.awards)}</div>` : ""}
  ${hasSection(d, "publications") ? `<div class="sec"><div class="sec-title">Publications</div>${renderPublications(d.publications)}</div>` : ""}
  ${hasSection(d, "languages") ? `<div class="sec"><div class="sec-title">Languages</div><div>${renderLanguages(d.languages)}</div></div>` : ""}
  ${hasSection(d, "achievements") ? `<div class="sec"><div class="sec-title">Achievements</div><div class="desc">${renderList(d.achievements)}</div></div>` : ""}
  ${hasSection(d, "hobbies") ? `<div class="sec"><div class="sec-title">Interests</div><div class="desc">${renderList(d.hobbies)}</div></div>` : ""}
</div>
</div></div></body></html>`;
};

// ===================== CLASSIC TEMPLATE =====================
exports.classicTemplate = function (d) {
  const p = d.personalInfo || {};
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Georgia','Times New Roman',serif;color:#222;background:#fff;font-size:11pt;line-height:1.5}
.page{width:210mm;min-height:297mm;padding:40px 48px;margin:0 auto}
.header{text-align:center;border-bottom:3px double #222;padding-bottom:16px;margin-bottom:22px}
.header h1{font-size:24pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
.header .jobtitle{font-size:11pt;color:#555;font-weight:normal;margin-bottom:8px;font-style:italic}
.header .contact{font-size:9pt;color:#444}
.sec{margin-bottom:18px}
.sec-title{font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #ccc}
.item{margin-bottom:10px}
.row{display:flex;justify-content:space-between;align-items:baseline}
.bold{font-weight:700;font-size:10.5pt}
.sub{font-size:9.5pt;color:#555;font-style:italic}
.sub-inline{color:#555;font-style:italic}
.muted{font-size:9pt;color:#888}
.desc{font-size:9.5pt;color:#333;margin-top:3px;line-height:1.65}
.link{font-size:8.5pt;color:#2563eb;margin-top:2px}
.item-inline{font-size:9.5pt;margin-bottom:5px}
.skill-tag{font-size:9.5pt;margin-right:12px;padding:2px 0;border-bottom:1px dotted #bbb;display:inline-block;margin-bottom:4px}
.lang-item{font-size:9.5pt}
.list-item{font-size:9.5pt;color:#333}
</style></head><body><div class="page">
<div class="header">
  <h1>${esc(p.name)}</h1>
  ${d.title ? `<div class="jobtitle">${esc(d.title)}</div>` : ""}
  <div class="contact">${contactLine(p, " &nbsp;|&nbsp; ")}</div>
</div>
${d.summary ? `<div class="sec"><div class="sec-title">Summary</div><div class="desc">${esc(d.summary)}</div></div>` : ""}
${hasSection(d, "experience") ? `<div class="sec"><div class="sec-title">Professional Experience</div>${renderExperience(d.experience)}</div>` : ""}
${hasSection(d, "education") ? `<div class="sec"><div class="sec-title">Education</div>${renderEducation(d.education)}</div>` : ""}
${hasSection(d, "projects") ? `<div class="sec"><div class="sec-title">Projects</div>${renderProjects(d.projects)}</div>` : ""}
${hasSection(d, "skills") ? `<div class="sec"><div class="sec-title">Technical Skills</div><div>${renderSkillTags(d.skills)}</div></div>` : ""}
${hasSection(d, "certifications") ? `<div class="sec"><div class="sec-title">Certifications</div>${renderCertifications(d.certifications)}</div>` : ""}
${hasSection(d, "volunteering") ? `<div class="sec"><div class="sec-title">Volunteering & Leadership</div>${renderVolunteering(d.volunteering)}</div>` : ""}
${hasSection(d, "awards") ? `<div class="sec"><div class="sec-title">Awards & Scholarships</div>${renderAwards(d.awards)}</div>` : ""}
${hasSection(d, "publications") ? `<div class="sec"><div class="sec-title">Publications</div>${renderPublications(d.publications)}</div>` : ""}
${hasSection(d, "languages") ? `<div class="sec"><div class="sec-title">Languages</div><div>${renderLanguages(d.languages)}</div></div>` : ""}
${hasSection(d, "achievements") ? `<div class="sec"><div class="sec-title">Awards &amp; Achievements</div><div class="desc">${renderList(d.achievements)}</div></div>` : ""}
${hasSection(d, "hobbies") ? `<div class="sec"><div class="sec-title">Interests</div><div class="desc">${renderList(d.hobbies)}</div></div>` : ""}
</div></body></html>`;
};

// ===================== MINIMAL TEMPLATE =====================
exports.minimalTemplate = function (d) {
  const p = d.personalInfo || {};
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;font-size:10.5pt;line-height:1.55}
.page{width:210mm;min-height:297mm;padding:48px 56px;margin:0 auto}
.header{margin-bottom:30px}
.header h1{font-size:28pt;font-weight:700;letter-spacing:-1px;margin-bottom:4px}
.header .jobtitle{font-size:10.5pt;color:#888;font-weight:300;margin-bottom:12px}
.header .contact{display:flex;gap:18px;font-size:8.5pt;color:#666;flex-wrap:wrap}
.divider{height:1px;background:#eee;margin:0 0 24px}
.sec{margin-bottom:24px}
.sec-title{font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:#999;margin-bottom:12px}
.item{margin-bottom:16px;padding-left:14px;border-left:2px solid #e5e5e5}
.row{display:flex;justify-content:space-between;align-items:baseline}
.bold{font-weight:600;font-size:10.5pt}
.sub{font-size:9pt;color:#888;margin-top:1px}
.sub-inline{color:#888}
.muted{font-size:8.5pt;color:#aaa}
.desc{font-size:9pt;color:#555;margin-top:4px;line-height:1.65}
.link{font-size:8pt;color:#3b82f6;margin-top:2px}
.item-inline{font-size:9pt;margin-bottom:5px;padding-left:14px;border-left:2px solid #e5e5e5}
.skill-tag{display:inline-block;font-size:9pt;color:#444;padding:3px 12px;border:1px solid #e5e5e5;border-radius:3px;margin:2px 3px 2px 0}
.lang-item{font-size:9pt}
.list-item{font-size:9pt;color:#555}
</style></head><body><div class="page">
<div class="header">
  <h1>${esc(p.name)}</h1>
  ${d.title ? `<div class="jobtitle">${esc(d.title)}</div>` : ""}
  <div class="contact">${contactLine(p, "").split(" | ").map((x) => `<span>${x}</span>`).join("")}</div>
</div>
<div class="divider"></div>
${d.summary ? `<div class="sec"><div class="sec-title">About</div><div class="desc">${esc(d.summary)}</div></div>` : ""}
${hasSection(d, "experience") ? `<div class="sec"><div class="sec-title">Experience</div>${renderExperience(d.experience)}</div>` : ""}
${hasSection(d, "education") ? `<div class="sec"><div class="sec-title">Education</div>${renderEducation(d.education)}</div>` : ""}
${hasSection(d, "projects") ? `<div class="sec"><div class="sec-title">Projects</div>${renderProjects(d.projects)}</div>` : ""}
${hasSection(d, "skills") ? `<div class="sec"><div class="sec-title">Skills</div><div>${renderSkillTags(d.skills)}</div></div>` : ""}
${hasSection(d, "certifications") ? `<div class="sec"><div class="sec-title">Certifications</div>${renderCertifications(d.certifications)}</div>` : ""}
${hasSection(d, "volunteering") ? `<div class="sec"><div class="sec-title">Volunteering & Leadership</div>${renderVolunteering(d.volunteering)}</div>` : ""}
${hasSection(d, "awards") ? `<div class="sec"><div class="sec-title">Awards & Scholarships</div>${renderAwards(d.awards)}</div>` : ""}
${hasSection(d, "publications") ? `<div class="sec"><div class="sec-title">Publications</div>${renderPublications(d.publications)}</div>` : ""}
${hasSection(d, "languages") ? `<div class="sec"><div class="sec-title">Languages</div><div>${renderLanguages(d.languages)}</div></div>` : ""}
${hasSection(d, "achievements") ? `<div class="sec"><div class="sec-title">Achievements</div><div class="desc">${renderList(d.achievements)}</div></div>` : ""}
${hasSection(d, "hobbies") ? `<div class="sec"><div class="sec-title">Interests</div><div class="desc">${renderList(d.hobbies)}</div></div>` : ""}
</div></body></html>`;
};

// ===================== CREATIVE TEMPLATE =====================
exports.creativeTemplate = function (d) {
  const p = d.personalInfo || {};
  const initials = (p.name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2);
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Calibri,Arial,sans-serif;color:#1e293b;background:#fff;font-size:10.5pt;line-height:1.5}
.page{width:210mm;min-height:297mm;margin:0 auto;display:grid;grid-template-columns:200px 1fr}
.left{background:#0f172a;color:#e2e8f0;padding:32px 22px}
.right{padding:32px 36px}
.avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:24pt;font-weight:700;color:#fff;margin:0 auto 16px}
.left h2{font-size:14pt;text-align:center;margin-bottom:3px}
.left .jobtitle{font-size:9pt;color:#94a3b8;text-align:center;margin-bottom:20px}
.left .sec{margin-bottom:18px}
.left .sec-title{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#3b82f6;margin-bottom:8px}
.left .contact-item{font-size:8pt;color:#cbd5e1;margin-bottom:6px;word-break:break-all}
.left .skill-tag{display:inline-block;background:rgba(59,130,246,.15);color:#93c5fd;font-size:7.5pt;padding:3px 8px;border-radius:10px;margin:2px 2px}
.left .lang-item{font-size:8pt;display:block;margin-bottom:4px}
.left .list-item{font-size:8pt;color:#cbd5e1}
.right .sec{margin-bottom:20px}
.right .sec-title{font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#2563eb;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
.item{margin-bottom:12px;position:relative;padding-left:16px}
.item::before{content:'';position:absolute;left:0;top:5px;width:6px;height:6px;border-radius:50%;background:#3b82f6}
.item-inline{font-size:9pt;margin-bottom:5px;padding-left:16px;position:relative}
.item-inline::before{content:'';position:absolute;left:0;top:5px;width:6px;height:6px;border-radius:50%;background:#8b5cf6}
.row{display:flex;justify-content:space-between;align-items:baseline}
.bold{font-weight:600;font-size:10pt}
.sub{font-size:9pt;color:#64748b;margin-top:1px}
.sub-inline{color:#64748b}
.muted{font-size:8pt;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:8px}
.desc{font-size:9pt;color:#475569;margin-top:4px;line-height:1.6}
.link{font-size:8pt;color:#3b82f6;margin-top:2px}
.list-item{font-size:9pt;color:#475569}
</style></head><body><div class="page">
<div class="left">
  <div class="avatar">${esc(initials)}</div>
  <h2>${esc(p.name)}</h2>
  ${d.title ? `<div class="jobtitle">${esc(d.title)}</div>` : ""}
  <div class="sec">
    <div class="sec-title">Contact</div>
    ${p.email ? `<div class="contact-item">${esc(p.email)}</div>` : ""}
    ${p.phone ? `<div class="contact-item">${esc(p.phone)}</div>` : ""}
    ${p.location ? `<div class="contact-item">${esc(p.location)}</div>` : ""}
    ${p.linkedin ? `<div class="contact-item">${esc(p.linkedin)}</div>` : ""}
    ${p.website ? `<div class="contact-item">${esc(p.website)}</div>` : ""}
  </div>
  ${hasSection(d, "skills") ? `<div class="sec"><div class="sec-title">Skills</div><div>${d.skills.map((s) => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div></div>` : ""}
  ${hasSection(d, "awards") ? `<div class="sec"><div class="sec-title">Awards</div>${renderAwards(d.awards)}</div>` : ""}
  ${hasSection(d, "languages") ? `<div class="sec"><div class="sec-title">Languages</div><div>${(d.languages || []).map((l) => `<span class="lang-item"><strong>${esc(l.language)}</strong>: ${esc(l.proficiency)}</span>`).join("")}</div></div>` : ""}
  ${hasSection(d, "hobbies") ? `<div class="sec"><div class="sec-title">Interests</div><div class="list-item">${(d.hobbies || []).map((h) => esc(h)).join(" &bull; ")}</div></div>` : ""}
</div>
<div class="right">
  ${d.summary ? `<div class="sec"><div class="sec-title">Profile</div><div class="desc">${esc(d.summary)}</div></div>` : ""}
  ${hasSection(d, "experience") ? `<div class="sec"><div class="sec-title">Experience</div>${renderExperience(d.experience)}</div>` : ""}
  ${hasSection(d, "education") ? `<div class="sec"><div class="sec-title">Education</div>${renderEducation(d.education)}</div>` : ""}
  ${hasSection(d, "projects") ? `<div class="sec"><div class="sec-title">Projects</div>${renderProjects(d.projects)}</div>` : ""}
  ${hasSection(d, "certifications") ? `<div class="sec"><div class="sec-title">Certifications</div>${renderCertifications(d.certifications)}</div>` : ""}
  ${hasSection(d, "volunteering") ? `<div class="sec"><div class="sec-title">Volunteering & Leadership</div>${renderVolunteering(d.volunteering)}</div>` : ""}
  ${hasSection(d, "publications") ? `<div class="sec"><div class="sec-title">Publications</div>${renderPublications(d.publications)}</div>` : ""}
  ${hasSection(d, "achievements") ? `<div class="sec"><div class="sec-title">Achievements</div><div class="desc">${renderList(d.achievements)}</div></div>` : ""}
</div>
</div></body></html>`;
};

exports.getTemplate = function (name) {
  const map = {
    modern: exports.modernTemplate,
    classic: exports.classicTemplate,
    minimal: exports.minimalTemplate,
    creative: exports.creativeTemplate,
  };
  return map[name] || map.modern;
};
