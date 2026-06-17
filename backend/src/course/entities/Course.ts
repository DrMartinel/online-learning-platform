export class Course {
  constructor(
    public id: string,
    public instructorId: string,
    public title: string,
    public description: string | null,
    public thumbnailUrl: string | null,
    public isPublished: boolean,
    public createdAt: Date,
    public price: number, //
    public updatedAt?: Date
  ) {}

  public publish(): void {
    this.isPublished = true;
  }

  public unpublish(): void {
    this.isPublished = false;
  }

  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    this.title = title;
  }

  public updatePrice(price: number): void {
    if (price < 0) {
      throw new Error('Price cannot be negative');
    }
    this.price = price;
  }
}