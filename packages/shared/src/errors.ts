import type { ErrorType } from './enums.js';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorType | string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
