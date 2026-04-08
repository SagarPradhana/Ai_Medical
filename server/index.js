import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { access, readFile, writeFile } from "node:fs/promises";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production";
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || "8h";
const DB_FILE = join(dirname(fileURLToPath(import.meta.url)), "db.json");
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "ai_medical_portal";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "";
const USE_MONGODB = Boolean(MONGODB_URI);

let mongoClient = null;
let mongoDb = null;

const allowedOrigins = CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors(
    allowedOrigins.length
      ? {
          origin: allowedOrigins,
          credentials: true
        }
      : {}
  )
);
app.use(express.json());

function syncCollection(target, source) {
  target.splice(0, target.length, ...source);
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const doctors = [];
const patients = [];
const appointments = [];
const liveSessions = [];
const medicalRecords = [];
const users = [];

const roles = [
  { id: "role-admin", name: "admin", description: "Platform administrator", isSystem: true },
  { id: "role-doctor", name: "doctor", description: "Clinical provider", isSystem: true },
  { id: "role-patient", name: "patient", description: "Patient account", isSystem: true }
];

const permissionEntries = [
  { id: "perm-1", role: "admin", resource: "doctor", actions: ["create", "read", "update", "delete"] },
  { id: "perm-2", role: "admin", resource: "patient", actions: ["create", "read", "update", "delete"] },
  { id: "perm-3", role: "admin", resource: "appointment", actions: ["create", "read", "update", "delete"] },
  { id: "perm-4", role: "admin", resource: "rbac", actions: ["create", "read", "update", "delete"] },
  { id: "perm-5", role: "doctor", resource: "doctor", actions: ["read", "update"] },
  { id: "perm-6", role: "doctor", resource: "patient", actions: ["create", "read", "update", "delete"] },
  { id: "perm-7", role: "doctor", resource: "appointment", actions: ["create", "read", "update", "delete"] },
  { id: "perm-8", role: "patient", resource: "doctor", actions: ["read"] },
  { id: "perm-9", role: "patient", resource: "patient", actions: ["read", "update"] },
  { id: "perm-10", role: "patient", resource: "appointment", actions: ["create", "read", "update", "delete"] },
  { id: "perm-11", role: "admin", resource: "session", actions: ["create", "read", "update", "delete"] },
  { id: "perm-12", role: "doctor", resource: "session", actions: ["create", "read", "update"] },
  { id: "perm-13", role: "patient", resource: "session", actions: ["create", "read", "update"] },
  { id: "perm-14", role: "admin", resource: "record", actions: ["create", "read", "update", "delete"] },
  { id: "perm-15", role: "doctor", resource: "record", actions: ["create", "read", "update", "delete"] },
  { id: "perm-16", role: "patient", resource: "record", actions: ["read"] }
];

const requiredPermissionSeeds = [
  { role: "admin", resource: "session", actions: ["create", "read", "update", "delete"] },
  { role: "doctor", resource: "session", actions: ["create", "read", "update"] },
  { role: "patient", resource: "session", actions: ["create", "read", "update"] },
  { role: "admin", resource: "record", actions: ["create", "read", "update", "delete"] },
  { role: "doctor", resource: "record", actions: ["create", "read", "update", "delete"] },
  { role: "patient", resource: "record", actions: ["read"] }
];

function dbSnapshot() {
  return {
    doctors,
    patients,
    appointments,
    liveSessions,
    medicalRecords,
    users,
    roles,
    permissionEntries
  };
}

const collectionMap = {
  doctors,
  patients,
  appointments,
  liveSessions,
  medicalRecords,
  users,
  roles,
  permissionEntries
};

async function connectMongo() {
  if (!USE_MONGODB) {
    return;
  }

  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 1
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB_NAME);
    console.log(`Connected to MongoDB Atlas database: ${MONGODB_DB_NAME}`);
  } catch (error) {
    console.error("MongoDB connection failed. Falling back to db.json.", error.message);
    mongoClient = null;
    mongoDb = null;
  }
}

async function ensureMongoIndexes() {
  if (!mongoDb) {
    return;
  }

  try {
    await mongoDb.collection("users").createIndex({ email: 1 }, { unique: true });
    await mongoDb.collection("roles").createIndex({ name: 1 }, { unique: true });
    await mongoDb
      .collection("permissionEntries")
      .createIndex({ role: 1, resource: 1 }, { unique: true });
    await mongoDb.collection("appointments").createIndex({ patientId: 1, date: 1, time: 1 });
    await mongoDb.collection("liveSessions").createIndex({ appointmentId: 1, status: 1 });
    await mongoDb.collection("medicalRecords").createIndex({ patientId: 1, date: -1 });
  } catch (error) {
    console.error("Failed to ensure MongoDB indexes:", error.message);
  }
}

