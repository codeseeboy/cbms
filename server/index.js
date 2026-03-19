const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const { hashSync, compareSync } = require("bcryptjs");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { getTemplate } = require("./templates");
const { parseResumeText } = require("./parser");
const { calculateATSScore } = require("./ats-scorer");
const { matchResumeToJob, generateSuggestedJobs } = require("./job-matcher");
const { generateCertificateHTML } = require("./certificate");
const { getSeedData } = require("./seed-data");

const app = express();
const PORT = process.env.PORT || 4002;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "careerbuilder";
const JWT_SECRET = process.env.JWT_SECRET || "careerbuilder-secret-key-change-in-production-2026";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are supported"), false);
  },
});

// ── MongoDB ──────────────────────────────────────────────────────────
let browserInstance = null;
let mongoClientPromise = null;

function getMongoClient() {
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI in backend environment");
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

// ── JWT helpers ──────────────────────────────────────────────────────
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// Auth middleware – attaches req.userId
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });
  req.userId = payload.userId;
  next();
}

// ── DB helper shortcuts ──────────────────────────────────────────────
async function col(name) { return (await getDb()).collection(name); }
async function findAll(name, filter = {}) { return (await col(name)).find(filter, { projection: { _id: 0 } }).toArray(); }
async function findById(name, id) { return (await col(name)).findOne({ id }, { projection: { _id: 0 } }); }
async function insertDoc(name, doc) { await (await col(name)).insertOne(doc); }
async function updateDoc(name, id, updates) { await (await col(name)).updateOne({ id }, { $set: updates }); }
async function deleteDoc(name, id) { await (await col(name)).deleteOne({ id }); }

// ── Seed ─────────────────────────────────────────────────────────────
let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  const db = await getDb();
  const count = await db.collection("users").countDocuments();
  if (count === 0) {
    const data = getSeedData();
    await db.collection("users").insertMany(data.users);
    await db.collection("resumes").insertMany(data.resumes);
    await db.collection("jobs").insertMany(data.jobs);
    await db.collection("assessments").insertMany(data.assessments);
    await db.collection("user_assessments").insertMany(data.userAssessments);
    await db.collection("courses").insertMany(data.courses);
    await db.collection("user_courses").insertMany(data.userCourses);
    await db.collection("career_goals").insertMany(data.careerGoals);
    await db.collection("notifications").insertMany(data.notifications);
    await db.collection("activity_log").insertMany(data.activityLog);
    console.log("  ✓ Database seeded with demo data");
  }
  seeded = true;
}

// ── Puppeteer (lazy) ─────────────────────────────────────────────────
async function getBrowser() {
  if (browserInstance) return browserInstance;
  const puppeteer = require("puppeteer");
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--font-render-hinting=none", "--single-process"],
  });
  return browserInstance;
}

// =====================================================================
//  ROUTES
// =====================================================================

// ── Health ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CareerBuilder Backend", port: PORT });
});

// ── Seed (manual trigger) ───────────────────────────────────────────
app.get("/api/seed", async (req, res) => {
  try {
    seeded = false;
    await ensureSeeded();
    res.json({ success: true, message: "Database seeded" });
  } catch (err) {
    res.status(500).json({ error: "Seed failed", details: err.message });
  }
});

// ── Auth ─────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    await ensureSeeded();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) return res.status(400).json({ success: false, error: "Email and password are required" });

    const user = await (await col("users")).findOne({ email }, { projection: { _id: 0 } });
    if (!user) return res.status(401).json({ success: false, error: "Invalid email or password" });
    if (!compareSync(password, String(user.password || ""))) return res.status(401).json({ success: false, error: "Invalid email or password" });

    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ success: false, error: "Failed to login" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    await ensureSeeded();
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const role = String(req.body?.role || "jobseeker");

    if (!name || !email || !password) return res.status(400).json({ success: false, error: "All fields are required" });
    if (password.length < 6) return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });

    const existing = await (await col("users")).findOne({ email }, { projection: { _id: 1 } });
    if (existing) return res.status(409).json({ success: false, error: "An account with this email already exists" });

    const user = {
      id: randomUUID(), name, email, password: hashSync(password, 10), role,
      phone: "", location: "", title: "", bio: "", skills: [],
      avatar: name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await insertDoc("users", user);
    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;
    return res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("Auth signup error:", err);
    return res.status(500).json({ success: false, error: "Failed to sign up" });
  }
});

