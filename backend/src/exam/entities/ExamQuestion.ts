export class ExamQuestion {
  constructor(
    public id: string,
    public examId: string,
    public questionId: string,
    public orderIndex: number,
    public points: number,
  ) {}
}
