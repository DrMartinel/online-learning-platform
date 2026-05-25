export class Question {
  constructor(
    public id: string,
    public type: 'essay' | 'single_choice' | 'multiple_choice',
    public tags: string[],
    public createdAt: Date,
    public updatedAt?: Date,
  ) {}
}