// ── Profile ──────────────────────────────────────────────────────────
app.get("/api/profile", authMiddleware, async (req, res) => {
  const user = await findById("users", req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.put("/api/profile", authMiddleware, async (req, res) => {
  const updates = {};
  for (const key of ["name", "phone", "location", "title", "bio"]) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.skills) updates.skills = req.body.skills;
  updates.updatedAt = new Date().toISOString();
  await updateDoc("users", req.userId, updates);
  res.json({ success: true });
});

app.put("/api/profile/password", authMiddleware, async (req, res) => {
  const user = await findById("users", req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!compareSync(req.body.currentPassword, user.password)) return res.status(400).json({ error: "Current password is incorrect" });
  if (!req.body.newPassword || req.body.newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });
  await updateDoc("users", req.userId, { password: hashSync(req.body.newPassword, 10), updatedAt: new Date().toISOString() });
  res.json({ success: true });
});

// ── Dashboard ────────────────────────────────────────────────────────
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  const user = await findById("users", req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password: _, ...safeUser } = user;

  const resumes = await findAll("resumes", { userId: req.userId });
  const jobs = await findAll("jobs");
  const userAssessments = await findAll("user_assessments", { userId: req.userId });
  const userCourses = await findAll("user_courses", { userId: req.userId });
  const activities = (await findAll("activity_log", { userId: req.userId }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const notifications = await findAll("notifications", { userId: req.userId, read: false });
  const applications = await findAll("job_applications", { userId: req.userId });
  const assessments = await findAll("assessments");

  const completedAssessments = userAssessments.filter((ua) => ua.status === "completed");
  const avgScore = completedAssessments.length > 0
    ? Math.round(completedAssessments.reduce((sum, ua) => sum + (ua.score || 0), 0) / completedAssessments.length) : 0;
  const activeCourses = userCourses.filter((uc) => uc.status === "in-progress");
  const topJobs = [...jobs].sort((a, b) => b.match - a.match).slice(0, 3);

  res.json({
    user: safeUser,
    stats: { resumes: resumes.length, jobsMatched: jobs.length, assessments: completedAssessments.length, avgScore, activeCourses: activeCourses.length, applications: applications.length },
    recentActivity: activities.slice(0, 5),
    topJobs,
    unreadNotifications: notifications.length,
    skillProgress: (safeUser.skills || []).map((skill) => {
      const related = completedAssessments.find((ua) => {
        const a = assessments.find((x) => x.id === ua.assessmentId);
        return a?.title?.toLowerCase().includes(skill.toLowerCase());
      });
      return { skill, level: related?.score || Math.floor(Math.random() * 40) + 50 };
    }),
  });
});

// ── Resumes CRUD ─────────────────────────────────────────────────────
function calculateCompleteness(r) {
  let s = 0;
  if (r.personalInfo?.name) s += 10; if (r.personalInfo?.email) s += 5;
  if (r.personalInfo?.phone) s += 5; if (r.personalInfo?.location) s += 5;
  if (r.summary && r.summary.length > 20) s += 15;
  if ((r.experience || []).length > 0) s += 20; if ((r.education || []).length > 0) s += 10;
  if ((r.skills || []).length >= 3) s += 10; if ((r.projects || []).length > 0) s += 8;
  if ((r.certifications || []).length > 0) s += 4; if ((r.languages || []).length > 0) s += 3;
  if ((r.volunteering || []).length > 0) s += 3; if ((r.awards || []).length > 0) s += 2;
  if ((r.achievements || []).length > 0) s += 2;
  return Math.min(s, 100);
}

app.get("/api/resumes", authMiddleware, async (req, res) => {
  res.json(await findAll("resumes", { userId: req.userId }));
});

app.get("/api/resumes/:id", authMiddleware, async (req, res) => {
  const r = await (await col("resumes")).findOne({ id: req.params.id, userId: req.userId }, { projection: { _id: 0 } });
  res.json(r || null);
});

app.post("/api/resumes", authMiddleware, async (req, res) => {
  const user = await findById("users", req.userId);
  const resume = {
    id: randomUUID(), userId: req.userId,
    title: req.body.title || "Untitled Resume", template: req.body.template || "modern",
    personalInfo: { name: user?.name || "", email: user?.email || "", phone: user?.phone || "", location: user?.location || "", linkedin: "", website: "" },
    summary: user?.bio || "", experience: [], education: [], skills: user?.skills || [],
    projects: [], certifications: [], languages: [], volunteering: [], awards: [], publications: [], achievements: [], hobbies: [],
    completeness: 20, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await insertDoc("resumes", resume);
  res.status(201).json({ success: true, id: resume.id });
});

app.put("/api/resumes/:id", authMiddleware, async (req, res) => {
  const existing = await (await col("resumes")).findOne({ id: req.params.id, userId: req.userId }, { projection: { _id: 0 } });
  if (!existing) return res.status(404).json({ error: "Resume not found" });
  const updates = { ...req.body, updatedAt: new Date().toISOString() };
  delete updates.id; delete updates.userId; delete updates._id;
  const merged = { ...existing, ...updates };
  updates.completeness = calculateCompleteness(merged);
  await updateDoc("resumes", req.params.id, updates);
  res.json({ success: true });
});

app.delete("/api/resumes/:id", authMiddleware, async (req, res) => {
  const existing = await (await col("resumes")).findOne({ id: req.params.id, userId: req.userId });
  if (!existing) return res.status(404).json({ error: "Resume not found" });
  await deleteDoc("resumes", req.params.id);
  res.json({ success: true });
});

// ── Jobs ─────────────────────────────────────────────────────────────
app.get("/api/jobs", async (req, res) => {
  await ensureSeeded();
  let jobs = await findAll("jobs");
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    jobs = jobs.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.tags || []).some((t) => t.toLowerCase().includes(q)));
  }
  res.json(jobs);
});

