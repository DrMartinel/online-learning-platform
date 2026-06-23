export class CourseExam {
  constructor(
    public id: string,
    public courseId: string,
    public examId: string,
    public createdAt: Date,
  ) {}
}