async function persistMongo() {
  if (!mongoDb) {
    return;
  }

  try {
    const entries = Object.entries(collectionMap);
    await Promise.all(
      entries.map(async ([collectionName, records]) => {
        const collection = mongoDb.collection(collectionName);
        await collection.deleteMany({});
        if (records.length > 0) {
          await collection.insertMany(records);
        }
      })
    );
  } catch (error) {
    console.error("Failed to persist MongoDB collections:", error.message);
  }
}

async function loadMongoCollections() {
  if (!mongoDb) {
    return;
  }

  try {
    const entries = Object.entries(collectionMap);
    const loaded = await Promise.all(
      entries.map(async ([collectionName]) => {
        const docs = await mongoDb.collection(collectionName).find({}, { projection: { _id: 0 } }).toArray();
        return [collectionName, docs];
      })
    );

    const hasAnyData = loaded.some(([, docs]) => docs.length > 0);
    if (!hasAnyData) {
      await persistMongo();
      return;
    }

    loaded.forEach(([collectionName, docs]) => {
      if (Array.isArray(docs)) {
        syncCollection(collectionMap[collectionName], docs);
      }
    });
  } catch (error) {
    console.error("Failed to load MongoDB collections:", error.message);
  }
}

async function persistDb() {
  try {
    await writeFile(DB_FILE, JSON.stringify(dbSnapshot(), null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to persist db.json:", error.message);
  }

  await persistMongo();
}

async function initializeDb() {
  if (!USE_MONGODB) {
    try {
      await access(DB_FILE);
      const raw = await readFile(DB_FILE, "utf-8");
      const payload = JSON.parse(raw);

      if (Array.isArray(payload.doctors)) syncCollection(doctors, payload.doctors);
      if (Array.isArray(payload.patients)) syncCollection(patients, payload.patients);
      if (Array.isArray(payload.appointments)) syncCollection(appointments, payload.appointments);
      if (Array.isArray(payload.liveSessions)) syncCollection(liveSessions, payload.liveSessions);
      if (Array.isArray(payload.medicalRecords)) syncCollection(medicalRecords, payload.medicalRecords);
      if (Array.isArray(payload.users)) syncCollection(users, payload.users);
      if (Array.isArray(payload.roles)) syncCollection(roles, payload.roles);
      if (Array.isArray(payload.permissionEntries)) {
        syncCollection(permissionEntries, payload.permissionEntries);
      }
    } catch (_error) {
      await persistDb();
    }
  }

  await connectMongo();
  await ensureMongoIndexes();
  await loadMongoCollections();

  requiredPermissionSeeds.forEach((seed) => {
    const existing = permissionEntries.find(
      (item) => item.role === seed.role && item.resource === seed.resource
    );
    if (!existing) {
      permissionEntries.push({ id: createId("perm"), ...seed });
      return;
    }
    existing.actions = [...new Set([...(existing.actions || []), ...seed.actions])];
  });

  const initAdminEmail = process.env.INIT_ADMIN_EMAIL?.toLowerCase().trim();
  const initAdminPassword = process.env.INIT_ADMIN_PASSWORD || "";
  const initAdminName = process.env.INIT_ADMIN_NAME || "Platform Admin";
  if (initAdminEmail && initAdminPassword) {
    const existingAdmin = users.find((item) => item.email === initAdminEmail);
    if (!existingAdmin) {
      users.push({
        id: createId("u"),
        name: initAdminName,
        email: initAdminEmail,
        role: "admin",
        passwordHash: bcrypt.hashSync(initAdminPassword, 10),
        doctorRef: null,
        patientRef: null
      });
    }
  }

  await persistDb();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    doctorRef: user.doctorRef,
    patientRef: user.patientRef
  };
}

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      doctorRef: user.doctorRef,
      patientRef: user.patientRef
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function getRole(name) {
  return roles.find((item) => item.name === name);
}

function getPermissionsByRole(role) {
  const map = {};
  permissionEntries
    .filter((entry) => entry.role === role)
    .forEach((entry) => {
      map[entry.resource] = [...entry.actions];
    });
  return map;
}

function hasPermission(role, resource, action) {
  const match = permissionEntries.find(
    (entry) => entry.role === role && entry.resource === resource
  );
  return Boolean(match?.actions?.includes(action));
}

function requirePermission(resource, action) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role || !hasPermission(role, resource, action)) {
      return res.status(403).json({ error: `Permission denied for ${resource}:${action}` });
    }
    return next();
  };
}