app.get("/api/jobs/:id", async (req, res) => {
  await ensureSeeded();
  res.json((await findById("jobs", req.params.id)) || null);
});

app.get("/api/bookmarks", authMiddleware, async (req, res) => {
  res.json(await findAll("job_bookmarks", { userId: req.userId }));
});

app.post("/api/bookmarks/:jobId", authMiddleware, async (req, res) => {
  const existing = await (await col("job_bookmarks")).findOne({ userId: req.userId, jobId: req.params.jobId });
  if (existing) {
    await deleteDoc("job_bookmarks", existing.id);
    return res.json({ success: true, bookmarked: false });
  }
  await insertDoc("job_bookmarks", { id: randomUUID(), userId: req.userId, jobId: req.params.jobId, createdAt: new Date().toISOString() });
  res.json({ success: true, bookmarked: true });
});

app.post("/api/jobs/:id/apply", authMiddleware, async (req, res) => {
  const existing = await (await col("job_applications")).findOne({ userId: req.userId, jobId: req.params.id });
  if (existing) return res.status(409).json({ error: "Already applied to this job" });
  await insertDoc("job_applications", { id: randomUUID(), userId: req.userId, jobId: req.params.id, status: "applied", appliedAt: new Date().toISOString() });
  res.json({ success: true });
});

app.get("/api/applications", authMiddleware, async (req, res) => {
  res.json(await findAll("job_applications", { userId: req.userId }));
});

