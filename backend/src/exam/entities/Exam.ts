export class Exam {
  constructor(
    public id: string,
    public courseId: string | null,
    public createdBy: string | null,
    public title: string,
    public headerContent: string | null,
    public createdAt: Date,
    public questionLabel: string,
    public tags: string[],
    public accessRights: string,
    public updatedAt?: Date,
  ) {}
}
