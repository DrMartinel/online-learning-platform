export class LessonContent {
  constructor(
    public id: string,
    public lessonId: string,
    public type: 'video' | 'document' | 'exam',
    public title: string,
    public url: string,
    public durationMinutes: number | null,
    public orderIndex: number,
    public createdAt: Date,
    public updatedAt?: Date
  ) {}

  public updateDetails(title?: string, url?: string, durationMinutes?: number | null, orderIndex?: number): void {
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        throw new Error('Title cannot be empty');
      }
      this.title = title;
    }
    if (url !== undefined) {
      if (!url || url.trim().length === 0) {
        throw new Error('URL cannot be empty');
      }
      this.url = url;
    }
    if (durationMinutes !== undefined) {
      this.durationMinutes = durationMinutes;
    }
    if (orderIndex !== undefined) {
      if (orderIndex < 0) {
        throw new Error('Order index cannot be negative');
      }
      this.orderIndex = orderIndex;
    }
  }
}
