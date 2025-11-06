import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const file = path.join(
  logsDir,
  `test-${new Date().toISOString().slice(0, 10)}.log`
);
const stream = fs.createWriteStream(file, { flags: "a" });

type Level = "DEBUG" | "INFO" | "WARN" | "ERROR";
const envLevel = (process.env.LOG_LEVEL || "INFO").toUpperCase() as Level;
const order: Record<Level, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

function write(level: Level, msg: string) {
  if (order[level] < order[envLevel]) return;
  const line = `${new Date().toISOString()} - ${level}: ${msg}\n`;
  stream.write(line);
  // mirror to console (optional)
  if (level === "ERROR") console.error(line.trim());
  else console.log(line.trim());
}

export const logger = {
  debug: (m: string) => write("DEBUG", m),
  info: (m: string) => write("INFO", m),
  warn: (m: string) => write("WARN", m),
  error: (m: string) => write("ERROR", m),
};
