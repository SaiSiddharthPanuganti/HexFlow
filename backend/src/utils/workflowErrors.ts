/**
 * Error types for workflow generation
 */

export class WorkflowGenerationError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'WorkflowGenerationError';
    this.status = status;
  }
}