app.get("/api/applied-jobs", authMiddleware, async (req, res) => {
  res.json(await findAll("applied_jobs", { userId: req.userId }));
});

app.post("/api/applied-jobs", authMiddleware, async (req, res) => {
  const job = {
    id: randomUUID(), userId: req.userId,
    title: req.body.title, company: req.body.company, url: req.body.url,
    location: req.body.location, matchScore: req.body.matchScore,
    status: req.body.status, notes: req.body.notes || "",
    appliedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await insertDoc("applied_jobs", job);
  res.json({ success: true, id: job.id });
});

app.put("/api/applied-jobs/:id/status", authMiddleware, async (req, res) => {
  const existing = await (await col("applied_jobs")).findOne({ id: req.params.id, userId: req.userId });
  if (!existing) return res.status(404).json({ error: "Job not found" });
  await updateDoc("applied_jobs", req.params.id, { status: req.body.status, updatedAt: new Date().toISOString() });
  res.json({ success: true });
});

app.delete("/api/applied-jobs/:id", authMiddleware, async (req, res) => {
  const existing = await (await col("applied_jobs")).findOne({ id: req.params.id, userId: req.userId });
  if (!existing) return res.status(404).json({ error: "Job not found" });
  await deleteDoc("applied_jobs", req.params.id);
  res.json({ success: true });
});

// ── Learning / Courses ───────────────────────────────────────────────
app.get("/api/courses", async (req, res) => {
  await ensureSeeded();
  let courses = await findAll("courses");
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    courses = courses.filter((c) => c.title.toLowerCase().includes(q) || (c.tags || []).some((t) => t.toLowerCase().includes(q)));
  }
  if (req.query.category && req.query.category !== "All") {
    courses = courses.filter((c) => c.category === req.query.category);
  }
  res.json(courses);
});

app.get("/api/courses/:id", async (req, res) => {
  await ensureSeeded();
  res.json((await findById("courses", req.params.id)) || null);
});

app.get("/api/user-courses", authMiddleware, async (req, res) => {
  res.json(await findAll("user_courses", { userId: req.userId }));
});

app.get("/api/user-courses/:courseId", authMiddleware, async (req, res) => {
  const uc = await (await col("user_courses")).findOne({ userId: req.userId, courseId: req.params.courseId }, { projection: { _id: 0 } });
  res.json(uc || null);
});

app.post("/api/courses/:id/enroll", authMiddleware, async (req, res) => {
  const existing = await (await col("user_courses")).findOne({ userId: req.userId, courseId: req.params.id });
  if (existing) return res.json({ error: "Already enrolled", id: existing.id });
  const course = await findById("courses", req.params.id);
  const firstVideoId = course?.modules?.[0]?.videos?.[0]?.id || "";
  const uc = { id: randomUUID(), userId: req.userId, courseId: req.params.id, progress: 0, watchedVideos: [], currentVideoId: firstVideoId, status: "in-progress", startedAt: new Date().toISOString(), completedAt: null };
  await insertDoc("user_courses", uc);
  res.json({ success: true, id: uc.id });
});

