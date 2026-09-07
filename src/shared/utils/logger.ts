type LogLevel = "info" | "warn" | "error";

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  public info(message: string, ...args: unknown[]) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  public warn(message: string, ...args: unknown[]) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  public error(message: string, ...args: unknown[]) {
    // We always log errors, even in production, but we might want to send them to an error tracking service
    console.error(`[ERROR] ${message}`, ...args);
  }
}

export const logger = new Logger();
