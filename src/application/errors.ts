/** Thrown when a Zod schema rejects use-case input, before any repository call. */
export class ValidationError extends Error {
  constructor(message: string, public readonly issues: string[] = []) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Thrown when rbac.ts denies the actor — checked before any repository call,
 * so a denied use case never reaches the database (Section 15.2). */
export class PermissionError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