app.post("/api/courses/:id/watch-video", authMiddleware, async (req, res) => {
  const uc = await (await col("user_courses")).findOne({ userId: req.userId, courseId: req.params.id }, { projection: { _id: 0 } });
  if (!uc) return res.status(404).json({ error: "Not enrolled" });
  const course = await findById("courses", req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const watched = new Set(uc.watchedVideos || []);
  watched.add(req.body.videoId);
  const watchedArr = Array.from(watched);
  const progress = Math.round((watchedArr.length / course.totalVideos) * 100);

  const updates = { watchedVideos: watchedArr, currentVideoId: req.body.videoId, progress: Math.min(progress, 100) };
  if (progress >= 100) {
    updates.status = "completed"; updates.completedAt = new Date().toISOString(); updates.progress = 100;
    const existingCert = await (await col("certificates")).findOne({ userId: req.userId, courseId: req.params.id });
    if (!existingCert) {
      const user = await findById("users", req.userId);
      await insertDoc("certificates", { id: randomUUID(), userId: req.userId, courseId: req.params.id, courseTitle: course.title, userName: user?.name || "", issuedAt: new Date().toISOString() });
    }
  }
  await updateDoc("user_courses", uc.id, updates);
  res.json({ success: true, progress: updates.progress, completed: progress >= 100 });
});

app.post("/api/courses/:id/set-current-video", authMiddleware, async (req, res) => {
  const uc = await (await col("user_courses")).findOne({ userId: req.userId, courseId: req.params.id });
  if (!uc) return res.status(404).json({ error: "Not enrolled" });
  await updateDoc("user_courses", uc.id, { currentVideoId: req.body.videoId });
  res.json({ success: true });
});

app.put("/api/courses/:id/progress", authMiddleware, async (req, res) => {
  const uc = await (await col("user_courses")).findOne({ userId: req.userId, courseId: req.params.id });
  if (!uc) return res.status(404).json({ error: "Not enrolled" });
  const updates = { progress: Math.min(req.body.progress, 100) };
  if (req.body.progress >= 100) { updates.status = "completed"; updates.completedAt = new Date().toISOString(); updates.progress = 100; }
  await updateDoc("user_courses", uc.id, updates);
  res.json({ success: true });
});

app.get("/api/certificates", authMiddleware, async (req, res) => {
  res.json(await findAll("certificates", { userId: req.userId }));
});

app.get("/api/certificates/:courseId", authMiddleware, async (req, res) => {
  const cert = await (await col("certificates")).findOne({ userId: req.userId, courseId: req.params.courseId }, { projection: { _id: 0 } });
  res.json(cert || null);
});

// ── Assessments / Skills ─────────────────────────────────────────────
app.get("/api/assessments", async (req, res) => {
  await ensureSeeded();
  res.json(await findAll("assessments"));
});

app.get("/api/assessments/:id", async (req, res) => {
  await ensureSeeded();
  res.json((await findById("assessments", req.params.id)) || null);
});

app.get("/api/user-assessments", authMiddleware, async (req, res) => {
  res.json(await findAll("user_assessments", { userId: req.userId }));
});

app.get("/api/user-assessments/:assessmentId", authMiddleware, async (req, res) => {
  const ua = await (await col("user_assessments")).findOne({ userId: req.userId, assessmentId: req.params.assessmentId }, { projection: { _id: 0 } });
  res.json(ua || null);
});

app.post("/api/assessments/:id/start", authMiddleware, async (req, res) => {
  const assessment = await findById("assessments", req.params.id);
  if (!assessment) return res.status(404).json({ error: "Assessment not found" });

  const existing = await (await col("user_assessments")).findOne({ userId: req.userId, assessmentId: req.params.id }, { projection: { _id: 0 } });
  if (existing && existing.status === "completed") {
    await updateDoc("user_assessments", existing.id, { score: null, answers: assessment.questions.map(() => null), currentQuestion: 0, status: "in-progress", startedAt: new Date().toISOString(), completedAt: null });
    return res.json({ success: true, id: existing.id });
  }
  if (existing && existing.status === "in-progress") return res.json({ success: true, id: existing.id });

  const ua = { id: randomUUID(), userId: req.userId, assessmentId: req.params.id, score: null, answers: assessment.questions.map(() => null), currentQuestion: 0, status: "in-progress", startedAt: new Date().toISOString(), completedAt: null };
  await insertDoc("user_assessments", ua);
  res.json({ success: true, id: ua.id });
});

app.post("/api/assessments/:id/answer", authMiddleware, async (req, res) => {
  const ua = await (await col("user_assessments")).findOne({ userId: req.userId, assessmentId: req.params.id }, { projection: { _id: 0 } });
  if (!ua || ua.status !== "in-progress") return res.status(400).json({ error: "No active assessment" });
  const newAnswers = [...ua.answers];
  newAnswers[req.body.questionIndex] = req.body.answer;
  await updateDoc("user_assessments", ua.id, { answers: newAnswers, currentQuestion: req.body.questionIndex + 1 });
  res.json({ success: true });
});

app.post("/api/assessments/:id/complete", authMiddleware, async (req, res) => {
  const assessment = await findById("assessments", req.params.id);
  if (!assessment) return res.status(404).json({ error: "Assessment not found" });
  const ua = await (await col("user_assessments")).findOne({ userId: req.userId, assessmentId: req.params.id }, { projection: { _id: 0 } });
  if (!ua) return res.status(404).json({ error: "No active assessment" });

  let correct = 0;
  ua.answers.forEach((answer, idx) => { if (answer === assessment.questions[idx]?.correctAnswer) correct++; });
  const score = Math.round((correct / assessment.questions.length) * 100);
  await updateDoc("user_assessments", ua.id, { score, status: "completed", completedAt: new Date().toISOString(), currentQuestion: assessment.questions.length });
  res.json({ success: true, score });
});

app.get("/api/assessment-history", authMiddleware, async (req, res) => {
  const all = await findAll("user_assessments", { userId: req.userId });
  const completed = all.filter((ua) => ua.status === "completed" && ua.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  res.json(completed);
});

// ── Notifications ────────────────────────────────────────────────────
app.get("/api/notifications", authMiddleware, async (req, res) => {
  const notifs = (await findAll("notifications", { userId: req.userId }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifs);
});

app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
  const count = await (await col("notifications")).countDocuments({ userId: req.userId, read: false });
  res.json({ count });
});

app.put("/api/notifications/:id/read", authMiddleware, async (req, res) => {
  await updateDoc("notifications", req.params.id, { read: true });
  res.json({ success: true });
});

app.put("/api/notifications/read-all", authMiddleware, async (req, res) => {
  await (await col("notifications")).updateMany({ userId: req.userId }, { $set: { read: true } });
  res.json({ success: true });
});

app.delete("/api/notifications/:id", authMiddleware, async (req, res) => {
  await deleteDoc("notifications", req.params.id);
  res.json({ success: true });
});

// ── Career Goals ─────────────────────────────────────────────────────
app.get("/api/career-goals", authMiddleware, async (req, res) => {
  res.json(await findAll("career_goals", { userId: req.userId }));
});

app.post("/api/career-goals", authMiddleware, async (req, res) => {
  const { title, description, deadline, milestones } = req.body;
  if (!title) return res.status(400).json({ error: "Goal title is required" });
  let ms = [];
  if (typeof milestones === "string") {
    ms = milestones.split("\n").map((t) => t.trim()).filter(Boolean).map((text) => ({ id: randomUUID(), text, done: false }));
  } else if (Array.isArray(milestones)) {
    ms = milestones;
  }
  const goal = { id: randomUUID(), userId: req.userId, title, description: description || "", deadline: deadline || "", progress: 0, status: "in-progress", milestones: ms, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await insertDoc("career_goals", goal);
  res.json({ success: true });
});

app.post("/api/career-goals/:id/toggle-milestone", authMiddleware, async (req, res) => {
  const goal = await (await col("career_goals")).findOne({ id: req.params.id, userId: req.userId }, { projection: { _id: 0 } });
  if (!goal) return res.status(404).json({ error: "Goal not found" });
  const milestones = goal.milestones.map((m) => m.id === req.body.milestoneId ? { ...m, done: !m.done } : m);
  const doneCount = milestones.filter((m) => m.done).length;
  const progress = milestones.length > 0 ? Math.round((doneCount / milestones.length) * 100) : 0;
  await updateDoc("career_goals", req.params.id, { milestones, progress, status: progress >= 100 ? "completed" : "in-progress", updatedAt: new Date().toISOString() });
  res.json({ success: true });
});

app.delete("/api/career-goals/:id", authMiddleware, async (req, res) => {
  const goal = await (await col("career_goals")).findOne({ id: req.params.id, userId: req.userId });
  if (!goal) return res.status(404).json({ error: "Goal not found" });
  await deleteDoc("career_goals", req.params.id);
  res.json({ success: true });
});

// ── Admin ────────────────────────────────────────────────────────────
app.get("/api/admin/data", authMiddleware, async (req, res) => {
  const user = await findById("users", req.userId);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Not authorized" });

  const users = await findAll("users");
  const resumes = await findAll("resumes");
  const jobs = await findAll("jobs");
  const assessments = await findAll("user_assessments");
  const courses = await findAll("user_courses");
  const applications = await findAll("job_applications");

  const safeUsers = users.map(({ password: _, ...u }) => u);
  res.json({
    stats: { totalUsers: users.length, totalResumes: resumes.length, totalJobs: jobs.length, totalAssessments: assessments.length, totalCourses: courses.length, totalApplications: applications.length },
    users: safeUsers,
    recentUsers: safeUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    roleDistribution: { jobseekers: users.filter((u) => u.role === "jobseeker").length, recruiters: users.filter((u) => u.role === "recruiter").length, coaches: users.filter((u) => u.role === "coach").length, admins: users.filter((u) => u.role === "admin").length },
  });
});

app.put("/api/admin/users/:id/role", authMiddleware, async (req, res) => {
  const admin = await findById("users", req.userId);
  if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Not authorized" });
  await updateDoc("users", req.params.id, { role: req.body.role, updatedAt: new Date().toISOString() });
  res.json({ success: true });
});

app.delete("/api/admin/users/:id", authMiddleware, async (req, res) => {
  const admin = await findById("users", req.userId);
  if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Not authorized" });
  if (req.params.id === req.userId) return res.status(400).json({ error: "Cannot delete your own account" });
  await deleteDoc("users", req.params.id);
  res.json({ success: true });
});

// ── Resume Preview / Download / Upload / ATS (existing) ─────────────
app.post("/api/resume/preview", (req, res) => {
  try {
    const { resumeData, template } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
    const html = getTemplate(template || "modern")(resumeData);
    res.setHeader("Content-Type", "text/html"); res.send(html);
  } catch (err) { res.status(500).json({ error: "Failed to generate preview", details: err.message }); }
});

app.post("/api/resume/download", async (req, res) => {
  try {
    const { resumeData, template } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
    const html = getTemplate(template || "modern")(resumeData);
    const browser = await getBrowser(); const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
    await new Promise((r) => setTimeout(r, 300));
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: false });
    await page.close();
    const fileName = `${(resumeData.personalInfo?.name || "Resume").replace(/[^a-zA-Z0-9 ]/g, "_")}_Resume.pdf`;
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${fileName}"`, "Content-Length": Buffer.byteLength(pdf), "Cache-Control": "no-cache" });
    res.end(pdf);
  } catch (err) { console.error("PDF error:", err); res.status(500).json({ error: "Failed to generate PDF", details: err.message }); }
});

