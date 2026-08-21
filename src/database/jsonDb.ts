import { promises as fs } from "node:fs";
import path from "node:path";
import type { Application, Database, Job, NewApplication, NewJob, NewUser, User, UserRole } from "../types.js";

const DB_PATH = path.resolve("data/db.json");

const initialData: Database = {
  users: [],
  jobs: [],
  applications: []
};

export async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;

    return {
      users: parsed.users || [],
      jobs: parsed.jobs || [],
      applications: parsed.applications || []
    };
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT") {
      throw error;
    }

    await writeDb(initialData);
    return structuredClone(initialData);
  }
}

export async function writeDb(data: Database): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function upsertUser(user: NewUser): Promise<User> {
  const db = await readDb();
  const now = new Date().toISOString();
  const index = db.users.findIndex((item) => item.telegramId === user.telegramId && item.role === user.role);

  if (index >= 0) {
    db.users[index] = {
      ...db.users[index],
      ...user,
      profession: user.profession ?? db.users[index].profession ?? null,
      photoFileId: user.photoFileId ?? db.users[index].photoFileId ?? null,
      consentAccepted: user.consentAccepted ?? db.users[index].consentAccepted ?? true,
      consentAcceptedAt: user.consentAcceptedAt ?? db.users[index].consentAcceptedAt ?? null,
      updatedAt: now
    };
  } else {
    db.users.push({
      id: `user_${Date.now()}`,
      ...user,
      profession: user.profession ?? null,
      photoFileId: user.photoFileId ?? null,
      consentAccepted: user.consentAccepted ?? true,
      consentAcceptedAt: user.consentAcceptedAt ?? null,
      createdAt: now,
      updatedAt: now
    });
  }

  await writeDb(db);

  const savedUser = db.users.find((item) => item.telegramId === user.telegramId && item.role === user.role);
  if (!savedUser) {
    throw new Error("Foydalanuvchi saqlanmadi.");
  }

  return savedUser;
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const db = await readDb();
  return db.users.find((user) => user.id === userId);
}

export async function findUserByTelegramId(telegramId: string, role?: UserRole): Promise<User | undefined> {
  const db = await readDb();
  return db.users.find((user) => user.telegramId === telegramId && (!role || user.role === role));
}

export async function findUsersByTelegramId(telegramId: string): Promise<User[]> {
  const db = await readDb();
  return db.users.filter((user) => user.telegramId === telegramId);
}

export async function createJob(job: NewJob): Promise<Job> {
  const db = await readDb();
  const savedJob: Job = {
    id: `job_${Date.now()}`,
    ...job,
    geoLocation: job.geoLocation || null,
    meals: job.meals || null,
    difficulty: job.difficulty || "light",
    photoFileId: job.photoFileId || null,
    status: "pending",
    channelChatId: null,
    channelMessageId: null,
    createdAt: new Date().toISOString()
  };

  db.jobs.unshift(savedJob);
  await writeDb(db);
  return savedJob;
}

export async function listJobs(limit = 20): Promise<Job[]> {
  const db = await readDb();
  return db.jobs.filter((job) => (job.status || "open") === "open").slice(0, limit);
}

export async function listJobsByLocation(location: string, limit = 20): Promise<Job[]> {
  const db = await readDb();
  const query = location.toLowerCase();

  return db.jobs
    .filter((job) => (job.status || "open") === "open")
    .filter((job) => job.location.toLowerCase().includes(query))
    .slice(0, limit);
}

export async function listJobsByEmployer(employerTelegramId: string): Promise<Job[]> {
  const db = await readDb();
  return db.jobs.filter((job) => job.employerTelegramId === employerTelegramId);
}

export async function findJob(jobId: string): Promise<Job | undefined> {
  const db = await readDb();
  return db.jobs.find((job) => job.id === jobId);
}

export async function closeJob(jobId: string, employerTelegramId?: string): Promise<Job | null> {
  const db = await readDb();
  const job = db.jobs.find((item) => item.id === jobId);

  if (!job || (employerTelegramId && job.employerTelegramId !== employerTelegramId)) {
    return null;
  }

  job.status = "closed";
  await writeDb(db);
  return job;
}

export async function saveJobChannelMessage(jobId: string, channelChatId: string, channelMessageId: number): Promise<Job | null> {
  const db = await readDb();
  const job = db.jobs.find((item) => item.id === jobId);

  if (!job) {
    return null;
  }

  job.channelChatId = channelChatId;
  job.channelMessageId = channelMessageId;
  await writeDb(db);
  return job;
}

export async function approveJob(jobId: string): Promise<Job | null> {
  const db = await readDb();
  const job = db.jobs.find((item) => item.id === jobId);

  if (!job) {
    return null;
  }

  job.status = "open";
  await writeDb(db);
  return job;
}

export async function rejectJob(jobId: string): Promise<Job | null> {
  const db = await readDb();
  const job = db.jobs.find((item) => item.id === jobId);

  if (!job) {
    return null;
  }

  job.status = "rejected";
  await writeDb(db);
  return job;
}

export async function deleteJob(jobId: string, employerTelegramId?: string): Promise<boolean> {
  const db = await readDb();
  const job = db.jobs.find((item) => item.id === jobId);

  if (!job || (employerTelegramId && job.employerTelegramId !== employerTelegramId)) {
    return false;
  }

  db.jobs = db.jobs.filter((item) => item.id !== jobId);
  db.applications = db.applications.filter((item) => item.jobId !== jobId);
  await writeDb(db);
  return true;
}

export async function listApplicationsByJob(jobId: string): Promise<Application[]> {
  const db = await readDb();
  return db.applications.filter((application) => application.jobId === jobId);
}

export async function createApplication(application: NewApplication): Promise<Application | null> {
  const db = await readDb();
  const alreadyExists = db.applications.some(
    (item) => item.jobId === application.jobId && item.userId === application.userId
  );

  if (alreadyExists) {
    return null;
  }

  const savedApplication: Application = {
    id: `app_${Date.now()}`,
    ...application,
    createdAt: new Date().toISOString()
  };

  db.applications.push(savedApplication);
  await writeDb(db);
  return savedApplication;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
