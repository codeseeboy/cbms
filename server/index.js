const path = require("path");

// Load repo-root .env for local dev (Render injects env vars automatically)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { MongoClient } = require("mongodb");
const { hashSync, compareSync } = require("bcryptjs");
const { randomUUID } = require("crypto");
const { getTemplate } = require("./templates");
const { parseResumeText } = require("./parser");
const { calculateATSScore } = require("./ats-scorer");
const { matchResumeToJob, generateSuggestedJobs } = require("./job-matcher");
const { generateCertificateHTML } = require("./certificate");

const app = express();
const PORT = process.env.PORT || 4002;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "careerbuilder";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are supported"), false);
    }
  },
});

let browserInstance = null;
let mongoClientPromise = null;

function getMongoClient() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in backend environment");
  }
  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    }).connect();
  }
  return mongoClientPromise;
}

async function getDb() {
  const client = await getMongoClient();
  return client.db(MONGODB_DB);
}

async function getBrowser() {
  if (browserInstance) return browserInstance;
  const puppeteer = require("puppeteer");
  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
      "--single-process",
    ],
  });
  return browserInstance;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CareerBuilder Resume Server", port: PORT });
});

// Auth endpoints for frontend login/signup via backend only
app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    if (!compareSync(password, String(user.password || ""))) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ success: false, error: "Failed to login" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const role = String(req.body?.role || "jobseeker");

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const db = await getDb();
    const existing = await db.collection("users").findOne({ email }, { projection: { _id: 1 } });
    if (existing) {
      return res.status(409).json({ success: false, error: "An account with this email already exists" });
    }

    const user = {
      id: randomUUID(),
      name,
      email,
      password: hashSync(password, 10),
      role,
      phone: "",
      location: "",
      title: "",
      bio: "",
      skills: [],
      avatar: name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("users").insertOne(user);

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Auth signup error:", err);
    return res.status(500).json({ success: false, error: "Failed to sign up" });
  }
});

app.post("/api/resume/preview", (req, res) => {
  try {
    const { resumeData, template } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
    const templateFn = getTemplate(template || "modern");
    const html = templateFn(resumeData);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate preview", details: err.message });
  }
});

