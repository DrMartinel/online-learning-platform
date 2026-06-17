export class ExamAttempt {
  constructor(
    public id: string,
    public sessionId: string,
    public userId: string,
    public startTime: Date,
    public submitTime: Date | null,
    public answers: Record<string, any>,
    public score: number | null,
    public status: string,
    public createdAt: Date,
    public gradedAt?: Date | null,
  ) {}
}