const diseaseProfiles = [
  {
    disease: "Common Cold",
    symptoms: ["cough", "sore throat", "runny nose", "sneezing", "mild fever"],
    risk: "Low",
    recommendation:
      "Hydrate, rest, and monitor symptoms. Consult a doctor if symptoms persist beyond a week."
  },
  {
    disease: "Influenza (Flu)",
    symptoms: ["fever", "cough", "fatigue", "body ache", "headache", "chills"],
    risk: "Medium",
    recommendation:
      "Rest, fluids, and medical review if high fever or breathing difficulty develops."
  },
  {
    disease: "Migraine",
    symptoms: ["headache", "nausea", "vomiting", "light sensitivity", "dizziness"],
    risk: "Low",
    recommendation:
      "Reduce screen/light exposure, hydrate, and seek clinical care for recurrent severe episodes."
  },
  {
    disease: "Gastroenteritis",
    symptoms: ["stomach pain", "vomiting", "diarrhea", "nausea", "fever"],
    risk: "Medium",
    recommendation:
      "Oral rehydration is key. Seek urgent care if dehydration signs appear."
  },
  {
    disease: "Possible Cardio-Respiratory Emergency",
    symptoms: ["chest pain", "shortness of breath", "sweating", "dizziness", "palpitations"],
    risk: "High",
    recommendation:
      "Seek emergency medical attention immediately, especially if symptoms are sudden or severe."
  },
  {
    disease: "Allergic Rhinitis",
    symptoms: ["sneezing", "runny nose", "itchy eyes", "nasal congestion", "cough"],
    risk: "Low",
    recommendation:
      "Avoid known allergens and consider physician-guided antihistamine support."
  }
];

const symptomAliases = {
  fever: ["fever", "high temperature", "temperature", "hot body"],
  cough: ["cough", "dry cough", "wet cough"],
  headache: ["headache", "head pain"],
  fatigue: ["fatigue", "tired", "weakness", "exhausted"],
  "body ache": ["body ache", "body pain", "muscle pain"],
  chills: ["chills", "shivering"],
  "sore throat": ["sore throat", "throat pain"],
  "runny nose": ["runny nose", "nose running"],
  sneezing: ["sneezing", "sneeze"],
  nausea: ["nausea", "queasy"],
  vomiting: ["vomiting", "throwing up", "vomit"],
  diarrhea: ["diarrhea", "loose motion", "loose stool"],
  "stomach pain": ["stomach pain", "abdominal pain", "belly pain"],
  dizziness: ["dizziness", "lightheaded"],
  "light sensitivity": ["light sensitivity", "sensitive to light"],
  "chest pain": ["chest pain", "chest tightness", "pain in chest"],
  "shortness of breath": ["shortness of breath", "breathless", "breathing difficulty"],
  sweating: ["sweating", "cold sweat"],
  palpitations: ["palpitations", "rapid heartbeat", "heart racing"],
  "itchy eyes": ["itchy eyes", "eye itching"],
  "nasal congestion": ["nasal congestion", "blocked nose", "stuffy nose"],
  "mild fever": ["mild fever", "slight fever"]
};

