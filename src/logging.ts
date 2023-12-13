import log, { type JsonLog } from "json-log";

export * from "json-log";
export { default } from "json-log";

export interface Logger {}

export class LoggerImpl implements Logger {
  constructor(
    private context: Record<string, unknown> = {},
    private logger: JsonLog = log,
  ) {}

  addContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
    this.logger = this.logger.child(context);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.logger.error(message, data);
  }
}
