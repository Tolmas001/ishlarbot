import type { Telegram } from "telegraf";
import { createJob, listJobs } from "../database/jsonDb.js";
import type { Job, NewJob } from "../types.js";
import { notifyAdminsAboutJob } from "./notification.service.js";

export async function addJob(job: NewJob, telegram?: Telegram): Promise<Job> {
  const savedJob = await createJob(job);

  if (telegram) {
    await notifyAdminsAboutJob(telegram, savedJob);
  }

  return savedJob;
}

export async function getLatestJobs(limit = 20): Promise<Job[]> {
  return listJobs(limit);
}