app.post("/api/resume/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(req.file.buffer);
    const parsed = parseResumeText(result.text);
    const atsScore = calculateATSScore(parsed);
    res.json({ success: true, data: parsed, atsScore, rawText: result.text });
  } catch (err) { console.error("Resume parse error:", err); res.status(500).json({ error: "Failed to parse resume", details: err.message }); }
});

app.post("/api/resume/ats-score", (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
    res.json(calculateATSScore(resumeData));
  } catch (err) { res.status(500).json({ error: "Failed to calculate ATS score", details: err.message }); }
});

// ── Job scraping / matching (existing) ──────────────────────────────
app.post("/api/job/scrape-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html", "Accept-Language": "en-US,en;q=0.5" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!response.ok) return res.status(400).json({ error: `Failed to fetch URL (${response.status})` });
    const html = await response.text();
    const cheerio = require("cheerio"); const $ = cheerio.load(html);
    $("script, style, nav, header, footer, iframe, noscript, svg, img, link, meta").remove();
    let jobTitle = "", companyName = "", jobDescription = "", location = "";
    for (const sel of ['h1[class*="job"]', 'h1[class*="title"]', ".job-title", ".jobTitle", "h1"]) { const el = $(sel).first(); if (el.length && el.text().trim().length > 3) { jobTitle = el.text().trim(); break; } }
    for (const sel of ['[class*="company"]', ".employer", ".companyName"]) { const el = $(sel).first(); if (el.length && el.text().trim().length > 1) { companyName = el.text().trim().substring(0, 100); break; } }
    for (const sel of ['[class*="description"]', '[class*="job-desc"]', "#job-description", "article", "main"]) { const el = $(sel).first(); if (el.length) { const t = el.text().replace(/\s+/g, " ").trim(); if (t.length > 100) { jobDescription = t; break; } } }
    if (!jobDescription) jobDescription = $("body").text().replace(/\s+/g, " ").trim();
    for (const sel of ['[class*="location"]', ".job-location"]) { const el = $(sel).first(); if (el.length && el.text().trim().length > 1 && el.text().trim().length < 100) { location = el.text().trim(); break; } }
    res.json({ success: true, data: { title: jobTitle.substring(0, 200), company: companyName.substring(0, 200), description: jobDescription.substring(0, 8000), location: location.substring(0, 100), url } });
  } catch (err) { res.status(500).json({ error: `Failed to scrape URL: ${err.message}` }); }
});

