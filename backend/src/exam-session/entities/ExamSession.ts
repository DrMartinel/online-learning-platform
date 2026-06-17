export class ExamSession {
  constructor(
    public id: string,
    public title: string,
    public examId: string,
    public courseId: string | null,
    public startTime: Date,
    public endTime: Date,
    public durationMinutes: number,
    public accessCode: string | null,
    public status: string,
    public createdBy: string | null,
    public createdAt: Date,
    public updatedAt?: Date,
  ) {}
}
