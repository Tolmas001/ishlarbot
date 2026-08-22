export type UserRole = "worker" | "employer";

export type UserLanguage = "uz" | "ru" | "en";

export type User = {
  id: string;
  telegramId: string;
  name: string;
  age: number;
  profession: string | null;
  photoFileId: string | null;
  consentAccepted: boolean;
  consentAcceptedAt: string | null;
  phone: string;
  cardNumber: string | null;
  banned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  role: UserRole;
  username: string | null;
  language: UserLanguage;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type NewUser = Omit<User, "id" | "createdAt" | "updatedAt">;

export type JobType = "temporary" | "permanent";
export type ExperienceLevel = "beginner" | "intermediate" | "expert";

export type Job = {
  id: string;
  employerTelegramId: string;
  title: string;
  description: string;
  salary: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string;
  geoLocation: string | null;
  workTime: string | null;
  meals: string | null;
  difficulty: "light" | "heavy";
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  photoFileId: string | null;
  status: "pending" | "open" | "closed" | "rejected";
  channelChatId: string | null;
  channelMessageId: number | null;
  createdAt: string;
};

export type NewJob = Omit<Job, "id" | "status" | "channelChatId" | "channelMessageId" | "createdAt">;

export type Application = {
  id: string;
  jobId: string;
  userId: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "completed";
  completedAt: string | null;
  createdAt: string;
};

export type NewApplication = Omit<Application, "id" | "createdAt">;

export type PaymentStatus = "awaiting_receipt" | "pending_review" | "approved" | "rejected";

export type Payment = {
  id: string;
  jobId: string;
  applicationId: string;
  workerId: string;
  employerTelegramId: string;
  totalAmount: number;
  commissionAmount: number;
  payoutAmount: number;
  cardNumber: string;
  status: PaymentStatus;
  receiptFileId: string | null;
  receiptSubmittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
};

export type NewPayment = Omit<
  Payment,
  "id" | "status" | "receiptFileId" | "receiptSubmittedAt" | "reviewedAt" | "reviewedBy" | "createdAt"
>;

export type Rating = {
  id: string;
  fromUserId: string;
  toUserId: string;
  jobId: string | null;
  score: number;
  comment: string | null;
  createdAt: string;
};

export type NewRating = Omit<Rating, "id" | "createdAt">;

export type SavedJob = {
  id: string;
  userId: string;
  jobId: string;
  createdAt: string;
};

export type NewSavedJob = Omit<SavedJob, "id" | "createdAt">;

export type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  applicationId: string | null;
  text: string;
  read: boolean;
  createdAt: string;
};

export type NewMessage = Omit<Message, "id" | "read" | "createdAt">;

export type Notification = {
  id: string;
  userId: string;
  type: "new_job" | "new_application" | "payment_status" | "job_closed" | "message";
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
};

export type NewNotification = Omit<Notification, "id" | "read" | "createdAt">;

export type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entityType: "user" | "job" | "application" | "payment";
  entityId: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

export type NewAuditLog = Omit<AuditLog, "id" | "createdAt">;

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: UserLanguage;
  order: number;
  createdAt: string;
};

export type NewFAQ = Omit<FAQ, "id" | "createdAt">;

export type HelpRequest = {
  id: string;
  userId: string;
  message: string;
  status: "pending" | "resolved";
  adminResponse: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type NewHelpRequest = Omit<HelpRequest, "id" | "status" | "adminResponse" | "resolvedAt" | "createdAt">;

export type FilterOptions = {
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  difficulty?: "light" | "heavy";
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  maxDistance?: number;
  userLat?: number;
  userLng?: number;
};

export type Database = {
  users: User[];
  jobs: Job[];
  applications: Application[];
  payments: Payment[];
  ratings: Rating[];
  savedJobs: SavedJob[];
  messages: Message[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  faqs: FAQ[];
  helpRequests: HelpRequest[];
};

export type RegisterSession = {
  flow: "register";
  role: UserRole;
  step: "consent" | "name" | "age" | "profession" | "photo" | "phone" | "card";
  mode: "create" | "edit";
  data: Partial<NewUser>;
};

export type CardSession = {
  flow: "card";
};

export type PaymentSession = {
  flow: "payment";
  paymentId: string;
};

export type JobSession = {
  flow: "job";
  step: "title" | "description" | "salary" | "salaryMin" | "salaryMax" | "location" | "geoLocation" | "workTime" | "meals" | "difficulty" | "jobType" | "experienceLevel" | "photo";
  data: Partial<NewJob>;
};

export type ApplySession = {
  flow: "apply";
  jobId: string;
};

export type LocationFilterSession = {
  flow: "locationFilter";
};

export type FilterSession = {
  flow: "filter";
  step: "salaryMin" | "salaryMax" | "difficulty" | "jobType" | "experienceLevel";
  data: Partial<FilterOptions>;
};

export type RatingSession = {
  flow: "rating";
  targetUserId: string;
  jobId: string | null;
};

export type MessageSession = {
  flow: "message";
  toUserId: string;
  applicationId: string | null;
};

export type LanguageSession = {
  flow: "language";
};

export type HelpSession = {
  flow: "help";
};

export type HelpResponseSession = {
  flow: "help_response";
  helpRequestId: string;
};

export type Session = RegisterSession | JobSession | ApplySession | LocationFilterSession | CardSession | PaymentSession | FilterSession | RatingSession | MessageSession | LanguageSession | HelpSession | HelpResponseSession;