function extractSymptoms(text = "") {
  const input = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const found = new Set();

  for (const [canonical, aliases] of Object.entries(symptomAliases)) {
    for (const alias of aliases) {
      const pattern = new RegExp(`\\b${alias.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (pattern.test(input)) {
        found.add(canonical);
        break;
      }
    }
  }

  return [...found];
}

function predictDisease(extractedSymptoms) {
  if (!extractedSymptoms.length) {
    return {
      disease: "Insufficient Symptom Data",
      confidence: 0,
      risk: "Unknown",
      recommendation:
        "Please describe specific symptoms such as fever, cough, headache, pain location, or duration."
    };
  }

  const scored = diseaseProfiles.map((profile) => {
    const matched = profile.symptoms.filter((symptom) => extractedSymptoms.includes(symptom));
    const score = matched.length / profile.symptoms.length;
    return { ...profile, matchedCount: matched.length, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  const confidence = Math.min(99, Math.round(best.score * 100 + Math.min(best.matchedCount * 4, 14)));

  if (best.matchedCount === 0) {
    return {
      disease: "General Viral or Non-Specific Condition",
      confidence: 18,
      risk: "Low",
      recommendation:
        "Monitor symptoms and consult a healthcare professional for accurate diagnosis."
    };
  }

  return {
    disease: best.disease,
    confidence,
    risk: best.risk,
    recommendation: best.recommendation
  };
}

function buildMedicalReply(extractedSymptoms, prediction) {
  const symptomLine =
    extractedSymptoms.length > 0
      ? `I identified these symptoms: ${extractedSymptoms.join(", ")}.`
      : "I could not confidently identify symptoms from your message.";

  const emergencyLine =
    prediction.risk === "High"
      ? "Your symptoms may indicate a serious condition. Please seek immediate medical attention."
      : "If symptoms worsen or persist, please contact a healthcare professional.";

  return `${symptomLine} Preliminary prediction: ${prediction.disease} (${prediction.confidence}% confidence, ${prediction.risk} risk). ${prediction.recommendation} ${emergencyLine}`;
}

function toISODate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const ref = new Date();
  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) return false;
  const diff = ref.getTime() - dt.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ai-medical-diagnosis-chatbot-api",
    storage: USE_MONGODB && mongoDb ? "mongodb-atlas" : "db-json"
  });
});

app.get("/api/dashboard/overview", authenticateToken, (req, res) => {
  const today = toISODate(new Date());
  const visibleAppointments =
    req.auth.role === "patient"
      ? appointments.filter((item) => item.patientId === req.auth.patientRef)
      : req.auth.role === "doctor"
        ? appointments.filter((item) => item.doctorId === req.auth.doctorRef)
        : appointments;

  const totalPatients = patients.length;
  const highRisk = patients.filter((item) => item.risk === "High").length;
  const visitsToday = visibleAppointments.filter((item) => item.date === today).length;
  const newPatients = patients.filter((item) => isWithinDays(item.nextVisit || today, 7)).length;

  const triageQueue = visibleAppointments
    .filter((item) => item.status === "Pending" || item.status === "Confirmed")
    .slice(0, 8)
    .map((item) => ({
      patient: item.patientId,
      symptom: patients.find((p) => p.id === item.patientId)?.condition || "General review",
      severity: patients.find((p) => p.id === item.patientId)?.risk || "Low",
      eta: item.time || "--:--",
      status: item.status
    }));

  const byDay = {};
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    byDay[toISODate(date)] = 0;
  }
  visibleAppointments.forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(byDay, item.date)) {
      byDay[item.date] += 1;
    }
  });
  const appointmentTrend = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  const riskDistribution = ["High", "Medium", "Low"].map((label) => ({
    label,
    value: patients.filter((item) => item.risk === label).length
  }));

  const doctorAvailability = [
    { label: "On Duty", value: doctors.filter((item) => item.status === "On Duty").length },
    { label: "On Leave", value: doctors.filter((item) => item.status === "On Leave").length }
  ];

  return res.json({
    stats: { totalPatients, highRisk, visitsToday, newPatients },
    triageQueue,
    appointmentTrend,
    riskDistribution,
    doctorAvailability
  });
});

app.get("/api/analytics/overview", authenticateToken, (req, res) => {
  const days = Number(req.query.days || 7);
  const department = String(req.query.department || "All Departments");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filteredAppointments = appointments.filter((item) => {
    const dt = new Date(item.date);
    if (Number.isNaN(dt.getTime())) return false;
    const inRange = dt >= cutoff;
    if (!inRange) return false;
    if (department === "All Departments") return true;
    const doctor = doctors.find((d) => d.id === item.doctorId);
    return (doctor?.specialization || "General") === department;
  });

  const totalPatients = patients.length;
  const totalAppointments = filteredAppointments.length;
  const completedAppointments = filteredAppointments.filter((a) => a.status === "Completed").length;
  const avgConsultTime = liveSessions.length
    ? Math.round(
        liveSessions
          .filter((s) => s.startedAt && s.endedAt)
          .reduce((acc, s) => acc + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000, 0) /
          Math.max(1, liveSessions.filter((s) => s.startedAt && s.endedAt).length)
      )
    : 0;

  const riskByLabel = ["High", "Medium", "Low"].map((label) => ({
    label,
    value: patients.filter((p) => p.risk === label).length
  }));

  const departmentUtilization = doctors.reduce((acc, doc) => {
    const key = doc.specialization || "General";
    if (!acc[key]) {
      acc[key] = { department: key, used: 0 };
    }
    acc[key].used += doc.status === "On Duty" ? 1 : 0;
    return acc;
  }, {});
  const departmentPerformance = Object.values(departmentUtilization).map((row) => ({
    ...row,
    used: Math.min(100, row.used * 20)
  }));

  const symptomTrend = ["Respiratory", "Fever", "Gastro"].map((label) => ({
    label,
    value:
      label === "Respiratory"
        ? patients.filter((p) => /cough|breath|resp/i.test(p.condition || "")).length
        : label === "Fever"
          ? patients.filter((p) => /fever/i.test(p.condition || "")).length
          : patients.filter((p) => /stomach|gastro|diarrhea|vomit/i.test(p.condition || "")).length
  }));

  return res.json({
    kpis: {
      totalPatients,
      totalAppointments,
      aiAccuracy: totalAppointments ? Math.max(60, Math.min(99, Math.round((completedAppointments / Math.max(1, totalAppointments)) * 100))) : 0,
      avgConsultTime
    },
    symptomTrend,
    departmentPerformance,
    appointmentTrend: filteredAppointments,
    riskDistribution: riskByLabel,
    aiInsights: [
      "Insight based on live operational data",
      "Department load calculated from current doctor availability",
      "Appointment completion trend sourced from actual records"
    ]
  });
});

app.get("/api/medical-records", authenticateToken, requirePermission("record", "read"), (req, res) => {
  if (req.auth.role === "patient") {
    return res.json({ data: medicalRecords.filter((item) => item.patientId === req.auth.patientRef) });
  }
  if (req.auth.role === "doctor") {
    return res.json({ data: medicalRecords.filter((item) => item.doctorId === req.auth.doctorRef) });
  }
  return res.json({ data: medicalRecords });
});

app.post("/api/medical-records", authenticateToken, requirePermission("record", "create"), (req, res) => {
  const { patientId, doctorId, type, category, date, status, encrypted, notes } = req.body ?? {};
  if (!patientId || !doctorId || !type) {
    return res.status(400).json({ error: "patientId, doctorId and type are required" });
  }
  const patient = patients.find((p) => p.id === patientId);
  const doctor = doctors.find((d) => d.id === doctorId);
  if (!patient || !doctor) {
    return res.status(400).json({ error: "Invalid patientId or doctorId" });
  }
  const next = {
    id: createId("mr"),
    patientId,
    patientName: patient.name,
    doctorId,
    doctorName: doctor.name,
    type,
    category: category || "Notes",
    date: date || toISODate(new Date()),
    status: status || "Pending",
    encrypted: Boolean(encrypted),
    notes: notes || ""
  };
  medicalRecords.push(next);
  persistDb();
  return res.status(201).json({ data: next });
});

app.get("/api/rbac/my-permissions", authenticateToken, (req, res) => {
  return res.json({ role: req.auth.role, permissions: getPermissionsByRole(req.auth.role) });
});

app.get("/api/rbac/roles", authenticateToken, requirePermission("rbac", "read"), (_req, res) => {
  return res.json({ data: roles });
});

app.post("/api/rbac/roles", authenticateToken, requirePermission("rbac", "create"), (req, res) => {
  const { name, description } = req.body ?? {};
  if (!name) {
    return res.status(400).json({ error: "Role name is required" });
  }
  const normalized = String(name).toLowerCase().trim();
  if (!/^[a-z0-9_-]+$/.test(normalized)) {
    return res.status(400).json({ error: "Role name must contain only a-z, 0-9, _ or -" });
  }
  if (roles.some((item) => item.name === normalized)) {
    return res.status(409).json({ error: "Role already exists" });
  }

  const next = {
    id: createId("role"),
    name: normalized,
    description: description || "",
    isSystem: false
  };
  roles.push(next);
  persistDb();
  return res.status(201).json({ data: next });
});

app.put("/api/rbac/roles/:id", authenticateToken, requirePermission("rbac", "update"), (req, res) => {
  const { id } = req.params;
  const { description } = req.body ?? {};
  const idx = roles.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Role not found" });
  }
  roles[idx] = { ...roles[idx], description: description ?? roles[idx].description };
  persistDb();
  return res.json({ data: roles[idx] });
});

app.delete("/api/rbac/roles/:id", authenticateToken, requirePermission("rbac", "delete"), (req, res) => {
  const { id } = req.params;
  const idx = roles.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Role not found" });
  }
  if (roles[idx].isSystem) {
    return res.status(400).json({ error: "System roles cannot be deleted" });
  }
  if (users.some((user) => user.role === roles[idx].name)) {
    return res.status(400).json({ error: "Role is assigned to existing users" });
  }

  const removedRole = roles.splice(idx, 1)[0];
  for (let i = permissionEntries.length - 1; i >= 0; i -= 1) {
    if (permissionEntries[i].role === removedRole.name) {
      permissionEntries.splice(i, 1);
    }
  }
  persistDb();
  return res.json({ data: removedRole });
});

app.get("/api/rbac/permissions", authenticateToken, requirePermission("rbac", "read"), (_req, res) => {
  return res.json({ data: permissionEntries });
});

app.post("/api/rbac/permissions", authenticateToken, requirePermission("rbac", "create"), (req, res) => {
  const { role, resource, actions } = req.body ?? {};
  if (!role || !resource || !Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ error: "role, resource, actions[] are required" });
  }
  if (!getRole(role)) {
    return res.status(400).json({ error: "Role does not exist" });
  }
  if (permissionEntries.some((item) => item.role === role && item.resource === resource)) {
    return res.status(409).json({ error: "Permission entry already exists for this role/resource" });
  }

  const next = {
    id: createId("perm"),
    role,
    resource,
    actions: [...new Set(actions)]
  };
  permissionEntries.push(next);
  persistDb();
  return res.status(201).json({ data: next });
});

app.put("/api/rbac/permissions/:id", authenticateToken, requirePermission("rbac", "update"), (req, res) => {
  const { id } = req.params;
  const { actions, resource } = req.body ?? {};
  const idx = permissionEntries.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Permission entry not found" });
  }

  if (resource && resource !== permissionEntries[idx].resource) {
    const exists = permissionEntries.some(
      (item) =>
        item.id !== id &&
        item.role === permissionEntries[idx].role &&
        item.resource === resource
    );
    if (exists) {
      return res.status(409).json({ error: "Role/resource combination already exists" });
    }
  }

  permissionEntries[idx] = {
    ...permissionEntries[idx],
    resource: resource || permissionEntries[idx].resource,
    actions: Array.isArray(actions) ? [...new Set(actions)] : permissionEntries[idx].actions
  };
  persistDb();
  return res.json({ data: permissionEntries[idx] });
});

app.delete("/api/rbac/permissions/:id", authenticateToken, requirePermission("rbac", "delete"), (req, res) => {
  const { id } = req.params;
  const idx = permissionEntries.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Permission entry not found" });
  }
  const removed = permissionEntries.splice(idx, 1)[0];
  persistDb();
  return res.json({ data: removed });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, role are required" });
  }

  if (!["doctor", "patient"].includes(role)) {
    return res.status(400).json({ error: "role must be doctor or patient" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const exists = users.some((user) => user.email === normalizedEmail);
  if (exists) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const baseUser = {
    id: createId("u"),
    name,
    email: normalizedEmail,
    role,
    passwordHash,
    doctorRef: null,
    patientRef: null
  };

  if (role === "doctor") {
    const doctorId = createId("doc");
    doctors.push({
      id: doctorId,
      name,
      specialization: "General Medicine",
      experience: 1,
      status: "On Duty",
      email: normalizedEmail,
      phone: ""
    });
    baseUser.doctorRef = doctorId;
  }

  if (role === "patient") {
    const patientId = createId("pat");
    patients.push({
      id: patientId,
      name,
      age: 0,
      gender: "Unknown",
      risk: "Low",
      status: "New",
      nextVisit: "",
      email: normalizedEmail,
      condition: "Not Assigned"
    });
    baseUser.patientRef = patientId;
  }

  users.push(baseUser);
  persistDb();
  const token = issueToken(baseUser);
  return res.status(201).json({
    token,
    user: sanitizeUser(baseUser),
    permissions: getPermissionsByRole(baseUser.role)
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = users.find((candidate) => candidate.email === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (role && role !== user.role) {
    return res.status(403).json({ error: "Selected role does not match account role" });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = issueToken(user);
  return res.json({
    token,
    user: sanitizeUser(user),
    permissions: getPermissionsByRole(user.role)
  });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email, newPassword } = req.body ?? {};

  if (!email || !newPassword) {
    return res.status(400).json({ error: "email and newPassword are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = users.find((candidate) => candidate.email === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  persistDb();
  return res.json({ message: "Password reset successful. Please login with your new password." });
});

app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body ?? {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "oldPassword and newPassword are required" });
  }

  const user = users.find((item) => item.id === req.auth.sub);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  persistDb();
  return res.json({ message: "Password changed successfully." });
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  const user = users.find((item) => item.id === req.auth.sub);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user: sanitizeUser(user), permissions: getPermissionsByRole(user.role) });
});

app.get("/api/rbac/users", authenticateToken, requirePermission("rbac", "read"), (_req, res) => {
  const safeUsers = users.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    doctorRef: item.doctorRef,
    patientRef: item.patientRef
  }));
  return res.json({ data: safeUsers });
});

app.put("/api/rbac/users/:id/role", authenticateToken, requirePermission("rbac", "update"), (req, res) => {
  const { id } = req.params;
  const { role } = req.body ?? {};
  if (!role) {
    return res.status(400).json({ error: "role is required" });
  }

  const userIdx = users.findIndex((item) => item.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!getRole(role)) {
    return res.status(400).json({ error: "Role does not exist" });
  }

  const target = users[userIdx];
  const next = { ...target, role };

  if (role !== "doctor") {
    next.doctorRef = null;
  } else if (!next.doctorRef) {
    const doctor = doctors.find((item) => item.email === next.email);
    if (doctor) {
      next.doctorRef = doctor.id;
    }
  }

  if (role !== "patient") {
    next.patientRef = null;
  } else if (!next.patientRef) {
    const patient = patients.find((item) => item.email === next.email);
    if (patient) {
      next.patientRef = patient.id;
    }
  }

  users[userIdx] = next;
  persistDb();
  return res.json({
    data: sanitizeUser(next),
    permissions: getPermissionsByRole(next.role)
  });
});

app.get("/api/doctors", authenticateToken, requirePermission("doctor", "read"), (_req, res) => {
  return res.json({ data: doctors });
});

app.post("/api/doctors", authenticateToken, requirePermission("doctor", "create"), (req, res) => {
  const { name, specialization, experience, status, email, phone } = req.body ?? {};
  if (!name) {
    return res.status(400).json({ error: "Doctor name is required" });
  }

  const next = {
    id: createId("doc"),
    name,
    specialization: specialization || "General Medicine",
    experience: Number(experience || 0),
    status: status || "On Duty",
    email: email || "",
    phone: phone || ""
  };
  doctors.push(next);
  persistDb();
  return res.status(201).json({ data: next });
});

app.put("/api/doctors/:id", authenticateToken, requirePermission("doctor", "update"), (req, res) => {
  const { id } = req.params;
  const idx = doctors.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Doctor not found" });
  }

  if (req.auth.role === "doctor" && req.auth.doctorRef !== id) {
    return res.status(403).json({ error: "Doctors can update only their own profile" });
  }

  doctors[idx] = { ...doctors[idx], ...req.body };
  persistDb();
  return res.json({ data: doctors[idx] });
});

app.delete("/api/doctors/:id", authenticateToken, requirePermission("doctor", "delete"), (req, res) => {
  const { id } = req.params;
  const idx = doctors.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Doctor not found" });
  }
  const removed = doctors.splice(idx, 1)[0];
  persistDb();
  return res.json({ data: removed });
});

app.get("/api/patients", authenticateToken, requirePermission("patient", "read"), (req, res) => {
  if (req.auth.role === "patient") {
    const own = patients.find((item) => item.id === req.auth.patientRef);
    return res.json({ data: own ? [own] : [] });
  }
  return res.json({ data: patients });
});

app.post("/api/patients", authenticateToken, requirePermission("patient", "create"), (req, res) => {
  const { name, age, gender, risk, status, nextVisit, email, condition } = req.body ?? {};
  if (!name) {
    return res.status(400).json({ error: "Patient name is required" });
  }

  const next = {
    id: createId("pat"),
    name,
    age: Number(age || 0),
    gender: gender || "Unknown",
    risk: risk || "Low",
    status: status || "New",
    nextVisit: nextVisit || "",
    email: email || "",
    condition: condition || "Not Assigned"
  };
  patients.push(next);
  persistDb();
  return res.status(201).json({ data: next });
});

app.put("/api/patients/:id", authenticateToken, requirePermission("patient", "update"), (req, res) => {
  const { id } = req.params;
  const idx = patients.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  if (req.auth.role === "patient" && req.auth.patientRef !== id) {
    return res.status(403).json({ error: "Patients can update only their own profile" });
  }

  patients[idx] = { ...patients[idx], ...req.body };
  persistDb();
  return res.json({ data: patients[idx] });
});

app.delete("/api/patients/:id", authenticateToken, requirePermission("patient", "delete"), (req, res) => {
  const { id } = req.params;
  const idx = patients.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }
  const removed = patients.splice(idx, 1)[0];
  persistDb();
  return res.json({ data: removed });
});

app.get("/api/appointments", authenticateToken, requirePermission("appointment", "read"), (req, res) => {
  if (req.auth.role === "patient") {
    return res.json({ data: appointments.filter((item) => item.patientId === req.auth.patientRef) });
  }
  return res.json({ data: appointments });
});

app.post("/api/appointments", authenticateToken, requirePermission("appointment", "create"), (req, res) => {
  const { patientId, doctorId, date, time, mode, status } = req.body ?? {};

  if (!doctorId || !date || !time) {
    return res.status(400).json({ error: "doctorId, date, time are required" });
  }

  const doctor = doctors.find((item) => item.id === doctorId);
  if (!doctor) {
    return res.status(400).json({ error: "Invalid doctorId" });
  }

  let resolvedPatient = null;
  if (req.auth.role === "patient") {
    resolvedPatient = patients.find((item) => item.id === req.auth.patientRef);
  } else {
    resolvedPatient = patients.find((item) => item.id === patientId);
  }

  if (!resolvedPatient) {
    return res.status(400).json({ error: "Invalid patientId" });
  }

  const next = {
    id: createId("apt"),
    patientId: resolvedPatient.id,
    patientName: resolvedPatient.name,
    doctorId: doctor.id,
    doctorName: doctor.name,
    date,
    time,
    mode: mode || "In-person",
    status: status || "Pending"
  };
  appointments.push(next);
  persistDb();
  return res.status(201).json({ data: next });
});

app.put("/api/appointments/:id", authenticateToken, requirePermission("appointment", "update"), (req, res) => {
  const { id } = req.params;
  const idx = appointments.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  if (req.auth.role === "patient" && appointments[idx].patientId !== req.auth.patientRef) {
    return res.status(403).json({ error: "Patients can update only their own appointments" });
  }

  const incoming = { ...req.body };
  if (incoming.doctorId) {
    const doctor = doctors.find((item) => item.id === incoming.doctorId);
    if (!doctor) {
      return res.status(400).json({ error: "Invalid doctorId" });
    }
    incoming.doctorName = doctor.name;
  }

  appointments[idx] = { ...appointments[idx], ...incoming };
  persistDb();
  return res.json({ data: appointments[idx] });
});

app.delete("/api/appointments/:id", authenticateToken, requirePermission("appointment", "delete"), (req, res) => {
  const { id } = req.params;
  const idx = appointments.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  if (req.auth.role === "patient" && appointments[idx].patientId !== req.auth.patientRef) {
    return res.status(403).json({ error: "Patients can delete only their own appointments" });
  }

  const removed = appointments.splice(idx, 1)[0];
  persistDb();
  return res.json({ data: removed });
});

function canAccessSession(auth, session) {
  if (auth.role === "admin") return true;
  if (auth.role === "doctor") return session.doctorId === auth.doctorRef;
  if (auth.role === "patient") return session.patientId === auth.patientRef;
  return false;
}

app.get("/api/live-sessions", authenticateToken, requirePermission("session", "read"), (req, res) => {
  if (req.auth.role === "admin") {
    return res.json({ data: liveSessions });
  }
  return res.json({ data: liveSessions.filter((item) => canAccessSession(req.auth, item)) });
});

app.post("/api/live-sessions", authenticateToken, requirePermission("session", "create"), (req, res) => {
  const { appointmentId } = req.body ?? {};
  if (!appointmentId) {
    return res.status(400).json({ error: "appointmentId is required" });
  }

  const appointment = appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  if (req.auth.role === "doctor" && appointment.doctorId !== req.auth.doctorRef) {
    return res.status(403).json({ error: "Doctors can create sessions only for own appointments" });
  }
  if (req.auth.role === "patient" && appointment.patientId !== req.auth.patientRef) {
    return res.status(403).json({ error: "Patients can create sessions only for own appointments" });
  }

  const existing = liveSessions.find(
    (item) => item.appointmentId === appointment.id && item.status !== "Ended"
  );
  if (existing) {
    return res.json({
      data: existing,
      message: "Existing active session returned for this appointment"
    });
  }

  const next = {
    id: createId("ses"),
    appointmentId: appointment.id,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctorName,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    roomCode: `AIMED-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "Active",
    startedAt: new Date().toISOString(),
    endedAt: null,
    messages: []
  };
  liveSessions.push(next);
  persistDb();
  return res.status(201).json({ data: next });
});

app.put("/api/live-sessions/:id", authenticateToken, requirePermission("session", "update"), (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  const idx = liveSessions.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Session not found" });
  }
  if (!canAccessSession(req.auth, liveSessions[idx])) {
    return res.status(403).json({ error: "Not allowed for this session" });
  }

  const nextStatus = status || liveSessions[idx].status;
  liveSessions[idx] = {
    ...liveSessions[idx],
    status: nextStatus,
    endedAt: nextStatus === "Ended" ? new Date().toISOString() : liveSessions[idx].endedAt
  };
  persistDb();
  return res.json({ data: liveSessions[idx] });
});

