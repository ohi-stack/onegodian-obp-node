import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store for OBP-1
const store = {
  records: new Map<string, any>(),
  auditLogs: [] as any[],
  certificates: new Map<string, any>()
};

function generateId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function createAudit(action: string, details: any) {
  const audit = {
    id: generateId('adt'),
    action,
    timestamp: new Date().toISOString(),
    details
  };
  store.auditLogs.push(audit);
  return audit;
}

// API Routes
app.get("/api/obp1/status", (req, res) => {
  res.json({ status: "operational", version: "0.1.0", node: "OBP-1 Capital Plugin" });
});

app.post("/api/obp1/verify", (req, res) => {
  const payload = req.body;
  const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const record = {
    record_id: generateId('rec'),
    ...payload,
    status: 'verified',
    timestamp_utc: new Date().toISOString(),
    hash,
    hash_algorithm: "SHA-256"
  };
  store.records.set(record.record_id, record);
  createAudit('VERIFY_RECORD', { record_id: record.record_id, hash });
  res.json(record);
});

app.get("/api/obp1/records", (req, res) => {
  res.json(Array.from(store.records.values()));
});

app.get("/api/obp1/records/:id", (req, res) => {
  const record = store.records.get(req.params.id);
  if (record) {
    res.json(record);
  } else {
    res.status(404).json({ error: "Record not found" });
  }
});

app.post("/api/obp1/certificates/create", (req, res) => {
  const { record_id, issued_to } = req.body;
  const record = store.records.get(record_id);
  
  if (!record) {
    return res.status(400).json({ error: "Invalid record ID" });
  }

  const certificate = {
    certificate_id: generateId('cert'),
    record_id,
    issued_to,
    issued_by: "OBP-1 Node",
    verification_hash: record.hash,
    issue_timestamp_utc: new Date().toISOString(),
    document_version: record.version || "0.1.0",
    status: "issued",
    verification_url: `/obp1/certificates/${record_id}`
  };
  
  store.certificates.set(certificate.certificate_id, certificate);
  createAudit('CREATE_CERTIFICATE', { certificate_id: certificate.certificate_id });
  res.json(certificate);
});

app.get("/api/obp1/certificates", (req, res) => {
  res.json(Array.from(store.certificates.values()));
});

app.get("/api/obp1/audit", (req, res) => {
  res.json(store.auditLogs);
});

app.post("/api/obp1/hash", (req, res) => {
  const hash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  res.json({ hash, algorithm: 'SHA-256' });
});

app.post("/api/obp1/capital/sync", (req, res) => {
  createAudit('CAPITAL_SYNC', { payload: req.body });
  res.json({ status: "synced", timestamp: new Date().toISOString() });
});

app.post("/api/obp1/policy/authorize", (req, res) => {
  createAudit('POLICY_AUTHORIZE', { action: req.body.action });
  res.json({ authorized: true, timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
