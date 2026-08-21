import type { Telegram } from "telegraf";
import { createApplication, findJob, findUserById } from "../database/jsonDb.js";
import type { Application, NewApplication } from "../types.js";
import { notifyAdminsAboutApplication, notifyEmployer } from "./notification.service.js";

export async function applyToJob(application: NewApplication, telegram?: Telegram): Promise<Application | null> {
  const savedApplication = await createApplication(application);

  if (!savedApplication || !telegram) {
    return savedApplication;
  }

  const [job, worker] = await Promise.all([
    findJob(savedApplication.jobId),
    findUserById(savedApplication.userId)
  ]);

  if (job && worker) {
    await notifyEmployer(telegram, job, worker, savedApplication.message);
    await notifyAdminsAboutApplication(telegram, job, worker, savedApplication.message);
  }

  return savedApplication;
}
