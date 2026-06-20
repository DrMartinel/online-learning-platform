export class Chapter {
  constructor(
    public id: string,
    public courseId: string,
    public title: string,
    public orderIndex: number,
    public createdAt: Date,
    public updatedAt?: Date
  ) {}

  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    this.title = title;
  }

  public updateOrderIndex(index: number): void {
    if (index < 0) {
      throw new Error('Order index cannot be negative');
    }
    this.orderIndex = index;
  }
}
