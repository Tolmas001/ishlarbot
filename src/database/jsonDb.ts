import { promises as fs } from "node:fs";
import path from "node:path";
import type { Application, AuditLog, Database, FAQ, FilterOptions, HelpRequest, Job, Message, NewApplication, NewAuditLog, NewFAQ, NewHelpRequest, NewJob, NewMessage, NewNotification, NewPayment, NewRating, NewSavedJob, NewUser, Notification, Payment, Rating, SavedJob, User, UserRole } from "../types.js";

const DB_PATH = path.resolve("data/db.json");

const initialData: Database = {
  users: [],
  jobs: [],
  applications: [],
  payments: [],
  ratings: [],
  savedJobs: [],
  messages: [],
  notifications: [],
  auditLogs: [],
  faqs: [],
  helpRequests: []
};

export async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;

    return {
      users: (parsed.users || []).map(normalizeUser),
      jobs: parsed.jobs || [],
      applications: parsed.applications || [],
      payments: parsed.payments || [],
      ratings: parsed.ratings || [],
      savedJobs: parsed.savedJobs || [],
      messages: parsed.messages || [],
      notifications: parsed.notifications || [],
      auditLogs: parsed.auditLogs || [],
      faqs: parsed.faqs || [],
      helpRequests: parsed.helpRequests || []
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
      ...normalizeUser(db.users[index]),
      ...user,
      profession: user.profession ?? db.users[index].profession ?? null,
      photoFileId: user.photoFileId ?? db.users[index].photoFileId ?? null,
      cardNumber: user.cardNumber ?? db.users[index].cardNumber ?? null,
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
      cardNumber: user.cardNumber ?? null,
      banned: user.banned ?? false,
      bannedAt: user.bannedAt ?? null,
      banReason: user.banReason ?? null,
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

export async function findUserByTelegramId(telegramId: string, role?: UserRole): Promise<User | undefined> {
  const db = await readDb();
  const user = db.users.find((user) => user.telegramId === telegramId && (!role || user.role === role));
  return user ? normalizeUser(user) : undefined;
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const db = await readDb();
  const user = db.users.find((user) => user.id === userId);
  return user ? normalizeUser(user) : undefined;
}

export async function findUsersByTelegramId(telegramId: string): Promise<User[]> {
  const db = await readDb();
  return db.users.filter((user) => user.telegramId === telegramId).map(normalizeUser);
}

export async function updateUserCard(userId: string, cardNumber: string): Promise<User | null> {
  const db = await readDb();
  const user = db.users.find((item) => item.id === userId);

  if (!user) {
    return null;
  }

  user.cardNumber = cardNumber;
  user.updatedAt = new Date().toISOString();
  await writeDb(db);
  return normalizeUser(user);
}

export async function isUserBanned(telegramId: string): Promise<boolean> {
  const users = await findUsersByTelegramId(telegramId);
  return users.some((user) => user.banned);
}

export async function banUser(telegramId: string, reason: string): Promise<User[]> {
  const db = await readDb();
  const now = new Date().toISOString();
  const updatedUsers: User[] = [];

  for (const user of db.users) {
    if (user.telegramId !== telegramId) {
      continue;
    }

    user.banned = true;
    user.bannedAt = now;
    user.banReason = reason;
    user.updatedAt = now;
    updatedUsers.push(normalizeUser(user));
  }

  if (updatedUsers.length) {
    await writeDb(db);
  }

  return updatedUsers;
}

export async function findApplication(applicationId: string): Promise<Application | undefined> {
  const db = await readDb();
  return db.applications.find((application) => application.id === applicationId);
}

export async function createPayment(payment: NewPayment): Promise<Payment> {
  const db = await readDb();
  const savedPayment: Payment = {
    id: `pay_${Date.now()}`,
    ...payment,
    status: "awaiting_receipt",
    receiptFileId: null,
    receiptSubmittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    createdAt: new Date().toISOString()
  };

  db.payments.push(savedPayment);
  await writeDb(db);
  return savedPayment;
}

export async function findPayment(paymentId: string): Promise<Payment | undefined> {
  const db = await readDb();
  return db.payments.find((payment) => payment.id === paymentId);
}

export async function findActivePaymentByApplication(applicationId: string): Promise<Payment | undefined> {
  const db = await readDb();
  return db.payments.find(
    (payment) =>
      payment.applicationId === applicationId &&
      payment.status !== "rejected"
  );
}

export async function submitPaymentReceipt(paymentId: string, receiptFileId: string): Promise<Payment | null> {
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === paymentId);

  if (!payment || payment.status !== "awaiting_receipt") {
    return null;
  }

  payment.status = "pending_review";
  payment.receiptFileId = receiptFileId;
  payment.receiptSubmittedAt = new Date().toISOString();
  await writeDb(db);
  return payment;
}

export async function approvePayment(paymentId: string, adminTelegramId: string): Promise<Payment | null> {
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === paymentId);

  if (!payment || payment.status !== "pending_review") {
    return null;
  }

  payment.status = "approved";
  payment.reviewedAt = new Date().toISOString();
  payment.reviewedBy = adminTelegramId;
  await writeDb(db);
  return payment;
}