app.post("/api/live-sessions/:id/messages", authenticateToken, requirePermission("session", "update"), (req, res) => {
  const { id } = req.params;
  const { text } = req.body ?? {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  const session = liveSessions.find((item) => item.id === id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  if (!canAccessSession(req.auth, session)) {
    return res.status(403).json({ error: "Not allowed for this session" });
  }

  const sender = users.find((item) => item.id === req.auth.sub);
  session.messages.push({
    id: createId("msg"),
    senderRole: req.auth.role,
    senderName: sender?.name || req.auth.name || "User",
    text: String(text).trim(),
    timestamp: new Date().toISOString()
  });
  persistDb();
  return res.status(201).json({ data: session });
});

app.post("/api/chat", authenticateToken, (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid request. A text `message` field is required." });
  }

  const extractedSymptoms = extractSymptoms(message);
  const prediction = predictDisease(extractedSymptoms);
  const reply = buildMedicalReply(extractedSymptoms, prediction);

  return res.json({
    reply,
    extractedSymptoms,
    prediction,
    timestamp: new Date().toISOString(),
    disclaimer:
      "This output is educational and not a clinical diagnosis. Consult a licensed medical professional."
  });
});

await initializeDb();

const server = app.listen(PORT, () => {
  console.log(`AI Medical chatbot server running on http://localhost:${PORT}`);
});

async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down server...`);
  server.close(async () => {
    if (mongoClient) {
      try {
        await mongoClient.close();
        console.log("MongoDB connection closed.");
      } catch (error) {
        console.error("Failed to close MongoDB connection:", error.message);
      }
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});