app.post("/api/job/match", (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData || !jobDescription) return res.status(400).json({ error: "resumeData and jobDescription are required" });
    res.json(matchResumeToJob(resumeData, jobDescription));
  } catch (err) { res.status(500).json({ error: "Failed to match resume", details: err.message }); }
});

app.post("/api/job/suggestions", (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
    res.json(generateSuggestedJobs(resumeData));
  } catch (err) { res.status(500).json({ error: "Failed to generate suggestions", details: err.message }); }
});

// ── Certificate PDF (existing) ──────────────────────────────────────
app.post("/api/certificate/download", async (req, res) => {
  try {
    const { userName, courseTitle, issuedAt, certificateId } = req.body;
    if (!userName || !courseTitle) return res.status(400).json({ error: "userName and courseTitle are required" });
    const html = generateCertificateHTML({ userName, courseTitle, issuedAt: issuedAt || new Date().toISOString(), certificateId: certificateId || "N/A" });
    const browser = await getBrowser(); const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
    await new Promise((r) => setTimeout(r, 300));
    const pdf = await page.pdf({ width: "297mm", height: "210mm", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, landscape: true });
    await page.close();
    const fileName = `${(userName || "Certificate").replace(/[^a-zA-Z0-9 ]/g, "_")}_Certificate.pdf`;
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${fileName}"`, "Content-Length": Buffer.byteLength(pdf), "Cache-Control": "no-cache" });
    res.end(pdf);
  } catch (err) { res.status(500).json({ error: "Failed to generate certificate", details: err.message }); }
});

app.post("/api/certificate/preview", (req, res) => {
  try {
    const { userName, courseTitle, issuedAt, certificateId } = req.body;
    const html = generateCertificateHTML({ userName, courseTitle: courseTitle || "Course", issuedAt: issuedAt || new Date().toISOString(), certificateId: certificateId || "N/A" });
    res.setHeader("Content-Type", "text/html"); res.send(html);
  } catch (err) { res.status(500).json({ error: "Failed", details: err.message }); }
});

// ── Start ────────────────────────────────────────────────────────────
process.on("SIGINT", async () => { if (browserInstance) await browserInstance.close(); process.exit(); });

app.listen(PORT, () => {
  console.log(`\n  CareerBuilder Backend Server`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  All API endpoints ready\n`);
});
