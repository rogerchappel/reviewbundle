export class ReviewBundleError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "ReviewBundleError";
    this.exitCode = exitCode;
  }
}
