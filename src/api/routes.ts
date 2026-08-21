import { Router } from "express";
import type { Telegram } from "telegraf";
import { findJob, listJobsByLocation, readDb } from "../database/jsonDb.js";
import { applyToJob } from "../services/application.service.js";
import { addJob, getLatestJobs } from "../services/job.service.js";
import { requireText } from "../utils/validation.js";

export function createApiRouter(telegram: Telegram): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const db = await readDb();
    res.json({
      status: "ok",
      users: db.users.length,
      jobs: db.jobs.length,
      applications: db.applications.length
    });
  });

  router.get("/jobs", async (req, res) => {
    const location = typeof req.query.location === "string" ? req.query.location : undefined;
    res.json(location ? await listJobsByLocation(location, 100) : await getLatestJobs(100));
  });

  router.post("/jobs", async (req, res) => {
    const job = await addJob({
      employerTelegramId: requireText(req.body.employerTelegramId, "employerTelegramId"),
      title: requireText(req.body.title, "title"),
      description: requireText(req.body.description, "description"),
      salary: requireText(req.body.salary, "salary"),
      location: requireText(req.body.location, "location"),
      geoLocation: req.body.geoLocation || null,
      workTime: req.body.workTime || null,
      meals: req.body.meals || null,
      difficulty: req.body.difficulty === "heavy" ? "heavy" : "light",
      photoFileId: req.body.photoFileId || null
    }, telegram);

    res.status(201).json(job);
  });

  router.post("/apply", async (req, res) => {
    const userId = requireText(req.body.userId, "userId");
    const jobId = requireText(req.body.jobId, "jobId");
    const job = await findJob(jobId);

    if (!job) {
      res.status(404).json({ error: "Ish topilmadi" });
      return;
    }

    const application = await applyToJob({
      jobId,
      userId,
      message: req.body.message || null
    }, telegram);

    if (!application) {
      res.status(409).json({ error: "Bu ishga avval ariza yuborilgan" });
      return;
    }

    res.status(201).json(application);
  });

  return router;
}