export async function rejectPayment(paymentId: string, adminTelegramId: string): Promise<Payment | null> {
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === paymentId);

  if (!payment || payment.status !== "pending_review") {
    return null;
  }

  payment.status = "rejected";
  payment.reviewedAt = new Date().toISOString();
  payment.reviewedBy = adminTelegramId;
  await writeDb(db);
  return payment;
}

export async function listPendingPayments(): Promise<Payment[]> {
  const db = await readDb();
  return db.payments.filter((payment) => payment.status === "pending_review");
}

function normalizeUser(user: User): User {
  return {
    ...user,
    cardNumber: user.cardNumber ?? null,
    banned: user.banned ?? false,
    bannedAt: user.bannedAt ?? null,
    banReason: user.banReason ?? null,
    language: user.language ?? "uz",
    rating: user.rating ?? 0,
    ratingCount: user.ratingCount ?? 0
  };
}

export async function createJob(job: NewJob): Promise<Job> {
  const db = await readDb();
  const savedJob: Job = {
    id: `job_${Date.now()}`,
    ...job,
    geoLocation: job.geoLocation || null,
    meals: job.meals || null,
    difficulty: job.difficulty || "light",
    jobType: job.jobType || "temporary",
    experienceLevel: job.experienceLevel || "beginner",
    salaryMin: job.salaryMin || null,
    salaryMax: job.salaryMax || null,
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
    status: "pending",
    completedAt: null,
    createdAt: new Date().toISOString()
  };

  db.applications.push(savedApplication);
  await writeDb(db);
  return savedApplication;
}

// Rating functions
export async function createRating(rating: NewRating): Promise<Rating> {
  const db = await readDb();
  const savedRating: Rating = {
    id: `rating_${Date.now()}`,
    ...rating,
    createdAt: new Date().toISOString()
  };

  db.ratings.push(savedRating);

  // Update user rating
  const user = db.users.find((u) => u.id === rating.toUserId);
  if (user) {
    const totalRating = user.rating * user.ratingCount + rating.score;
    user.ratingCount += 1;
    user.rating = totalRating / user.ratingCount;
    user.updatedAt = new Date().toISOString();
  }

  await writeDb(db);
  return savedRating;
}

export async function getRatingsByUser(userId: string): Promise<Rating[]> {
  const db = await readDb();
  return db.ratings.filter((r) => r.toUserId === userId);
}

// Saved jobs functions
export async function saveJob(savedJob: NewSavedJob): Promise<SavedJob> {
  const db = await readDb();
  const alreadyExists = db.savedJobs.some(
    (item) => item.userId === savedJob.userId && item.jobId === savedJob.jobId
  );

  if (alreadyExists) {
    const existing = db.savedJobs.find(
      (item) => item.userId === savedJob.userId && item.jobId === savedJob.jobId
    );
    return existing!;
  }

  const saved: SavedJob = {
    id: `saved_${Date.now()}`,
    ...savedJob,
    createdAt: new Date().toISOString()
  };

  db.savedJobs.push(saved);
  await writeDb(db);
  return saved;
}

export async function unsaveJob(userId: string, jobId: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.savedJobs.length;
  db.savedJobs = db.savedJobs.filter(
    (item) => !(item.userId === userId && item.jobId === jobId)
  );

  if (db.savedJobs.length !== initialLength) {
    await writeDb(db);
    return true;
  }

  return false;
}

export async function getSavedJobs(userId: string): Promise<SavedJob[]> {
  const db = await readDb();
  return db.savedJobs.filter((s) => s.userId === userId);
}

// Messages functions
export async function createMessage(message: NewMessage): Promise<Message> {
  const db = await readDb();
  const savedMessage: Message = {
    id: `msg_${Date.now()}`,
    ...message,
    read: false,
    createdAt: new Date().toISOString()
  };

  db.messages.push(savedMessage);
  await writeDb(db);
  return savedMessage;
}

