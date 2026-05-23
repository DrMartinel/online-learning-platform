export class UserNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`User with ID ${id} was not found.`);
    this.name = 'UserNotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'User is not authorized to perform this action.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
