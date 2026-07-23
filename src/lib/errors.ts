export class ApiRequestError extends Error {
  status: number;
  errorType?: string;

  constructor(status: number, message: string, errorType?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errorType = errorType;
  }
}
