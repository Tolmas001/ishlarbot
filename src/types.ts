export type UserRole = "worker" | "employer";

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
  role: UserRole;
  username: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewUser = Omit<User, "id" | "createdAt" | "updatedAt">;

export type Job = {
  id: string;
  employerTelegramId: string;
  title: string;
  description: string;
  salary: string;
  location: string;
  geoLocation: string | null;
  workTime: string | null;
  meals: string | null;
  difficulty: "light" | "heavy";
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
  createdAt: string;
};

export type NewApplication = Omit<Application, "id" | "createdAt">;

export type Database = {
  users: User[];
  jobs: Job[];
  applications: Application[];
};

export type RegisterSession = {
  flow: "register";
  role: UserRole;
  step: "consent" | "name" | "age" | "profession" | "photo" | "phone";
  mode: "create" | "edit";
  data: Partial<NewUser>;
};

export type JobSession = {
  flow: "job";
  step: "title" | "description" | "salary" | "location" | "geoLocation" | "workTime" | "meals" | "difficulty" | "photo";
  data: Partial<NewJob>;
};

export type ApplySession = {
  flow: "apply";
  jobId: string;
};

export type LocationFilterSession = {
  flow: "locationFilter";
};

export type Session = RegisterSession | JobSession | ApplySession | LocationFilterSession;
