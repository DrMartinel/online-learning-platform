export class Comment {
  constructor(
    public id: string,
    public lessonId: string,
    public userId: string,
    public content: string,
    public parentId: string | null,
    public createdAt: Date,
    public updatedAt?: Date
  ) {}

  public updateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    this.content = content;
  }
}