app.post("/api/resume/download", async (req, res) => {
  try {
    const { resumeData, template } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });

    const templateFn = getTemplate(template || "modern");
    const html = templateFn(resumeData);

    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
    await new Promise((r) => setTimeout(r, 300));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false,
    });

    await page.close();

    const fileName = `${(resumeData.personalInfo?.name || "Resume").replace(/[^a-zA-Z0-9 ]/g, "_")}_Resume.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": Buffer.byteLength(pdf),
      "Cache-Control": "no-cache",
    });
    res.end(pdf);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  }
});

app.post("/api/resume/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const pdfParse = require("pdf-parse");
    const result = await pdfParse(req.file.buffer);
    const text = result.text;

    console.log("--- Extracted text (%d chars) ---", text.length);
    console.log(text.substring(0, 500));
    console.log("---");

    const parsed = parseResumeText(text);

    console.log("--- Parsed result ---");
    console.log("Name:", parsed.personalInfo.name);
    console.log("Email:", parsed.personalInfo.email);
    console.log("Experience:", parsed.experience.length, "entries");
    console.log("Education:", parsed.education.length, "entries");
    console.log("Skills:", parsed.skills.length, "items");
    console.log("Projects:", parsed.projects.length, "entries");
    console.log("Certifications:", parsed.certifications.length, "entries");
    console.log("---");

    const atsScore = calculateATSScore(parsed);

    res.json({ success: true, data: parsed, atsScore, rawText: text });
  } catch (err) {
    console.error("Resume parse error:", err);
    res.status(500).json({ error: "Failed to parse resume", details: err.message });
  }
});

app.post("/api/resume/ats-score", (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
    const result = calculateATSScore(resumeData);
    res.json(result);
  } catch (err) {
    console.error("ATS scoring error:", err);
    res.status(500).json({ error: "Failed to calculate ATS score", details: err.message });
  }
});

// Job URL scraping
app.post("/api/job/scrape-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return res.status(400).json({ error: `Failed to fetch URL (${response.status})` });

    const html = await response.text();
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    $("script, style, nav, header, footer, iframe, noscript, svg, img, link, meta").remove();

    let jobTitle = "";
    let companyName = "";
    let jobDescription = "";
    let location = "";

    const titleSelectors = [
      'h1[class*="job"]', 'h1[class*="title"]', '.job-title', '.jobTitle',
      '[data-testid*="jobTitle"]', '[data-testid*="job-title"]', 'h1',
    ];
    for (const sel of titleSelectors) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 3) { jobTitle = el.text().trim(); break; }
    }

    const companySelectors = [
      '[class*="company"]', '[data-testid*="company"]', '.employer', '.companyName',
      'a[class*="company"]', '[class*="employer"]',
    ];
    for (const sel of companySelectors) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 1) { companyName = el.text().trim().substring(0, 100); break; }
    }

    const descSelectors = [
      '[class*="description"]', '[class*="job-desc"]', '[class*="jobDesc"]',
      '[data-testid*="description"]', '#job-description', '.job-description',
      'article', '[class*="details"]', '[class*="content"]', 'main',
    ];
    for (const sel of descSelectors) {
      const el = $(sel).first();
      if (el.length) {
        const text = el.text().replace(/\s+/g, " ").trim();
        if (text.length > 100) { jobDescription = text; break; }
      }
    }

    if (!jobDescription) {
      jobDescription = $("body").text().replace(/\s+/g, " ").trim();
    }

    const locSelectors = [
      '[class*="location"]', '[data-testid*="location"]', '.job-location',
      'span:contains("Remote")', '[class*="loc"]',
    ];
    for (const sel of locSelectors) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 1 && el.text().trim().length < 100) {
        location = el.text().trim(); break;
      }
    }

    jobDescription = jobDescription.substring(0, 8000);

    res.json({
      success: true,
      data: {
        title: jobTitle.substring(0, 200),
        company: companyName.substring(0, 200),
        description: jobDescription,
        location: location.substring(0, 100),
        url,
      },
    });
  } catch (err) {
    console.error("URL scrape error:", err);
    const msg = err.name === "TimeoutError" ? "Request timed out (15s)" : err.message;
    res.status(500).json({ error: `Failed to scrape URL: ${msg}` });
  }
});

// Job matching: resume vs job description
app.post("/api/job/match", (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
    if (!jobDescription) return res.status(400).json({ error: "jobDescription is required" });
    const result = matchResumeToJob(resumeData, jobDescription);
    res.json(result);
  } catch (err) {
    console.error("Job match error:", err);
    res.status(500).json({ error: "Failed to match resume", details: err.message });
  }
});

// Suggested jobs based on resume
app.post("/api/job/suggestions", (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
    const suggestions = generateSuggestedJobs(resumeData);
    res.json(suggestions);
  } catch (err) {
    console.error("Suggestions error:", err);
    res.status(500).json({ error: "Failed to generate suggestions", details: err.message });
  }
});

// Certificate PDF generation
app.post("/api/certificate/download", async (req, res) => {
  try {
    const { userName, courseTitle, issuedAt, certificateId } = req.body;
    if (!userName || !courseTitle) return res.status(400).json({ error: "userName and courseTitle are required" });

    const html = generateCertificateHTML({ userName, courseTitle, issuedAt: issuedAt || new Date().toISOString(), certificateId: certificateId || "N/A" });

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
    await new Promise((r) => setTimeout(r, 300));

    const pdf = await page.pdf({
      width: "297mm",
      height: "210mm",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      landscape: true,
    });
    await page.close();

    const fileName = `${(userName || "Certificate").replace(/[^a-zA-Z0-9 ]/g, "_")}_Certificate.pdf`;
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": Buffer.byteLength(pdf),
      "Cache-Control": "no-cache",
    });
    res.end(pdf);
  } catch (err) {
    console.error("Certificate generation error:", err);
    res.status(500).json({ error: "Failed to generate certificate", details: err.message });
  }
});

// Certificate preview
app.post("/api/certificate/preview", (req, res) => {
  try {
    const { userName, courseTitle, issuedAt, certificateId } = req.body;
    const html = generateCertificateHTML({ userName, courseTitle: courseTitle || "Course", issuedAt: issuedAt || new Date().toISOString(), certificateId: certificateId || "N/A" });
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: "Failed", details: err.message });
  }
});

process.on("SIGINT", async () => {
  if (browserInstance) await browserInstance.close();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`\n  CareerBuilder Resume Server`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  Endpoints:`);
  console.log(`    GET  /api/health           - Health check`);
  console.log(`    POST /api/resume/preview    - HTML preview`);
  console.log(`    POST /api/resume/download   - PDF download`);
  console.log(`    POST /api/resume/upload     - Parse uploaded PDF`);
  console.log(`    POST /api/resume/ats-score  - Real-time ATS scoring`);
  console.log(`    POST /api/job/scrape-url    - Scrape job URL`);
  console.log(`    POST /api/job/match         - Resume vs JD matching`);
  console.log(`    POST /api/job/suggestions   - Suggested jobs`);
  console.log(`    POST /api/auth/login        - Auth login`);
  console.log(`    POST /api/auth/signup       - Auth signup`);
  console.log(`    POST /api/certificate/download - Certificate PDF`);
  console.log(`    POST /api/certificate/preview  - Certificate preview\n`);
});
