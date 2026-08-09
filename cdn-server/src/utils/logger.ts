import path from "path";
import winston from "winston";

/**
 * Creates a Winston logger that writes to a rotating log file and the console.
 * @param filename  Log filename (e.g. "server.log").
 * @param logDir    Absolute path to the logs directory.
 */
export function makeLogger(filename: string, logDir: string): winston.Logger {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message }) =>
        `[${timestamp}] [${level.toUpperCase()}] ${message}`
      )
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, filename),
        maxsize: 1 * 1024 * 1024, // 1 MB per file
        maxFiles: 2,               // keep up to 2 rotated files
        tailable: true,
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message }) =>
            `[${filename.replace(".log", "")}] [${level}] ${message}`
          )
        ),
      }),
    ],
  });
}