export async function getMessages(userId1: string, userId2: string): Promise<Message[]> {
  const db = await readDb();
  return db.messages.filter(
    (m) =>
      (m.fromUserId === userId1 && m.toUserId === userId2) ||
      (m.fromUserId === userId2 && m.toUserId === userId1)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function markMessagesAsRead(userId: string): Promise<void> {
  const db = await readDb();
  db.messages.forEach((m) => {
    if (m.toUserId === userId) {
      m.read = true;
    }
  });
  await writeDb(db);
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const db = await readDb();
  return db.messages.filter((m) => m.toUserId === userId && !m.read).length;
}

// Notifications functions
export async function createNotification(notification: NewNotification): Promise<Notification> {
  const db = await readDb();
  const savedNotification: Notification = {
    id: `notif_${Date.now()}`,
    ...notification,
    read: false,
    createdAt: new Date().toISOString()
  };

  db.notifications.push(savedNotification);
  await writeDb(db);
  return savedNotification;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const db = await readDb();
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const db = await readDb();
  const notification = db.notifications.find((n) => n.id === notificationId);

  if (notification) {
    notification.read = true;
    await writeDb(db);
    return true;
  }

  return false;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const db = await readDb();
  db.notifications.forEach((n) => {
    if (n.userId === userId) {
      n.read = true;
    }
  });
  await writeDb(db);
}

// Audit log functions
export async function createAuditLog(log: NewAuditLog): Promise<AuditLog> {
  const db = await readDb();
  const savedLog: AuditLog = {
    id: `audit_${Date.now()}`,
    ...log,
    createdAt: new Date().toISOString()
  };

  db.auditLogs.push(savedLog);
  await writeDb(db);
  return savedLog;
}

export async function getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
  const db = await readDb();
  return db.auditLogs
    .filter((l) => l.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);
}

export async function getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
  const db = await readDb();
  return db.auditLogs
    .filter((l) => l.entityType === entityType && l.entityId === entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// FAQ functions
export async function createFAQ(faq: NewFAQ): Promise<FAQ> {
  const db = await readDb();
  const savedFAQ: FAQ = {
    id: `faq_${Date.now()}`,
    ...faq,
    createdAt: new Date().toISOString()
  };

  db.faqs.push(savedFAQ);
  await writeDb(db);
  return savedFAQ;
}

export async function getFAQs(language: string = "uz"): Promise<FAQ[]> {
  const db = await readDb();
  return db.faqs
    .filter((f) => f.language === language)
    .sort((a, b) => a.order - b.order);
}

// Help request functions
export async function createHelpRequest(helpRequest: NewHelpRequest): Promise<HelpRequest> {
  const db = await readDb();
  const savedRequest: HelpRequest = {
    id: `help_${Date.now()}`,
    ...helpRequest,
    status: "pending",
    adminResponse: null,
    resolvedAt: null,
    createdAt: new Date().toISOString()
  };

  db.helpRequests.push(savedRequest);
  await writeDb(db);
  return savedRequest;
}

export async function resolveHelpRequest(helpRequestId: string, adminResponse: string): Promise<HelpRequest | null> {
  const db = await readDb();
  const request = db.helpRequests.find((r) => r.id === helpRequestId);

  if (request) {
    request.status = "resolved";
    request.adminResponse = adminResponse;
    request.resolvedAt = new Date().toISOString();
    await writeDb(db);
    return request;
  }

  return null;
}

export async function getPendingHelpRequests(): Promise<HelpRequest[]> {
  const db = await readDb();
  return db.helpRequests.filter((r) => r.status === "pending");
}

// Filter functions
export async function filterJobs(filters: FilterOptions, limit = 20): Promise<Job[]> {
  const db = await readDb();
  let filtered = db.jobs.filter((job) => (job.status || "open") === "open");

  if (filters.location) {
    const query = filters.location.toLowerCase();
    filtered = filtered.filter((job) => job.location.toLowerCase().includes(query));
  }

  if (filters.salaryMin !== undefined) {
    filtered = filtered.filter((job) => {
      const salary = job.salaryMin || 0;
      return salary >= filters.salaryMin!;
    });
  }

  if (filters.salaryMax !== undefined) {
    filtered = filtered.filter((job) => {
      const salary = job.salaryMax || Infinity;
      return salary <= filters.salaryMax!;
    });
  }

  if (filters.difficulty) {
    filtered = filtered.filter((job) => job.difficulty === filters.difficulty);
  }

  if (filters.jobType) {
    filtered = filtered.filter((job) => job.jobType === filters.jobType);
  }

  if (filters.experienceLevel) {
    filtered = filtered.filter((job) => job.experienceLevel === filters.experienceLevel);
  }

  if (filters.maxDistance && filters.userLat && filters.userLng) {
    filtered = filtered.filter((job) => {
      if (!job.geoLocation) return false;
      const jobCoords = parseGeoLocation(job.geoLocation);
      if (!jobCoords) return false;

      const distance = calculateDistance(
        filters.userLat!,
        filters.userLng!,
        jobCoords.lat,
        jobCoords.lng
      );
      return distance <= filters.maxDistance!;
    });
  }

  return filtered.slice(0, limit);
}

function parseGeoLocation(geoLocation: string): { lat: number; lng: number } | null {
  try {
    const match = geoLocation.match(/q=([-\d.]+),([-\d.]+)/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
  } catch {
    return null;
  }
  return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Application status update
export async function updateApplicationStatus(applicationId: string, status: "accepted" | "rejected" | "completed"): Promise<Application | null> {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === applicationId);

  if (application) {
    application.status = status;
    if (status === "completed") {
      application.completedAt = new Date().toISOString();
    }
    await writeDb(db);
    return application;
  }

  return null;
}

// User language update
export async function updateUserLanguage(userId: string, language: "uz" | "ru" | "en"): Promise<User | null> {
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);

  if (user) {
    user.language = language;
    user.updatedAt = new Date().toISOString();
    await writeDb(db);
    return user;
  }

  return null;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
