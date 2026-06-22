export class CourseReview {
  constructor(
    public id: string,
    public userId: string,
    public courseId: string,
    public rating: number,
    public comment: string | null,
    public status: 'pending' | 'approved' | 'hidden',
    public response: string | null,
    public respondedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}
