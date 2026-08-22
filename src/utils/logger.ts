import { promises as fs } from "node:fs";
import path from "node:path";

const LOG_DIR = path.resolve("logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR"
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export async function ensureLogDir(): Promise<void> {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

export async function writeLog(entry: LogEntry): Promise<void> {
  await ensureLogDir();
  const logLine = JSON.stringify(entry) + "\n";
  await fs.appendFile(LOG_FILE, logLine);
}

export async function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): Promise<void> {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined
  };

  await writeLog(entry);

  // Also log to console for development
  const consoleMessage = `[${entry.timestamp}] [${level}] ${message}`;
  if (error) {
    console.error(consoleMessage, error);
  } else {
    console.log(consoleMessage);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: Record<string, unknown>) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: Record<string, unknown>) => log(LogLevel.WARN, message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => log(LogLevel.ERROR, message, context, error)
};

export async function getLogs(limit = 100): Promise<LogEntry[]> {
  try {
    await ensureLogDir();
    const content = await fs.readFile(LOG_FILE, "utf8");
    const lines = content.trim().split("\n").reverse().slice(0, limit);
    return lines.map(line => JSON.parse(line) as LogEntry);
  } catch {
    return [];
  }
}
